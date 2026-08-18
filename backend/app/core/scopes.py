from typing import Dict, List, TypedDict


class ScopeAction(TypedDict):
    id: str
    name: str
    description: str


class ScopeGroup(TypedDict):
    key: str
    name: str
    description: str
    actions: List[ScopeAction]


SYSTEM_SCOPES: Dict[str, ScopeGroup] = {
    "audit": {
        "key": "audit",
        "name": "Audit Logs",
        "description": "Security events and platform audit logs management.",
        "actions": [
            {
                "id": "audit:read",
                "name": "Read Audit Logs",
                "description": "Allows viewing security audit trails and log events.",
            },
            {
                "id": "audit:write",
                "name": "Write Audit Logs",
                "description": "Allows writing custom audit log entries and exporting audit data.",
            },
        ],
    },
}


def get_all_valid_scopes() -> List[str]:
    """
    """
    flat_scopes: List[str] = []
    for group in SYSTEM_SCOPES.values():
        for action in group["actions"]:
            flat_scopes.append(action["id"])
    return flat_scopes


def get_scopes_registry() -> Dict[str, ScopeGroup]:
    """
    """
    return SYSTEM_SCOPES
