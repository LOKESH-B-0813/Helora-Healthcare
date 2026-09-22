"""Knowledge document metadata model.

Designed so clinically reviewed material can be added later with full
provenance. Nothing in the default curated set is claimed to be clinically
validated.
"""
from typing import List, Optional

from pydantic import BaseModel, Field

REVIEW_STATUSES = ('draft', 'standards_review', 'clinically_validated')


class KnowledgeSource(BaseModel):
    name: str
    version: str = '1.0'
    url: str = ''
    retrieved_at: str = ''


class KnowledgeDocument(BaseModel):
    id: str
    title: str
    topic: str
    specialty: str = ''
    language: str = 'en'  # 'en' | 'ta' | 'hi' | 'all'
    sections: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    sources: List[KnowledgeSource] = Field(default_factory=list)
    effective_date: str = ''
    review_status: str = 'draft'
    clinically_validated: bool = False


def assert_review_status(doc: KnowledgeDocument) -> KnowledgeDocument:
    if doc.review_status not in REVIEW_STATUSES:
        doc.review_status = 'draft'
    if doc.review_status == 'clinically_validated':
        doc.clinically_validated = True
    return doc