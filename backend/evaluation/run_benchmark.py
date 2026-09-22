"""Reproducible benchmark for the current deterministic intent classifier.

Run (from repo root or anywhere):
    backend/venv/bin/python backend/evaluation/run_benchmark.py

It prints accuracy/precision/recall/F1, a confusion matrix and per-class
metrics, then writes the machine-readable result to ``backend/evaluation/results/``.

It measures ONLY the classification component. It is not a medical/diagnostic
evaluation and makes no clinical accuracy claims. The evaluation set is a small
internal labeled dev set (see ``labeled_intents.py``); the ">= 94% accuracy on a
held-out evaluation dataset" target is reported honestly (TARGET MET/NOT MET),
and absent a large, independently validated dataset the clinical claim is NOT
VALIDATED.
"""
import os
import sys
import json
from collections import defaultdict

BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.abspath(BACKEND))

from app.medi_ai.knowledge.intent import classify_intent  # noqa: E402
from app.medi_ai.language_utils import detect_language_code, detect_transliterated_language  # noqa: E402
from evaluation.labeled_intents import DEV_SET  # noqa: E402

TARGET_ACCURACY = 0.94
RANDOM_SEED = 20260918  # deterministic ordering/metadata reference


def bucket_language(text: str) -> str:
    """Bucket an example by detected language: script first, then transliteration,
    else English. Used only for the per-language breakdown of the dev set."""
    detected = detect_language_code(text)
    if detected:
        return detected
    transliterated = detect_transliterated_language(text)
    return transliterated or 'en'


def metrics_for(pairs):
    """Return (accuracy, macro_f1, weighted_f1, per_class, confusion, labels)."""
    preds = [classify_intent(text).intent for text, _ in pairs]
    labels = sorted({true for _, true in pairs} | set(preds))
    matrix = {a: {b: 0 for b in labels} for a in labels}
    tp = defaultdict(int)
    tp_fp = defaultdict(int)
    tp_fn = defaultdict(int)
    correct = 0
    for (text, true), pred in zip(pairs, preds):
        matrix[true][pred] += 1
        if pred == true:
            correct += 1
            tp[true] += 1
        tp_fp[pred] += 1
        tp_fn[true] += 1

    n = len(pairs)
    accuracy = correct / n if n else 0.0

    per_class = {}
    macro_f1 = 0.0
    support_total = 0
    weighted_f1 = 0.0
    for label in labels:
        p = tp[label] / tp_fp[label] if tp_fp[label] else 0.0
        r = tp[label] / tp_fn[label] if tp_fn[label] else 0.0
        f1 = 2 * p * r / (p + r) if (p + r) else 0.0
        support = tp_fn[label]
        per_class[label] = {'precision': round(p, 4), 'recall': round(r, 4), 'f1': round(f1, 4), 'support': support}
        macro_f1 += f1 / len(labels)
        weighted_f1 += f1 * support
    weighted_f1 = weighted_f1 / n if n else 0.0

    return accuracy, macro_f1, weighted_f1, per_class, matrix, labels


def _print_confusion(matrix, labels):
    header = ' ' * 20 + ''.join(f'{l[:10]:>12}' for l in labels)
    rows = [header, ' ' + '-' * (20 + 12 * len(labels))]
    for true in labels:
        cells = ''.join(f'{matrix[true][pred]:>12}' for pred in labels)
        rows.append(f'{true[:20]:<20}{cells}')
    return '\n'.join(rows)


def main():
    results_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results')
    os.makedirs(results_dir, exist_ok=True)

    english = [(t, y) for t, y in DEV_SET if _is_latin(t)]
    multilingual = [(t, y) for t, y in DEV_SET if not _is_latin(t)]
    transliterated = [(t, y) for t, y in DEV_SET if _is_latin(t) and bucket_language(t) != 'en']
    by_language = {}
    for t, y in DEV_SET:
        by_language.setdefault(bucket_language(t), []).append((t, y))

    report = {
        'target_accuracy': TARGET_ACCURACY,
        'random_seed': RANDOM_SEED,
        'dataset': {
            'name': 'helora-intent-dev-set',
            'source': 'internally assembled development set (not clinically validated)',
            'size': len(DEV_SET),
            'english_examples': len(english),
            'multilingual_examples': len(multilingual),
            'transliterated_examples': len(transliterated),
            'per_language_sizes': {lang: len(pairs) for lang, pairs in sorted(by_language.items())},
        },
        'precision_recall_f1': {},
        'by_language': {},
    }

    print('=' * 78)
    print('Medi-AI intent classifier benchmark (deterministic/heuristic)\n')

    subsets = [('all', DEV_SET), ('english_only', english),
               ('multilingual_only', multilingual), ('transliterated_only', transliterated)]
    subsets += [(f'language_{lang}', pairs) for lang, pairs in sorted(by_language.items())]
    for label, pairs in subsets:
        if not pairs:
            continue
        accuracy, macro_f1, weighted_f1, per_class, matrix, labels = metrics_for(pairs)
        ok = accuracy >= TARGET_ACCURACY
        print('-' * 78)
        print(f'subset: {label}  (n={len(pairs)})')
        print(f'accuracy: {accuracy:.4f}  (target >= {TARGET_ACCURACY}) -> {"TARGET MET" if ok else "TARGET NOT MET"}')
        print(f'macro F1: {macro_f1:.4f} | weighted F1: {weighted_f1:.4f}')
        print(_print_confusion(matrix, labels))
        print('per-class:')
        for label, m in sorted(per_class.items()):
            print(f'  {label:<22} P={m["precision"]:.3f} R={m["recall"]:.3f} F1={m["f1"]:.3f} support={m["support"]}')
        section = 'by_language' if label.startswith('language_') else 'precision_recall_f1'
        report[section][label] = {
            'n': len(pairs),
            'accuracy': round(accuracy, 4),
            'macro_f1': round(macro_f1, 4),
            'weighted_f1': round(weighted_f1, 4),
            'per_class': per_class,
            'confusion_matrix': matrix,
            'accuracy_status': 'TARGET MET' if ok else 'TARGET NOT MET',
        }
        report['accuracy_statement'] = 'Measured accuracy reported above; no clinical accuracy claim is made.'
        if not ok:
            report['accuracy_statement'] = (
                'Measured accuracy reported above is below the >= 0.94 target '
                'for at least one subset (TARGET NOT MET). Multilingual coverage '
                'is a documented gap of the current heuristic classifier; no '
                'clinical accuracy claim is made.'
            )

    json_path = os.path.join(results_dir, 'intent_benchmark.json')
    with open(json_path, 'w', encoding='utf-8') as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)
    print('=' * 78)
    print(f'Results written to {json_path}')


def _is_latin(text: str) -> bool:
    return all(ord(c) < 0x0800 for c in text or '')


if __name__ == '__main__':
    main()