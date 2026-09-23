# Medi-AI Intent Classifier — Evaluation Report

**Date:** 2026-09-18
**Component measured:** deterministic intent classification
(`backend/app/medi_ai/knowledge/intent.py`, `classify_intent`)
**Reproduce with:** `venv/bin/python backend/evaluation/run_benchmark.py`

> This report is honest about scope. It is a **software measurement**, not a
> clinical or diagnostic claim. The dataset is small, internally assembled, and
> not medically validated.

## 1. Task definition

The intent classifier labels a free-text user message with one of the intents
currently emitted by the implementation: `symptom`, `general`, `medication`,
`medication_admin`, `report`, `appointment`, `specialist`, `triage`. The
targeted product taxonomy also includes emergency symptoms, consultation
requests, follow-ups, preventive health and unsupported requests; those are
handled by other components today (the safety engine, RAG routing, and the
provider), and the mapping is documented in `docs/MEDI_AI.md`.

## 2. Target

The product target is **≥ 94% accuracy** for the *intent-classification /
specialist-routing component* measured on a held-out evaluation dataset. This
report measures the currently shipped component and states the status plainly:
**TARGET MET** or **TARGET NOT MET** based on the measured accuracy.

## 3. Dataset

| Property | Value |
| --- | --- |
| Name | `helora-intent-dev-set` |
| Source | Internally assembled development set (`backend/evaluation/labeled_intents.py`) |
| Total examples | 51 |
| English | 46 |
| Multilingual (ta/hi/te/ml) | 5 |
| Clinical validation | none — examples are illustrative phrasing, not medical record data |

The multilingual examples are included deliberately to measure a documented
limitation: the current classifier is English keyword–based.

## 4. Train / validation / test split

The model is **rule-based with no training**, so:

- Training set: **0**
- Validation set: **0**
- Test (evaluation) set: **51** (the full labeled set)
- Random seed documented: `20260918` (no stochastic training occurs)

No cross-validation is applicable to a deterministic rule set; instead, one
fixed labeled evaluation set is used and reported verbatim.

## 5. Preprocessing

`classify_intent` lowercases input, splits into ASCII word tokens, and compares
against curated English keyword sets separated by single-word
`symptom`/`category`/`action` vocabularies. Multilingual input produces no
keyword hits and — correctly under the current design — does **not** raise; it
falls through to `general`, and the safety engine (unaffected by language)
is the multilingual protection layer today.

## 6. Results

Machine-readable output: `backend/evaluation/results/intent_benchmark.json`

| Subset | n | Accuracy | Macro F1 | Weighted F1 |
| --- | --- | --- | --- | --- |
| all | 51 | 0.7843 | 0.7887 | 0.7915 |
| english-only | 46 | 0.8696 | 0.8440 | 0.8629 |
| multilingual-only | 5 | 0.0000 | 0.0000 | 0.0000 |

Per-class (english-only subset):

| Intent | Precision | Recall | F1 | Support |
| --- | --- | --- | --- | --- |
| appointment | 1.000 | 1.000 | 1.000 | 5 |
| general | 0.700 | 1.000 | 0.824 | 7 |
| medication | 0.750 | 1.000 | 0.857 | 6 |
| medication_admin | 1.000 | 0.333 | 0.500 | 3 |
| report | 1.000 | 1.000 | 1.000 | 6 |
| specialist | 1.000 | 0.750 | 0.857 | 4 |
| symptom | 0.900 | 0.818 | 0.857 | 11 |
| triage | 1.000 | 0.750 | 0.857 | 4 |

Notable failure modes (confusion matrix rows in the JSON output / console):

- `medication_admin` → `medication` (drug-related phrasing without an explicit
  "stop/change" verb pattern fire).
- `symptom` → `general` (several symptom phrasings the keyword vocab misses).
- `specialist` → `general` for the "recommend a … specialist" construction.
- `triage` → `symptom` once ("how serious is a persistent fever").
- All 5 multilingual examples → `general` (English-only classifier).

## 7. Status

- Measured accuracy (all): **78.43%**.
- 94% target: **TARGET NOT MET**.
- No trained multilingual model is claimed; XLM-RoBERTa is documented as the
  planned approach in `docs/MEDI_AI.md` §9 and is **not trained / NOT
  VALIDATED**. Any future ≥94% claim must be backed by a held-out dataset,
  split, preprocessing, hyperparameters and seed, and reproduced by this
  harness or equivalent.

## 8. Limitations

1. Sample size is small (51) and not statistically validated.
2. No clinician review of labels; some label assignments are judgment calls.
3. Metrics are computed with purpose-written code (no external ML library),
   so they are transparent but not independently verified.
4. Multilingual coverage is the dominant failure driver and is a real product
   gap today (partially mitigated by the deterministic safety engine).
5. These numbers must not be presented as clinical accuracy.