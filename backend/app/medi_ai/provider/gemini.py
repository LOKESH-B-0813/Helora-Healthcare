"""Gemini provider implemented over the REST ``generateContent`` API.

Uses the standard ``requests`` library (no heavyweight SDK) so it works across
Python versions. The API key is read from server environment configuration at
call time and is never sent to the browser.

Endpoint (confirmed working against the current Gemini API):
    https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    Streaming: ... :streamGenerateContent?alt=sse
"""
import json
import logging
import time
from typing import Any, Dict, Iterator, List, Optional

import requests

from ..errors import (
    MalformedResponseError,
    ProviderInvalidKeyError,
    ProviderQuotaExceededError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from ..schemas.base import ChatTurn, ProviderResult

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'


class GeminiProvider:
    name = 'gemini'

    def __init__(
        self,
        api_key: str = '',
        base_url: str = '',
        timeout_seconds: float = 45,
        retries: int = 1,
        fallback_model: str = '',
        fallback_api_key: str = '',
    ):
        self.api_key = api_key
        self.base_url = base_url or DEFAULT_BASE_URL
        self.timeout_seconds = timeout_seconds
        self.retries = max(0, retries)
        self.fallback_model = fallback_model
        self.fallback_api_key = fallback_api_key
        self._session = requests.Session()

    @property
    def supports_streaming(self) -> bool:
        return True

    @property
    def supports_multimodal(self) -> bool:
        return False  # Interface present for future use; not enabled yet.

    # ------------------------------------------------------------------
    # Prompt building
    # ------------------------------------------------------------------
    @staticmethod
    def _build_contents(turns: List[ChatTurn]) -> Dict[str, Any]:
        system_parts = []
        contents = []
        for turn in turns:
            if turn.role == 'system':
                system_parts.append(turn.content)
            else:
                contents.append({
                    'role': 'model' if turn.role == 'assistant' else 'user',
                    'parts': [{'text': turn.content}],
                })
        body: Dict[str, Any] = {'contents': contents}
        if system_parts:
            body['systemInstruction'] = {'parts': [{'text': '\n'.join(system_parts)}]}
        return body

    @staticmethod
    def _build_generation_config(
        response_schema: Optional[Dict[str, Any]],
        max_tokens: Optional[int],
        temperature: float,
    ) -> Dict[str, Any]:
        config: Dict[str, Any] = {'temperature': temperature}
        if max_tokens:
            config['maxOutputTokens'] = max_tokens
        if response_schema:
            config['responseMimeType'] = 'application/json'
            config['responseSchema'] = response_schema
        return config

    # ------------------------------------------------------------------
    # HTTP helpers with retry + safe error mapping
    # ------------------------------------------------------------------
    def _url(self, model: str, *, stream: bool = False) -> str:
        action = 'streamGenerateContent' if stream else 'generateContent'
        suffix = '?alt=sse' if stream else ''
        return f'{self.base_url}/models/{model}:{action}{suffix}'

    def _request(
        self,
        url: str,
        body: Dict[str, Any],
    ) -> Any:
        return self._request_key(url, body, self.api_key)

    def _request_key(
        self,
        url: str,
        body: Dict[str, Any],
        api_key: str,
    ) -> Any:
        if not api_key:
            raise ProviderInvalidKeyError('GEMINI_API_KEY is not configured')

        attempts = 1 + self.retries
        last_error: Exception = ProviderUnavailableError()
        for attempt in range(attempts):
            try:
                resp = self._session.post(
                    url,
                    params={'key': api_key},
                    json=body,
                    timeout=self.timeout_seconds,
                )
            except requests.exceptions.Timeout:
                last_error = ProviderTimeoutError()
            except requests.exceptions.RequestException:
                last_error = ProviderUnavailableError()
            else:
                if resp.status_code in (200, 201):
                    # The Gemini API is documented UTF-8 for both JSON and SSE.
                    # `requests` falls back to ISO-8859-1 for `text/*` bodies
                    # (SSE arrives as `text/event-stream`, usually with no
                    # charset header), which corrupts Tamil/Hindi/Telugu/
                    # Malayalam/Kannada text into mojibake. Pin UTF-8 so both
                    # `resp.json()` and `iter_lines(decode_unicode=True)` decode
                    # correctly.
                    resp.encoding = 'utf-8'
                    return resp
                # Map HTTP errors to safe types.
                if resp.status_code in (401, 403):
                    raise ProviderInvalidKeyError()
                if resp.status_code == 429:
                    raise ProviderQuotaExceededError()
                if resp.status_code >= 500:
                    last_error = ProviderUnavailableError()
                else:
                    last_error = ProviderUnavailableError()
                logger.warning(
                    'Gemini HTTP %s on attempt %d: %s',
                    resp.status_code, attempt + 1, (resp.text or '')[:400],
                )
            if attempt < attempts - 1:
                time.sleep(0.5 * (attempt + 1))
        raise last_error

    def _fallback(
        self,
        url: str,
        body: Dict[str, Any],
        *,
        stream: bool,
    ) -> Optional[Any]:
        """Retry a failed provider call once with the configured fallback model.

        Returns ``None`` when no fallback is configured; otherwise returns a
        response-like object or raises the last provider error.
        """
        if not self.fallback_model:
            return None
        logger.warning('Gemini primary model failed; trying fallback model %s', self.fallback_model)
        fallback_url = self._url(self.fallback_model, stream=stream)
        fallback_key = self.fallback_api_key or self.api_key
        try:
            return self._request_key(fallback_url, body, fallback_key)
        except (ProviderInvalidKeyError, ProviderQuotaExceededError,
                ProviderTimeoutError, ProviderUnavailableError) as exc:
            logger.error('Gemini fallback model also failed: %s', exc)
            raise

    @staticmethod
    def _extract_usage(resp: Any) -> Dict[str, Any]:
        payload = resp.json() if resp is not None else {}
        usage = payload.get('usageMetadata') or {}
        return {
            'prompt_tokens': usage.get('promptTokenCount'),
            'candidates_tokens': usage.get('candidatesTokenCount'),
            'total_tokens': usage.get('totalTokenCount'),
        }

    @staticmethod
    def _extract_text(resp: Any) -> str:
        payload = resp.json() if resp is not None else {}
        candidates = payload.get('candidates') or []
        if not candidates:
            reason = payload.get('promptFeedback', {}).get('blockReason')
            logger.warning('Gemini returned no candidates; blockReason=%s', reason)
            raise MalformedResponseError()
        parts = (candidates[0].get('content') or {}).get('parts') or []
        text = ''.join(part.get('text', '') for part in parts if isinstance(part, dict))
        if not text:
            raise MalformedResponseError()
        return text

    # ------------------------------------------------------------------
    # Interface implementation
    # ------------------------------------------------------------------
    def chat(
        self,
        turns: List[ChatTurn],
        *,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
        language: str = 'en',
        **kwargs: Any,
    ) -> ProviderResult:
        body = self._build_contents(turns)
        body['generationConfig'] = self._build_generation_config(None, max_tokens, temperature)
        url = self._url(model or 'gemini-2.5-flash', stream=False)
        try:
            resp = self._request(url, body)
        except (ProviderInvalidKeyError, ProviderQuotaExceededError,
                ProviderTimeoutError, ProviderUnavailableError):
            resp = self._fallback(url, body, stream=False)
            if resp is None:
                raise
        return ProviderResult(text=self._extract_text(resp), usage=self._extract_usage(resp))

    def stream_chat(
        self,
        turns: List[ChatTurn],
        *,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
        language: str = 'en',
        **kwargs: Any,
    ) -> Iterator[str]:
        body = self._build_contents(turns)
        body['generationConfig'] = self._build_generation_config(None, max_tokens, temperature)
        url = self._url(model or 'gemini-2.5-flash', stream=True)
        try:
            resp = self._request(url, body)
        except (ProviderInvalidKeyError, ProviderQuotaExceededError,
                ProviderTimeoutError, ProviderUnavailableError):
            resp = self._fallback(url, body, stream=True)
            if resp is None:
                raise
        for line in resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith('data:'):
                continue
            try:
                event = json.loads(line[len('data:'):].strip())
                parts = (event.get('candidates') or [{}])[0].get('content', {}).get('parts') or []
                for part in parts:
                    if isinstance(part, dict) and part.get('text'):
                        yield part['text']
            except Exception:
                logger.warning('Skipped unparsable Gemini stream event')
                continue

    def structured(
        self,
        turns: List[ChatTurn],
        response_schema: Dict[str, Any],
        *,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.2,
        language: str = 'en',
        **kwargs: Any,
    ) -> Dict[str, Any]:
        body = self._build_contents(turns)
        body['generationConfig'] = self._build_generation_config(
            response_schema, max_tokens, temperature
        )
        url = self._url(model or 'gemini-2.5-flash', stream=False)
        try:
            resp = self._request(url, body)
        except (ProviderInvalidKeyError, ProviderQuotaExceededError,
                ProviderTimeoutError, ProviderUnavailableError):
            resp = self._fallback(url, body, stream=False)
            if resp is None:
                raise
        text = self._extract_text(resp)
        try:
            parsed = json.loads(text)
        except Exception:
            logger.warning('Gemini structured output was not valid JSON')
            raise MalformedResponseError()
        if not isinstance(parsed, dict):
            raise MalformedResponseError()
        return parsed