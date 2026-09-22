from app.registration_routes import resolve_matching_user_row


def test_resolve_matching_user_row_returns_none_when_no_match():
    rows = [{'$id': 'r1', 'email': 'other@example.com', 'user_id': 'u-2', 'role': 'patient'}]

    result = resolve_matching_user_row(rows, user_id='u-1', email='new@example.com')

    assert result is None


def test_resolve_matching_user_row_rejects_conflicting_rows():
    rows = [
        {'$id': 'r1', 'email': 'same@example.com', 'user_id': 'u-1', 'role': 'patient'},
        {'$id': 'r2', 'email': 'same@example.com', 'user_id': 'u-2', 'role': 'doctor'},
    ]

    result = resolve_matching_user_row(rows, user_id='u-1', email='same@example.com')

    assert result is not None
    assert result['conflict'] is True
    assert {item['$id'] for item in result['matches']} == {'r1', 'r2'}


def test_resolve_matching_user_row_uses_unique_match_when_exact_id_matches():
    rows = [
        {'$id': 'r1', 'email': 'same@example.com', 'user_id': 'u-1', 'role': 'patient'},
        {'$id': 'r2', 'email': 'other@example.com', 'user_id': 'u-2', 'role': 'patient'},
    ]

    result = resolve_matching_user_row(rows, user_id='u-1', email='different@example.com')

    assert result is not None
    assert result['conflict'] is False
    assert result['match']['$id'] == 'r1'
