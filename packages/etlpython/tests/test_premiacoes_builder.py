from etlpython.models import DeputadoResumo
from etlpython.services.premiacoes_builder import build_premiacoes_cache, DEFAULT_CATEGORY


def make_deputado(idx: int, nome: str, partido: str, uf: str, total: float) -> DeputadoResumo:
    return DeputadoResumo(
        id=idx,
        nome=nome,
        nomeEleitoral=nome,
        siglaPartido=partido,
        siglaUf=uf,
        totalDespesas=total,
        numeroDespesas=10,
        fornecedoresIdentificados=2,
    )


def test_build_premiacoes_cache_produces_coroas_e_trofeus():
    dep_sp = make_deputado(1, "Dep SP", "AAA", "SP", 1500)
    dep_rj = make_deputado(2, "Dep RJ", "BBB", "RJ", 1200)

    stats = {
        1: {
            "total_despesas": 1500.0,
            "numero_despesas": 10,
            "fornecedores": set(),
            "gastos_por_ano": {2023: 700.0, 2024: 800.0},
            "gastos_por_categoria": {"Alimentação": 900.0, "Transporte": 600.0},
            "gastos_por_ano_categoria": {
                2023: {"Alimentação": 500.0},
                2024: {"Transporte": 400.0},
            },
        },
        2: {
            "total_despesas": 1200.0,
            "numero_despesas": 8,
            "fornecedores": set(),
            "gastos_por_ano": {2023: 900.0, 2024: 300.0},
            "gastos_por_categoria": {"Alimentação": 400.0, "Divulgação": 800.0},
            "gastos_por_ano_categoria": {
                2023: {"Alimentação": 350.0, "Divulgação": 550.0},
                2024: {"Divulgação": 250.0},
            },
        },
    }

    payload = build_premiacoes_cache([dep_sp, dep_rj], stats, generated_at="2025-01-01T00:00:00Z")

    coroas = payload["premiacoes"]["coroas"]
    trofeus = payload["premiacoes"]["trofeus"]

    assert payload["metadata"]["totalPremiacoes"] == len(coroas) + len(trofeus)
    assert "SP" in payload["metadata"]["ufsDisponiveis"]
    assert 2023 in payload["metadata"]["anosDisponiveis"]

    coroa_geral = next(entry for entry in coroas if entry["tipo"] == "categoria" and entry["categoria"] == DEFAULT_CATEGORY)
    assert coroa_geral["id"] == dep_sp.id
    assert coroa_geral["premio"] == "coroa"

    coroa_estado_rj = next(entry for entry in coroas if entry["tipo"] == "estado" and entry["uf"] == "RJ")
    assert coroa_estado_rj["id"] == dep_rj.id

    trofeu_geral_2023 = next(entry for entry in trofeus if entry["tipo"] == "categoria" and entry["categoria"] == DEFAULT_CATEGORY and entry["ano"] == 2023)
    assert trofeu_geral_2023["id"] == dep_rj.id  # maior gasto em 2023

    trofeu_estado_sp_2024 = next(entry for entry in trofeus if entry["tipo"] == "estado" and entry["uf"] == "SP" and entry["ano"] == 2024)
    assert trofeu_estado_sp_2024["id"] == dep_sp.id
