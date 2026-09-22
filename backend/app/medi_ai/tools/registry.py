"""Registry of controlled Medi-AI tools.

The LLM only ever *requests* a tool by name. The backend validates role,
ownership, requested operation, and input before executing anything.
"""
import logging
from typing import Dict, Optional

from ..errors import (
    AppwriteUnavailableError,
    ForbiddenError,
    MediAIError,
    ToolAuthorizationError,
)
from .base import Tool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Tool] = {}

    def register(self, tool: Tool):
        self._tools[tool.name] = tool

    def list_tools(self) -> list:
        return [
            {
                'name': tool.name,
                'description': tool.description,
                'enabled': tool.enabled,
                'param_schema': tool.param_schema,
                'required_roles': tool.required_roles,
            }
            for tool in sorted(self._tools.values(), key=lambda t: t.name)
        ]

    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def execute(
        self,
        name: str,
        params: Dict,
        context: ToolContext,
    ) -> ToolResult:
        tool = self._tools.get(name)
        if not tool:
            return ToolResult(
                success=False, error_code='unknown_tool',
                error_message='Unknown tool.', available=True,
            )
        if not tool.enabled:
            return ToolResult(
                success=False, error_code='not_available',
                error_message='This feature is not available yet.', available=False,
            )
        role = context.user.get('role', '')
        is_owner = bool(context.user.get('is_owner'))
        if not tool.allows(role, is_owner):
            raise ToolAuthorizationError()

        try:
            return tool.handler(params or {}, context)
        except (ToolAuthorizationError, ForbiddenError) as exc:
            raise exc
        except MediAIError as exc:
            raise exc
        except Exception:
            logger.exception('Tool %s execution failed', name)
            raise AppwriteUnavailableError()


_REGISTRY = None


def create_default_registry() -> ToolRegistry:
    global _REGISTRY
    if _REGISTRY is not None:
        return _REGISTRY
    from . import backend_tools  # noqa: F401  (registers DEFAULT_TOOLS)
    registry = ToolRegistry()
    for tool in backend_tools.DEFAULT_TOOLS:
        registry.register(tool)
    _REGISTRY = registry
    return registry