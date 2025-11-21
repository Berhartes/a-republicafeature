"""Utilities to build the premiações cache based on deputados data."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple

from ..models import DeputadoResumo

DEFAULT_CATEGORY = "Geral"


def build_premiacoes_cache(
    deputados: List[DeputadoResumo],
    stats_by_id: Dict[int, Dict[str, Any]],
    *,
    generated_at: Optional[str] = None,
) -> Dict[str, Any]:
    """Return the structure expected by premiações consumers."""

    timestamp = generated_at or datetime.utcnow().isoformat()

    if not deputados or not stats_by_id:
        return _empty_payload(timestamp)

    categorias_disponiveis = _collect_categorias(stats_by_id)
    ufs_disponiveis = _collect_ufs(deputados)
    anos_disponiveis = _collect_anos(stats_by_id)

    coroas = []
    coroas.extend(_build_coroas_por_categoria(deputados, stats_by_id, categorias_disponiveis))
    coroas.extend(_build_coroas_por_uf(deputados, stats_by_id, ufs_disponiveis))

    trofeus = []
    trofeus.extend(
        _build_trofeus_por_categoria(deputados, stats_by_id, anos_disponiveis, categorias_disponiveis)
    )
    trofeus.extend(
        _build_trofeus_por_uf(deputados, stats_by_id, anos_disponiveis, ufs_disponiveis)
    )

    metadata = {
        "anosDisponiveis": sorted(anos_disponiveis),
        "categoriasDisponiveis": sorted(categorias_disponiveis),
        "ufsDisponiveis": sorted(ufs_disponiveis),
        "lastUpdate": timestamp,
        "totalPremiacoes": len(coroas) + len(trofeus),
    }

    return {
        "premiacoes": {
            "coroas": coroas,
            "trofeus": trofeus,
        },
        "metadata": metadata,
    }


def _collect_categorias(stats_by_id: Dict[int, Dict[str, Any]]) -> set:
    categorias = {DEFAULT_CATEGORY}
    for stats in stats_by_id.values():
        categorias.update(stats.get("gastos_por_categoria", {}).keys())
        for ano_categorias in stats.get("gastos_por_ano_categoria", {}).values():
            categorias.update(ano_categorias.keys())
    categorias.discard("")
    categorias.discard(None)
    return categorias


def _collect_ufs(deputados: Iterable[DeputadoResumo]) -> set:
    return {dep.siglaUf for dep in deputados if getattr(dep, "siglaUf", None)}


def _collect_anos(stats_by_id: Dict[int, Dict[str, Any]]) -> set:
    anos = set()
    for stats in stats_by_id.values():
        anos.update(stats.get("gastos_por_ano", {}).keys())
    return {int(ano) for ano in anos if isinstance(ano, (int, str))}


def _build_coroas_por_categoria(
    deputados: List[DeputadoResumo],
    stats_by_id: Dict[int, Dict[str, Any]],
    categorias: Iterable[str],
) -> List[Dict[str, Any]]:
    coroas: List[Dict[str, Any]] = []
    for categoria in categorias:
        vencedor = _find_vencedor_categoria(deputados, stats_by_id, categoria)
        if vencedor:
            dep, total = vencedor
            coroas.append(
                _format_premio_entry(
                    dep,
                    total,
                    premio="coroa",
                    tipo="categoria",
                    categoria=categoria,
                )
            )
    return coroas


def _build_coroas_por_uf(
    deputados: List[DeputadoResumo],
    stats_by_id: Dict[int, Dict[str, Any]],
    ufs: Iterable[str],
) -> List[Dict[str, Any]]:
    coroas: List[Dict[str, Any]] = []
    for uf in ufs:
        candidatos = [
            (dep, stats_by_id.get(dep.id))
            for dep in deputados
            if getattr(dep, "siglaUf", None) == uf
        ]
        vencedor = _pick_max(candidatos, lambda tup: tup[1]["total_despesas"] if tup[1] else 0.0)
        if vencedor:
            dep, stats = vencedor
            coroas.append(
                _format_premio_entry(
                    dep,
                    stats["total_despesas"],
                    premio="coroa",
                    tipo="estado",
                    uf=uf,
                )
            )
    return coroas


def _find_vencedor_categoria(
    deputados: List[DeputadoResumo],
    stats_by_id: Dict[int, Dict[str, Any]],
    categoria: str,
) -> Optional[Tuple[DeputadoResumo, float]]:
    candidatos = []
    for dep in deputados:
        stats = stats_by_id.get(dep.id)
        if not stats:
            continue
        if categoria == DEFAULT_CATEGORY:
            total = stats["total_despesas"]
        else:
            total = stats.get("gastos_por_categoria", {}).get(categoria, 0.0)
        candidatos.append((dep, total))

    return _pick_max(candidatos, lambda item: item[1])


def _build_trofeus_por_categoria(
    deputados: List[DeputadoResumo],
    stats_by_id: Dict[int, Dict[str, Any]],
    anos: Iterable[int],
    categorias: Iterable[str],
) -> List[Dict[str, Any]]:
    trofeus: List[Dict[str, Any]] = []
    for ano in sorted(anos):
        for categoria in categorias:
            vencedor = _find_vencedor_categoria_ano(deputados, stats_by_id, ano, categoria)
            if vencedor:
                dep, total = vencedor
                trofeus.append(
                    _format_premio_entry(
                        dep,
                        total,
                        premio="trofeu",
                        tipo="categoria",
                        categoria=categoria,
                        ano=ano,
                    )
                )
    return trofeus


def _build_trofeus_por_uf(
    deputados: List[DeputadoResumo],
    stats_by_id: Dict[int, Dict[str, Any]],
    anos: Iterable[int],
    ufs: Iterable[str],
) -> List[Dict[str, Any]]:
    trofeus: List[Dict[str, Any]] = []
    for ano in sorted(anos):
        for uf in ufs:
            candidatos = [
                (dep, stats_by_id.get(dep.id))
                for dep in deputados
                if getattr(dep, "siglaUf", None) == uf
            ]
            vencedor = _pick_max(
                candidatos,
                lambda tup: tup[1].get("gastos_por_ano", {}).get(ano, 0.0) if tup[1] else 0.0,
            )
            if vencedor:
                dep, stats = vencedor
                total = stats.get("gastos_por_ano", {}).get(ano, 0.0)
                if total > 0:
                    trofeus.append(
                        _format_premio_entry(
                            dep,
                            total,
                            premio="trofeu",
                            tipo="estado",
                            ano=ano,
                            uf=uf,
                        )
                    )
    return trofeus


def _find_vencedor_categoria_ano(
    deputados: List[DeputadoResumo],
    stats_by_id: Dict[int, Dict[str, Any]],
    ano: int,
    categoria: str,
) -> Optional[Tuple[DeputadoResumo, float]]:
    candidatos = []
    for dep in deputados:
        stats = stats_by_id.get(dep.id)
        if not stats:
            continue

        if categoria == DEFAULT_CATEGORY:
            total = stats.get("gastos_por_ano", {}).get(ano, 0.0)
        else:
            total = (
                stats.get("gastos_por_ano_categoria", {})
                .get(ano, {})
                .get(categoria, 0.0)
            )
        candidatos.append((dep, total))

    return _pick_max(candidatos, lambda item: item[1])


def _pick_max(iterable: Iterable, key_fn) -> Optional[Tuple[Any, Any]]:
    best_item: Optional[Tuple[Any, Any]] = None
    best_value = float("-inf")
    for item in iterable:
        value = key_fn(item)
        if value > best_value:
            best_value = value
            best_item = item
    if not best_item or best_value <= 0:
        return None
    return best_item


def _format_premio_entry(
    deputado: DeputadoResumo,
    total: float,
    *,
    premio: str,
    tipo: str,
    categoria: Optional[str] = None,
    uf: Optional[str] = None,
    ano: Optional[int] = None,
) -> Dict[str, Any]:
    return {
        "premio": premio,
        "tipo": tipo,
        "categoria": categoria,
        "uf": uf,
        "ano": ano,
        "id": deputado.id,
        "nome": deputado.nome or deputado.nomeEleitoral,
        "nomeEleitoral": deputado.nomeEleitoral or deputado.nome,
        "siglaPartido": getattr(deputado, "siglaPartido", None) or deputado.sigla_partido,
        "siglaUf": getattr(deputado, "siglaUf", None) or deputado.sigla_uf,
        "total": round(total, 2),
    }


def _empty_payload(timestamp: str) -> Dict[str, Any]:
    return {
        "premiacoes": {"coroas": [], "trofeus": []},
        "metadata": {
            "anosDisponiveis": [],
            "categoriasDisponiveis": [],
            "ufsDisponiveis": [],
            "lastUpdate": timestamp,
            "totalPremiacoes": 0,
        },
    }
