#!/usr/bin/env python3
"""
Script para testar a normalização de categorias.
"""

def normalize_categoria_despesa(categoria):
    """Normalize expense category by removing trailing dots and extra spaces."""
    if not categoria:
        return "Despesa não especificada"

    # Remove trailing dots and strip whitespace
    normalized = categoria.strip()
    if normalized.endswith('.'):
        normalized = normalized[:-1].strip()

    return normalized if normalized else "Despesa não especificada"


def test_normalization():
    """Test category normalization."""
    test_cases = [
        ("DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.", "DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR"),
        ("COMBUSTÍVEIS E LUBRIFICANTES.", "COMBUSTÍVEIS E LUBRIFICANTES"),
        ("LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES", "LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES"),
        ("LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES.", "LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES"),
        ("MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR", "MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR"),
        ("  PASSAGEM AÉREA - SIGEPA  .", "PASSAGEM AÉREA - SIGEPA"),
        ("", "Despesa não especificada"),
        (None, "Despesa não especificada"),
        ("   .", "Despesa não especificada"),
    ]

    print("🧪 Testando Normalização de Categorias")
    print("=" * 60)

    all_passed = True
    for original, expected in test_cases:
        result = normalize_categoria_despesa(original)
        passed = result == expected
        status = "✅ PASS" if passed else "❌ FAIL"

        print(f"{status} Original: '{original}' → Normalizado: '{result}'")
        if not passed:
            print(f"     Esperado: '{expected}'")
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("✅ Todos os testes passaram! A normalização está funcionando corretamente.")
    else:
        print("❌ Alguns testes falharam!")

    # Test uniqueness - categories that should be the same after normalization
    print("\n🔍 Testando Prevenção de Duplicatas")
    print("-" * 40)

    categories_before = [
        "DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.",
        "DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR",
        "COMBUSTÍVEIS E LUBRIFICANTES.",
        "COMBUSTÍVEIS E LUBRIFICANTES",
        "LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES",
        "LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES.",
    ]

    categories_after = [normalize_categoria_despesa(cat) for cat in categories_before]
    unique_after = list(set(categories_after))

    print(f"Categorias originais: {len(categories_before)}")
    print(f"Categorias após normalização: {len(unique_after)}")
    print("Categorias únicas após normalização:")
    for cat in sorted(unique_after):
        print(f"  • {cat}")

    if len(unique_after) == 3:  # Esperamos 3 categorias únicas
        print("✅ Duplicatas foram eliminadas com sucesso!")
    else:
        print("❌ Problema na eliminação de duplicatas!")


if __name__ == "__main__":
    test_normalization()