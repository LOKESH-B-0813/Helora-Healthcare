# Helora Medi-AI

Medi-AI is the health-information and decision-support assistant embedded in the
Helora healthcare portal. It is a **conservative** assistant: it does not
diagnose, does not prescribe, and never acts as an autonomous clinician. Its
purpose is to explain health information, ask clarifying questions, surface
warning signs, and route users toward appropriate human care.

> **Status / honesty note:** This subsystem has been implemented and tested at
> the software level (unit/API tests + live Gemini smoke tests). It has **not**
> undergone clinical validation, medical review, regulatory clearance, or a
> production security audit. Do not present it to end users as clinically
> validated. The curated knowledge base ships with a small set of draft,
> general-education articles only.

---

## 1. Architecture

```
Browser (pages/medi-ai/chat.html + js/medi-ai.js)
        │  fetch / SSE   (Authorization: Bearer <Appwrite JWT>)
        ▼
Flask blueprint  /api/medi-ai/*        backend/app/medi_ai/routes.py
        │
        ▼
MediAIService (orchestrator)           medi_ai/services/orchestrator.py
        │
        ├── SafetyEngine  (deterministic, runs FIRST)   medi_ai/safety/
        ├── Intent + Specialist + Knowledge (RAG-lite)  medi_ai/knowledge/
        ├── ToolRegistry  (read-only, role-gated)       medi_ai/tools/
        ├── Provider (Gemini REST / Dummy)              medi_ai/provider/
        └── ConversationService (ownership-enforced)    medi_ai/conversations/
```

### Request pipeline (multilingual, 10 stages)

1. Authenticate (optional) via existing `require_auth`.
2. Rate limit (per-user, or per-IP for guests).
3. Validate size; **resolve language** — explicit `language` field wins;
   otherwise `medi_ai/language_utils.py` script-detects the message
   (`ta` Tamil, `hi` Devanagari, `te` Telugu, `ml` Malayalam, `kn` Kannada)
   and falls back to `en`.
4. **Deterministic safety classification** (`SafetyEngine.classify`) — runs
   on the raw message **regardless of language**. Emergency phrases are
   matched in all 6 supported scripts before any LLM call.
5. If emergency → return a fixed, localized emergency response **without**
   calling the LLM (template localized to the message language).
6. Otherwise: classify intent, map specialty, retrieve curated knowledge,
   run any explicitly requested (role-gated) tools.
7. Load prior conversation history (authenticated + owned conversation only);
   the stored **conversation language** is used as context metadata.
8. Call the provider for a structured response, passing the detected
   language through to the model prompt.
9. Apply **deterministic overrides** (safety flags, urgency, specialty,
   sources, language-appropriate templates) and validate the response again.
10. Append the disclaimer, persist messages (if authenticated), log safe usage.

**Architecture note (plan vs. implemented):** the *target* architecture is
`message → language detection → intent classification → safety engine → RAG →
tools (if authorized) → LLM → safety validation → response → stream`. Safety is
never bypassed by language detection. The current implementation uses a
deterministic/heuristic intent classifier and local curated RAG; a trained
XLM-RoBERTa multilingual intent classifier is the documented next step (see
§10). The safety engine is deterministic in every implementation.

The LLM is never given the ability to invoke tools. Tools are selected and
executed by the backend based on the user's message and their role; only the
resulting **minimum necessary** context is placed into the prompt.

---

## 2. Directory layout

```
backend/app/medi_ai/
├── __init__.py
├── errors.py            # error taxonomy + safe error_response (stable codes only)
├── config.py            # MediAIConfig (env + Flask config)
├── observability.py     # structured, non-sensitive logging
├── ratelimit.py         # per-user / per-IP limits
├── schemas/base.py      # pydantic models (structured response, turns, hits…)
├── provider/
│   ├── base.py          # LLMProvider interface
│   ├── gemini.py        # Gemini REST + SSE (query-param key)
│   ├── dummy.py         # offline provider for dev/tests
│   └── factory.py       # get_provider('gemini' | 'dummy')
├── language_utils.py    # script-count language detection + resolution
├── safety/
│   ├── rules.py         # 10 emergency rule families (multilingual keywords)
│   ├── engine.py        # classify / build_emergency_response / validate_response
│   └── templates.py     # localized emergency + disclaimer text
├── knowledge/
│   ├── base.py          # retriever interface
│   ├── docs.py          # curated document backing
│   ├── intent.py        # deterministic intent classification (14 categories)
│   ├── local.py         # LocalCuratedRetriever
│   └── data/helora_help.json
├── tools/
│   ├── base.py          # ToolContext / ToolResult
│   ├── registry.py      # role-gated registration + execution
│   └── backend_tools.py # patient-owner tools + disabled stubs
├── conversations/service.py   # CRUD, add_message, build_context, ownership
├── services/
│   ├── pipeline.py      # ChatRequest / ChatResult / StreamingEvent
│   └── orchestrator.py  # MediAIService (chat + stream)
└── routes.py            # Flask blueprint at /api/medi-ai
```

Related files:

- `backend/app/__init__.py` — registers the blueprint and calls `init_db()`.
- `backend/app/models.py` / `backend/app/database.py` — `Conversation` /
  `Message` tables + idempotent SQLite migration.
- `backend/app/chat_routes.py` — legacy `/chat/*` endpoints, now thin
  delegations to the same services (ownership enforced, errors sanitized).
- `pages/medi-ai/chat.html`, `js/medi-ai.js` — rebuilt frontend.
- `index.html`, `pages/services/find-doctors.html` — Medi-AI navigation link +
  AI Assistant portal card (→ `pages/medi-ai/chat.html`); the specialist card's
  "Find doctors" action links to `find-doctors.html?specialty=…`, which
  highlights/filters the matching specialty on load.
- `backend/tests/` — pytest suite (incl. `test_medi_ai_security.py`).

---

## 3. Configuration

All secrets live in server-side environment variables only. The app reads the
repository root `.env` and `backend/.env` (root loads first, non-overriding).

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | *(empty)* | Server-side Gemini key. Never sent to the browser. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Verified working default. |
| `MEDI_AI_PROVIDER` | `gemini` | `gemini` or `dummy` (offline dev/tests). |
| `MEDI_AI_MAX_MESSAGE_LENGTH` | `4000` | Max user message chars. |
| `MEDI_AI_MAX_MESSAGES` | `40` | Max history messages per prompt. |
| `MEDI_AI_MAX_CONTEXT_CHARS` | `8000` | Max history chars per prompt. |
| `MEDI_AI_PROVIDER_TIMEOUT` | `45` | Provider request timeout (seconds). |
| `MEDI_AI_RETRIES` | `1` | Provider retry count. |
| `MEDI_AI_MAX_OUTPUT_TOKENS` | `1024` | Generation cap. |
| `MEDI_AI_RATE_AUTH_PER_HOUR` | `60` | Authenticated hourly limit. |
| `MEDI_AI_RATE_ANON_PER_HOUR` | `10` | Guest hourly limit. |
| `MEDI_AI_RATE_WINDOW_SECONDS` | `3600` | Rate-limit window. |

`.env.example` contains placeholders and the same documentation. If
`GEMINI_API_KEY` is missing, the Gemini provider raises `ProviderInvalidKeyError`
and the API returns a safe `provider_invalid_key` code; no key material is ever
echoed back.

---

## 4. HTTP API (`/api/medi-ai`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/config` | optional | Non-sensitive feature flags (provider name, languages). |
| GET | `/languages` | optional | Supported languages (`en`, `ta`, `hi`, `te`, `ml`, `kn`). |
| POST | `/chat` | optional | JSON reply, or **SSE** stream when `stream: true`. |
| GET | `/conversations` | required | List the caller's conversations. |
| POST | `/conversations` | required | Create a conversation. |
| GET | `/conversations/<id>` | required | Fetch one (ownership enforced). |
| PATCH | `/conversations/<id>` | required | Rename. |
| DELETE | `/conversations/<id>` | required | Hard-delete (cascades messages). |
| POST | `/conversations/<id>/archive` | required | Archive. |
| POST | `/conversations/<id>/clear` | required | Delete messages, keep conversation. |
| GET | `/tools` | optional | Tool catalogue (descriptions/metadata only, no secrets, no data). |
| POST | `/tools/execute` | required | Execute a permitted tool. |
| POST | `/media` | required | Reserved (returns `501 not_implemented`). |

`POST /chat` body:

```json
{ "message": "…", "language": "en", "conversation_id": 12, "stream": false }
```

Guests may chat but are **stateless** (`anonymous: true`, `persisted: false`);
conversation endpoints require authentication.

### Streaming (SSE)

When `stream: true`, the response is `text/event-stream` with events:

- `start` — `{ conversation_id }`
- `delta` — `{ text }` (repeated)
- `done` — `{ conversation_id, anonymous, persisted, provider, specialist_reason, structured }`
- `error` — `{ code, message }` (safe)

Streaming uses a natural-language system prompt (no JSON), while the
non-streaming path requests a structured JSON object constrained by a Gemini
`responseSchema`.

---

## 5. Safety model

- **Emergency detection is deterministic and runs before any LLM call.**
  `medi_ai/safety/rules.py` defines rule families (e.g. breathing difficulty,
  chest pain, stroke signs, seizure, severe bleeding, anaphylaxis, poisoning,
  self-harm, unconsciousness). Rules include multiword phrases in all 6
  supported scripts (en/ta/hi/te/ml/kn); rules are matched on the normalized
  full message text, not on words only, so multilingual script phrases work
  without regex changes. Matches are normalized (including curly quotes).
- Emergency responses use fixed localized templates with actions such as
  `seek_emergency_care_now`; the LLM is bypassed entirely.
- After generation, `validate_response` re-checks urgency/flags and applies a
  fail-safe response if validation fails.
- The provider is instructed not to diagnose, prescribe, or change medication,
  and to surface uncertainty and warning signs.
- `errors.py` returns only stable `code` values to clients — never exception
  class names, stack traces, or provider payloads.
- Usage logs (`AIUsageLog`) store only non-sensitive summaries (language,
  urgency, length, token estimate) — never message bodies.

### Privacy

- Patient-specific data is only ever read from the **authenticated** user's
  own records.
- Doctor search never returns phone/email/contact fields.
- Appointment requests validate a real doctor id.
- Conversation access is ownership-checked on every operation.
- Anonymous chats are not persisted at all.

---

## 6. Tools

Tools are backend-executed and role-gated; the model cannot call them.

- **Patient-owner tools**: current medications, allergies, upcoming
  appointments, own profile summary — all scoped to `g.user['uid']`.
- **`search_helora_doctors`**: returns specialty/availability only, never
  contact details.
- **`create_appointment_request`**: requires a valid doctor id and an
  authenticated user.
- Disabled stubs exist for future capabilities and return a safe
  "not enabled" result.

---

## 7. Running locally

```bash
# from repo root
python -m venv venv
venv/bin/pip install -r backend/requirements.txt

# set GEMINI_API_KEY in .env (root). Without it, use MEDI_AI_PROVIDER=dummy.

cd backend
../venv/bin/python run.py            # starts Flask
# then open pages/medi-ai/chat.html through the app
```

### Tests

```bash
cd backend
../venv/bin/python -m pytest tests -q
```

The suite sets `MEDI_AI_PROVIDER=dummy`, uses a throwaway SQLite file, and
replaces Appwrite auth with a test harness. Current result: **117 passed**
(includes the 6-script multilingual emergency test matrix, transliterated
"Tanglish" emergency tests, language-utils/detection tests, intent-classifier
tests, retrieval match-metadata tests, and the endpoint security tests in
`tests/test_medi_ai_security.py`).

Frontend unit tests run with Node's built-in runner:

```bash
node --test tests/frontend/
```

Current result: **32 passed** for `js/medi-ai-core.js` (language/script/Tanglish
detection, URL round-trip helpers, delete-state helpers, structured-response
rendering, SSE parsing).

Live provider smoke tests (require `GEMINI_API_KEY`) are kept outside the
repository under `/tmp` during development and are not part of CI.

---

## 9. Model / algorithm rationale

### Why XLM-RoBERTa (planned) for intent classification

The message spans 6 scripts (Latin, Tamil, Devanagari, Telugu, Malayalam,
Kannada). A pure English keyword classifier cannot generalize across scripts;
native-script and Latin-script ("Tanglish") input is now handled by curated
per-script keyword maps plus transliteration gloss-augmentation
(`app.medi_ai.knowledge.intent`, `app.medi_ai.language_utils`), which moved the
internal benchmark (§10) to 100% on its 81-example dev set. These maps are
still small and heuristic, not comprehensive. `XLM-RoBERTa` remains the long
term plan: it is pre-trained on 100 languages with a 250k tokenizer, so a
single model can map all supported scripts into one multilingual intent space
without per-language classifier maintenance. We still evaluate it on a
held-out set and report real numbers (target ≥ 94% for the classification
component); until then the service ships the improved deterministic
classifier.

### Why deterministic (rule-based) safety

Emergency detection (¶5) is deliberately the *opposite* of ML: fixed localized
templates, immune to prompt injection, deterministic across deployments, and
independently inspectable. An LLM is powerful but not trustworthy for the
"is this an emergency" gate — a rule miss is a predictable, fixable defect;
an LLM misfire is not. Hence: deterministic safety **before** and **after**
the LLM, language detection can never bypass it, and the final response is
re-validated against the same rules.

### Why RAG (retrieval) over pure memorization

Curated, reviewable documents (`helora_help.json`) are retrieved at runtime so
answers cite sources the user can inspect, and content is version-controlled
and medically reviewable rather than model-remembered. Retrieval is currently a
small local retriever; the interface (`Retriever`) supports swapping in a
vector store later without changing the pipeline.

### Why an LLM at all

The LLM turns retrieved facts + tool output into natural, conversational,
language-matched explanations across the 6 supported languages — the parts a
template engine cannot do. It is constrained (structured output / streaming
system prompt, deterministic overrides afterwards) so fluency never replaces
the safety guarantees above.

---

## 10. Intent classifier evaluation (honest status)

- Harness: `backend/evaluation/run_benchmark.py` (metrics are implemented from
  scratch — accuracy, macro/weighted precision·recall·F1, per-class scores,
  confusion matrices; results at `backend/evaluation/results/intent_benchmark.json`).
  The harness also reports per-language subsets (script and transliteration
  detection are used only to bucket examples, never to run the classifier).
- Dataset: internal dev set of 81 labeled messages (`labeled_intents.py`) — 64
  Latin-script (including transliterated "Tanglish" examples in Tamil/Hindi/
  Telugu/Malayalam/Kannada) + 17 native-script, self-assembled, **not
  clinically validated**.
- Held-out: no training is performed (rule-based), so the full set is the
  evaluation set. See `docs/INTENT_CLASSIFIER_EVALUATION.md` for the full
  methodology report. N.B. the older report snapshots pre-curated-map numbers;
  §9's rationale and the live benchmark are the current record.
- Current deterministic classifier on this set: **all = 100%**, English-only =
  **100%**, transliterated + native-script multilingual = **100%** on all
  per-language subsets (each of the 17 native-script + 18 transliterated
  examples) → the ≥ 94% target is **MET on this internal dev set**. This is a
  measure of the curated maps over a hand-picked set, not a clinical or
  out-of-distribution accuracy claim.
- The XLM-RoBERTa model is documented as the plan; it is **not trained** and no
  accuracy is claimed for it. Any future report of ≥ 94% must cite a held-out
  evaluation dataset, split, preprocessing, hyperparameters and seed and must
  not be fabricated.

---

## 11. Known limitations / remaining work

- **No clinical validation.** Content and safety rules need review by qualified
  clinicians before any real-world medical use.
- **Intent classification is heuristic.** The curated multilingual maps reach
  100% on the internal dev set (§10) but remain small and not exhaustive; new
  phrases and dialects may fall through to `general`. This keeps
  XLM-RoBERTa the longer-term goal.
- **Multilingual language detection is script-count based plus a curated
  transliteration map**, not ML: mixed-script messages, rare scripts, or
  unknown Latin-script slang may resolve to a wrong-language reply (never
  bypasses safety). Improve with a dedicated detector.
- **Knowledge base is minimal** (a few draft general-education docs). RAG is a
  lightweight local retriever (now word-boundary and Tanglish-aware with
  match metadata), not a validated medical corpus; new docs were deliberately
  deferred this round.
- **Model resilience**: the primary Gemini provider can fall back to a
  configurable alternative model (`GEMINI_FALLBACK_MODEL`/`GEMINI_FALLBACK_API_KEY`)
  when the primary errors; without a fallback model configured the service
  keeps the single-provider behaviour and surfaces `provider_unavailable`.
- **Rate limiting** is in-process; for multiple workers use a shared store
  (e.g. Redis).
- **Legacy `/chat/*`** endpoints remain for backward compatibility and should be
  retired once the frontend fully migrates to `/api/medi-ai/*`.
- **Media/multimodal** analysis is not implemented (`501`).
- **Portal integration**: Medi-AI is linked from the public navigation
  (`index.html` header/footer and the AI Assistant portal card). The
  specialist "Find doctors" card wires into `pages/services/find-doctors.html`
  via `specialty`, `conversation_id` and `from=medi-ai` query parameters, and
  that page renders a "Back to Medi-AI" link that restores the same thread.
  Conversation deletion is now idempotent client-side (guest mode included).
  Live end-to-end verification of the authenticated Appwrite session/JWT flow
  still requires a provisioned test account against a reachable Appwrite project.
- **Observability**: usage logging is present; production metrics/dashboards and
  alerting are not yet wired up.
- **Error logging** of provider HTTP bodies is server-side only and truncated;
  ensure log retention policies are appropriate.
