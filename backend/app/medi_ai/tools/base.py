"""Tool primitive types. Tools are backend-controlled; the model never executes
them directly."""
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional


@dataclass
class ToolContext:
    user: Dict[str, Any]
    language: str = 'en'


@dataclass
class ToolResult:
    success: bool
    data: Any = None
    error_code: str = ''
    error_message: str = ''
    available: bool = True


@dataclass
class Tool:
    name: str
    description: str
    handler: Callable[[Dict[str, Any], ToolContext], ToolResult]
    required_roles: List[str] = field(default_factory=list)
    owner_only: bool = True  # operate strictly on the authenticated identity
    enabled: bool = True
    param_schema: Dict[str, Any] = field(default_factory=dict)

    def allows(self, role: str, is_owner: bool) -> bool:
        if is_owner:
            return True
        if not self.required_roles:
            return True
        return role in self.required_roles