"""Deterministic specialist mapping (health concern -> specialty).

The AI may suggest a specialty/category, but only the backend may run real
doctor searches or appointment actions. This layer never invents doctors.
"""
from typing import List, Optional

from .knowledge.intent import CATEGORY_KEYWORDS, classify_intent

# Synonym normalization so suggested specialties match Helora doctor profiles.
SPECIALTY_ALIASES = {
    'cardiology': 'Cardiology',
    'cardiologist': 'Cardiology',
    'dermatology': 'Dermatology',
    'dermatologist': 'Dermatology',
    'ophthalmology': 'Ophthalmology',
    'ophthalmologist': 'Ophthalmology',
    'ent': 'Otorhinolaryngology',
    'ent specialist': 'Otorhinolaryngology',
    'otorhinolaryngology': 'Otorhinolaryngology',
    'pulmonology': 'Pulmonology',
    'respiratory medicine': 'Pulmonology',
    'neurology': 'Neurology',
    'neurologist': 'Neurology',
    'gastroenterology': 'Gastroenterology',
    'gastroenterologist': 'Gastroenterology',
    'orthopedics': 'Orthopedics',
    'orthopaedic': 'Orthopedics',
    'urology': 'Urology / Nephrology',
    'nephrology': 'Urology / Nephrology',
    'endocrinology': 'Endocrinology',
    'diabetology': 'Endocrinology',
    'gynecology': 'Gynecology',
    'gynecologist': 'Gynecology',
    'obstetrics': 'Gynecology',
    'pediatrics': 'Pediatrics',
    'pediatrician': 'Pediatrics',
    'dental': 'Dental / Maxillofacial',
    'dentistry': 'Dental / Maxillofacial',
    'psychiatry': 'Psychiatry / Mental Health',
    'psychiatrist': 'Psychiatry / Mental Health',
    'mental health': 'Psychiatry / Mental Health',
    'general medicine': 'General Medicine',
    'general physician': 'General Physician',
    'internal medicine': 'General Medicine',
}

DEFAULT_SPECIALTY = 'General Physician'

# Ordered phrase aliases for model-provided specialty strings that include extra
# words (e.g. "heart specialist", "bone doctor"). First match wins.
_PHRASE_ALIASES = [
    ('cardiolog', 'Cardiology'),
    ('heart specialist', 'Cardiology'),
    ('heart doctor', 'Cardiology'),
    ('cardiac', 'Cardiology'),
    ('dermatolog', 'Dermatology'),
    ('skin spec', 'Dermatology'),
    ('ophthalmo', 'Ophthalmology'),
    ('eye', 'Ophthalmology'),
    ('ear nose', 'Otorhinolaryngology'),
    ('ent ', 'Otorhinolaryngology'),
    ('pulmon', 'Pulmonology'),
    ('lung', 'Pulmonology'),
    ('respiratory', 'Pulmonology'),
    ('neuro', 'Neurology'),
    ('gastro', 'Gastroenterology'),
    ('stomach', 'Gastroenterology'),
    ('digestive', 'Gastroenterology'),
    ('ortho', 'Orthopedics'),
    ('bone', 'Orthopedics'),
    ('joint', 'Orthopedics'),
    ('uro', 'Urology / Nephrology'),
    ('kidney', 'Urology / Nephrology'),
    ('renal', 'Urology / Nephrology'),
    ('endocrino', 'Endocrinology'),
    ('diabet', 'Endocrinology'),
    ('hormone', 'Endocrinology'),
    ('gyneco', 'Gynecology'),
    ('women', 'Gynecology'),
    ('obstetric', 'Gynecology'),
    ('pediatr', 'Pediatrics'),
    ('child', 'Pediatrics'),
    ('dent', 'Dental / Maxillofacial'),
    ('mouth', 'Dental / Maxillofacial'),
    ('jaw', 'Dental / Maxillofacial'),
    ('psychiatr', 'Psychiatry / Mental Health'),
    ('mental health', 'Psychiatry / Mental Health'),
    ('counselling', 'Psychiatry / Mental Health'),
    ('general physician', 'General Physician'),
    ('general medicine', 'General Medicine'),
]

# Categories defined by keyword detection, mapped to canonical specialties.
_CATEGORY_SPECIALTY = {
    'Cardiology': 'Cardiology',
    'Dermatology': 'Dermatology',
    'Ophthalmology': 'Ophthalmology',
    'Otorhinolaryngology': 'Otorhinolaryngology',
    'Pulmonology': 'Pulmonology',
    'Neurology': 'Neurology',
    'Gastroenterology': 'Gastroenterology',
    'Orthopedics': 'Orthopedics',
    'Urology / Nephrology': 'Urology / Nephrology',
    'Endocrinology': 'Endocrinology',
    'Gynecology': 'Gynecology',
    'Pediatrics': 'Pediatrics',
    'Dental / Maxillofacial': 'Dental / Maxillofacial',
    'Psychiatry / Mental Health': 'Psychiatry / Mental Health',
}

_EMERGENCY_CATEGORY_SPECIALTY = {
    'severe_chest_pain': 'Cardiology',
    'stroke_warning_signs': 'Neurology',
    'seizure_neurological': 'Neurology',
}


def normalize_specialty(name: str) -> str:
    value = (name or '').strip().lower()
    if value in SPECIALTY_ALIASES:
        return SPECIALTY_ALIASES[value]
    if value.rstrip('s') in SPECIALTY_ALIASES:
        return SPECIALTY_ALIASES[value.rstrip('s')]
    # Model text often includes phrases around the specialty name.
    for phrase, canonical in _PHRASE_ALIASES:
        if phrase in value:
            return canonical
    return name.strip()


def map_specialty(text: str = '', categories: Optional[List[str]] = None) -> Optional[str]:
    """Map symptoms/concerns to a canonical specialty name.

    Returns ``None`` when nothing maps (callers should default to General
    Physician rather than guessing).
    """
    candidates = []
    if categories:
        candidates.extend(categories)
    if text:
        intent = classify_intent(text)
        if intent.medical_category:
            candidates.append(intent.medical_category)
    for category in reversed(candidates):
        if category in _CATEGORY_SPECIALTY:
            return _CATEGORY_SPECIALTY[category]
    return None


def emergency_specialty(rule_label: str) -> Optional[str]:
    return _EMERGENCY_CATEGORY_SPECIALTY.get(rule_label)


def available_specialties() -> List[str]:
    return sorted({SPECIALTY_ALIASES.get(key) for key in CATEGORY_KEYWORDS})


# Deterministic, conservative reasons shown next to a specialist suggestion.
# These only restate the mapping; they never rank doctors or guarantee care.
SPECIALIST_REASONS = {
    'Cardiology': 'Your concern relates to the heart or chest, which is what a cardiologist evaluates.',
    'Pulmonology': 'Your concern relates to breathing or the lungs, which is what a pulmonologist evaluates.',
    'Neurology': 'Your concern relates to the nervous system, which is what a neurologist evaluates.',
    'Dermatology': 'Your concern relates to the skin, which is what a dermatologist evaluates.',
    'Ophthalmology': 'Your concern relates to the eyes or vision, which is what an ophthalmologist evaluates.',
    'Otorhinolaryngology': 'Your concern relates to the ear, nose, or throat, which is what an ENT specialist evaluates.',
    'Gastroenterology': 'Your concern relates to the digestive system, which is what a gastroenterologist evaluates.',
    'Orthopedics': 'Your concern relates to bones, joints, or muscles, which is what an orthopedist evaluates.',
    'Urology / Nephrology': 'Your concern relates to the urinary tract or kidneys, which is what a urologist or nephrologist evaluates.',
    'Endocrinology': 'Your concern relates to hormones or metabolism, which is what an endocrinologist evaluates.',
    'Gynecology': 'Your concern relates to women\u2019s health, which is what a gynecologist evaluates.',
    'Pediatrics': 'Your concern relates to a child\u2019s health, which is what a pediatrician evaluates.',
    'Dental / Maxillofacial': 'Your concern relates to the teeth, gums, or mouth, which is what a dentist evaluates.',
    'Psychiatry / Mental Health': 'Your concern relates to mental health, which is what a psychiatrist evaluates.',
    'General Medicine': 'A general medicine physician can evaluate this concern and refer you further if needed.',
    'General Physician': 'A general physician can evaluate this concern and refer you further if needed.',
}

# Localized variants (fall back to English per-specialty string when missing).
SPECIALIST_REASONS_TA = {
    'Cardiology': 'உங்கள் கவலை இதயம் அல்லது மார்பு சார்ந்தது; இதை இருதய மருத்துவர் மதிப்பிடுவார்.',
    'Pulmonology': 'உங்கள் கவலை சுவாசம் அல்லது நுரையீரல் சார்ந்தது; இதை நுரையீரல் மருத்துவர் மதிப்பிடுவார்.',
    'Neurology': 'உங்கள் கவலை நரம்பு மண்டலம் சார்ந்தது; இதை நரம்பியல் மருத்துவர் மதிப்பிடுவார்.',
    'Dermatology': 'உங்கள் கவலை தோல் சார்ந்தது; இதை தோல் மருத்துவர் மதிப்பிடுவார்.',
    'Ophthalmology': 'உங்கள் கவலை கண் அல்லது பார்வை சார்ந்தது; இதை கண் மருத்துவர் மதிப்பிடுவார்.',
    'Gastroenterology': 'உங்கள் கவலை செரிமான அமைப்பு சார்ந்தது; இதை இரையக குடலியல் மருத்துவர் மதிப்பிடுவார்.',
    'Orthopedics': 'உங்கள் கவலை எலும்பு, மூட்டு அல்லது தசை சார்ந்தது; இதை எலும்பு மருத்துவர் மதிப்பிடுவார்.',
    'Endocrinology': 'உங்கள் கவலை ஹார்மோன் அல்லது வளர்சிதை விகாரம் சார்ந்தது; இதை நாளமில்லா மருத்துவர் மதிப்பிடுவார்.',
    'Gynecology': 'உங்கள் கவலை பெண்களின் உடல்நலம் சார்ந்தது; இதை மகப்பேறு மருத்துவர் மதிப்பிடுவார்.',
    'Pediatrics': 'உங்கள் கவலை குழந்தையின் உடல்நலம் சார்ந்தது; இதை குழந்தை மருத்துவர் மதிப்பிடுவார்.',
    'Psychiatry / Mental Health': 'உங்கள் கவலை மன நலம் சார்ந்தது; இதை மனநல மருத்துவர் மதிப்பிடுவார்.',
    'General Medicine': 'இந்த கவலையை ஒரு பொது மருத்துவர் மதிப்பிட்டு தேவைப்பட்டால் மேலும் பரிந்துரைப்பார்.',
    'General Physician': 'இந்த கவலையை ஒரு பொது மருத்துவர் மதிப்பிட்டு தேவைப்பட்டால் மேலும் பரிந்துரைப்பார்.',
}

SPECIALIST_REASONS_HI = {
    'Cardiology': 'आपकी चिंता हृदय या छाती से जुड़ी है, जिसका मूल्यांकन हृदय रोग विशेषज्ञ करता है।',
    'Pulmonology': 'आपकी चिंता सांस या फेफड़ों से जुड़ी है, जिसका मूल्यांकन फेफड़ा विशेषज्ञ करता है।',
    'Neurology': 'आपकी चिंता तंत्रिका तंत्र से जुड़ी है, जिसका मूल्यांकन न्यूरोलॉजिस्ट करता है।',
    'Dermatology': 'आपकी चिंता त्वचा से जुड़ी है, जिसका मूल्यांकन त्वचा विशेषज्ञ करता है।',
    'Ophthalmology': 'आपकी चिंता आंखों या दृष्टि से जुड़ी है, जिसका मूल्यांकन नेत्र विशेषज्ञ करता है।',
    'Otorhinolaryngology': 'आपकी चिंता कान, नाक या गले से जुड़ी है, जिसका मूल्यांकन ईएनटी विशेषज्ञ करता है।',
    'Gastroenterology': 'आपकी चिंता पाचन तंत्र से जुड़ी है, जिसका मूल्यांकन गैस्ट्रोएंटेरोलॉजिस्ट करता है।',
    'Orthopedics': 'आपकी चिंता हड्डियों, जोड़ों या मांसपेशियों से जुड़ी है, जिसका मूल्यांकन हड्डी रोग विशेषज्ञ करता है।',
    'Endocrinology': 'आपकी चिंता हार्मोन या चयापचय से जुड़ी है, जिसका मूल्यांकन एंडोक्रिनोलॉजिस्ट करता है।',
    'Gynecology': 'आपकी चिंता महिलाओं के स्वास्थ्य से जुड़ी है, जिसका मूल्यांकन स्त्री रोग विशेषज्ञ करता है।',
    'Pediatrics': 'आपकी चिंता बच्चे के स्वास्थ्य से जुड़ी है, जिसका मूल्यांकन बाल रोग विशेषज्ञ करता है।',
    'Psychiatry / Mental Health': 'आपकी चिंता मानसिक स्वास्थ्य से जुड़ी है, जिसका मूल्यांकन मनोचिकित्सक करता है।',
    'General Medicine': 'एक सामान्य चिकित्सक इस चिंता का मूल्यांकन कर आवश्यक होने पर आगे भेज सकता है।',
    'General Physician': 'एक सामान्य चिकित्सक इस चिंता का मूल्यांकन कर आवश्यक होने पर आगे भेज सकता है।',
}

SPECIALIST_REASONS_TE = {
    'Cardiology': 'మీ సమస్య గుండె లేదా ఛాతీకి సంబంధించినది; దీనిని గుండె నిపుణుడు అంచనా వేస్తారు.',
    'Pulmonology': 'మీ సమస్య శ్వాస లేదా ఊపిరితిత్తులకు సంబంధించినది; దీనిని ఊపిరితిత్తుల నిపుణుడు అంచనా వేస్తారు.',
    'Neurology': 'మీ సమస్య నాడీ వ్యవస్థకు సంబంధించినది; దీనిని న్యూరాలజిస్ట్ అంచనా వేస్తారు.',
    'Dermatology': 'మీ సమస్య చర్మానికి సంబంధించినది; దీనిని చర్మ నిపుణుడు అంచనా వేస్తారు.',
    'Ophthalmology': 'మీ సమస్య కళ్ళకు లేదా దృష్టికి సంబంధించినది; దీనిని కంటి నిపుణుడు అంచనా వేస్తారు.',
    'Gastroenterology': 'మీ సమస్య జీర్ణ వ్యవస్థకు సంబంధించినది; దీనిని గ్యాస్ట్రోఎంటరాలజిస్ట్ అంచనా వేస్తారు.',
    'Orthopedics': 'మీ సమస్య ఎముకలు, కీళ్ళు లేదా కండరాలకు సంబంధించినది; దీనిని ఎముక నిపుణుడు అంచనా వేస్తారు.',
    'Endocrinology': 'మీ సమస్య హార్మోన్లు లేదా జీవక్రియకు సంబంధించినది; దీనిని ఎండోక్రినాలజిస్ట్ అంచనా వేస్తారు.',
    'Gynecology': 'మీ సమస్య మహిళల ఆరోగ్యానికి సంబంధించినది; దీనిని గైనకాలజిస్ట్ అంచనా వేస్తారు.',
    'Pediatrics': 'మీ సమస్య పిల్లల ఆరోగ్యానికి సంబంధించినది; దీనిని పీడియాట్రీషియన్ అంచనా వేస్తారు.',
    'Psychiatry / Mental Health': 'మీ సమస్య మానసిక ఆరోగ్యానికి సంబంధించినది; దీనిని మనోవైద్యుడు అంచనా వేస్తారు.',
    'General Medicine': 'ఒక సాధారణ వైద్యుడు ఈ సమస్యను అంచనా వేసి అవసరమైతే మరింత సిఫారసు చేస్తారు.',
    'General Physician': 'ఒక సాధారణ వైద్యుడు ఈ సమస్యను అంచనా వేసి అవసరమైతే మరింత సిఫారసు చేస్తారు.',
}

SPECIALIST_REASONS_ML = {
    'Cardiology': 'നിങ്ങളുടെ ആശങ്ക ഹൃദയം അല്ലെങ്കിൽ നെഞ്ചാണ്; ഇത് കാർഡിയോളജിസ്റ്റ് വിലയിരുത്തുന്നു.',
    'Pulmonology': 'നിങ്ങളുടെ ആശങ്ക ശ്വാസോച്ഛ്വാസം അല്ലെങ്കിൽ ശ്വാസകോശവുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് പൾമോണോളജിസ്റ്റ് വിലയിരുത്തുന്നു.',
    'Neurology': 'നിങ്ങളുടെ ആശങ്ക നാഡീവ്യൂഹവുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് ന്യൂറോളജിസ്റ്റ് വിലയിരുത്തുന്നു.',
    'Dermatology': 'നിങ്ങളുടെ ആശങ്ക ചർമ്മവുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് ഡെർമറ്റോളജിസ്റ്റ് വിലയിരുത്തുന്നു.',
    'Ophthalmology': 'നിങ്ങളുടെ ആശങ്ക കണ്ണ് അല്ലെങ്കിൽ കാഴ്ചയുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് നേത്ര ശസ്ത്രക്രിയാ വിദഗ്ദ്ധൻ വിലയിരുത്തുന്നു.',
    'Gastroenterology': 'നിങ്ങളുടെ ആശങ്ക ദഹനവ്യവസ്ഥയുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് ഗ്യാസ്ട്രോഎന്ററോളജിസ്റ്റ് വിലയിരുത്തുന്നു.',
    'Orthopedics': 'നിങ്ങളുടെ ആശങ്ക എല്ലുകൾ, സന്ധികൾ അല്ലെങ്കിൽ പേശികളുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് ഓർത്തോപീഡിക് വിദഗ്ദ്ധൻ വിലയിരുത്തുന്നു.',
    'Endocrinology': 'നിങ്ങളുടെ ആശങ്ക ഹോർമോണുകൾ അല്ലെങ്കിൽ ഉപാപചയവുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് എൻഡോക്രൈനോളജിസ്റ്റ് വിലയിരുത്തുന്നു.',
    'Gynecology': 'നിങ്ങളുടെ ആശങ്ക സ്ത്രീകളുടെ ആരോഗ്യവുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് ഗൈനക്കോളജിസ്റ്റ് വിലയിരുത്തുന്നു.',
    'Pediatrics': 'നിങ്ങളുടെ ആശങ്ക കുട്ടിയുടെ ആരോഗ്യവുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് ശിശുരോഗ വിദഗ്ദ്ധൻ വിലയിരുത്തുന്നു.',
    'Psychiatry / Mental Health': 'നിങ്ങളുടെ ആശങ്ക മാനസികാരോഗ്യവുമായി ബന്ധപ്പെട്ടതാണ്; ഇത് സൈക്യാട്രിസ്റ്റ് വിലയിരുത്തുന്നു.',
    'General Medicine': 'ജനറൽ മെഡിസിൻ ഡോക്ടർ ഈ ആശങ്ക വിലയിരുത്തി ആവശ്യമെങ്കിൽ വിദഗ്ദ്ധനിലേക്ക് റഫർ ചെയ്യും.',
    'General Physician': 'ജനറൽ ഫിസിഷ്യൻ ഈ ആശങ്ക വിലയിരുത്തി ആവശ്യമെങ്കിൽ വിദഗ്ദ്ധനിലേക്ക് റഫർ ചെയ്യും.',
}

SPECIALIST_REASONS_KN = {
    'Cardiology': 'ನಿಮ್ಮ ಆತಂಕ ಹೃದಯ ಅಥವಾ ಎದೆಗೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಹೃದ್ರೋಗ ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Pulmonology': 'ನಿಮ್ಮ ಆತಂಕ ಉಸಿರಾಟ ಅಥವಾ ಶ್ವಾಸಕೋಶಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಶ್ವಾಸಕೋಶ ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Neurology': 'ನಿಮ್ಮ ಆತಂಕ ನರಮಂಡಲಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ನರರೋಗ ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Dermatology': 'ನಿಮ್ಮ ಆತಂಕ ಚರ್ಮಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಚರ್ಮರೋಗ ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Ophthalmology': 'ನಿಮ್ಮ ಆತಂಕ ಕಣ್ಣು ಅಥವಾ ದೃಷ್ಟಿಗೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ನೇತ್ರ ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Gastroenterology': 'ನಿಮ್ಮ ಆತಂಕ ಜೀರ್ಣಾಂಗ ವ್ಯವಸ್ಥೆಗೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಜಠರಗರುಳು ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Orthopedics': 'ನಿಮ್ಮ ಆತಂಕ ಮೂಳೆಗಳು, ಕೀಲುಗಳು ಅಥವಾ ಸ್ನಾಯುಗಳಿಗೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಮೂಳೆ ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Endocrinology': 'ನಿಮ್ಮ ಆತಂಕ ಹಾರ್ಮೋನ್ಗಳು ಅಥವಾ ಚಯಾಪಚಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಹಾರ್ಮೋನ್ ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Gynecology': 'ನಿಮ್ಮ ಆತಂಕ ಮಹಿಳೆಯರ ಆರೋಗ್ಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಸ್ತ್ರೀರೋಗ ತಜ್ಞರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Pediatrics': 'ನಿಮ್ಮ ಆತಂಕ ಮಗುವಿನ ಆರೋಗ್ಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಶಿಶುವೈದ್ಯರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'Psychiatry / Mental Health': 'ನಿಮ್ಮ ಆತಂಕ ಮಾನಸಿಕ ಆರೋಗ್ಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ; ಇದನ್ನು ಮನೋವೈದ್ಯರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
    'General Medicine': 'ಸಾಮಾನ್ಯ ವೈದ್ಯರು ಈ ಆತಂಕವನ್ನು ಪರಿಶೀಲಿಸಿ ಅಗತ್ಯವಿದ್ದರೆ ಮತ್ತಷ್ಟು ಶಿಫಾರಸು ಮಾಡಬಹುದು.',
    'General Physician': 'ಸಾಮಾನ್ಯ ವೈದ್ಯರು ಈ ಆತಂಕವನ್ನು ಪರಿಶೀಲಿಸಿ ಅಗತ್ಯವಿದ್ದರೆ ಮತ್ತಷ್ಟು ಶಿಫಾರಸು ಮಾಡಬಹುದು.',
}

_SPECIALIST_REASONS_BY_LANG = {
    'ta': SPECIALIST_REASONS_TA,
    'hi': SPECIALIST_REASONS_HI,
    'te': SPECIALIST_REASONS_TE,
    'ml': SPECIALIST_REASONS_ML,
    'kn': SPECIALIST_REASONS_KN,
}


def specialist_reason(specialty: Optional[str], language: str = 'en') -> str:
    if not specialty:
        return ''
    reasons = _SPECIALIST_REASONS_BY_LANG.get(language, {})
    if language != 'en' and specialty in reasons:
        return reasons[specialty]
    return SPECIALIST_REASONS.get(
        specialty,
        f'A {specialty} specialist may be able to evaluate this concern.',
    )