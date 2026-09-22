"""Lightweight language code helpers for Medi-AI.

Language *detection* here is script-based and intentionally conservative: it
only maps Unicode scripts that correspond to the supported Helora languages.
It is used as a fallback so that a message typed in Tamil never falls back to
English just because the client omitted the field. It is NOT a claim of full
text classification, and it never bypasses the deterministic safety engine.

Latin-script (transliterated) input such as Tamil written in English letters
("enakku thala vali irukku") is handled by a small, curated token map that is
used ONLY to (a) choose the reply language and (b) feed classifier/RAG/safety
keyword matching. The original text is always preserved verbatim for the model.
"""
import re
from typing import Dict, List, Optional, Tuple

# Start/end code points for the scripts we can distinguish. Latin is used as
# the default (most Helora traffic is typed in a Latin alphabet).
_SCRIPT_RANGES: List[Tuple[str, int, int]] = [
    ('hi', 0x0900, 0x097F),  # Devanagari (Hindi)
    ('ta', 0x0B80, 0x0BFF),  # Tamil
    ('te', 0x0C00, 0x0C7F),  # Telugu
    ('kn', 0x0C80, 0x0CFF),  # Kannada
    ('ml', 0x0D00, 0x0D7F),  # Malayalam
]

_DEFAULT = 'en'

_TOKEN_RE = re.compile(r"[a-z']+")


def script_counts(text: str) -> dict:
    """Count code points per detected script. Latin/unknown is grouped as 'en'."""
    counts = {'en': 0}
    for char in str(text or ''):
        code = ord(char)
        if 0x0041 <= code <= 0x007A or 0x00C0 <= code <= 0x00FF:
            counts['en'] += 1
            continue
        matched = False
        for lang, start, end in _SCRIPT_RANGES:
            if start <= code <= end:
                counts[lang] = counts.get(lang, 0) + 1
                matched = True
                break
        if not matched:
            counts['en'] += 1  # punctuation, digits, other scripts -> neutral
    return counts


def detect_language_code(text: str, min_ratio: float = 0.35) -> Optional[str]:
    """Return a supported language code if a script clearly dominates.

    Returns ``None`` when the text is Latin/ASCII or ambiguous, so callers
    fall back to their own default without changing behaviour.
    """
    counts = script_counts(text)
    total = sum(counts.values())
    if total <= 0:
        return None
    non_latin = {k: v for k, v in counts.items() if k != 'en'}
    if not non_latin:
        return None
    best, best_count = max(non_latin.items(), key=lambda item: item[1])
    if best_count / total >= min_ratio and best_count >= 2:
        return best
    return None


# ---------------------------------------------------------------------------
# Latin-script (transliterated) Indian language handling.
#
# Curated, conservative token maps. Keys are lowercase Latin tokens; values
# are English glosses used ONLY for language selection + classifier/RAG
# normalization. The user's original text is never rewritten for the model.
# ---------------------------------------------------------------------------
TRANSLITERATED_WORDS: Dict[str, Dict[str, str]] = {
    'ta': {
        'enakku': 'i', 'yennakku': 'i', 'ennaakku': 'i', 'nan': 'i', 'naan': 'i',
        'irukku': 'have', 'irukkuthu': 'have', 'irukka': 'have', 'irundh': 'having',
        'illai': 'no', 'illa': 'no', 'romba': 'very', 'migavum': 'very',
        'vali': 'pain', 'vedana': 'pain', 'nopu': 'pain', 'thala': 'head',
        'thalai': 'head', 'jvaram': 'fever', 'jwaram': 'fever',
        'moochu': 'panting', 'mooku': 'mucus', 'thodai': 'throat',
        'siriche': 'chest', 'nenchu': 'chest', 'vandhu': 'came',
        'poguthu': 'going', 'unaku': 'you', 'unga': 'your', 'konjam': 'some',
        'seedham': 'cold', 'ratha': 'blood', 'ratta': 'blood', 'kan': 'eye',
    },
    'hi': {
        'mujhe': 'i', 'mujko': 'i', 'main': 'i', 'meri': 'my', 'mera': 'my',
        'hai': 'is', 'hain': 'is', 'nahi': 'no', 'nahin': 'no', 'bhi': 'also',
        'dard': 'pain', 'bukhar': 'fever', 'khaansi': 'cough', 'sira': 'head',
        'sar': 'head', 'dil': 'heart', 'chehra': 'face', 'khoon': 'blood',
        'thak': 'tired', 'chakkar': 'dizzy', 'jukhaam': 'cold', 'gala': 'throat',
        'bahut': 'very', 'kaafi': 'quite', 'kya': 'what', 'kyun': 'why',
    },
    'te': {
        'naaku': 'i', 'nenu': 'i', 'nuvvu': 'you', 'naa': 'my', 'naku': 'i',
        'undhi': 'have', 'undi': 'have', 'ledu': 'no', 'ledhu': 'no',
        'noppu': 'pain', 'noppi': 'pain', 'javaram': 'fever', 'jawaram': 'fever',
        'thalakayi': 'head', 'thala': 'head', 'raktam': 'blood', 'gunde': 'heart',
        'daddu': 'chest', 'chala': 'very', 'baga': 'well', 'kavali': 'want',
        'kaavali': 'want',
    },
    'ml': {
        'enikku': 'i', 'njan': 'i', 'enne': 'i', 'ente': 'my', 'enik': 'i',
        'undu': 'have', 'unde': 'have', 'illa': 'no', 'venam': 'need',
        'vedana': 'pain', 'nov': 'pain', 'pani': 'fever', 'thala': 'head',
        'nenju': 'heart', 'chora': 'blood', 'nee': 'you',
    },
    'kn': {
        'nanage': 'i', 'naanu': 'i', 'nanna': 'my', 'nimage': 'you',
        'ide': 'is', 'unde': 'have', 'illa': 'no', 'beku': 'need',
        'nove': 'pain', 'juga': 'fever', 'thale': 'head', 'raktava': 'blood',
        'siri': 'chest', 'bahala': 'very', 'kasa': 'cough', 'edey': 'chest',
    },
}

_TRANSLITERATION_ORDER = ['ta', 'hi', 'te', 'ml', 'kn']


def transliteration_counts(text: str) -> dict:
    counts = {lang: 0 for lang in _TRANSLITERATION_ORDER}
    tokens = _TOKEN_RE.findall(str(text or '').lower())
    for token in tokens:
        for lang in _TRANSLITERATION_ORDER:
            if token in TRANSLITERATED_WORDS[lang]:
                counts[lang] += 1
    return counts


def detect_transliterated_language(text: str, min_tokens: int = 2, min_ratio: float = 0.2) -> Optional[str]:
    """Detect a supported Indian language written in Latin script.

    Conservative: requires at least ``min_tokens`` matches making up at least
    ``min_ratio`` of the token stream, so plain English rarely mis-detects.
    """
    tokens = _TOKEN_RE.findall(str(text or '').lower())
    if not tokens:
        return None
    counts = transliteration_counts(text)
    best = None
    best_count = 0
    for lang in _TRANSLITERATION_ORDER:
        if counts[lang] > best_count:
            best_count = counts[lang]
            best = lang
    if best is None or best_count < min_tokens:
        return None
    if best_count / len(tokens) < min_ratio:
        return None
    return best


def tanglish_normalized(text: str) -> str:
    """Lowercase text plus English glosses of recognized transliterated tokens.

    Used ONLY for deterministic classifier/RAG keyword matching. The model
    prompt always uses the original text unchanged.
    """
    source = str(text or '').lower()
    tokens = _TOKEN_RE.findall(source)
    glosses = []
    for token in tokens:
        for lang in _TRANSLITERATION_ORDER:
            gloss = TRANSLITERATED_WORDS[lang].get(token)
            if gloss is not None:
                glosses.append(gloss)
                break
    if not glosses:
        return source
    return f'{source} \n{" ".join(glosses)}'


def resolve_language(explicit: str, message: str, supported: List[str]) -> Optional[str]:
    """Return the request language.

    Priority:
        1. A supported explicit language (the client's selected language wins).
        2. Script detection of the message text (fallback for missing field).
        3. Transliteration detection for Latin-script Indian language input.
        4. ``None`` when an explicit but unsupported language was supplied, so
           the caller can raise a 400 ``invalid_language``.
    """
    explicit = (explicit or '').strip()
    if explicit:
        return explicit if explicit in supported else None
    detected = detect_language_code(message)
    if detected in supported:
        return detected
    transliterated = detect_transliterated_language(message)
    return transliterated if transliterated in supported else _DEFAULT


def language_names(languages: List[str]) -> dict:
    names = {
        'en': 'English',
        'ta': 'Tamil',
        'hi': 'Hindi',
        'te': 'Telugu',
        'ml': 'Malayalam',
        'kn': 'Kannada',
    }
    return {code: names.get(code, code) for code in languages}