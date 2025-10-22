"""Compatibilidade para o comando legado de despesas.

Este módulo apenas delega para o pipeline modular de Câmara dos Deputados
em ``etlpython.sources.congresso_nacional.camara_deputados``.
"""

from ..sources.congresso_nacional.camara_deputados.cli import camara_deputados


def main() -> None:
    """Ponto de entrada legado que encaminha para o CLI modular."""
    camara_deputados()


if __name__ == "__main__":  # pragma: no cover
    main()
