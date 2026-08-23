"""Pure scene-ordering + duplication helpers (no framework deps)."""
from __future__ import annotations


def reindex(order: list[str], scene_id: str, new_index: int) -> list[str]:
    """Move scene_id to new_index, return the new ordered id list."""
    if scene_id not in order:
        return order
    items = [s for s in order if s != scene_id]
    new_index = max(0, min(new_index, len(items)))
    items.insert(new_index, scene_id)
    return items


def copy_name(name: str, existing: set[str]) -> str:
    """Produce a unique '(copy)' name that doesn't collide."""
    base = f"{name} (copy)"
    if base not in existing:
        return base
    i = 2
    while f"{base} {i}" in existing:
        i += 1
    return f"{base} {i}"
