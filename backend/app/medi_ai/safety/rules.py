"""Deterministic emergency-signal rules for the safety engine.

Heuristic keyword rules are intentionally conservative: they exist to catch
clearly urgent language so Medi-AI can escalate immediately. They are NOT an
exhaustive clinical rule set.

Versioning: bump ``EMERGENCY_RULES_VERSION`` whenever any rule changes so that
externally reviewed/versioned rule revisions can be audited. Rules may later be
loaded from an external, clinically-reviewed JSON file instead of this module.
"""
from typing import Dict, List

EMERGENCY_RULES_VERSION = '1.3.0'

# Guidance strings appended to emergency replies. Keep them generic; wording is
# in the safety templates module so it can be localized.
EMERGENCY_ACTIONS = ['seek_emergency_care_now']


class EmergencyRule:
    def __init__(
        self,
        rule_id: str,
        label: str,
        phrases: List[str],
        recommend_specialty: str = '',
        words: List[str] = None,
    ):
        self.id = rule_id
        self.label = label
        self.phrases = [p.strip().lower() for p in phrases if p.strip()]
        self.words = {w.strip().lower() for w in (words or []) if w.strip()}
        self.recommend_specialty = recommend_specialty

    def matches(self, normalized: str, words: set) -> bool:
        for phrase in self.phrases:
            if phrase in normalized:
                return True
        return bool(self.words and self.words.intersection(words))


def _compiled(rules: List[Dict[str, object]]) -> List[EmergencyRule]:
    compiled = []
    for rule in rules:
        compiled.append(EmergencyRule(
            rule_id=str(rule['id']),
            label=str(rule['label']),
            phrases=[str(p) for p in rule['phrases']],
            recommend_specialty=str(rule.get('specialty', '')),
            words=[str(w) for w in rule.get('words', [])],
        ))
    return compiled


# Curated placeholder rules. Struct is designed so that clinically reviewed
# rules can replace/extend these later with identical metadata fields.
EMERGENCY_RULES: List[EmergencyRule] = _compiled([
    {
        'id': 'breathing_severe',
        'label': 'severe_breathing_difficulty',
        'phrases': [
            'can\'t breathe', 'cannot breathe', 'can not breathe',
            'difficulty breathing', 'trouble breathing', 'severe shortness of breath',
            'choking', 'struggling to breathe', 'gasping for air',
            'not breathing', 'stopped breathing', 'failed to breathe', 'breathing stopped',
            # Tamil
            'மூச்சு விட முடியவில்லை', 'மூச்சுத் திணறல்', 'மூச்சுதிணறல்',
            'மூச்சு விட சிரமம்', 'மூச்சு விடுவதில் சிரமம்',
            # Hindi
            'सांस लेने में कठिनाई', 'सांस लेने में तकलीफ', 'सांस नहीं आ रही',
            'सांस रुक गई', 'सांस ले नहीं पा रहा',
            # Telugu
            'శ్వాస తీసుకోవడంలో ఇబ్బంది', 'ఊపిరి ఆడటం లేదు', 'ఊపిరి రావడం లేదు',
            'శ్వాస ఆగిపోయింది',
            # Malayalam
            'ശ്വാസം മുട്ടൽ', 'ശ്വാസതടസ്സം', 'ശ്വാസം എടുക്കാൻ പറ്റുന്നില്ല',
            'ശ്വാസം നിൽക്കുന്നു',
            # Kannada
            'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ಉಸಿರಾಡಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ', 'ಉಸಿರು ಕಟ್ಟಿಹೋಗಿದೆ',
            'ಉಸಿರು ನಿಂತುಹೋಗಿದೆ',
            # Transliterated (Tanglish) - Latin-script Indian language input
            'enakku moochu mudiyala', 'moochu mudiyala', 'naaku oopiri raavatledu',
            'saans nahi aa raha', 'saans ruk gayi', 'saans nahi le pa rahe',
            'enikku shwasam kantham', 'nanage usarake aagolla', 'can t breathe',
        ],
    },
    {
        'id': 'chest_pain',
        'label': 'chest_pain',
        'phrases': [
            'chest pain', 'pain in my chest', 'pain in the chest',
            'chest pressure', 'pressure in my chest', 'chest tightness',
            'tightness in my chest', 'my chest hurts', 'chest hurting',
            'chest discomfort', 'discomfort in my chest', 'heavy chest',
            'chest heaviness', 'pressing on my chest', 'pressure on my chest',
            # Multilingual
            'மார்பு வலி', 'மார்பில் வலி', 'நெஞ்சு வலி', 'நெஞ்சில் வலி',
            'सीने में दर्द', 'छाती में दर्द', 'सीने में जकड़न', 'सीने में दबाव',
            'ఛాతీ నొప్పి', 'ఛాతీలో నొప్పి', 'ఛాతీ బిగుతు',
            'നെഞ്ചുവേദന', 'നെഞ്ചിൽ വേദന', 'നെഞ്ച് ഭാരം',
            'ಎದೆ ನೋವು', 'ಎದೆಯಲ್ಲಿ ನೋವು', 'ಎದೆ ಬಿಗಿತ', 'ಎದೆ ಭಾರ',
            # Transliterated (Tanglish)
            'enakku chest pain', 'enakku chest pain irukku', 'yenna chest pain',
            'chest pain irukku', 'naaku chest pain', 'naaku chest pain undhi',
            'mujhe chest pain', 'mujhe chest pain hai', 'enikku chest pain undu',
            'nanage chest pain ide', 'chest pain undhi', 'chest pain hai',
            'chest pain aagudhu', 'chest pain varudhu',
        ],
        'specialty': 'Cardiology',
    },
    {
        'id': 'chest_pain_severe',
        'label': 'severe_chest_pain',
        'phrases': [
            'severe chest pain', 'crushing chest pain', 'heavy chest pain',
            'chest pain and sweating', 'chest pain and breathlessness',
            'pain radiating down my arm', 'pressing chest pain',
            # Multilingual combined patterns (the deterministic engine matches
            # the full phrase regardless of script).
            'கடும் மார்பு வலி', 'மார்பு வலி மற்றும் மூச்சுத்திணறல்',
            'सीने में तेज दर्द', 'सीने में दर्द और सांस लेने में कठिनाई',
            'తీవ్ర ఛాతీ నొప్పి', 'ఛాతీ నొప్పి మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది',
            'കടുത്ത നെഞ്ചുവേദന', 'നെഞ്ചുവേദനയും ശ്വാസതടസ്സവും',
            'ತೀವ್ರ ಎದೆ ನೋವು', 'ಎದೆ ನೋವು ಮತ್ತು ಉಸಿರಾಟದ ತೊಂದರೆ',
        ],
    },
    {
        'id': 'unconscious',
        'label': 'loss_of_consciousness',
        'phrases': [
            'unconscious', 'passed out', 'fainted', 'loss of consciousness',
            'collapse', 'collapsed', 'not waking up',
            'மயக்கமடைந்தேன்', 'மயங்கி விழுந்தேன்', 'மயக்கம்',
            'बेहोश हो गया', 'बेहोशी', 'बेहोश हो गई',
            'స్పృహ తప్పింది', 'మూర్ఛపోయాను', 'మూర్ఛపోయింది',
            'ബോധം നഷ്ടപ്പെട്ടു', 'ബോധം കെട്ടു',
            'ಪ್ರಜ್ಞೆ ಕಳೆದುಕೊಂಡೆ', 'ಮೂರ್ಛೆ ಹೋದೆ',
            # Transliterated (Tanglish)
            'enakku mitchi pochu', 'yenna mitchi pochu', 'mitchi poiten',
            'mitchi pochu', 'pass out aagitten', 'behosh ho gaya',
            'naaku spruha thappindi', 'naaku tappesindi', 'enikku bodham poyi',
            'nanage prapgne hoyitu', 'not waking up',
        ],
    },
    {
        'id': 'severe_bleeding',
        'label': 'severe_uncontrolled_bleeding',
        'phrases': [
            'severe bleeding', 'bleeding heavily', 'uncontrolled bleeding',
            'won\'t stop bleeding', 'gushing blood', 'bleeding profusely',
            'கடுமையான இரத்தப்போக்கு', 'ரத்தம் நிற்கவில்லை', 'இரத்தம் நிற்கவில்லை',
            'भारी रक्तस्राव', 'खून बहना बंद नहीं हो रहा',
            'తీవ్ర రక్తస్రావం', 'రక్తం ఆగడం లేదు',
            'കടുത്ത രക്തസ്രാവം', 'രക്തം നിൽക്കുന്നില്ല',
            'ಭಾರೀ ರಕ್ತಸ್ರಾವ', 'ರಕ್ತ ನಿಲ್ಲುತ್ತಿಲ್ಲ',
            # Transliterated (Tanglish)
            'enakku blood varudhu', 'blood stop aagala', 'naaku ratha aagatledu',
            'khoon ruk nahi raha', 'blood niraya varudhu', 'blood vandhe',
        ],
    },
    {
        'id': 'stroke_signs',
        'label': 'stroke_warning_signs',
        'phrases': [
            'face drooping', 'one side of my face', 'slurred speech',
            'sudden weakness on one side', 'sudden numbness on one side',
            'cannot lift my arm', 'arm weakness', 'signs of stroke',
            'முகம் சாய்ந்தது', 'பக்கவாதம்',
            'चेहरा टेढ़ा हो गया', 'लकवा', 'स्ट्रोक',
            'ముఖం వంకరగా ఉంది', 'స్ట్రోక్', 'పక్షవాతం',
            'മുഖം വളഞ്ഞു', 'സ്ട്രോക്ക്', 'തളർവാതം',
            'ಮುಖ ವಕ್ರವಾಗಿದೆ', 'ಸ್ಟ್ರೋಕ್', 'ಪಾರ್ಶ್ವವಾಯು',
            # Transliterated (Tanglish)
            'stroke aanthudhu', 'enakku stroke', 'naaku stroke vachindi',
            'mujhe stroke aaya', 'face vandha', 'stroke sambandham',
        ],
    },
    {
        'id': 'seizure',
        'label': 'seizure_neurological',
        'phrases': [
            'seizure', 'fitting', 'convuls', 'my whole body shaking uncontrollably',
            'my whole body is shaking uncontrollably', 'uncontrollable shaking',
            'வலிப்பு', 'வலிப்பு ஏற்பட்டது',
            'दौरा', 'ऐंठन',
            'మూర్ఛ', 'మూర్ఛలు',
            'അപസ്മാരം', 'ഞരമ്പ് വലിവ്',
            'ಅಪಸ್ಮಾರ', 'ಸೆಳೆತ',
            # Transliterated (Tanglish)
            'enakku velluppu', 'fits varudhu', 'enakku fits', 'mujhe fit aa raha',
            'naaku fits vacchayi', 'convulsion varudhu',
        ],
    },
    {
        'id': 'anaphylaxis',
        'label': 'severe_allergic_reaction',
        'phrases': [
            'severe allergic reaction', 'anaphylaxis', 'anaphylactic',
            'throat swelling', 'swelling of my lips and tongue', 'can\'t swallow and can\'t breathe',
            'கடுமையான ஒவ்வாமை', 'அனாபிலாக்சிஸ்',
            'गंभीर एलर्जी', 'एनाफिलेक्सिस',
            'తీవ్ర అలెర్జీ', 'అనాఫిలాక్సిస్',
            'കടുത്ത അലർജി', 'അനാഫിലാക്സിസ്',
            'ತೀವ್ರ ಅಲರ್ಜಿ', 'ಅನಾಫಿಲಾಕ್ಸಿಸ್',
            # Transliterated (Tanglish)
            'enakku severe allergy', 'throat oomma', 'naaku allergy ekkuva',
            'mujhe allergy reaction hua', 'lips and tongue oomma',
        ],
    },
    {
        'id': 'self_harm',
        'label': 'suicidal_self_harm_emergency',
        'words': ['suicide', 'suicidal'],
        'phrases': [
            'want to kill myself', 'want to end my life',
            'going to hurt myself', 'planning to harm myself', 'take my own life',
            'thoughts of ending my life', 'better off dead',
            'தற்கொலை', 'வாழ்க்கையை முடிக்க நினைக்கிறேன்',
            'आत्महत्या', 'खुद को नुकसान पहुंचाना चाहता हूं',
            'ఆత్మహత్య', 'నా జీవితాన్ని ముగించాలనుకుంటున్నాను',
            'ആത്മഹത്യ', 'ജീവിതം അവസാനിപ്പിക്കാൻ ആഗ്രഹിക്കുന്നു',
            'ಆತ್ಮಹತ್ಯ', 'ನನ್ನ ಜೀವನ ಕೊನೆಗೊಳಿಸಲು ಬಯಸುತ್ತೇನೆ',
            # Transliterated (Tanglish)
            'enakku suicide pannanum', 'nan ennaiye kondru kolkiren', 'yenna suicide pannanum',
            'mujhe suicide karna hai', 'naaku jailo', 'enikku aathmahathya cheyyam',
            'nanage jumlah madkothini',
        ],
    },
    {
        'id': 'poisoning',
        'label': 'poisoning_overdose',
        'phrases': [
            'poisoning', 'overdose', 'swallowed poison', 'took too much medicine',
            'took an overdose', 'pesticide poisoning',
            'விஷம்', 'அதிக அளவு மருந்து உட்கொண்டேன்',
            'जहर', 'ओवरडोज़', 'जहर खा लिया',
            'విషం', 'ఓవర్ డోస్', 'విషం తీసుకున్నాను',
            'വിഷം', 'ഓവർഡോസ്', 'വിഷം കഴിച്ചു',
            'ವಿಷ', 'ಓವರ್ ಡೋಸ್', 'ವಿಷ ಸೇವಿಸಿದೆ',
            # Transliterated (Tanglish)
            'enakku visham panni', 'naaku poison tinnanu', 'mujhe poison kha liya',
            'overdose pannita', 'visham saptan', 'enikku visham kazhichu',
        ],
    },
    {
        'id': 'vomiting_blood',
        'label': 'vomiting_blood',
        'phrases': [
            'vomiting blood', 'throwing up blood', 'coughing up blood',
            'blood in vomit',
            'இரத்த வாந்தி', 'இரத்தம் கக்குதல்',
            'खून की उल्टी', 'खून उल्टी करना',
            'రక్తం వాంతి', 'నెత్తురు వాంతి',
            'രക്തം ഛർദ്ദിക്കുന്നു', 'ചോര ഛർദ്ദിക്കൽ',
            'ರಕ್ತ ವಾಂತಿ', 'ರಕ್ತ ಕಕ್ಕುವುದು',
            # Transliterated (Tanglish)
            'enakku blood vanti varudhu', 'vanti la blood', 'naaku vomiting blood',
            'mujhe khoon ki ulti', 'raka chardu kunnanu', 'rakta vanti aagudhu',
        ],
    },
])

# category -> recommended specialty (when escalation to a specialist is the
# appropriate next step after the emergency is handled).
EMERGENCY_SPECIALTY: Dict[str, str] = {
    'chest_pain': 'Cardiology',
    'severe_chest_pain': 'Cardiology',
    'stroke_warning_signs': 'Neurology',
    'seizure_neurological': 'Neurology',
    'severe_allergic_reaction': 'General Medicine',
}