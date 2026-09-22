"""Safety engine and deterministic classification unit tests."""
import pytest

from app.medi_ai.safety.engine import SafetyEngine
from app.medi_ai.safety.rules import EMERGENCY_RULES_VERSION
from app.medi_ai.schemas.base import MediAIStructuredResponse


@pytest.fixture
def engine():
    return SafetyEngine()


EMERGENCIES = [
    "I can't breathe right now",
    'severe chest pain and sweating',
    'my father passed out and is not waking up',
    'he is bleeding heavily after the accident',
    'one side of my face is drooping',
    'she is having a seizure',
    'my whole body is shaking uncontrollably',
    'his throat is swelling, can\u2019t swallow and can\u2019t breathe',
    'I want to end my life',
    'I took an overdose of my medicine',
    'vomiting blood since morning',
]

TANGLISH_EMERGENCIES = [
    'enakku moochu mudiyala',
    'enakku chest pain irukku',
    'enakku mitchi pochu',
    'enakku blood varudhu',
    'stroke aanthudhu',
    'fits varudhu',
    'enakku severe allergy',
    'mujhe suicide karna hai',
    'naaku poison tinnanu',
    'enakku blood vanti varudhu',
]


@pytest.mark.parametrize('text', EMERGENCIES)
def test_emergency_messages_are_classified(engine, text):
    result = engine.classify(text)
    assert result.urgency == 'emergency'
    assert result.actions == ['seek_emergency_care_now']


@pytest.mark.parametrize('text', TANGLISH_EMERGENCIES)
def test_tanglish_emergency_messages_are_classified(engine, text):
    result = engine.classify(text)
    assert result.urgency == 'emergency'
    assert result.actions == ['seek_emergency_care_now']


def test_non_emergency_mostly_routine(engine):
    result = engine.classify('I have had a mild headache for two days')
    assert result.urgency == 'routine'
    assert not result.flags


def test_chest_pain_is_classified_emergency(engine):
    # Chest pain (any phrasing/severity) must escalate - the browser test found
    # plain "chest pain" previously fell through to a routine LLM answer.
    for text in (
        'I am having chest pain right now',
        'tightness in my chest',
        'I sometimes get mild chest pain when stressed',
        'my chest hurts',
    ):
        assert engine.classify(text).urgency == 'emergency'
    assert engine.classify('I am having chest pain right now').flags == ['chest_pain']
    assert 'severe_chest_pain' in engine.classify('severe chest pain and sweating').flags


def test_emergency_response_is_deterministic(engine):
    resp = engine.build_emergency_response("I can't breathe", 'en')
    assert resp.urgency == 'emergency'
    assert 'emergency' in resp.message.lower()
    assert resp.recommended_specialty is None or isinstance(resp.recommended_specialty, str)


def test_fail_safe_response(engine):
    resp = engine.fail_safe_response('en')
    assert resp.urgency == 'routine'
    assert 'fail_safe_used' in resp.safety_flags
    assert resp.message


def test_validate_response_downgrades_definitive_claim(engine):
    resp = MediAIStructuredResponse(
        message='You definitely have diabetes and I prescribe metformin.',
        urgency='routine',
        needs_follow_up=False,
    )
    out = engine.validate_response(resp, 'en')
    assert 'definitely' not in out.message.lower().split('.')[0]
    assert 'consult_healthcare_professional' in out.actions


def test_validate_response_normalizes_unknown_urgency(engine):
    resp = MediAIStructuredResponse(
        message='Just some info.',
        urgency='mild',
        needs_follow_up=False,
    )
    out = engine.validate_response(resp, 'en')
    assert out.urgency == 'routine'


def test_rules_version_is_stable():
    assert EMERGENCY_RULES_VERSION == '1.3.0'


MULTILINGUAL_EMERGENCIES = [
    ('ta', 'எனக்கு மார்பு வலி மற்றும் மூச்சுத்திணறல் உள்ளது.'),
    ('hi', 'मुझे सीने में दर्द और सांस लेने में कठिनाई हो रही है।'),
    ('te', 'నాకు ఛాతీ నొప్పి మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంది.'),
    ('ml', 'എനിക്ക് നെഞ്ചുവേദനയും ശ്വാസതടസ്സവും ഉണ്ട്.'),
    ('kn', 'ನನಗೆ ಎದೆ ನೋವು ಮತ್ತು ಉಸಿರಾಟದ ತೊಂದರೆ ಇದೆ.'),
]

# Deterministic safety must escalate emergencies regardless of language script.
@pytest.mark.parametrize('language,text', MULTILINGUAL_EMERGENCIES)
def test_multilingual_emergencies_are_classified(engine, language, text):
    result = engine.classify(text)
    assert result.urgency == 'emergency'
    assert result.actions == ['seek_emergency_care_now']


@pytest.mark.parametrize('language,text', MULTILINGUAL_EMERGENCIES)
def test_multilingual_emergency_response_uses_language(engine, language, text):
    from app.medi_ai.safety.templates import EMERGENCY_BANNER, template_for
    resp = engine.build_emergency_response(text, language)
    assert resp.urgency == 'emergency'
    assert resp.message
    # The deterministic banner is localized to the message language.
    assert template_for(EMERGENCY_BANNER, language) in resp.message
    assert resp.actions == ['seek_emergency_care_now']


def test_specialist_mapping_deterministic():
    from app.medi_ai.specialist import map_specialty, normalize_specialty
    assert normalize_specialty('cardiologist') == 'Cardiology'
    assert normalize_specialty('derm') == 'Derm' or map_specialty('skin rash') == 'Dermatology'
    from app.medi_ai.knowledge.intent import classify_intent
    intent = classify_intent('I have a persistent skin rash on my arm')
    assert intent.medical_category == 'Dermatology'
    assert map_specialty('I have a persistent skin rash on my arm') == 'Dermatology'


def test_source_hits_have_review_metadata():
    from app.medi_ai.knowledge.local import LocalCuratedRetriever
    r = LocalCuratedRetriever()
    hits = r.retrieve('how do I prepare for a blood test', None, 'en', limit=3)
    assert hits
    for doc in hits:
        assert hasattr(doc, 'review_status')
        assert doc.review_status == 'draft'


def test_intent_classification():
    from app.medi_ai.knowledge.intent import classify_intent
    assert classify_intent('book an appointment with a cardiologist').intent == 'appointment'
    assert classify_intent('what is my medication for blood pressure').intent == 'medication'
    assert classify_intent('hello there').intent == 'general'


@pytest.mark.parametrize('text,intent', [
    ('இது எமர்ஜென்சியா', 'triage'),
    ('எனக்கு தலைவலி', 'symptom'),
    ('मुझे दवा बंद करना है', 'medication_admin'),
    ('नాకు రక్త పరీక్ష రిపోర్ట్ కావాలి', 'report'),
    ('enakku thala vali irukku', 'symptom'),
    ('naaku javaram undhi', 'symptom'),
    ('mujhe dawai ka side effect batao', 'medication'),
])
def test_multilingual_intent_classification(text, intent):
    from app.medi_ai.knowledge.intent import classify_intent
    assert classify_intent(text).intent == intent


def test_specialist_reason_is_localized():
    from app.medi_ai.specialist import specialist_reason
    assert specialist_reason('Cardiology', 'ta') == 'உங்கள் கவலை இதயம் அல்லது மார்பு சார்ந்தது; இதை இருதய மருத்துவர் மதிப்பிடுவார்.'
    assert specialist_reason('Pulmonology', 'te') == 'మీ సమస్య శ్వాస లేదా ఊపిరితిత్తులకు సంబంధించినది; దీనిని ఊపిరితిత్తుల నిపుణుడు అంచనా వేస్తారు.'
    # Unsupported language falls back to English.
    assert specialist_reason('Cardiology', 'fr').startswith('Your concern relates to the heart')
    # Unknown specialty still produces a conservative generic reason.
    assert 'Fancyology' in specialist_reason('Fancyology', 'en')
    assert specialist_reason('', 'en') == ''


@pytest.mark.parametrize('raw,canonical', [
    ('Cardiologist', 'Cardiology'),
    ('Heart specialist', 'Cardiology'),
    ('ENT Doctor', 'Otorhinolaryngology'),
    ('Bone doctor', 'Orthopedics'),
    ('Kidney specialist', 'Urology / Nephrology'),
    ('skindoctor', None),
])
def test_normalize_specialty_handles_model_strings(raw, canonical):
    from app.medi_ai.specialist import normalize_specialty
    assert normalize_specialty(raw) == (canonical if canonical else raw.strip())


def test_local_retrieval_word_boundary_avoids_false_positive():
    from app.medi_ai.knowledge.local import LocalCuratedRetriever
    r = LocalCuratedRetriever()
    # 'dosage' must NOT match inside 'overdosage' (word-boundary matching).
    docs = r.retrieve('There was an overdosage at the hospital', '', 'en', limit=3)
    assert all(d.topic != 'medication-information' for d in docs)


def test_local_retrieval_returns_match_metadata():
    from app.medi_ai.knowledge.local import LocalCuratedRetriever
    r = LocalCuratedRetriever()
    docs = r.retrieve('medicine side effects', '', 'en', limit=3)
    assert docs and any(d.topic == 'medication-information' for d in docs)
    hits = r.to_hits(docs, 'medicine side effects')
    for hit in hits:
        assert hit.match_score > 0
        assert hit.matched_terms