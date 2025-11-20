"""Allow `python -m etlpython` to executar o CLI unificado."""

from __future__ import annotations

from .cli.main import etlpython_cli


def main() -> None:
    etlpython_cli()


if __name__ == "__main__":  # pragma: no cover
    main()
