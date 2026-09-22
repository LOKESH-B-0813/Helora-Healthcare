"""Explicit, idempotent Appwrite schema bootstrap.

Run from the repository root:
    ./venv/bin/python backend/scripts/provision_appwrite_schema.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import create_app
from app.schema_provisioning import provision_schema


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        print(json.dumps(provision_schema(app), indent=2, sort_keys=True))