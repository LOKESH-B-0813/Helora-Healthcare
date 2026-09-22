"""Knowledge retrieval interface.

The retrieval system is replaceable: swap ``LocalCuratedRetriever`` for a
vector/embeddings store later without touching the rest of Medi-AI.
"""
import abc
from typing import List, Optional

from .docs import KnowledgeDocument


class KnowledgeRetriever(abc.ABC):
    @abc.abstractmethod
    def retrieve(
        self,
        query: str,
        topic: str = '',
        language: str = 'en',
        limit: int = 3,
    ) -> List[KnowledgeDocument]:
        raise NotImplementedError()