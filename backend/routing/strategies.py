from typing import List


def simple_broadcast(selected: List[str]) -> List[str]:
    """Return the list unchanged (send prompt to all selected models)."""
    return selected


def domain_based(prompt: str, selected: List[str]) -> List[str]:
    """Example: if prompt looks like math/code, prefer certain providers.

    This is a stub for future advanced routing logic. For now, just return selected.
    """
    return selected


