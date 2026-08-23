"""Private/shared markdown notes with autosave (client PUTs on a debounce)."""
from __future__ import annotations
from app.features.notes.models import Note
from app.features.notes.repository import NoteRepository
from app.features.notes.schemas import NoteOut, SaveNote


def _out(n: Note) -> NoteOut:
    return NoteOut(id=str(n.id), session_id=n.session_id, owner_id=n.owner_id,
                   visibility=n.visibility, body_md=n.body_md, updated_at=n.updated_at)


class NotesService:
    def __init__(self, repo: NoteRepository) -> None:
        self._repo = repo

    async def save(self, session_id: str, req: SaveNote, user: dict) -> NoteOut:
        note = await self._repo.get(session_id, user["user_id"])
        if note is None:
            note = Note(session_id=session_id, owner_id=user["user_id"])
        note.body_md = req.body_md
        note.visibility = req.visibility.value
        return _out(await self._repo.upsert(note))

    async def mine(self, session_id: str, user: dict) -> NoteOut | None:
        note = await self._repo.get(session_id, user["user_id"])
        return _out(note) if note else None

    async def shared(self, session_id: str) -> list[NoteOut]:
        return [_out(n) for n in await self._repo.shared_for(session_id)]
