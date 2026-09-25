import { getAuthToken, getCurrentUser, apiUrl } from './auth.js';
import * as core from './medi-ai-core.js';

const messagesEl = document.getElementById('messages');
const chatAreaEl = document.getElementById('chat-area');
const composer = document.getElementById('composer');
const sendBtn = document.getElementById('send');
const charCountEl = document.getElementById('char-count');
const langSelects = Array.from(document.querySelectorAll('[data-lang-select]'));
const newChatBtn = document.getElementById('new-chat');
const convsEl = document.getElementById('conversations');
const convSearch = document.getElementById('conv-search');
const backBtn = document.getElementById('back-home');
const clearBtn = document.getElementById('clear-conv');
const deleteBtn = document.getElementById('delete-conv');
const toastEl = document.getElementById('toast');
const guestNote = document.getElementById('guest-note');
const patientToggle = document.getElementById('patient-toggle');
const usePatientData = document.getElementById('use-patient-data');
const bannerInfo = document.getElementById('banner-info');
const pageDisclaimer = document.getElementById('page-disclaimer');
const statusChip = document.getElementById('status-chip');
const emergencyPin = document.getElementById('emergency-pin');
const guestCta = document.getElementById('guest-cta');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.querySelector('.sidebar');
const scrim = document.getElementById('sidebar-scrim');

const MAX_LENGTH = 4000;
const PATIENT_TOOLS = [
    'get_patient_profile',
    'get_recent_medical_reports',
    'get_report_metadata',
    'get_recent_consultations',
    'get_current_medications',
    'search_helora_doctors',
];

const state = {
    user: null,
    token: null,
    conversationId: null,
    language: core.DEFAULT_LANGUAGE,
    languageTouched: false,
    conversations: [],
    streaming: false,
    abortController: null,
    conversationGen: 0,
    deleteInFlight: null,
    disclaimer: '',
    maxLength: MAX_LENGTH,
};

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

function showToast(message, ms = 3000) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), ms);
}

function localTime(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const now = new Date();
        const sameDay = d.toDateString() === now.toDateString();
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return sameDay ? time : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
        return '';
    }
}

/* ------------------------------------------------------------------ */
/* Safe markdown rendering (DOM-only, no innerHTML from untrusted text) */
/* ------------------------------------------------------------------ */

const INLINE_RE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;

function appendInline(parent, text) {
    const parts = String(text ?? '').split(INLINE_RE);
    for (const part of parts) {
        if (!part) continue;
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            const b = document.createElement('strong');
            appendInline(b, part.slice(2, -2));
            parent.appendChild(b);
        } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
            const c = document.createElement('code');
            c.textContent = part.slice(1, -1);
            parent.appendChild(c);
        } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            const em = document.createElement('em');
            appendInline(em, part.slice(1, -1));
            parent.appendChild(em);
        } else {
            parent.appendChild(document.createTextNode(part));
        }
    }
}

function renderMarkdown(container, md) {
    container.replaceChildren();
    const lines = String(md ?? '').split('\n');
    let i = 0;
    let listBuffer = null;

    const flushList = () => {
        if (!listBuffer) return;
        const ul = document.createElement(listBuffer.ordered ? 'ol' : 'ul');
        for (const item of listBuffer.items) {
            const li = document.createElement('li');
            appendInline(li, item);
            ul.appendChild(li);
        }
        container.appendChild(ul);
        listBuffer = null;
    };

    while (i < lines.length) {
        const line = lines[i];
        if (/^```/.test(line.trim())) {
            flushList();
            i += 1;
            const codeLines = [];
            while (i < lines.length && !/^```/.test(lines[i].trim())) {
                codeLines.push(lines[i]);
                i += 1;
            }
            i += 1;
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = codeLines.join('\n');
            pre.appendChild(code);
            container.appendChild(pre);
            continue;
        }
        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            flushList();
            const level = Math.max(1, Math.min(6, heading[1].length));
            const el = document.createElement(`h${level}`);
            appendInline(el, heading[2]);
            container.appendChild(el);
            i += 1;
            continue;
        }
        const quote = line.match(/^>\s?(.*)$/);
        if (quote) {
            flushList();
            const el = document.createElement('blockquote');
            appendInline(el, quote[1]);
            container.appendChild(el);
            i += 1;
            continue;
        }
        if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
            const ordered = /^\s*\d+\.\s+/.test(line);
            if (!listBuffer || listBuffer.ordered !== ordered) flushList();
            listBuffer = listBuffer || { ordered, items: [] };
            listBuffer.items.push(line.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, ''));
            i += 1;
            continue;
        }
        flushList();
        if (line.trim() === '') {
            i += 1;
            continue;
        }
        const p = document.createElement('p');
        appendInline(p, line);
        container.appendChild(p);
        i += 1;
    }
    flushList();
}

/* ------------------------------------------------------------------ */
/* API helpers                                                         */
/* ------------------------------------------------------------------ */

async function authHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...extra };
    if (state.user && !state.token) {
        try {
            state.token = await getAuthToken();
        } catch (e) {
            console.warn('Token refresh failed:', e);
        }
    }
    if (state.user && state.token) headers.Authorization = `Bearer ${state.token}`;
    return headers;
}

async function apiJSON(method, path, body) {
    const headers = await authHeaders();
    const resp = await fetch(apiUrl(path), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        const err = new Error((data && data.error && data.error.message) || `Request failed (${resp.status})`);
        err.payload = data;
        err.status = resp.status;
        throw err;
    }
    return data;
}

/* ------------------------------------------------------------------ */
/* Bubble helpers                                                      */
/* ------------------------------------------------------------------ */

function scrollBottom() {
    chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
}

function avatar(label) {
    const el = document.createElement('div');
    el.className = 'avatar';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = label === 'Me' ? 'Me' : 'AI';
    return el;
}

function appendUserBubble(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg user';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    wrap.append(avatar('Me'), bubble);
    messagesEl.appendChild(wrap);
    scrollBottom();
    return wrap;
}

function appendAssistantBubble(text, meta = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'msg assistant';
    const content = document.createElement('div');
    content.className = 'msg-content';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const md = document.createElement('div');
    md.className = 'md';
    renderMarkdown(md, text || '');
    bubble.appendChild(md);
    content.appendChild(bubble);

    if (meta.question) wrap.dataset.question = meta.question;
    if (meta.message) wrap.dataset.message = meta.message;
    if (meta.structured) renderStructuredMeta(content, meta.structured);

    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    actions.append(
        actionButton('copy', 'Copy reply', 'Copy'),
        actionButton('retry', 'Ask this question again', 'Retry'),
    );
    content.appendChild(actions);

    wrap.append(avatar('AI'), content);
    messagesEl.appendChild(wrap);
    scrollBottom();
    return wrap;
}

function actionButton(action, label, text) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.action = action;
    btn.setAttribute('aria-label', label);
    btn.textContent = text;
    return btn;
}

function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'msg assistant typing';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const dots = document.createElement('span');
    dots.className = 'typing-dots';
    dots.setAttribute('aria-label', 'Medi-AI is thinking');
    dots.append(span(), span(), span());
    bubble.appendChild(dots);
    wrap.append(avatar('AI'), bubble);
    messagesEl.appendChild(wrap);
    scrollBottom();
}

function span() {
    return document.createElement('span');
}

function removeTyping() {
    const el = messagesEl.querySelector('.typing');
    if (el) el.remove();
}

/* ------------------------------------------------------------------ */
/* Structured meta sections (concerns / actions / questions /           */
/* specialist / sources)                                                */
/* ------------------------------------------------------------------ */

function sectionCard(title) {
    const card = document.createElement('div');
    card.className = 'meta-card';
    const head = document.createElement('strong');
    head.className = 'meta-title';
    head.textContent = title;
    card.appendChild(head);
    return card;
}

function appendTextItems(card, items) {
    const ul = document.createElement('ul');
    for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
    }
    card.appendChild(ul);
    return ul;
}

function renderStructuredMeta(content, structured) {
    const sections = core.structuredSections(structured);
    if (!sections.length) return;

    const holder = document.createElement('div');
    holder.className = 'meta-sections';
    holder.setAttribute('aria-label', 'Additional context from Medi-AI');

    for (const section of sections) {
        if (section.key === 'specialist') {
            const card = sectionCard(section.title);
            const specialty = document.createElement('div');
            specialty.className = 'specialist-name';
            specialty.textContent = section.specialty;
            card.appendChild(specialty);
            if (section.reason) {
                const why = document.createElement('p');
                why.className = 'specialist-reason';
                why.textContent = section.reason;
                card.appendChild(why);
            }
            const go = document.createElement('a');
            go.className = 'btn-find-doctors';
            go.href = core.buildFindDoctorsHref({
                specialty: section.specialty,
                conversationId: state.conversationId || '',
                language: state.language || '',
            });
            go.textContent = 'Find doctors';
            go.setAttribute(
                'aria-label',
                `Find doctors specializing in ${section.specialty}`,
            );
            card.appendChild(go);
            holder.appendChild(card);
            continue;
        }

        const card = sectionCard(section.title);
        if (section.key === 'sources') {
            const ul = document.createElement('ul');
            ul.className = 'sources-list';
            for (const item of section.items) {
                const li = document.createElement('li');
                const dot = document.createElement('span');
                dot.className = 'source-dot';
                dot.setAttribute('aria-hidden', 'true');
                li.append(dot, document.createTextNode(item));
                ul.appendChild(li);
            }
            card.appendChild(ul);
        } else {
            appendTextItems(card, section.items);
        }
        holder.appendChild(card);
    }

    content.insertBefore(holder, content.querySelector('.msg-actions'));
}

function renderUrgencyBanner(content, structured, language) {
    const urgency = core.nonRoutineUrgency(structured);
    if (!urgency) return;
    const banner = document.createElement('div');
    const emergency = urgency === 'emergency';
    banner.className = `banner ${emergency ? 'emergency' : 'warning'}`;
    const icon = document.createElement('span');
    icon.className = 'b-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '!';
    const body = document.createElement('div');
    const strong = document.createElement('strong');
    const ui = core.emergencyBannerStrings(language);
    strong.textContent = emergency ? ui.title : 'Please follow up with a healthcare professional soon.';
    body.appendChild(strong);
    const text = document.createElement('span');
    if (emergency) {
        text.textContent = ui.notice;
        text.style.display = 'block';
        text.style.marginTop = '0.2rem';
    }
    body.appendChild(text);
    banner.append(icon, body);
    content.insertBefore(banner, content.firstChild);
}

/* ------------------------------------------------------------------ */
/* Welcome / empty state                                               */
/* ------------------------------------------------------------------ */

function showWelcome() {
    messagesEl.replaceChildren();
    const card = document.createElement('div');
    card.className = 'welcome-card';

    const eye = document.createElement('div');
    eye.className = 'welcome-logo';
    eye.setAttribute('aria-hidden', 'true');
    eye.textContent = '★';
    card.appendChild(eye);

    const h2 = document.createElement('h2');
    h2.textContent = 'How can I help you today?';
    card.appendChild(h2);

    const p = document.createElement('p');
    p.textContent = 'Ask about symptoms, medications, reports, specialists, or general health questions. '
        + 'Medi-AI provides health information only — not a diagnosis.';
    card.appendChild(p);

    const chips = document.createElement('div');
    chips.className = 'welcome-chips';
    const suggestions = [
        'What can Medi-AI help me with?',
        'I have had a mild headache for three days.',
        'How do I prepare a sample for a blood test?',
        'Which specialist should I see for skin rashes?',
    ];
    for (const s of suggestions) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = s;
        btn.addEventListener('click', () => {
            composer.value = s;
            composer.dispatchEvent(new Event('input'));
            composer.focus();
        });
        chips.appendChild(btn);
    }
    card.appendChild(chips);
    messagesEl.appendChild(card);
}

/* ------------------------------------------------------------------ */
/* Sidebar / conversations                                             */
/* ------------------------------------------------------------------ */

function guestVariant() {
    return !!state.user ? 'signed-in' : 'guest';
}

function renderConversations(filter = '') {
    convsEl.replaceChildren();
    if (!state.user) {
        const empty = document.createElement('div');
        empty.className = 'conversations-empty';
        const strong = document.createElement('strong');
        strong.textContent = 'Guest mode';
        const line = document.createElement('p');
        line.textContent = 'You can chat below. Sign in to save conversations and use your health records.';
        empty.append(strong, line);
        convsEl.appendChild(empty);
        return;
    }
    const keyword = filter.trim().toLowerCase();
    const items = state.conversations.filter((c) =>
        !keyword || !c.title || c.title.toLowerCase().includes(keyword),
    );
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'conversations-empty';
        empty.textContent = filter
            ? 'No conversations match your search.'
            : 'No conversations yet. Start a new one!';
        convsEl.appendChild(empty);
        return;
    }
    items.forEach((conv) => {
        const row = document.createElement('div');
        row.className = 'conv-item' + (conv.id === state.conversationId ? ' active' : '');
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', conv.id === state.conversationId ? 'true' : 'false');

        const title = document.createElement('span');
        title.className = 'conv-title';
        title.textContent = conv.title;
        const meta = document.createElement('span');
        meta.className = 'conv-meta';
        meta.textContent = localTime(conv.updated_at);
        const del = document.createElement('button');
        del.className = 'conv-delete';
        del.type = 'button';
        del.textContent = '✕';
        del.title = 'Delete conversation';
        del.setAttribute('aria-label', `Delete conversation: ${conv.title}`);
        del.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(conv.id);
        });

        row.append(title, meta, del);
        row.addEventListener('click', () => openConversation(conv.id));
        convsEl.appendChild(row);
    });
}

async function loadConversations() {
    const snapshotGen = state.conversationGen;
    if (!state.user) {
        state.conversations = [];
        renderConversations(convSearch.value);
        return;
    }
    try {
        const data = await apiJSON('GET', '/api/medi-ai/conversations');
        if (state.conversationGen !== snapshotGen) return; // stale snapshot; ignore
        state.conversations = data.conversations || [];
    } catch (e) {
        if (state.conversationGen !== snapshotGen) return;
        state.conversations = [];
        if (e.status && e.status !== 401) console.warn('Failed to load conversations:', e.message);
    }
    renderConversations(convSearch.value);
}

async function openConversation(convId) {
    if (state.streaming) abortStream();
    try {
        const data = await apiJSON('GET', `/api/medi-ai/conversations/${convId}`);
        const conv = data.conversation;
        state.conversationId = conv.id;
        setLanguage(conv.language || state.language, true);
        messagesEl.replaceChildren();
        (conv.messages || []).forEach((m) => {
            if (m.role === 'user') appendUserBubble(m.content);
            else if (m.content || m.meta_data) {
                appendAssistantBubble(m.content, {
                    message: m.content,
                    structured: m.meta_data || {},
                });
            }
        });
        deleteBtn.hidden = false;
        renderConversations(convSearch.value);
        scrollBottom();
    } catch (e) {
        showToast(core.statusMessageFromError(e));
    }
}

async function deleteConversation(convId) {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    if (state.deleteInFlight) {
        showToast('Already deleting a conversation — please wait.');
        return;
    }
    state.deleteInFlight = convId;
    // Invalidate any in-flight conversation snapshots so a stale reload issued
    // before this delete lands can never re-render the removed conversation.
    state.conversationGen += 1;
    try {
        try {
            await apiJSON('DELETE', `/api/medi-ai/conversations/${convId}`);
        } catch (e) {
            if (e.status !== 404) throw e;
            // 404 means the server never knew about it (already deleted);
            // treat it as a successful delete so the UI converges.
        }
        const removed = core.applyConversationDelete({
            conversations: state.conversations,
            deletedId: convId,
            currentId: state.conversationId,
        });
        state.conversations = removed.conversations;
        if (removed.wasCurrent) {
            state.conversationId = null;
            deleteBtn.hidden = true;
            startNewChat(false);
        }
        renderConversations(convSearch.value);
        showToast('Conversation deleted.');
        // Authoritative server reload, now that all deletes have settled.
        await loadConversations();
    } catch (e) {
        showToast(core.statusMessageFromError(e));
    } finally {
        state.deleteInFlight = null;
    }
}

async function clearConversation() {
    if (!state.conversationId) {
        startNewChat(true);
        return;
    }
    if (!confirm('Clear all messages in this conversation?')) return;
    try {
        await apiJSON('POST', `/api/medi-ai/conversations/${state.conversationId}/clear`);
        messagesEl.replaceChildren();
        showWelcome();
    } catch (e) {
        showToast(core.statusMessageFromError(e));
    }
}

/* ------------------------------------------------------------------ */
/* Chat + SSE                                                          */
/* ------------------------------------------------------------------ */

function builtTools() {
    if (!state.user || !usePatientData.checked) return [];
    return [...PATIENT_TOOLS];
}

function currentLangValue() {
    return (langSelects.find((s) => !s.hidden) || langSelects[0]).value;
}

function setLanguage(code, quiet = false) {
    state.language = code;
    langSelects.forEach((s) => {
        if (s.value === code || Array.from(s.options).some((o) => o.value === code)) s.value = code;
    });
    if (!quiet) localStorage.setItem('medi_ai_lang', code);
}

async function sendMessage() {
    const text = composer.value.trim();
    if (!text || state.streaming) return;
    if (text.length > state.maxLength) {
        showToast(`Message is too long (max ${state.maxLength} characters).`);
        return;
    }

    const explicit = state.languageTouched ? currentLangValue() : '';
    const language = core.resolveLanguage(explicit, text) || currentLangValue();
    if (language !== state.language) {
        setLanguage(language, state.languageTouched);
        if (language !== core.DEFAULT_LANGUAGE) {
            const info = core.languageInfo(language);
            showToast(`Detected ${info.name} — answering in ${info.native}.`, 2400);
        }
    }

    appendUserBubble(text);
    composer.value = '';
    composer.dispatchEvent(new Event('input'));
    showTyping();

    state.streaming = true;
    state.abortController = new AbortController();
    sendBtn.textContent = 'Stop';
    sendBtn.setAttribute('aria-label', 'Stop generating');

    const payload = {
        message: text,
        language,
        conversation_id: state.conversationId,
        use_patient_data: usePatientData.checked,
        tools: builtTools(),
        stream: true,
    };

    try {
        const headers = await authHeaders({ Accept: 'text/event-stream' });
        const response = await fetch(apiUrl('/api/medi-ai/chat'), {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: state.abortController.signal,
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const err = new Error(core.statusMessageFromError({ status: response.status, payload: data }));
            err.status = response.status;
            err.payload = data;
            throw err;
        }
        await consumeSSE(response, text, language);
    } catch (e) {
        removeTyping();
        if (e.name !== 'AbortError') {
            renderAssistantError(core.statusMessageFromError(e));
            console.error('Medi-AI request failed:', e);
        }
    } finally {
        state.streaming = false;
        state.abortController = null;
        sendBtn.textContent = 'Send';
        sendBtn.setAttribute('aria-label', 'Send message');
        composer.focus();
    }
}

function renderAssistantError(message) {
    messagesEl.querySelectorAll('.typing').forEach((el) => el.remove());
    const wrap = appendAssistantBubble(message);
    wrap.classList.add('error-bubble');
}

async function consumeSSE(response, question, language) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let bubble = null;

    const handleBlock = (block) => {
        const parsed = core.parseSSEBlock(block);
        if (!parsed) return;
        const type = parsed.type;
        switch (type) {
            case 'start':
                removeTyping();
                bubble = bubble || appendAssistantBubble('', { question });
                break;
            case 'delta': {
                if (!parsed.data || !parsed.data.text) return;
                bubble = bubble || appendAssistantBubble('', { question });
                const md = bubbleDetachMd(bubble);
                renderMarkdown(md, parsed.data.text);
                const cursor = document.createElement('span');
                cursor.className = 'cursor-blink';
                cursor.setAttribute('aria-hidden', 'true');
                md.parentNode.appendChild(cursor);
                scrollBottom();
                break;
            }
            case 'done': {
                removeTyping();
                const data = parsed.data || {};
                const structured = data.structured || {};
                bubble = bubble || appendAssistantBubble('', { question });
                const md = bubbleDetachMd(bubble);
                renderMarkdown(md, structured.message || '');
                bubble.dataset.message = structured.message || '';
                if (data.conversation_id) {
                    const hadNone = !state.conversationId;
                    state.conversationId = data.conversation_id;
                    if (hadNone) {
                        deleteBtn.hidden = false;
                        loadConversations();
                    }
                }
                renderStructuredMeta(bubbleContent(bubble), structured);
                renderUrgencyBanner(bubbleContent(bubble), structured, language);
                if (core.isEmergency(structured)) {
                    setPinnedEmergency(true, structured, language);
                }
                syncPatientChip();
                scrollBottom();
                break;
            }
            case 'error': {
                removeTyping();
                const errData = parsed.data || {};
                if (bubble && bubble.dataset.message) break;
                if (!bubble) bubble = appendAssistantBubble('', { question });
                if (!bubble.dataset.message) {
                    bubbleDetach(bubble);
                    bubbleContent(bubble).textContent =
                        errData.message || 'Something went wrong. Please try again.';
                }
                break;
            }
            default:
                break;
        }
    };

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            if (block.trim()) handleBlock(block);
        }
    }
    if (buffer.trim()) handleBlock(buffer);
}

// Close over the current layout of an assistant bubble.
function bubbleContent(bubble) {
    return bubble.querySelector('.msg-content');
}

function bubbleDetachMd(bubble) {
    const content = bubbleContent(bubble);
    let md = content.querySelector('.md');
    if (!md) {
        md = document.createElement('div');
        md.className = 'md';
        content.prepend(md);
    }
    const cursor = content.querySelector('.cursor-blink');
    if (cursor) cursor.remove();
    return md;
}

function bubbleDetach(bubble) {
    const content = bubbleContent(bubble);
    content.querySelectorAll('.md').forEach((el) => el.remove());
    const cursor = content.querySelector('.cursor-blink');
    if (cursor) cursor.remove();
}

/* ------------------------------------------------------------------ */
/* Emergency pinned banner                                             */
/* ------------------------------------------------------------------ */

function setPinnedEmergency(active, structured = {}, language) {
    if (!active) {
        emergencyPin.hidden = true;
        return;
    }
    emergencyPin.hidden = false;
    const ui = core.emergencyBannerStrings(language);
    const label = document.createElement('strong');
    label.textContent = ui.title;
    const detail = document.createElement('div');
    detail.textContent = ui.notice;
    detail.style.marginTop = '0.2rem';
    emergencyPin.replaceChildren(label, detail);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'pin-close';
    close.setAttribute('aria-label', 'Dismiss emergency reminder');
    close.textContent = '✕';
    close.addEventListener('click', () => emergencyPin.hidden = true);
    emergencyPin.appendChild(close);
}

/* ------------------------------------------------------------------ */
/* Stream control / new chat                                           */
/* ------------------------------------------------------------------ */

function abortStream() {
    if (state.abortController) {
        try { state.abortController.abort(); } catch (e) { /* ignore */ }
    }
    removeTyping();
    state.streaming = false;
    sendBtn.textContent = 'Send';
}

function startNewChat(clearComposer = true) {
    state.conversationId = null;
    deleteBtn.hidden = true;
    setPinnedEmergency(false);
    messagesEl.replaceChildren();
    showWelcome();
    if (clearComposer) {
        composer.value = '';
        composer.dispatchEvent(new Event('input'));
    }
    renderConversations(convSearch.value);
    composer.focus();
}

function syncPatientChip() {
    statusChip.textContent = usePatientData.checked ? 'Using your records' : 'AI Support';
}

/* ------------------------------------------------------------------ */
/* Mobile drawer                                                       */
/* ------------------------------------------------------------------ */

function openDrawer() {
    sidebar.classList.add('open');
    scrim.classList.add('show');
    document.body.style.overflow = 'hidden';
    sidebar.querySelector('button, input, select')?.focus();
}

function closeDrawer() {
    sidebar.classList.remove('open');
    scrim.classList.remove('show');
    document.body.style.overflow = '';
}

/* ------------------------------------------------------------------ */
/* Setup / listeners                                                   */
/* ------------------------------------------------------------------ */

composer.addEventListener('input', () => {
    const len = composer.value.length;
    charCountEl.textContent = `${len} / ${state.maxLength}`;
    charCountEl.style.color = len > state.maxLength ? 'var(--rose)' : '';
    composer.style.height = 'auto';
    composer.style.height = `${Math.min(composer.scrollHeight, 160)}px`;
});

composer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', () => {
    if (state.streaming) abortStream();
    else sendMessage();
});

newChatBtn.addEventListener('click', () => {
    startNewChat();
    if (window.innerWidth <= 900) closeDrawer();
});

backBtn.addEventListener('click', () => { window.location.href = '/index.html'; });
guestCta.addEventListener('click', () => { window.location.href = '/pages/patient/login.html'; });
clearBtn.addEventListener('click', clearConversation);
deleteBtn.addEventListener('click', () => {
    if (state.conversationId) deleteConversation(state.conversationId);
});

convSearch.addEventListener('input', () => renderConversations(convSearch.value));

langSelects.forEach((sel) => {
    sel.addEventListener('change', () => {
        state.languageTouched = true;
        setLanguage(sel.value);
    });
});

menuBtn.addEventListener('click', openDrawer);
scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
});

usePatientData.addEventListener('change', () => {
    if (!state.user) {
        usePatientData.checked = false;
        showToast('Sign in to use your health records.');
        return;
    }
    syncPatientChip();
});

messagesEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const wrap = btn.closest('.msg.assistant');
    if (!wrap) return;
    if (btn.dataset.action === 'copy') {
        const text = wrap.dataset.message || '';
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard.');
        } catch (err) {
            showToast('Could not copy.');
        }
    } else if (btn.dataset.action === 'retry') {
        const question = (wrap.dataset.question || '').trim();
        if (!question) return;
        wrap.remove();
        composer.value = question;
        composer.dispatchEvent(new Event('input'));
        closeDrawer();
        await sendMessage();
    }
});

document.getElementById('brand')?.addEventListener('click', () => { window.location.href = '/index.html'; });

/* ------------------------------------------------------------------ */
/* Config + init                                                       */
/* ------------------------------------------------------------------ */

async function loadConfig() {
    try {
        const data = await apiJSON('GET', '/api/medi-ai/config');
        const cfg = data.config || {};
        state.maxLength = cfg.max_message_length || MAX_LENGTH;
        state.disclaimer = cfg.disclaimer || '';
        composer.setAttribute('maxlength', String(state.maxLength));
        charCountEl.textContent = `0 / ${state.maxLength}`;
        pageDisclaimer.textContent = state.disclaimer;
        const supported = cfg.languages || core.supportedLanguages();
        langSelects.forEach((sel) => {
            Array.from(sel.options).forEach((opt) => {
                opt.hidden = !supported.includes(opt.value);
            });
        });
    } catch (e) {
        console.warn('Could not load Medi-AI config:', e.message);
    }
}

function renderBanners() {
    bannerInfo.hidden = !!state.user;
    guestNote.hidden = !!state.user;
    patientToggle.classList.toggle('inactive', !state.user);
    usePatientData.disabled = !state.user;
    guestCta.hidden = !!state.user;
}

async function init() {
    for (const l of core.LANGUAGES) {
        langSelects.forEach((sel) => {
            const opt = document.createElement('option');
            opt.value = l.code;
            opt.textContent = `${l.name} (${l.native})`;
            sel.appendChild(opt);
        });
    }

    const savedLang = localStorage.getItem('medi_ai_lang');
    if (savedLang && core.supportedLanguages().includes(savedLang)) {
        state.languageTouched = true;
        setLanguage(savedLang, true);
    }

    showWelcome();
    renderBanners();

    let currentUser = null;
    try {
        currentUser = await getCurrentUser();
    } catch (e) {
        currentUser = null;
    }

    if (currentUser) {
        try {
            state.token = await getAuthToken();
            state.user = currentUser;
        } catch (e) {
            console.warn('Medi-AI guest mode (no Appwrite session):', e.message);
            state.user = null;
            state.token = null;
        }
    }
    renderBanners();
    await loadConversations();
    await loadConfig();

    const returned = core.parseReturnParams(window.location.search);
    if (returned.isReturn && returned.conversationId) {
        if (returned.language && core.supportedLanguages().includes(returned.language)) {
            state.languageTouched = true;
            setLanguage(returned.language, true);
        }
        await openConversation(returned.conversationId);
    }
    composer.focus();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}