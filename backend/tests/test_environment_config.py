"""Configuration syntax checks that never include environment values in output."""
from io import StringIO
from pathlib import Path

from dotenv import dotenv_values
from dotenv.parser import parse_stream


ROOT = Path(__file__).resolve().parents[2]


def _parse_errors(path):
    return [
        index
        for index, binding in enumerate(parse_stream(StringIO(path.read_text())), 1)
        if binding.error
    ]


def test_example_dotenv_is_parseable_and_documents_provider_keys():
    example = ROOT / '.env.example'
    assert example.exists()
    assert _parse_errors(example) == []

    names = set(dotenv_values(example))
    assert {'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'GEMINI_API_KEY'} <= names
    example_text = example.read_text()
    assert 'SUPERADMIN_EMAIL=' in example_text
    assert 'SUPERADMIN_PASSWORD=' in example_text


def test_present_local_dotenv_files_have_no_parse_errors():
    for relative in ('.env', 'backend/.env'):
        path = ROOT / relative
        if path.exists():
            assert _parse_errors(path) == []

    root_env = ROOT / '.env'
    if root_env.exists():
        names = set(dotenv_values(root_env))
        assert {'SUPERADMIN_EMAIL', 'SUPERADMIN_PASSWORD'} <= names