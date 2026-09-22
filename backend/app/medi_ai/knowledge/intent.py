"""Deterministic medical-intent and health-category classifier.

Pure keyword heuristics, so it is transparent and testable. It only feeds
retrieval and the provider prompt; it never decides treatment.

Input is normalized in two ways that never reach the model:
  * English is matched directly.
  * Latin-script transliterations ("Tanglish") are gloss-augmented via
    ``language_utils.tanglish_normalized`` so e.g. "enakku thala vali irukku"
    contributes its English meaning to indexing.
  * Native-script keywords (Tamil/Hindi/Telugu/Malayalam/Kannada) are matched
    against a small curated per-script set when the message uses that script.

Coverage remains heuristic and NOT clinically validated; multilingual intent
is improved but still imperfect (the documented XLM-R classifier remains the
plan for full coverage).
"""
import re
from typing import Dict, List, Tuple

from ..language_utils import detect_language_code, tanglish_normalized
from ..schemas.base import IntentResult

_WORD_RE = re.compile(r"[a-z0-9']+")

_INTENT_NAMES = ('medication_admin', 'medication', 'report', 'appointment',
                 'specialist', 'triage')

INTENT_KEYWORDS: Dict[str, List[str]] = {
    'medication': [
        'medicine', 'medication', 'tablet', 'capsule', 'dosage', 'dose',
        'side effect', 'interaction', 'paracetamol', 'amoxicillin', 'metformin',
        'aspirin', 'ibuprofen', 'prescription medicine', 'is it safe to take',
        'yellow capsule', 'small white tablet',
    ],
    'report': [
        'report', 'lab result', 'test result', 'blood test', 'blood work',
        'x-ray', 'mri', 'ct scan', 'ecg', 'hba1c', 'hemoglobin', 'cholesterol',
        'vitamin d', 'thyroid test', 'explain my report', 'my reports',
        'my test', 'lipid profile', 'blood sugar test',
    ],
    'specialist': [
        'which doctor', 'which specialist', 'which department', 'what kind of doctor',
        'see a specialist', 'see a doctor', 'consult a', 'recommend a doctor',
        'recommend a specialist', 'skin specialist', 'specialist for',
        'should i see', 'who should i', 'best doctor for',
    ],
    'appointment': [
        'appointment', 'book', 'schedule', 'slot', 'fix an appointment',
        'book a consult', 'meet the doctor', 'consultation slot',
    ],
    'triage': [
        'urgent', 'how serious is', 'should i go to hospital', 'should i go to the hospital',
        'go to hospital', 'go to the hospital', 'is this an emergency',
        'rush', 'asap', 'going to er', 'how worried should i be',
    ],
    'medication_admin': [
        'stopped my medicine', 'change my dosage', 'change the dose', 'change my dose',
        'should i stop', 'can i stop my medicine', 'stop my medicine', 'stop my medication',
        'dosage prescribed', 'quit my medicine', 'stop taking',
    ],
}

SYMPTOM_WORDS: List[str] = [
    'pain', 'fever', 'cough', 'headache', 'rash', 'nausea', 'dizziness', 'fatigue',
    'sore throat', 'runny nose', 'body ache', 'chills', 'vomiting', 'diarrhea',
    'constipation', 'itching', 'swelling', 'breathing', 'heartburn', 'acidity',
    'weakness', 'tired', 'sleepless', 'appetite', 'weight loss',
    'dizzy', 'stomach', 'stomach pain', 'hurt', 'abdominal pain', 'body pain',
    'joint pain', 'back pain', 'neck pain', 'throat pain', 'ear pain', 'chest pain',
    'eye pain', 'head pain',
]

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    'Cardiology': [
        'chest pain', 'heart', 'palpitation', 'uneasiness in chest', 'high bp',
        'blood pressure', 'hypertension', 'pounding heart',
    ],
    'Dermatology': [
        'rash', 'skin', 'itch', 'acne', 'eczema', 'psoriasis', 'mole', 'hives',
        'pigmentation', 'hair fall', 'scalp', 'ringworm',
    ],
    'Ophthalmology': [
        'eye', 'vision', 'blurred vision', 'red eye', 'eye pain', 'watery eye',
        'floaters', 'specs', 'sight',
    ],
    'Otorhinolaryngology': [
        'ear pain', 'sore throat', 'throat pain', 'hearing', 'earache', 'tonsil',
        'sinus', 'nasal', 'voice loss', 'ear discharge', 'swallowing',
    ],
    'Pulmonology': [
        'cough', 'shortness of breath', 'breathless', 'wheez', 'asthma', 'lung',
        'phlegm', 'chest congestion', 'breathing difficulty', 'coughing',
    ],
    'Neurology': [
        'headache', 'migraine', 'dizziness', 'numbness', 'tingling', 'vertigo',
        'tremor', 'memory loss', 'fits', 'head injury', 'neuralgia',
    ],
    'Gastroenterology': [
        'stomach pain', 'abdominal', 'diarrhea', 'constipation', 'nausea', 'vomit',
        'indigestion', 'acid reflux', 'bloating', 'liver', 'stomach', 'gas trouble',
        'loose motion', 'ulcer',
    ],
    'Orthopedics': [
        'joint pain', 'knee', 'back pain', 'neck pain', 'shoulder pain', 'bone',
        'fracture', 'sprain', 'muscle pain', 'arthritis', 'posture', 'slip disc',
    ],
    'Urology / Nephrology': [
        'urinary', 'urine', 'kidney', 'renal', 'bladder', 'burning while passing urine',
        'frequent urination', 'stone',
    ],
    'Endocrinology': [
        'diabetes', 'thyroid', 'sugar', 'hormone', 'weight gain', 'thyroid level',
        'insulin', 'pcod',
    ],
    'Gynecology': [
        'period', 'menstrual', 'pregnancy', 'ovary', 'uterus', 'breast pain',
        'pcod', 'pcos', 'menopause', 'white discharge',
    ],
    'Pediatrics': [
        'child', 'baby', 'infant', 'toddler', 'newborn', 'my kid',
    ],
    'Dental / Maxillofacial': [
        'tooth', 'teeth', 'gum', 'dental', 'jaw', 'mouth ulcer', 'bleeding gums',
    ],
    'Psychiatry / Mental Health': [
        'anxiety', 'depression', 'stress', 'panic', 'insomnia', 'sadness',
        'overthinking', 'mood', 'mental health',
    ],
}

# ---------------------------------------------------------------------------
# Curated per-script keyword maps (native-script text). Small, deliberate sets
# covering the most common expressions; not exhaustive.
# ---------------------------------------------------------------------------

MULTILINGUAL_SYMPTOM_WORDS: Dict[str, List[str]] = {
    'ta': ['தலைவலி', 'காய்ச்சல்', 'இருமல்', 'வலி', 'வாந்தி', 'சோர்வு',
           'தோல்', 'சொறி', 'அரிப்பு', 'தலை', 'நெஞ்சு', 'மார்பு', 'மூச்சு'],
    'hi': ['सिरदर्द', 'बुखार', 'खांसी', 'दर्द', 'उल्टी', 'थकान', 'खुजली',
           'सिर', 'सीना', 'छाती', 'सांस'],
    'te': ['తలనొప్పి', 'జ్వరం', 'దగ్గు', 'నొప్పి', 'వాంతి', 'అలసట',
           'గుండె', 'ఛాతీ', 'చర్మం', 'శ్వాస'],
    'ml': ['തലവേദന', 'പനി', 'ചുമ', 'വേദന', 'ഛർദ്ദി', 'ക്ഷീണം', 'നെഞ്ച്',
           'തൊലി', 'ശ്വാസം'],
    'kn': ['ತಲೆನೋವು', 'ಜ್ವರ', 'ಕೆಮ್ಮು', 'ನೋವು', 'ವಾಂತಿ', 'ಸುಸ್ತು', 'ಎದೆ',
           'ಚರ್ಮ', 'ಉಸಿರು'],
}

MULTILINGUAL_INTENT_KEYWORDS: Dict[str, Dict[str, List[str]]] = {
    'ta': {
        'appointment': ['நியமனம்', 'முன்பதிவு', 'சந்திப்பு', 'டாக்டர் பார்க்க'],
        'medication': ['மருந்து', 'மாத்திரை', 'காப்ஸியூல்'],
        'medication_admin': ['மருந்து நிறுத்த', 'மாத்திரை நிறுத்த', 'டோஸ் மாற்ற'],
        'report': ['ரிப்போர்ட்', 'பரிசோதனை முடிவு', 'ரத்த பரிசோதனை'],
        'specialist': ['எந்த டாக்டர்', 'எந்த டாக்டர', 'டாக்டரை', 'ஸ்பெஷலிஸ்ட்', 'மருத்துவர்'],
        'triage': ['அவசரம்', 'எமர்ஜென்சி', 'மருத்துவமனை செல்ல'],
    },
    'hi': {
        'appointment': ['अपॉइंटमेंट', 'नियुक्ति', 'डॉक्टर मिलना'],
        'medication': ['दवाई', 'दवा', 'गोली', 'कैप्सूल'],
        'medication_admin': ['दवा बंद करूं', 'दवा बंद करना', 'दवा छोड़'],
        'report': ['रिपोर्ट', 'जांच रिपोर्ट', 'ब्लड टेस्ट', 'रक्त परीक्षण'],
        'specialist': ['कौन सा डॉक्टर', 'विशेषज्ञ', 'डॉक्टर'],
        'triage': ['आपातकालीन', 'तुरंत', 'अस्पताल जाना'],
    },
    'te': {
        'appointment': ['అపాయింట్మెంట్', 'నియామకం', 'డాక్టర్ కలవాలి'],
        'medication': ['మందు', 'మాత్రలు', 'క్యాప్సూల్'],
        'medication_admin': ['మందు ఆపాలి', 'మందు మార్చాలి'],
        'report': ['రిపోర్ట్', 'పరీక్ష ఫలితం', 'రక్త పరీక్ష'],
        'specialist': ['ఏ డాక్టర్', 'స్పెషలిస్ట్'],
        'triage': ['అత్యవసరం', 'ఆసుపత్రి వెళ్లాలి'],
    },
    'ml': {
        'appointment': ['അപ്പോയിന്റ്മെന്റ്', 'കൂടിക്കാഴ്ച', 'ഡോക്ടറെ കാണാൻ'],
        'medication': ['മരുന്ന്', 'ഗുളിക', 'ഔഷധം'],
        'medication_admin': ['മരുന്ന് നിർത്തണോ', 'മരുന്ന് മാറ്റണം'],
        'report': ['റിപ്പോർട്ട്', 'പരിശോധന ഫലം', 'രക്ത പരിശോധന'],
        'specialist': ['ഏത് ഡോക്ടർ', 'സ്പെഷ്യലിസ്റ്റ്'],
        'triage': ['അടിയന്തരം', 'ആശുപത്രിയിൽ പോകണോ'],
    },
    'kn': {
        'appointment': ['ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್', 'ನೇಮಕಾತಿ', 'ಡಾಕ್ಟರ್ ಬಳಿ'],
        'medication': ['ಮದ್ದು', 'ಮಾತ್ರೆ', 'ಕ್ಯಾಪ್ಸೂಲ್'],
        'medication_admin': ['ಮದ್ದು ನಿಲ್ಲಿಸಬೇಕೆ', 'ಮದ್ದು ಬದಲಾಯಿಸಬೇಕೆ'],
        'report': ['ವರದಿ', 'ಪರೀಕ್ಷೆ ಫಲಿತಾಂಶ', 'ರಕ್ತ ಪರೀಕ್ಷೆ'],
        'specialist': ['ಯಾವ ಡಾಕ್ಟರ್', 'ತಜ್ಞ'],
        'triage': ['ತುರ್ತು', 'ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಬೇಕೆ'],
    },
}

MULTILINGUAL_CATEGORY_KEYWORDS: Dict[str, Dict[str, List[str]]] = {
    'Cardiology': {
        'ta': ['மார்பு', 'நெஞ்சு', 'இதயம்'],
        'hi': ['छाती', 'सीना', 'दिल'],
        'te': ['ఛాతీ', 'గుండె'],
        'ml': ['നെഞ്ച', 'ഹൃദയം'],
        'kn': ['ಎದೆ', 'ಹೃದಯ'],
    },
    'Pulmonology': {
        'ta': ['இருமல்', 'மூச்சு'],
        'hi': ['खांसी', 'सांस'],
        'te': ['దగ్గు', 'శ్వాస'],
        'ml': ['ചുമ', 'ശ്വാസം'],
        'kn': ['ಕೆಮ್ಮು', 'ಉಸಿರು'],
    },
    'Neurology': {
        'ta': ['தலைவலி', 'தலை'],
        'hi': ['सिरदर्द', 'सिर'],
        'te': ['తలనొప్పి'],
        'ml': ['തലവേദന'],
        'kn': ['ತಲೆನೋವು'],
    },
    'Gastroenterology': {
        'ta': ['வயிறு', 'வயிற்று'],
        'hi': ['पेट'],
        'te': ['కడుపు'],
        'ml': ['വയറ്'],
        'kn': ['ಹೊಟ್ಟೆ'],
    },
    'Dermatology': {
        'ta': ['தோல்', 'சொறி'],
        'hi': ['त्वचा'],
        'te': ['చర్మం'],
        'ml': ['തൊലി'],
        'kn': ['ಚರ್ಮ'],
    },
}

INTENT_ORDER = (
    'medication_admin', 'medication', 'report', 'appointment',
    'specialist', 'triage',
)


def _score_substrings(text: str, keywords: List[str]) -> int:
    score = 0
    for keyword in keywords:
        if keyword in text:
            score += 2 if ' ' in keyword else 1
    return score


def _detected_scripts(text: str) -> Tuple[str, ...]:
    """Return the dominant native script present, if clearly dominant."""
    detected = detect_language_code(text)
    return (detected,) if detected else ()


def classify_intent(text: str) -> IntentResult:
    lowered = (text or '').lower()
    augmented = tanglish_normalized(text)
    words = set(_WORD_RE.findall(augmented))
    scripts = _detected_scripts(text)

    scores = {intent: _score_substrings(augmented, keywords)
              for intent, keywords in INTENT_KEYWORDS.items()}
    for script in scripts:
        script_maps = MULTILINGUAL_INTENT_KEYWORDS.get(script, {})
        for intent, keywords in script_maps.items():
            scores[intent] = (scores.get(intent, 0)
                              + _score_substrings(lowered, keywords))

    intent = ''
    if any(scores.values()):
        intent = max(INTENT_ORDER, key=lambda i: scores.get(i, 0))
    else:
        symptom_count = _score_substrings(augmented, SYMPTOM_WORDS)
        for script in scripts:
            symptom_count += _score_substrings(
                lowered, MULTILINGUAL_SYMPTOM_WORDS.get(script, []))
        intent = 'symptom' if symptom_count >= 1 else 'general'

    # category detection over English/gloss text plus native-script keywords
    category, category_keywords = _detect_category(
        augmented, lowered, words, scripts)

    topic = category or _topic_hint(intent, lowered)
    return IntentResult(
        intent=intent,
        topic=topic,
        medical_category=category,
        confidence_words=category_keywords,
    )


def _detect_category(augmented, lowered, words: set, scripts: Tuple[str, ...]) -> Tuple[str, List[str]]:
    best: Tuple[str, List[str]] = ('', [])
    best_score = 0
    for category, keywords in CATEGORY_KEYWORDS.items():
        hits = [k for k in keywords if k in augmented]
        score = _score_substrings(augmented, keywords)
        for script in scripts:
            script_keywords = MULTILINGUAL_CATEGORY_KEYWORDS.get(category, {}).get(script, [])
            score += _score_substrings(lowered, script_keywords)
            hits.extend(k for k in script_keywords if k in lowered)
        if score > best_score:
            best_score = score
            best = (category, hits)
    return best


def _topic_hint(intent: str, lowered: str) -> str:
    hints = {
        'medication': 'medication information',
        'medication_admin': 'medication change inquiry',
        'report': 'medical report explanation',
        'appointment': 'appointment request',
        'specialist': 'doctor consultation',
        'triage': 'care urgency',
        'symptom': 'symptom discussion',
    }
    return hints.get(intent, 'general health question')