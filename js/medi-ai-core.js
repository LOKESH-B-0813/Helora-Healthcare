/**
 * medi-ai-core.js — DOM-free, dependency-free helpers shared by the Medi-AI
 * frontend and its unit tests. Kept intentionally free of browser/document
 * globals so it stays testable under `node --test`.
 */

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGES = Object.freeze([
    { code: 'en', name: 'English', native: 'English' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
]);

export function supportedLanguages() {
    return LANGUAGES.map((l) => l.code);
}

export function languageInfo(code) {
    return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

/**
 * Unicode ranges used for script-count language detection, mirroring the
 * backend `language_utils.py` implementation.
 */
const SCRIPT_RANGES = Object.freeze([
    { code: 'hi', min: 0x0900, max: 0x097f },
    { code: 'ta', min: 0x0b80, max: 0x0bff },
    { code: 'te', min: 0x0c00, max: 0x0c7f },
    { code: 'kn', min: 0x0c80, max: 0x0cff },
    { code: 'ml', min: 0x0d00, max: 0x0d7f },
]);

export function scriptCounts(text) {
    const counts = { hi: 0, ta: 0, te: 0, kn: 0, ml: 0 };
    if (!text) return counts;
    for (const ch of String(text)) {
        const cp = ch.codePointAt(0);
        if (cp === undefined) continue;
        for (const r of SCRIPT_RANGES) {
            if (cp >= r.min && cp <= r.max) {
                counts[r.code] += 1;
                break;
            }
        }
    }
    return counts;
}

/**
 * Detect a supported Indian-script language for `text`.
 * Returns a language code, or `null` when no supported script dominates
 * (typically pure English/Latin input).
 */
export function detectLanguage(text, minRatio = 0.35) {
    const counts = scriptCounts(text);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (!total) return null;
    let best = null;
    let bestCount = 0;
    for (const r of SCRIPT_RANGES) {
        const count = counts[r.code];
        if (count > bestCount) {
            bestCount = count;
            best = r.code;
        }
    }
    if (bestCount / total >= minRatio) return best;
    return null;
}

/**
 * Decide the message language, mirroring the backend resolver:
 * an explicit non-empty language wins; otherwise a detected supported script
 * is used; otherwise the fallback language applies.
 */
export function resolveLanguage(explicit, message, fallback = DEFAULT_LANGUAGE) {
    if (explicit && supportedLanguages().includes(explicit)) return explicit;
    const detected = detectLanguage(message);
    if (detected) return detected;
    const transliterated = detectTanglish(message);
    if (transliterated) return transliterated;
    return fallback;
}

/* ------------------------------------------------------------------ */
/* Conversation state helpers (DOM-free delete/refresh coordination)   */
/* ------------------------------------------------------------------ */

/**
 * A small monotonic generation counter. Every asynchronous conversation
 * snapshot stamps the generation at issue time; resolutions from an older
 * generation must be discarded so a stale reload can never resurrect a
 * conversation that was deleted meanwhile.
 */
export function makeGenerationCounter(initial = 0) {
    let gen = initial;
    return {
        next: () => (gen += 1),
        current: () => gen,
        isStale: (snapshotGen) => snapshotGen !== gen,
    };
}

/**
 * Pure delete result. Given the current list, the id being deleted, and the
 * current conversation id, return the updated list and whether the current
 * conversation was the one deleted (so the UI can reset to a fresh chat).
 */
export function applyConversationDelete({ conversations, deletedId, currentId }) {
    const list = Array.isArray(conversations) ? conversations : [];
    return {
        conversations: list.filter((c) => String(c.id) !== String(deletedId)),
        wasCurrent: String(currentId) === String(deletedId),
    };
}

/* ------------------------------------------------------------------ */
/* Find Doctors round-trip URL helpers                                 */
/* ------------------------------------------------------------------ */

/**
 * Build the Find Doctors link from a Medi-AI specialist card. Carries the
 * origin marker plus the open conversation so the doctors page can offer a
 * "Back to Medi-AI" link that restores the exact thread. Relative path only
 * (never hard-codes a host).
 */
export function buildFindDoctorsHref({ specialty, conversationId = '', language = '' }) {
    const params = new URLSearchParams();
    if (specialty) params.set('specialty', String(specialty));
    if (conversationId) params.set('conversation_id', String(conversationId));
    if (language) params.set('lang', language);
    params.set('from', 'medi-ai');
    return `/pages/services/find-doctors.html?${params.toString()}`;
}

/**
 * Build a chat.html link that requests re-opening a conversation (returning
 * from Find Doctors, for example).
 */
export function buildChatReturnHref({ baseHref = '/pages/medi-ai/chat.html', conversationId = '', language = '' }) {
    const params = new URLSearchParams();
    params.set('back', '1');
    if (conversationId) params.set('conversation_id', String(conversationId));
    if (language) params.set('lang', language);
    return `${baseHref}?${params.toString()}`;
}

/**
 * Parse chat/find-doctors query params into a return intent:
 * { isReturn, conversationId, language }. Only accepts the marker values the
 * app itself emits (`from=medi-ai` / `back=1` plus a numeric conversation id),
 * so direct visitors are never affected.
 */
export function parseReturnParams(search, { requireConversation = true } = {}) {
    const params = new URLSearchParams(search || '');
    const from = params.get('from');
    const back = params.get('back');
    const conversationId = params.get('conversation_id');
    const language = params.get('lang');
    const hasConversation = Boolean(conversationId);
    const isReturn = Boolean(
        (from === 'medi-ai' || back === '1') && (!requireConversation || hasConversation),
    );
    return {
        isReturn,
        conversationId: isReturn ? conversationId : null,
        language: (isReturn && language) ? language : null,
    };
}

/* ------------------------------------------------------------------ */
/* Latin-script (transliterated) Indian language detection             */
/* ------------------------------------------------------------------ */

/**
 * Curated, conservative token maps for Latin-script ("Tanglish" style)
 * input. Keys are lowercase Latin tokens; values are English glosses used
 * ONLY for classification/retrieval normalization. The original user text is
 * always preserved verbatim for the model. These lists are intentionally
 * small and gloss-free for ambiguous words, to avoid false-positive language
 * switches on plain English.
 */
export const TRANSLITERATED_WORDS = Object.freeze({
    ta: Object.freeze({
        enakku: 'i', yennakku: 'i', ennaakku: 'i', nan: 'i', naan: 'i',
        irukku: 'have', irukkuthu: 'have', irukka: 'have', irundh: 'having',
        illai: 'no', illa: 'no', romba: 'very', migavum: 'very',
        vali: 'pain', vedana: 'pain', nopu: 'pain', thala: 'head',
        thalai: 'head', jvaram: 'fever', jwaram: 'fever', moochu: 'panting',
        mooku: 'mucus', thodai: 'throat', mullu: 'ache', siriche: 'chest',
        nenchu: 'chest', iruthu: 'is', vandhu: 'came', poguthu: 'going',
        unaku: 'you', unga: 'your', konjam: 'some', seedham: 'cold',
        cough: 'cough', madi: 'fever', soodu: 'fever', vetayu: 'sweat',
        'blood': 'blood', 'ratha': 'blood', 'ratta': 'blood', 'kan': 'eye',
    }),
    hi: Object.freeze({
        mujhe: 'i', mujko: 'i', main: 'i', meri: 'my', mera: 'my',
        hai: 'is', hain: 'is', nahi: 'no', nahin: 'no', bhi: 'also',
        dard: 'pain', bukhar: 'fever', khaansi: 'cough', sira: 'head',
        sar: 'head', dil: 'heart', chehra: 'face', khoon: 'blood',
        thak: 'tired', chakkar: 'dizzy', jukhaam: 'cold', gala: 'throat',
        'bahut': 'very', kaafi: 'quite', kya: 'what', kyun: 'why',
    }),
    te: Object.freeze({
        naaku: 'i', nenu: 'i', nuvvu: 'you', naa: 'my', naku: 'i',
        undhi: 'have', undi: 'have', ledu: 'no', ledhu: 'no',
        noppu: 'pain', noppi: 'pain', javaram: 'fever', jawaram: 'fever',
        thalakayi: 'head', thala: 'head', raktam: 'blood', gunde: 'heart',
        daddu: 'chest', edukka: 'bring', rava: 'temperature', jalbadi: 'fast',
        chala: 'very', baga: 'well', kavali: 'want', kaavali: 'want',
    }),
    ml: Object.freeze({
        enikku: 'i', njan: 'i', enne: 'i', ente: 'my', enik: 'i',
        undu: 'have', unde: 'have', illa: 'no', venam: 'need',
        vedana: 'pain', nov: 'pain', pani: 'fever', thala: 'head',
        chirassi: 'cough', nenju: 'heart', chora: 'blood', nee: 'you',
    }),
    kn: Object.freeze({
        nanage: 'i', naanu: 'i', nanna: 'my', nimage: 'you',
        ide: 'is', unde: 'have', illa: 'no', beku: 'need',
        nove: 'pain', juga: 'fever', thale: 'head', raktava: 'blood',
        siri: 'chest', bahala: 'very', kasa: 'cough', edey: 'chest',
    }),
});

const TRANSLITERATION_ORDER = ['ta', 'hi', 'te', 'ml', 'kn'];

export function transliterationCounts(text) {
    const counts = { ta: 0, hi: 0, te: 0, ml: 0, kn: 0 };
    if (!text) return counts;
    const tokens = String(text).toLowerCase().match(/[a-z']+/g) || [];
    for (const token of tokens) {
        for (const code of TRANSLITERATION_ORDER) {
            if (TRANSLITERATED_WORDS[code][token] !== undefined) counts[code] += 1;
        }
    }
    return counts;
}

/**
 * Detect a supported Indian language written in Latin script (e.g.
 * "enakku thala vali irukku"). Requires at least `minTokens` distinct-count
 * matches forming at least `minRatio` of the token stream, so ordinary
 * English text is almost never mis-detected.
 */
export function detectTanglish(text, minTokens = 2, minRatio = 0.2) {
    const tokens = (String(text || '').toLowerCase().match(/[a-z']+/g) || []);
    if (!tokens.length) return null;
    const counts = transliterationCounts(text);
    let best = null;
    let bestCount = 0;
    for (const code of TRANSLITERATION_ORDER) {
        if (counts[code] > bestCount) {
            bestCount = counts[code];
            best = code;
        }
    }
    if (!best || bestCount < minTokens) return null;
    if (bestCount / tokens.length < minRatio) return null;
    return best;
}

/**
 * English gloss augmentation for transliterated tokens (classification only).
 * Returns the lowercase text plus the English glosses of any recognized
 * tokens, so classifier/RAG keyword matching can see meaning without the
 * model ever seeing a rewritten message.
 */
export function tanglishNormalized(text) {
    const source = String(text || '').toLowerCase();
    const tokens = source.match(/[a-z']+/g) || [];
    const glosses = [];
    for (const token of tokens) {
        for (const code of TRANSLITERATION_ORDER) {
            const gloss = TRANSLITERATED_WORDS[code][token];
            if (gloss !== undefined) {
                glosses.push(gloss);
                break;
            }
        }
    }
    if (!glosses.length) return source;
    return `${source} \n${glosses.join(' ')}`;
}

export function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    })[m]);
}

/** Parse a single SSE block into { type, data } or return null. */
export function parseSSEBlock(block) {
    if (!block || !block.trim()) return null;
    const eventMatch = block.match(/^event:\s*(.*)$/m);
    const dataMatch = block.match(/^data:\s*(.*)$/m);
    if (!dataMatch) return null;
    let payload = null;
    let parsedOk = false;
    try {
        payload = JSON.parse(dataMatch[1]);
        parsedOk = true;
    } catch (e) {
        payload = null;
    }
    const type = (parsedOk && payload && payload.type) || (eventMatch && eventMatch[1]) || 'message';
    const data = parsedOk && payload
        ? (payload.data !== undefined ? payload.data : payload)
        : dataMatch[1];
    return { type, data };
}

export function isEmergency(structured) {
    return !!(structured && structured.urgency === 'emergency');
}

export function nonRoutineUrgency(structured) {
    const urgency = structured && structured.urgency;
    if (!urgency || urgency === 'routine') return null;
    return urgency;
}

const FLAG_LABELS = Object.freeze({
    urgent_care_needed: 'Signs that may need urgent medical attention',
    consult_healthcare_professional: 'Consider discussing with a healthcare professional',
    no_diagnosis_confirmed: 'This is not a confirmed diagnosis',
    medication_changes_need_doctor: 'Do not change medication without a doctor',
    fail_safe_used: 'Response re-checked by safety system',
});

export function flagLabel(flag, fallback) {
    return FLAG_LABELS[flag] || fallback || flag;
}

const ACTION_LABELS = Object.freeze({
    seek_emergency_care_now: 'Seek emergency care now',
    consult_healthcare_professional: 'Consult a healthcare professional',
    hydrate: 'Drink water',
    rest: 'Rest',
    monitor_symptoms: 'Monitor your symptoms',
    follow_up_as_needed: 'Follow up as needed',
});

export function actionLabel(action, fallback) {
    return ACTION_LABELS[action] || fallback || action;
}

/**
 * Map a backend structured response into the ordered, front-facing "meta
 * sections" the UI may render. Only sections with content are returned.
 * Keys align with the task's intended sections:
 *   concerns, actions, questions, specialist, sources.
 */
export function structuredSections(structured) {
    if (!structured || typeof structured !== 'object') return [];
    const sections = [];

    const flags = Array.isArray(structured.safety_flags) ? structured.safety_flags : [];
    if (flags.length) {
        sections.push({
            key: 'concerns',
            title: 'Possible concerns',
            items: flags.map((f) => flagLabel(f, String(f))),
        });
    }

    const actions = Array.isArray(structured.actions) ? structured.actions : [];
    if (actions.length) {
        sections.push({
            key: 'actions',
            title: 'What you can do now',
            items: actions.map((a) => actionLabel(a, String(a))),
        });
    }

    const questions = Array.isArray(structured.follow_up_questions) ? structured.follow_up_questions : [];
    if (questions.length) {
        sections.push({ key: 'questions', title: 'Questions to consider', items: questions.map(String) });
    }

    if (structured.recommended_specialty) {
        sections.push({
            key: 'specialist',
            title: 'Recommended specialist',
            specialty: String(structured.recommended_specialty),
            reason: structured.specialist_reason ? String(structured.specialist_reason) : '',
            items: [],
        });
    }

    const sources = Array.isArray(structured.sources) ? structured.sources : [];
    if (sources.length) {
        sections.push({
            key: 'sources',
            title: 'Medical information used',
            items: sources.map((s) => (s && typeof s === 'object' ? s.title : String(s))).filter(Boolean),
        });
    }

    return sections;
}

/**
 * Map an error (fetch/API/SSE) to a short, user-safe message. Never echoes
 * raw exception text, stack traces, or server internals.
 */
export function statusMessageFromError(err) {
    if (!err) return 'Something went wrong. Please try again.';
    const status = err.status;
    const code = err.payload && err.payload.error && err.payload.error.code;
    if (status === 401 || code === 'auth_required' || code === 'session_expired') {
        return 'Your session has expired. Please sign in again.';
    }
    if (status === 429 || code === 'rate_limited' || code === 'too_many_requests') {
        return "You've sent a lot of messages. Please wait a little while and try again.";
    }
    if (code === 'provider_unavailable' || code === 'provider_invalid_key' || status === 503) {
        return 'The health assistant is temporarily unavailable. Please try again in a moment.';
    }
    if (err.name === 'AbortError') {
        return 'Stopped.';
    }
    if (typeof err === 'string') return err;
    if (!status && !code) {
        return 'Network problem. Please check your connection and try again.';
    }
    return 'Medi-AI could not complete that request. Please try again.';
}

/**
 * Localized emergency title + guidance for the UI banners, mirroring the
 * backend `safety/templates.py` EMERGENCY_BANNER + EMERGENCY_ACTION strings so
 * the pinned banner and the in-message banner speak the message language.
 */
const EMERGENCY_UI = Object.freeze({
    en: Object.freeze({
        title: 'This may be a medical emergency.',
        notice: 'If this is a medical emergency, call your local emergency number (112 in India) or go to the nearest emergency department immediately.',
    }),
    ta: Object.freeze({
        title: 'மருத்துவ அவசரநிலை சாத்தியம்.',
        notice: 'உடனடியாக அவசர மருத்துவ சிகிச்சையை நாடுங்கள். உங்களது உள்ளூர் அவசர எண்ணை (இந்தியாவில் 112) அல்லது அருகிலுள்ள அவசர சிகிச்சைப் பிரிவுக்கு உடனடியாக அழைக்கவும்.',
    }),
    hi: Object.freeze({
        title: 'संभावित चिकित्सा आपातकाल पाया गया.',
        notice: 'कृपया तुरंत आपातकालीन चिकित्सा सहायता लें। अपने स्थानीय आपातकालीन नंबर (भारत में 112) पर कॉल करें या तुरंत निकटतम आपातकालीन विभाग में जाएँ।',
    }),
    te: Object.freeze({
        title: 'అత్యవసర వైద్య స్థితి ఉండవచ్చు.',
        notice: 'వెంటనే అత్యవసర వైద్య సహాయం తీసుకోండి. మీ స్థానిక అత్యవసర నంబర్ (భారతదేశంలో 112) కు కాల్ చేయండి లేదా వెంటనే దగ్గరి అత్యవసర విభాగానికి వెళ్లండి.',
    }),
    ml: Object.freeze({
        title: 'മെഡിക്കൽ അടിയന്തരാവസ്ഥ സാധ്യമാണ്.',
        notice: 'ഉടൻ അടിയന്തര വൈദ്യശുശ്രൂഷ തേടുക. നിങ്ങളുടെ പ്രാദേശിക എമർജൻസി നമ്പറിൽ (ഇന്ത്യയിൽ 112) വിളിക്കുക അല്ലെങ്കിൽ ഉടൻ അടുത്തുള്ള അടിയന്തര വിഭാഗത്തിലേക്ക് പോകുക.',
    }),
    kn: Object.freeze({
        title: 'ವೈದ್ಯಕೀಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಇರುವ ಸಾಧ್ಯತೆ ಇದೆ.',
        notice: 'ತಕ್ಷಣ ಅತ್ಯವಶ್ಯಕ ವೈದ್ಯಕೀಯ ಆರೈಕೆಯನ್ನು ಪಡೆಯಿರಿ. ನಿಮ್ಮ ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗೆ (ಭಾರತದಲ್ಲಿ 112) ಕರೆ ಮಾಡಿ ಅಥವಾ ತಕ್ಷಣ ಹತ್ತಿರದ ತುರ್ತು ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ.',
    }),
});

export function emergencyBannerStrings(code) {
    return EMERGENCY_UI[code] || EMERGENCY_UI.en;
}