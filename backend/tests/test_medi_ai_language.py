"""Language detection and resolution unit tests."""
from app.medi_ai.language_utils import (
    detect_language_code,
    detect_transliterated_language,
    resolve_language,
    tanglish_normalized,
)

SUPPORTED = ['en', 'ta', 'hi', 'te', 'ml', 'kn']


def test_detect_english_is_none():
    assert detect_language_code('I have a headache since morning') is None


def test_detect_tamil():
    assert detect_language_code('எனக்கு மார்பு வலி மற்றும் மூச்சுத்திணறல் உள்ளது.') == 'ta'


def test_detect_hindi():
    assert detect_language_code('मुझे सीने में दर्द और सांस लेने में कठिनाई हो रही है।') == 'hi'


def test_detect_telugu():
    assert detect_language_code('నాకు ఛాతీ నొప్పి మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంది.') == 'te'


def test_detect_malayalam():
    assert detect_language_code('എനിക്ക് നെഞ്ചുവേദനയും ശ്വാസതടസ്സവും ഉണ്ട്.') == 'ml'


def test_detect_kannada():
    assert detect_language_code('ನನಗೆ ಎದೆ ನೋವು ಮತ್ತು ಉಸಿರಾಟದ ತೊಂದರೆ ಇದೆ.') == 'kn'


def test_resolve_explicit_language_wins():
    assert resolve_language('hi', 'I have chest pain', SUPPORTED) == 'hi'


def test_resolve_empty_explicit_detects_script():
    assert resolve_language('', 'எனக்கு மார்பு வலி', SUPPORTED) == 'ta'


def test_resolve_unsupported_explicit_returns_none():
    assert resolve_language('fr', 'bonjour', SUPPORTED) is None


def test_resolve_empty_latin_falls_back_to_english():
    assert resolve_language('', 'hello there', SUPPORTED) == 'en'


def test_detect_transliterated_tamil():
    assert detect_transliterated_language('enakku thala vali irukku') == 'ta'


def test_detect_transliterated_telugu():
    assert detect_transliterated_language('naaku javaram undhi') == 'te'


def test_detect_transliterated_hindi():
    assert detect_transliterated_language('mujhe sir dard hai') == 'hi'


def test_detect_transliterated_malayalam():
    assert detect_transliterated_language('enikku pani undu') == 'ml'


def test_detect_transliterated_kannada():
    assert detect_transliterated_language('nanage thale nove ide') == 'kn'


def test_transliteration_not_detected_for_plain_english():
    assert detect_transliterated_language('I have a chest pain since morning') is None


def test_transliteration_not_detected_for_single_token():
    assert detect_transliterated_language('irukku') is None


def test_resolve_transliterated_language():
    assert resolve_language('', 'enakku thala vali irukku', SUPPORTED) == 'ta'


def test_tanglish_normalized_appends_glosses():
    normalized = tanglish_normalized('enakku thala vali irukku')
    for gloss in ('pain', 'head', 'have'):
        assert gloss in normalized


def test_tanglish_normalized_preserves_original_text():
    original = 'enakku thala vali irukku'
    assert tanglish_normalized(original).startswith(original.lower())


def test_tanglish_normalized_english_unchanged():
    text = 'I have a headache since morning'
    assert tanglish_normalized(text) == text.lower()