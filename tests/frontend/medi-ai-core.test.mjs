import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    LANGUAGES,
    DEFAULT_LANGUAGE,
    supportedLanguages,
    languageInfo,
    scriptCounts,
    detectLanguage,
    resolveLanguage,
    makeGenerationCounter,
    applyConversationDelete,
    buildFindDoctorsHref,
    buildChatReturnHref,
    parseReturnParams,
    transliterationCounts,
    detectTanglish,
    tanglishNormalized,
    escapeHtml,
    parseSSEBlock,
    isEmergency,
    nonRoutineUrgency,
    flagLabel,
    actionLabel,
    structuredSections,
    statusMessageFromError,
    emergencyBannerStrings,
} from '../../js/medi-ai-core.js';

test('supported languages match the 6-language contract', () => {
    assert.deepEqual(supportedLanguages(), ['en', 'ta', 'hi', 'te', 'ml', 'kn']);
    assert.equal(LANGUAGES.length, 6);
    assert.equal(languageInfo('ta').name, 'Tamil');
    assert.equal(languageInfo('zz').code, DEFAULT_LANGUAGE);
});

test('scriptCounts counts only supported non-Latin scripts', () => {
    const counts = scriptCounts('எனக்கு மார்பு வலி');
    assert.equal(counts.ta, 15);
    assert.equal(counts.hi, 0);
});

test('detectLanguage maps each supported script', () => {
    assert.equal(detectLanguage('எனக்கு மார்பு வலி மற்றும் மூச்சுத்திணறல் உள்ளது.'), 'ta');
    assert.equal(detectLanguage('मुझे सीने में दर्द और सांस लेने में कठिनाई हो रही है।'), 'hi');
    assert.equal(detectLanguage('నాకు ఛాతీ నొప్పి మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంది.'), 'te');
    assert.equal(detectLanguage('എനിക്ക് നെഞ്ചുവേദനയും ശ്വാസതടസ്സവും ഉണ്ട്.'), 'ml');
    assert.equal(detectLanguage('ನನಗೆ ಎದೆ ನೋವು ಮತ್ತು ಉಸಿರಾಟದ ತೊಂದರೆ ಇದೆ.'), 'kn');
});

test('detectLanguage returns null for Latin/pure English input', () => {
    assert.equal(detectLanguage('I have chest pain and difficulty breathing.'), null);
    assert.equal(detectLanguage(''), null);
});

test('resolveLanguage: explicit wins, else script detection, else fallback', () => {
    assert.equal(resolveLanguage('hi', 'something in english'), 'hi');
    assert.equal(resolveLanguage('', 'எனக்கு மார்பு வலி'), 'ta');
    assert.equal(resolveLanguage('', 'plain english here'), 'en');
    assert.equal(resolveLanguage('fr', 'bonjour'), 'en');
});

test('escapeHtml escapes unsafe characters and leaves safe text intact', () => {
    assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    assert.equal(escapeHtml('safe & sound'), 'safe &amp; sound');
    assert.equal(escapeHtml(null), '');
});

test('parseSSEBlock parses valid blocks and rejects garbage', () => {
    const parsed = parseSSEBlock('event: delta\ndata: {"type":"delta","data":{"text":"hi"}}');
    assert.equal(parsed.type, 'delta');
    assert.equal(parsed.data.text, 'hi');
    const typed = parseSSEBlock('data: {"type":"done","data":{"conversation_id":3}}');
    assert.equal(typed.type, 'done');
    assert.equal(typed.data.conversation_id, 3);
    assert.equal(parseSSEBlock(''), null);
    assert.equal(parseSSEBlock('not a block'), null);
});

test('isEmergency and nonRoutineUrgency reflect urgency levels', () => {
    assert.equal(isEmergency({ urgency: 'emergency' }), true);
    assert.equal(isEmergency({ urgency: 'routine' }), false);
    assert.equal(nonRoutineUrgency({ urgency: 'urgent' }), 'urgent');
    assert.equal(nonRoutineUrgency({ urgency: 'routine' }), null);
    assert.equal(nonRoutineUrgency({}), null);
});

test('flagLabel and actionLabel fall back to the raw key', () => {
    assert.equal(flagLabel('urgent_care_needed'), 'Signs that may need urgent medical attention');
    assert.equal(flagLabel('brand_new_flag'), 'brand_new_flag');
    assert.equal(actionLabel('seek_emergency_care_now'), 'Seek emergency care now');
    assert.equal(actionLabel('custom_action'), 'custom_action');
});

test('structuredSections returns only populated sections, in order', () => {
    const structured = {
        message: 'hi',
        urgency: 'urgent',
        safety_flags: ['urgent_care_needed'],
        actions: ['rest', 'consult_healthcare_professional'],
        follow_up_questions: ['Has it worsened?'],
        recommended_specialty: 'Cardiology',
        specialist_reason: 'Your symptoms concern the heart.',
        sources: [{ title: 'Helora health note' }, { title: 'Another note' }],
    };
    const sections = structuredSections(structured);
    assert.deepEqual(sections.map((s) => s.key), ['concerns', 'actions', 'questions', 'specialist', 'sources']);
    const specialist = sections.find((s) => s.key === 'specialist');
    assert.equal(specialist.specialty, 'Cardiology');
    assert.equal(specialist.reason, 'Your symptoms concern the heart.');
});

test('structuredSections returns empty for empty responses', () => {
    assert.deepEqual(structuredSections({}), []);
    assert.deepEqual(structuredSections(null), []);
});

test('statusMessageFromError maps API/network cases without leaking internals', () => {
    assert.match(statusMessageFromError({ status: 401 }), /sign in/i);
    assert.match(statusMessageFromError({ status: 429 }), /wait/i);
    assert.match(
        statusMessageFromError({ payload: { error: { code: 'provider_unavailable' } } }),
        /unavailable/i,
    );
    assert.match(statusMessageFromError({ name: 'AbortError' }), /stopped/i);
    assert.match(statusMessageFromError({ message: 'fetch failed' }), /network/i);
    assert.match(statusMessageFromError({ status: 500, payload: { error: { code: 'internal_error' } } }), /try again/i);
});

test('LANGUAGES is frozen and contains native names', () => {
    assert.ok(Object.isFrozen(LANGUAGES));
    assert.equal(languageInfo('kn').native, 'ಕನ್ನಡ');
    assert.equal(languageInfo('ml').native, 'മലയാളം');
});

test('detectLanguage keeps the dominant script on mixed input', () => {
    assert.equal(detectLanguage('hi தமிழ் தமிழ் தமிழ் हिंदी हिंदी हिंदी हिंदी'), 'hi');
    assert.equal(detectLanguage('hi தமிழ் தமிழ் तमिल'), 'ta');
});

test('detectLanguage requires a dominant ratio', () => {
    assert.equal(detectLanguage('hi'), null);
    assert.equal(detectLanguage('ta kn'), null);
});

test('resolveLanguage: explicit unsupported language falls back to script detection', () => {
    assert.equal(resolveLanguage('fr', 'எனக்கு மார்பு வலி'), 'ta');
});

test('resolveLanguage defaults explicit languages against the supported list', () => {
    assert.equal(resolveLanguage('kn', 'سلام'), 'kn');
    assert.equal(resolveLanguage('TE'.toLowerCase(), 'whatever'), 'te');
});

test('parseSSEBlock falls back to the event field when data is not JSON', () => {
    const parsed = parseSSEBlock('event: start\ndata: {"type":"start","data":{}}');
    assert.equal(parsed.type, 'start');
    const plain = parseSSEBlock('event: ping\ndata: hello');
    assert.equal(plain.type, 'ping');
    assert.deepEqual(plain.data, 'hello');
});

test('parseSSEBlock exposes the data envelope', () => {
    const parsed = parseSSEBlock('data: {"type":"error","data":{"message":"nope"}}');
    assert.equal(parsed.type, 'error');
    assert.equal(parsed.data.message, 'nope');
});

test('structuredSections handles specialist-only and string-only sources', () => {
    const specialistOnly = structuredSections({ recommended_specialty: 'Dermatology' });
    assert.equal(specialistOnly.length, 1);
    assert.equal(specialistOnly[0].key, 'specialist');
    assert.equal(specialistOnly[0].reason, '');

    const stringSources = structuredSections({ sources: ['Note A', 'Note B'] });
    assert.deepEqual(stringSources[0].items, ['Note A', 'Note B']);
});

test('structuredSections maps every intent action label to readable text', () => {
    const sections = structuredSections({
        safety_flags: ['no_diagnosis_confirmed', 'unknown_flag_x'],
        actions: ['monitor_symptoms', 'seek_emergency_care_now'],
    });
    const labels = sections.flatMap((s) => s.items);
    assert.ok(labels.includes('This is not a confirmed diagnosis'));
    assert.ok(labels.includes('unknown_flag_x'));
    assert.ok(labels.includes('Monitor your symptoms'));
    assert.ok(labels.includes('Seek emergency care now'));
});

test('statusMessageFromError rate-limit code and 503 paths', () => {
    assert.match(statusMessageFromError({ payload: { error: { code: 'rate_limited' } } }), /wait/i);
    assert.match(statusMessageFromError({ status: 503 }), /unavailable/i);
    assert.match(statusMessageFromError({ payload: { error: { code: 'session_expired' } } }), /sign in/i);
});

test('makeGenerationCounter tracks generations and staleness', () => {
    const counter = makeGenerationCounter(0);
    assert.equal(counter.current(), 0);
    assert.equal(counter.next(), 1);
    assert.equal(counter.next(), 2);
    assert.equal(counter.isStale(1), true);
    assert.equal(counter.isStale(2), false);
    const fresh = makeGenerationCounter();
    assert.equal(fresh.current(), 0);
});

test('applyConversationDelete filters the list and flags current deletion', () => {
    const conversations = [{ id: 1 }, { id: 2 }, { id: 3 }];
    assert.deepEqual(
        applyConversationDelete({ conversations, deletedId: 2, currentId: 2 }),
        { conversations: [{ id: 1 }, { id: 3 }], wasCurrent: true },
    );
    assert.equal(
        applyConversationDelete({ conversations, deletedId: '1', currentId: 1 }).conversations.length,
        2,
    );
    assert.equal(
        applyConversationDelete({ conversations, deletedId: 99, currentId: 1 }).wasCurrent,
        false,
    );
    assert.deepEqual(applyConversationDelete({ conversations: null, deletedId: 1, currentId: 1 }).conversations, []);
});

test('buildFindDoctorsHref carries the mediator + conversation params', () => {
    const href = buildFindDoctorsHref({ specialty: 'Cardiology', conversationId: 42, language: 'ta' });
    const url = new URL(href, 'https://helora.local');
    assert.equal(url.pathname, '/pages/services/find-doctors.html');
    assert.equal(url.searchParams.get('from'), 'medi-ai');
    assert.equal(url.searchParams.get('specialty'), 'Cardiology');
    assert.equal(url.searchParams.get('conversation_id'), '42');
    assert.equal(url.searchParams.get('lang'), 'ta');
    const minimal = new URL(buildFindDoctorsHref({ specialty: 'Dermatology' }), 'https://helora.local');
    assert.equal(minimal.searchParams.get('conversation_id'), null);
    assert.equal(minimal.searchParams.get('from'), 'medi-ai');
});

test('buildChatReturnHref requests restore of the conversation', () => {
    const href = buildChatReturnHref({ conversationId: 7, language: 'kn' });
    const url = new URL(href, 'https://helora.local');
    assert.equal(url.pathname, '/pages/medi-ai/chat.html');
    assert.equal(url.searchParams.get('back'), '1');
    assert.equal(url.searchParams.get('conversation_id'), '7');
    assert.equal(url.searchParams.get('lang'), 'kn');
});

test('parseReturnParams only accepts app-emitted return markers', () => {
    assert.deepEqual(
        parseReturnParams('?from=medi-ai&conversation_id=42&lang=ta'),
        { isReturn: true, conversationId: '42', language: 'ta' },
    );
    assert.deepEqual(
        parseReturnParams('?back=1&conversation_id=9'),
        { isReturn: true, conversationId: '9', language: null },
    );
    assert.deepEqual(parseReturnParams('?from=medi-ai'), { isReturn: false, conversationId: null, language: null });
    assert.deepEqual(parseReturnParams('?specialty=Cardiology'), { isReturn: false, conversationId: null, language: null });
    assert.deepEqual(parseReturnParams(''), { isReturn: false, conversationId: null, language: null });
    const relaxed = parseReturnParams('?from=medi-ai', { requireConversation: false });
    assert.equal(relaxed.isReturn, true);
    assert.equal(relaxed.conversationId, null);
});

test('detectTanglish maps Latin-script Indian language input', () => {
    assert.equal(detectTanglish('enakku thala vali irukku'), 'ta');
    assert.equal(detectTanglish('mujhe sir dard hai'), 'hi');
    assert.equal(detectTanglish('naaku javaram undhi'), 'te');
    assert.equal(detectTanglish('enikku pani undu'), 'ml');
    assert.equal(detectTanglish('nanage thale nove ide'), 'kn');
});

test('detectTanglish ignores plain English and single tokens', () => {
    assert.equal(detectTanglish('I have a chest pain and difficulty breathing'), null);
    assert.equal(detectTanglish('irukku'), null);
    assert.equal(detectTanglish(''), null);
});

test('transliterationCounts resets to zero for empty input', () => {
    assert.deepEqual(transliterationCounts(''), { ta: 0, hi: 0, te: 0, ml: 0, kn: 0 });
    assert.equal(transliterationCounts('enakku thala vali irukku').ta, 4);
});

test('tanglishNormalized preserves original text and appends glosses', () => {
    const normalized = tanglishNormalized('enakku thala vali irukku');
    assert.ok(normalized.startsWith('enakku thala vali irukku'));
    assert.ok(normalized.includes('pain'));
    assert.ok(normalized.includes('head'));
    assert.ok(normalized.includes('have'));
    assert.equal(tanglishNormalized('plain english here'), 'plain english here');
});

test('resolveLanguage uses transliteration detection on Latin input', () => {
    assert.equal(resolveLanguage('', 'enakku thala vali irukku'), 'ta');
    assert.equal(resolveLanguage('', 'naaku javaram undhi'), 'te');
});

test('emergencyBannerStrings localizes every supported language', () => {
    for (const { code } of LANGUAGES) {
        const ui = emergencyBannerStrings(code);
        assert.ok(ui.title && ui.notice, `${code} banner text present`);
    }
    assert.equal(emergencyBannerStrings('en').title, 'This may be a medical emergency.');
    assert.match(emergencyBannerStrings('ta').title, /[\u0b80-\u0bff]/);
    assert.match(emergencyBannerStrings('ta').notice, /[\u0b80-\u0bff]/);
    assert.equal(emergencyBannerStrings('xx').title, emergencyBannerStrings('en').title);
});