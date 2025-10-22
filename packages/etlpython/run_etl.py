#!/usr/bin/env python3
"""
ETL Runner for Python version.
Usage: python run_etl.py [legislatura] [limit] [--pc]
"""

import sys
import subprocess
from pathlib import Path


def main():
    """Run the ETL with command line arguments."""
    script_path = Path(__file__).parent / "test_etl.py"

    # Forward all arguments to test_etl.py
    cmd = [sys.executable, str(script_path)] + sys.argv[1:]

    # Run the ETL
    result = subprocess.run(cmd)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()