"""Labeled evaluation examples for the deterministic intent classifier.

IMPORTANT
---------
This is a small, internal, self-assembled development set used only to measure
the CURRENT keyword/intent classifier. It is NOT a clinically validated
medical corpus, and results here are NOT a claim of medical or diagnostic
accuracy. Multilingual (native-script and Latin-script transliteration)
examples are deliberately included; coverage improves with the curated maps in
``app.medi_ai.knowledge.intent`` but remains heuristic (the planned XLM-R
classifier remains the goal for full coverage).

Each row is ``(text, expected_intent)`` where intent uses the labels emitted by
``app.medi_ai.knowledge.intent.classify_intent``:
symptom | general | medication | medication_admin | report | appointment |
specialist | triage
"""
DEV_SET = [
    # --- symptom -------------------------------------------------------
    ('I have had a mild headache for three days', 'symptom'),
    ('my throat has been sore and I have a cough', 'symptom'),
    ('I feel dizzy when I stand up quickly', 'symptom'),
    ('I have a persistent rash on my arm', 'symptom'),
    ('I have been vomiting since this morning', 'symptom'),
    ('I have pain in my lower back', 'symptom'),
    ('my stomach hurts after eating', 'symptom'),
    ('I have itching and redness on my skin', 'symptom'),
    ('I have been feeling tired and weak lately', 'symptom'),
    ('my child has a fever and cough', 'symptom'),
    ('I have a fever of 101 and chills', 'symptom'),
    # --- general -------------------------------------------------------
    ('hello there', 'general'),
    ('what can Medi-AI help me with', 'general'),
    ('thanks, that was helpful', 'general'),
    ('how do I stay healthy this winter', 'general'),
    ('can you explain what a blood pressure reading means', 'general'),
    ('what should I do if I get a minor burn at home', 'general'),
    ('I think I might have diabetes, how do I check', 'general'),
    # --- medication ----------------------------------------------------
    ('what is metformin used for', 'medication'),
    ('tell me about the side effects of amoxicillin', 'medication'),
    ('can I take paracetamol with ibuprofen', 'medication'),
    ('is it safe to take this yellow capsule', 'medication'),
    ('what does a usual dose of aspirin look like', 'medication'),
    ('the medication gives me a side effect headache, what do I do', 'medication'),
    # --- medication_admin ----------------------------------------------
    ('should I stop taking my diabetes medicine', 'medication_admin'),
    ('my doctor prescribed 5 mg but I want to change the dose', 'medication_admin'),
    ('can I stop my medicine if I feel fine', 'medication_admin'),
    # --- report --------------------------------------------------------
    ('can you explain my latest blood test results', 'report'),
    ('what does my lipid profile mean', 'report'),
    ('my hba1c is too high, what does that mean', 'report'),
    ('explain this x-ray report to me', 'report'),
    ('what is a normal hemoglobin level', 'report'),
    ('my reports show high cholesterol, should I worry', 'report'),
    # --- appointment ---------------------------------------------------
    ('I want to book an appointment with a cardiologist', 'appointment'),
    ('schedule a consultation slot for me', 'appointment'),
    ('how do I fix an appointment', 'appointment'),
    ('book my next visit', 'appointment'),
    ('I need a doctor appointment soon, chest pain for two days', 'appointment'),
    # --- specialist ----------------------------------------------------
    ('which specialist should I see for a skin rash', 'specialist'),
    ('what kind of doctor treats joint pain', 'specialist'),
    ('should I see a neurologist for my headaches', 'specialist'),
    ('can you recommend a skin specialist for acne', 'specialist'),
    # --- triage --------------------------------------------------------
    ('how urgent is this rash', 'triage'),
    ('should I go to the hospital for this chest pain', 'triage'),
    ('is this an emergency', 'triage'),
    ('how serious is a persistent fever', 'triage'),
    # --- multilingual (native script) ------------------------------------
    ('எனக்கு தலைவலி', 'symptom'),
    ('मुझे एक अपॉइंटमेंट बुक करना है', 'appointment'),
    ('मेरी दवाई के साइड इफेक्ट बताइए', 'medication'),
    ('నాకు జ్వరం వచ్చింది', 'symptom'),
    ('എനിക്ക് പനി ഉണ്ട്', 'symptom'),
    # --- multilingual (native script) with the curated maps ---------------
    ('இது எமர்ஜென்சியா', 'triage'),
    ('எனக்கு நியமனம் தேவை', 'appointment'),
    ('எந்த டாக்டரை பார்க்க வேண்டும்', 'specialist'),
    ('நாளை மருத்துவமனை செல்லலாமா', 'triage'),
    ('मुझे दवा बंद करना है', 'medication_admin'),
    ('क्या यह आपातकालीन है', 'triage'),
    ('నాకు రక్త పరీక్ష రిపోర్ట్ కావాలి', 'report'),
    ('నాకు మందు కావాలి', 'medication'),
    ('ఏ డాక్టర్ చూడాలి', 'specialist'),
    ('ನನಗೆ ರಕ್ತ ಪರೀಕ್ಷೆ ವರದಿ ಬೇಕು', 'report'),
    ('ನನಗೆ ಮದ್ದು ಬೇಕು', 'medication'),
    ('എനിക്ക് ഡോക്ടറെ കാണാൻ ഉണ്ട്', 'appointment'),
    # --- transliterated / Tanglish (Latin-script Indian languages) --------
    ('enakku thala vali irukku', 'symptom'),
    ('naaku javaram undhi', 'symptom'),
    ('mujhe bahut thak hai', 'symptom'),
    ('nanage thale nove ide', 'symptom'),
    ('enikku pani undu', 'symptom'),
    ('mujhe sir dard hai', 'symptom'),
    ('naaku thala noppi undhi', 'symptom'),
    ('yenna chest pain irukku', 'symptom'),
    ('mujhe dawai ka side effect batao', 'medication'),
    ('naaku medicine gurinchi cheppandi', 'medication'),
    ('naaku appointment kavali', 'appointment'),
    ('mujhe doctor se appointment chahiye', 'appointment'),
    ('enakku appointment venum', 'appointment'),
    ('naaku blood test report cheppandi', 'report'),
    ('mujhe blood test report samajho', 'report'),
    ('should i stop my dawai', 'medication_admin'),
    ('naaku hospital urgent aa', 'triage'),
    ('mujhe video dekhna hai', 'general'),
]