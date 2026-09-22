"""Local curated knowledge retriever.

Loads JSON documents from ``data/``. Retrieval is deterministic keyword
scoring so it is auditable. Documents are clearly marked as not clinically
validated; nothing here pretends to be a medical source.
"""
import json
import logging
import os
import re
from typing import List, Tuple

from ..language_utils import tanglish_normalized
from ..schemas.base import KnowledgeHit
from .base import KnowledgeRetriever
from .docs import KnowledgeDocument, KnowledgeSource, assert_review_status

logger = logging.getLogger(__name__)

_WORD_RE = re.compile(r"[a-z0-9']+")


def _word_boundary(keyword: str) -> str:
    """Enforce whole-word-ish matching to avoid substring false positives.

    Plain \b fails around non-Latin script, so combine a boundary regex with a
    fallback plain substring for multi-script/embedded keywords.
    """
    if re.match(r"^[a-z0-9' ]+$", keyword):
        return r'\b' + re.escape(keyword) + r'\b'
    return re.escape(keyword)


def _to_document(raw: dict) -> KnowledgeDocument:
    sources = []
    for source in raw.get('sources', []) or []:
        sources.append(KnowledgeSource(**source))
    doc = KnowledgeDocument(
        id=str(raw.get('id', '')),
        title=str(raw.get('title', '')),
        topic=str(raw.get('topic', '')),
        specialty=str(raw.get('specialty', '')),
        language=str(raw.get('language', 'en')),
        sections=[str(s) for s in raw.get('sections', []) or []],
        keywords=[str(k).lower() for k in raw.get('keywords', []) or []],
        sources=sources,
        effective_date=str(raw.get('effective_date', '')),
        review_status=str(raw.get('review_status', 'draft')),
    )
    return assert_review_status(doc)


class LocalCuratedRetriever(KnowledgeRetriever):
    def __init__(self, data_dir: str = ''):
        base = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = data_dir or os.path.join(base, 'data')
        self._documents: List[KnowledgeDocument] = []
        self._load()

    def _load(self) -> None:
        if not os.path.isdir(self.data_dir):
            logger.warning('Knowledge data directory missing: %s', self.data_dir)
            return
        for entry in sorted(os.listdir(self.data_dir)):
            if not entry.endswith('.json'):
                continue
            path = os.path.join(self.data_dir, entry)
            try:
                with open(path, 'r', encoding='utf-8') as handle:
                    raw_payload = json.load(handle)
                raw_docs = raw_payload if isinstance(raw_payload, list) else raw_payload.get('documents', [])
                for raw_doc in raw_docs:
                    self._documents.append(_to_document(raw_doc))
            except Exception:
                logger.exception('Failed to load knowledge document %s', entry)

    def all_documents(self) -> List[KnowledgeDocument]:
        return list(self._documents)

    def _score(self, doc: KnowledgeDocument, query_lowered: str, query_words: set) -> Tuple[int, List[str]]:
        score = 0
        matched: List[str] = []
        corpus = query_lowered
        for keyword in doc.keywords:
            pattern = _word_boundary(keyword)
            if re.search(pattern, corpus):
                score += 2 if ' ' in keyword else 1
                matched.append(keyword)
        for keyword in doc.keywords:
            if keyword in query_words:
                score += 1
        title_words = set(_WORD_RE.findall(doc.title.lower()))
        if title_words.intersection(query_words):
            score += 1
        return score, matched

    def retrieve(
        self,
        query: str,
        topic: str = '',
        language: str = 'en',
        limit: int = 3,
    ) -> List[KnowledgeDocument]:
        # Transliteration-aware scoring: the English glosses of recognized
        # Latin-script Indian-language tokens are appended for indexing, while
        # the original user text is left untouched everywhere else.
        normalized = tanglish_normalized(query)
        lowered = normalized.lower()
        words = set(_WORD_RE.findall(lowered))
        lang_filtered = [d for d in self._documents if d.language in ('all', language, 'en')]
        scored = [
            (self._score(doc, lowered, words), doc)
            for doc in lang_filtered
        ]
        scored.sort(key=lambda item: (-item[0][0], item[1].id))
        results = [doc for (score, _), doc in scored if score > 0][:limit]

        # topic match passthrough
        if topic and not results:
            topic_lowered = topic.lower()
            for doc in lang_filtered:
                if doc.topic.lower() == topic_lowered:
                    results.append(doc)
                    break
        return results

    def to_hits(self, documents: List[KnowledgeDocument], query: str = '') -> List[KnowledgeHit]:
        normalized = tanglish_normalized(query).lower()
        words = set(_WORD_RE.findall(normalized))
        hits = []
        for doc in documents:
            score, matched = self._score(doc, normalized, words)
            hit = KnowledgeHit(
                document_id=doc.id,
                title=doc.title,
                topic=doc.topic,
                specialty=doc.specialty,
                review_status=doc.review_status,
                effective_date=doc.effective_date,
                match_score=score,
                matched_terms=matched,
            )
            if doc.sources:
                hit.source = doc.sources[0].name
                hit.version = doc.sources[0].version
            hits.append(hit)
        return hits