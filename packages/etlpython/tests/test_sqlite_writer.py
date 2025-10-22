import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

# Ensure package imports resolve when running tests directly
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from etlpython.core.base_models import (  # noqa: E402
    AnoInfo,
    BaseFornecedor,
    CategoriaInfo,
)
from etlpython.load.sqlite_writer import ExpenseRecord, SQLiteWriter  # noqa: E402
from etlpython.sources.congresso_nacional.camara_deputados.processor import (  # noqa: E402
    DeputadoResumo,
)


def test_sqlite_writer_generates_expected_schema(tmp_path):
    db_path = tmp_path / "monitordespesas.db"

    categoria = CategoriaInfo(categoria="Hospedagem", total=1250.55)
    ano_info = AnoInfo(
        ano=2024,
        total=1250.55,
        numero_transacoes=3,
        numero_legisladores=1,
    )

    fornecedor = BaseFornecedor(
        id="12345678000190",
        nome="Fornecedor XPTO",
        documento="12345678000190",
        tipo_fornecedor=None,
        tipo_despesa_principal="Hospedagem",
        total_recebido=1250.55,
        numero_transacoes=3,
        numero_legisladores=1,
        score_suspeicao=12.5,
        categorias=[categoria],
        anos=[ano_info],
        ranking=1,
        created_at="2024-05-04T12:30:00",
    )

    deputado = DeputadoResumo(
        id=42,
        nome="Fulano de Tal",
        partido="ABC",
        uf="DF",
        total_despesas=1250.55,
        numero_despesas=3,
        fornecedores_identificados=1,
    )

    expense = ExpenseRecord(
        deputado_id=42,
        fornecedor_id=fornecedor.id,
        fornecedor_nome="Fornecedor XPTO",
        fornecedor_documento="12345678000190",
        ano=2024,
        mes=3,
        tipo_despesa="Hospedagem",
        valor_documento=500.15,
        valor_liquido=500.15,
        cod_documento=9876,
        num_documento="ABC-9876",
        url_documento="https://example.com/doc/9876",
    )

    manifest = {
        "generated_at": datetime(2024, 5, 4, 12, 45).isoformat(),
        "legislatura": 57,
        "anos": [2024],
        "total_legisladores": 1,
        "total_fornecedores": 1,
        "total_despesas": 1250.55,
        "platform": "congresso_nacional",
        "source": "camara_deputados",
    }

    writer = SQLiteWriter(db_path)
    writer.save(
        deputados=[deputado],
        fornecedores=[fornecedor],
        despesas=[expense],
        manifest=manifest,
    )

    assert db_path.exists()

    connection = sqlite3.connect(db_path)
    try:
        cursor = connection.cursor()

        cursor.execute("SELECT COUNT(*) FROM fornecedores")
        assert cursor.fetchone()[0] == 1

        cursor.execute("SELECT categorias, anos FROM fornecedores WHERE id = ?", (fornecedor.id,))
        categorias_json, anos_json = cursor.fetchone()
        categorias = json.loads(categorias_json)
        anos = json.loads(anos_json)
        assert categorias[0]["categoria"] == "Hospedagem"
        assert categorias[0]["total"] == round(categoria.total, 2)
        assert categorias[0]["percentual"] > 0
        assert anos[0]["ano"] == 2024
        assert anos[0]["numeroTransacoes"] == 3
        assert anos[0]["numeroLegisladores"] == 1

        cursor.execute("SELECT COUNT(*) FROM deputados")
        assert cursor.fetchone()[0] == 1

        cursor.execute("SELECT COUNT(*) FROM despesas")
        assert cursor.fetchone()[0] == 1

        cursor.execute(
            "SELECT fornecedor_id, fornecedor_documento FROM despesas WHERE deputado_id = ?",
            (deputado.id,),
        )
        fornecedor_id, fornecedor_documento = cursor.fetchone()
        assert fornecedor_id == fornecedor.id
        assert fornecedor_documento == "12345678000190"

        cursor.execute(
            "SELECT total FROM categorias WHERE categoria = ?",
            ("Hospedagem",),
        )
        assert cursor.fetchone()[0] == round(categoria.total, 2)

        cursor.execute("SELECT generated_at, platform, source FROM manifest WHERE id = 1")
        generated_at, platform, source = cursor.fetchone()
        assert generated_at == manifest["generated_at"]
        assert platform == manifest["platform"]
        assert source == manifest["source"]
    finally:
        connection.close()
