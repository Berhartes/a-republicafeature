"""SQLite writer responsible for materializing ETL outputs into a unified DB."""

from __future__ import annotations

import json
import sqlite3
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Union

from ..core.base_models import BaseFornecedor, BaseLegisladorResumo


@dataclass(frozen=True)
class ExpenseRecord:
    """Normalized representation of an expense ready for SQLite insertion."""

    deputado_id: int
    fornecedor_id: Optional[str]
    fornecedor_nome: str
    fornecedor_documento: Optional[str]
    ano: Optional[int]
    mes: Optional[int]
    tipo_despesa: Optional[str]
    valor_documento: Optional[float]
    valor_liquido: Optional[float]
    cod_documento: Optional[int]
    num_documento: Optional[str]
    url_documento: Optional[str]

    def as_tuple(self) -> tuple:
        """Return tuple aligned with the despesas insert statement."""
        return (
            self.deputado_id,
            self.fornecedor_id,
            self.fornecedor_nome,
            self.fornecedor_documento,
            self.ano,
            self.mes,
            self.tipo_despesa,
            self.valor_documento,
            self.valor_liquido,
            self.cod_documento,
            self.num_documento,
            self.url_documento,
        )


class SQLiteWriter:
    """Persist structured ETL results into the monitordespesas SQLite database."""

    def __init__(self, db_path: Path):
        self.db_path = db_path

    def save(
        self,
        *,
        deputados: Sequence[BaseLegisladorResumo],
        fornecedores: Sequence[BaseFornecedor],
        despesas: Sequence[ExpenseRecord],
        manifest: Dict[str, Any],
    ) -> None:
        """Create a fresh SQLite database and populate it with ETL results."""
        self._prepare_directory()
        self._reset_database()

        connection = sqlite3.connect(self.db_path)
        try:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("PRAGMA foreign_keys=ON")
            self._create_schema(connection)
            with connection:
                self._insert_deputados(connection, deputados)
                self._insert_fornecedores(connection, fornecedores)
                self._insert_fornecedor_dimensions(connection, fornecedores)
                self._insert_despesas(connection, despesas)
                self._insert_categorias(connection, fornecedores)
                self._insert_manifest(connection, manifest)
        finally:
            connection.close()

    def _prepare_directory(self) -> None:
        """Ensure the parent directory for the database exists."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def _reset_database(self) -> None:
        """Remove the existing database file to guarantee a clean state."""
        if self.db_path.exists():
            self.db_path.unlink()

    def _create_schema(self, connection: sqlite3.Connection) -> None:
        """Create all tables and indices required by the backend."""
        connection.executescript(
            """
            CREATE TABLE deputados (
                id INTEGER PRIMARY KEY,
                nome TEXT NOT NULL,
                sigla_partido TEXT,
                sigla_uf TEXT,
                total_despesas REAL NOT NULL,
                numero_despesas INTEGER NOT NULL,
                fornecedores_identificados INTEGER NOT NULL
            );

            CREATE TABLE fornecedores (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                cnpj_cpf TEXT,
                tipo_fornecedor TEXT,
                tipo_despesa_principal TEXT,
                total_recebido REAL NOT NULL,
                numero_transacoes INTEGER NOT NULL,
                numero_deputados INTEGER NOT NULL,
                score_suspeicao REAL,
                categorias TEXT,
                anos TEXT,
                ranking INTEGER,
                created_at TEXT NOT NULL
            );

            CREATE TABLE fornecedor_categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fornecedor_id TEXT NOT NULL,
                categoria TEXT NOT NULL,
                total REAL NOT NULL,
                percentual REAL NOT NULL,
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE
            );

            CREATE TABLE fornecedor_anos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fornecedor_id TEXT NOT NULL,
                ano INTEGER NOT NULL,
                total REAL NOT NULL,
                numero_transacoes INTEGER NOT NULL,
                numero_deputados INTEGER NOT NULL,
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE
            );

            CREATE TABLE despesas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deputado_id INTEGER NOT NULL,
                fornecedor_id TEXT,
                fornecedor_nome TEXT,
                fornecedor_documento TEXT,
                ano INTEGER,
                mes INTEGER,
                tipo_despesa TEXT,
                valor_documento REAL,
                valor_liquido REAL,
                cod_documento INTEGER,
                num_documento TEXT,
                url_documento TEXT,
                FOREIGN KEY (deputado_id) REFERENCES deputados(id),
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
            );

            CREATE TABLE categorias (
                categoria TEXT PRIMARY KEY,
                total REAL NOT NULL,
                fornecedores INTEGER NOT NULL
            );

            CREATE TABLE manifest (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                generated_at TEXT NOT NULL,
                legislatura INTEGER,
                anos TEXT NOT NULL,
                total_deputados INTEGER NOT NULL,
                total_fornecedores INTEGER NOT NULL,
                total_despesas REAL NOT NULL,
                platform TEXT NOT NULL,
                source TEXT NOT NULL
            );

            CREATE INDEX idx_despesas_deputado ON despesas (deputado_id);
            CREATE INDEX idx_despesas_fornecedor ON despesas (fornecedor_id);
            CREATE INDEX idx_despesas_ano ON despesas (ano);
            CREATE INDEX idx_fornecedor_categorias_fornecedor ON fornecedor_categorias (fornecedor_id);
            CREATE INDEX idx_fornecedor_anos_fornecedor ON fornecedor_anos (fornecedor_id);
            CREATE INDEX idx_categorias_total ON categorias (total DESC);
            CREATE INDEX idx_fornecedores_total_recebido ON fornecedores (total_recebido DESC);
            CREATE INDEX idx_fornecedores_nome ON fornecedores (nome);
            """
        )

    def _insert_deputados(
        self,
        connection: sqlite3.Connection,
        deputados: Sequence[BaseLegisladorResumo],
    ) -> None:
        """Insert deputados summaries into the database."""
        rows = []
        for deputado in deputados:
            partido = getattr(deputado, "partido", getattr(deputado, "siglaPartido", None))
            uf = getattr(deputado, "uf", getattr(deputado, "siglaUf", None))
            total_despesas = getattr(deputado, "total_despesas", getattr(deputado, "totalDespesas", 0.0))
            numero_despesas = getattr(deputado, "numero_despesas", getattr(deputado, "numeroDespesas", 0))
            fornecedores_identificados = getattr(
                deputado,
                "fornecedores_identificados",
                getattr(deputado, "fornecedoresIdentificados", 0),
            )

            rows.append(
                (
                    deputado.id,
                    deputado.nome,
                    partido,
                    uf,
                    float(total_despesas),
                    numero_despesas,
                    fornecedores_identificados,
                )
            )
        connection.executemany(
            """
            INSERT INTO deputados (
                id,
                nome,
                sigla_partido,
                sigla_uf,
                total_despesas,
                numero_despesas,
                fornecedores_identificados
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )

    def _insert_fornecedores(
        self,
        connection: sqlite3.Connection,
        fornecedores: Sequence[BaseFornecedor],
    ) -> None:
        """Insert consolidated suppliers preserving JSON columns used by the backend."""
        rows = []
        for fornecedor in fornecedores:
            total_recebido = float(fornecedor.total_recebido)
            categorias_payload = self._serialize_categorias(fornecedor.categorias, total_recebido)
            anos_payload = self._serialize_anos(fornecedor.anos)
            documento = getattr(fornecedor, "documento", None)
            numero_legisladores = getattr(fornecedor, "numero_legisladores", None)
            if numero_legisladores is None:
                numero_legisladores = getattr(fornecedor, "numero_deputados", 0)

            rows.append(
                (
                    fornecedor.id,
                    fornecedor.nome,
                    documento,
                    fornecedor.tipo_fornecedor,
                    fornecedor.tipo_despesa_principal,
                    total_recebido,
                    fornecedor.numero_transacoes,
                    int(numero_legisladores or 0),
                    fornecedor.score_suspeicao,
                    categorias_payload,
                    anos_payload,
                    fornecedor.ranking,
                    fornecedor.created_at,
                )
            )

        connection.executemany(
            """
            INSERT INTO fornecedores (
                id,
                nome,
                cnpj_cpf,
                tipo_fornecedor,
                tipo_despesa_principal,
                total_recebido,
                numero_transacoes,
                numero_deputados,
                score_suspeicao,
                categorias,
                anos,
                ranking,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )

    def _insert_fornecedor_dimensions(
        self,
        connection: sqlite3.Connection,
        fornecedores: Sequence[BaseFornecedor],
    ) -> None:
        """Populate helper tables breaking down fornecedor aggregates by category and year."""
        categoria_rows: List[tuple] = []
        ano_rows: List[tuple] = []

        for fornecedor in fornecedores:
            total_recebido = float(fornecedor.total_recebido) or 0.0
            for categoria in fornecedor.categorias:
                percentual = 0.0
                if total_recebido > 0:
                    percentual = round((categoria.total / total_recebido) * 100, 4)
                categoria_rows.append(
                    (
                        fornecedor.id,
                        categoria.categoria,
                        float(categoria.total),
                        percentual,
                    )
                )

            for ano in fornecedor.anos:
                ano_rows.append(
                    (
                        fornecedor.id,
                        ano.ano,
                        float(ano.total),
                        int(getattr(ano, "numero_transacoes", getattr(ano, "numeroTransacoes", 0)) or 0),
                        int(getattr(ano, "numero_legisladores", getattr(ano, "numeroDeputados", 0)) or 0),
                    )
                )

        if categoria_rows:
            connection.executemany(
                """
                INSERT INTO fornecedor_categorias (
                    fornecedor_id,
                    categoria,
                    total,
                    percentual
                ) VALUES (?, ?, ?, ?)
                """,
                categoria_rows,
            )

        if ano_rows:
            connection.executemany(
                """
                INSERT INTO fornecedor_anos (
                    fornecedor_id,
                    ano,
                    total,
                    numero_transacoes,
                    numero_deputados
                ) VALUES (?, ?, ?, ?, ?)
                """,
                ano_rows,
            )

    def _insert_despesas(
        self,
        connection: sqlite3.Connection,
        despesas: Sequence[ExpenseRecord],
    ) -> None:
        """Insert raw expenses linked to deputados and fornecedores."""
        if not despesas:
            return

        rows = [record.as_tuple() for record in despesas]
        connection.executemany(
            """
            INSERT INTO despesas (
                deputado_id,
                fornecedor_id,
                fornecedor_nome,
                fornecedor_documento,
                ano,
                mes,
                tipo_despesa,
                valor_documento,
                valor_liquido,
                cod_documento,
                num_documento,
                url_documento
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )

    def _insert_categorias(
        self,
        connection: sqlite3.Connection,
        fornecedores: Sequence[BaseFornecedor],
    ) -> None:
        """Insert aggregated category totals across all suppliers."""
        totals: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"total": 0.0, "fornecedores": set()})

        for fornecedor in fornecedores:
            for categoria in fornecedor.categorias:
                entry = totals[categoria.categoria]
                entry["total"] += float(categoria.total)
                entry["fornecedores"].add(fornecedor.id)

        rows = [
            (
                categoria,
                round(values["total"], 2),
                len(values["fornecedores"]),
            )
            for categoria, values in totals.items()
        ]

        if rows:
            connection.executemany(
                """
                INSERT INTO categorias (
                    categoria,
                    total,
                    fornecedores
                ) VALUES (?, ?, ?)
                """,
                rows,
            )

    def _insert_manifest(self, connection: sqlite3.Connection, manifest: Dict[str, Any]) -> None:
        """Persist manifest information to trace provenance."""
        generated_at = manifest.get("generated_at")
        if generated_at is None:
            generated_at = manifest.get("generatedAt")

        total_legisladores = manifest.get("total_legisladores")
        if total_legisladores is None:
            total_legisladores = manifest.get("totalLegisladores")
        if total_legisladores is None:
            total_legisladores = manifest.get("total_deputados")
        if total_legisladores is None:
            total_legisladores = manifest.get("totalDeputados")

        total_fornecedores = manifest.get("total_fornecedores")
        if total_fornecedores is None:
            total_fornecedores = manifest.get("totalFornecedores")

        total_despesas = manifest.get("total_despesas")
        if total_despesas is None:
            total_despesas = manifest.get("totalDespesas")

        platform = manifest.get("platform") or manifest.get("plataforma") or "desconhecido"
        source = manifest.get("source") or manifest.get("fonte") or "desconhecido"

        payload = (
            1,
            generated_at,
            manifest.get("legislatura"),
            json.dumps(manifest.get("anos", []), ensure_ascii=False),
            total_legisladores,
            total_fornecedores,
            total_despesas,
            platform,
            source,
        )
        connection.execute(
            """
            INSERT INTO manifest (
                id,
                generated_at,
                legislatura,
                anos,
                total_deputados,
                total_fornecedores,
                total_despesas,
                platform,
                source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            payload,
        )

    @staticmethod
    def _serialize_categorias(categories: Iterable[Any], total_recebido: float) -> str:
        """Serialize categorias payload matching the legacy TypeScript schema."""
        serialized = []
        for category in categories:
            total = float(getattr(category, "total", 0.0))
            percentual = 0.0
            if total_recebido > 0:
                percentual = round((total / total_recebido) * 100, 4)
            serialized.append(
                {
                    "categoria": getattr(category, "categoria", None),
                    "total": round(total, 2),
                    "percentual": percentual,
                }
            )
        return json.dumps(serialized, ensure_ascii=False)

    @staticmethod
    def _serialize_anos(years: Iterable[Any]) -> str:
        """Serialize anos payload matching the legacy TypeScript schema."""
        serialized = []
        for year in years:
            numero_transacoes = getattr(
                year,
                "numero_transacoes",
                getattr(year, "numeroTransacoes", None),
            )
            numero_legisladores = getattr(
                year,
                "numero_legisladores",
                getattr(year, "numeroDeputados", None),
            )
            serialized.append(
                {
                    "ano": getattr(year, "ano", None),
                    "total": round(float(getattr(year, "total", 0.0)), 2),
                    "numeroTransacoes": numero_transacoes,
                    "numeroDeputados": numero_legisladores,
                    "numeroLegisladores": numero_legisladores,
                }
            )
        return json.dumps(serialized, ensure_ascii=False)


def save_to_sqlite(data: Dict[str, Any], db_path: Union[str, Path]) -> None:
    """Convenience function to persist ETL artifacts into SQLite.

    The ``data`` dictionary must contain the keys ``deputados``, ``fornecedores``,
    ``despesas`` and ``manifest``. This thin wrapper mainly exists to satisfy
    callers that prefer a functional API over explicitly instantiating
    ``SQLiteWriter``.
    """
    required_keys = {"deputados", "fornecedores", "despesas", "manifest"}
    missing = required_keys.difference(data.keys())
    if missing:
        raise KeyError(f"Missing keys for sqlite writer: {', '.join(sorted(missing))}")

    writer = SQLiteWriter(Path(db_path))
    writer.save(
        deputados=data["deputados"],
        fornecedores=data["fornecedores"],
        despesas=data["despesas"],
        manifest=data["manifest"],
    )
