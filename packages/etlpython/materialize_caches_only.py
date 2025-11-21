import argparse
from pathlib import Path
from datetime import datetime, timezone
import json

from etlpython.cli.materialize_monitordespesasDf import (
    find_project_root,
    resolve_path,
    DEFAULT_DATASET_CANDIDATES,
    load_dataset,
    normalize_fornecedores,
    normalize_deputados,
    generate_frontend_caches,
)


def main():
    parser = argparse.ArgumentParser(description="Materializar caches do frontend sem escrever SQLite")
    parser.add_argument("--fornecedores-dataset", required=False, help="Caminho para o dataset de fornecedores JSON")
    parser.add_argument("--deputados-dataset", required=False, help="Caminho para o dataset de deputados JSON")
    parser.add_argument("--legislatura", type=int, required=True, help="Legislatura dos dados")
    parser.add_argument("--cache-version", required=True, help="Versão do cache a ser gerada")
    parser.add_argument("--expected-total", type=int, required=False, help="Total de deputados esperado (ex.: 40)")
    args = parser.parse_args()

    project_root = find_project_root(Path.cwd())

    # Defaults para os caminhos consolidados corretos
    default_deps = project_root / "bancoDados" / "monitordespesas" / "congressoNacional" / "camaraDeputados" / "deputadosFederais" / "deputados.json"
    default_forns = project_root / "bancoDados" / "monitordespesas" / "congressoNacional" / "fornecedores" / "fornecedores.json"

    fornecedores_dataset_path = resolve_path(
        args.fornecedores_dataset or str(default_forns), project_root, defaults=DEFAULT_DATASET_CANDIDATES
    )
    deputados_dataset_path = resolve_path(
        args.deputados_dataset or str(default_deps), project_root, defaults=()
    )

    # Bloqueio preventivo: não aceitar caminho parcial de camaraDeputados
    # COMENTADO: A validação está rejeitando o caminho correto que contém "camaraDeputados"
    # for p in (fornecedores_dataset_path, deputados_dataset_path):
    #     if "camaraDeputados" in str(p):
    #         raise SystemExit(
    #             "❌ Caminho inválido para materialização: detectado 'camaraDeputados'. "
    #             "Use os consolidados em 'congressoNacional/camaraDeputados/deputadosFederais/deputados.json' "
    #             "e 'congressoNacional/fornecedores/fornecedores.json'."
    #         )

    # Carregar manifest para validação de total
    manifest_path = project_root / "bancoDados" / "monitordespesas" / "manifest.json"
    expected_total = args.expected_total
    if manifest_path.exists() and expected_total is None:
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
                expected_total = manifest.get("totalDeputados")
        except Exception:
            expected_total = None

    raw_fornecedores = load_dataset(fornecedores_dataset_path)
    raw_deputados = load_dataset(deputados_dataset_path)

    # Validar contagem de deputados antes de normalizar
    try:
        deputados_count = len(raw_deputados)
    except Exception:
        deputados_count = None

    if expected_total is not None and deputados_count is not None and deputados_count != expected_total:
        raise SystemExit(
            f"❌ Divergência de total de deputados: dataset contém {deputados_count}, "
            f"mas o esperado é {expected_total}. Verifique os caminhos dos consolidado(s)."
        )

    normalized_fornecedores = normalize_fornecedores(raw_fornecedores)
    normalized_deputados = normalize_deputados(raw_deputados)

    # Gera caches em packages/monitor-despesas-next/public/cache
    generate_frontend_caches(
        normalized_fornecedores,
        normalized_deputados,
        fornecedores_dataset_path,
        deputados_dataset_path,
        project_root,
        legislatura=args.legislatura,
        version=args.cache_version,
        dados_processados=None,
        deputados_index={},
    )

    ts = datetime.now(timezone.utc).isoformat()
    print(f"✅ Caches materializados com sucesso ({ts})")


if __name__ == "__main__":
    main()