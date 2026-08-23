"""Live polls per session. Anonymous polls do not retain voter identity."""
from __future__ import annotations
import uuid
from dataclasses import dataclass, field

from app.core.errors import Conflict, NotFound
from app.features.polls.schemas import CreatePoll, PollOut


@dataclass
class _Poll:
    id: str
    question: str
    options: list[str]
    anonymous: bool
    counts: list[int]
    voters: set[str] = field(default_factory=set)   # empty when anonymous
    closed: bool = False


class PollStore:
    def __init__(self) -> None:
        self._by_session: dict[str, dict[str, _Poll]] = {}

    def create(self, session_id: str, req: CreatePoll) -> PollOut:
        if len(req.options) < 2:
            raise Conflict("A poll needs at least two options")
        poll = _Poll(
            id=str(uuid.uuid4()), question=req.question, options=list(req.options),
            anonymous=req.anonymous, counts=[0] * len(req.options),
        )
        self._by_session.setdefault(session_id, {})[poll.id] = poll
        return self._out(poll)

    def vote(self, session_id: str, poll_id: str, option_index: int, user_id: str) -> PollOut:
        poll = self._get(session_id, poll_id)
        if poll.closed:
            raise Conflict("Poll is closed")
        if not 0 <= option_index < len(poll.options):
            raise Conflict("Invalid option")
        if not poll.anonymous:
            if user_id in poll.voters:
                raise Conflict("Already voted")
            poll.voters.add(user_id)
        poll.counts[option_index] += 1
        return self._out(poll)

    def close(self, session_id: str, poll_id: str) -> PollOut:
        poll = self._get(session_id, poll_id)
        poll.closed = True
        return self._out(poll)

    def _get(self, session_id: str, poll_id: str) -> _Poll:
        poll = self._by_session.get(session_id, {}).get(poll_id)
        if poll is None:
            raise NotFound("Poll not found")
        return poll

    @staticmethod
    def _out(p: _Poll) -> PollOut:
        return PollOut(
            id=p.id, question=p.question, options=p.options, anonymous=p.anonymous,
            counts=p.counts, total_votes=sum(p.counts), closed=p.closed,
        )
