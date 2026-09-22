import os
import abc
import logging


class AIProvider(abc.ABC):
    @abc.abstractmethod
    def generate(self, prompt, **kwargs):
        raise NotImplementedError()

    @abc.abstractmethod
    def stream(self, prompt, **kwargs):
        raise NotImplementedError()


class OpenAIProvider(AIProvider):
    def __init__(self, api_key=None):
        try:
            import openai
            self.openai = openai
        except Exception:
            self.openai = None
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        if self.openai and self.api_key:
            self.openai.api_key = self.api_key

    def generate(self, prompt, **kwargs):
        if not self.openai:
            raise RuntimeError('OpenAI SDK not installed. Install with: pip install openai')
        if not self.api_key:
            raise RuntimeError('OPENAI_API_KEY not set in environment')

        # Call the OpenAI ChatCompletion API and normalize to a dict
        raw = self.openai.ChatCompletion.create(model=kwargs.get('model', 'gpt-4o-mini'), messages=prompt)
        try:
            # openai returns OpenAIObject with to_dict()
            if hasattr(raw, 'to_dict'):
                return raw.to_dict()
            # sometimes it's already a dict
            if isinstance(raw, dict):
                return raw
            # Fallback: try to build a dict with choices
            choices = []
            for c in getattr(raw, 'choices', []) or []:
                # each c may have message attribute or dict
                m = None
                if isinstance(c, dict):
                    m = c.get('message')
                else:
                    m = getattr(c, 'message', None)
                if m is None:
                    # try text
                    cont = getattr(c, 'text', None) or (c.get('text') if isinstance(c, dict) else None)
                    m = {'content': cont}
                choices.append({'message': m})
            return {'choices': choices}
        except Exception:
            logging.exception('Failed to normalize OpenAI response')
            raise

    def stream(self, prompt, **kwargs):
        # Simplified: yield full response only (streaming requires client-side support)
        resp = self.generate(prompt, **kwargs)
        content = ''
        try:
            # resp is normalized dict
            for choice in resp.get('choices', []):
                msg = choice.get('message') or {}
                content += msg.get('content', '')
        except Exception:
            logging.exception('Failed to parse OpenAI response for streaming')
        yield content


class DummyProvider(AIProvider):
    def generate(self, prompt, **kwargs):
        return {'choices': [{'message': {'content': 'This is a dummy response for testing.'}}]}

    def stream(self, prompt, **kwargs):
        yield 'This is a dummy streamed response.'


def get_provider(name=None):
    name = name or os.environ.get('AI_PROVIDER', 'openai')
    name = name.lower() if isinstance(name, str) else name
    if name == 'openai':
        return OpenAIProvider()
    if name == 'gemini':
        return GeminiProvider()
    return DummyProvider()


class GeminiProvider(AIProvider):
    def __init__(self, api_key=None):
        try:
            import google.generativeai as genai
            self.genai = genai
        except Exception:
            self.genai = None
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY')
        if self.genai and self.api_key:
            try:
                # official SDK configuration
                self.genai.configure(api_key=self.api_key)
            except Exception:
                # some versions use a different configure method
                pass

    def generate(self, prompt, **kwargs):
        if not self.genai:
            raise RuntimeError('Gemini SDK (google.generativeai) not installed. Install with: pip install --upgrade google-generative-ai')
        if not self.api_key:
            raise RuntimeError('GEMINI_API_KEY not set in environment')

        # Build a simple prompt string from messages list
        try:
            if isinstance(prompt, list):
                parts = []
                for m in prompt:
                    role = m.get('role') if isinstance(m, dict) else getattr(m, 'role', 'user')
                    content = m.get('content') if isinstance(m, dict) else getattr(m, 'content', '')
                    parts.append(f"{role.upper()}: {content}")
                prompt_text = "\n".join(parts)
            else:
                prompt_text = str(prompt)

            model = kwargs.get('model') or os.environ.get('GEMINI_MODEL', 'gemini-pro')

            # Call the Gemini Chat/Generate API via the SDK
            # Use generate() for text-like responses; keep result normalization
            resp = self.genai.generate(model=model, prompt=prompt_text)

            # Normalize response to dict-like with choices -> message -> content
            # Different SDK versions have different shapes; try common access patterns
            text = ''
            # resp.output may contain text
            if hasattr(resp, 'text'):
                text = resp.text
            else:
                # try candidates or output
                out = getattr(resp, 'output', None) or getattr(resp, 'candidates', None) or resp
                # try to extract string
                if isinstance(out, list):
                    for o in out:
                        if isinstance(o, str):
                            text += o
                        elif isinstance(o, dict):
                            text += o.get('content', '') or o.get('text', '')
                        else:
                            text += str(o)
                elif isinstance(out, dict):
                    # try known keys
                    text = out.get('content') or out.get('text') or ''
                else:
                    text = str(out)

            return {'choices': [{'message': {'content': text}}]}
        except Exception as e:
            logging.exception('Gemini provider generate failed')
            raise

    def stream(self, prompt, **kwargs):
        # SDK streaming support is complex; return full text as single chunk
        resp = self.generate(prompt, **kwargs)
        content = ''
        for choice in resp.get('choices', []):
            content += choice.get('message', {}).get('content', '')
        yield content
