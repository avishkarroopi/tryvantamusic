import pytest
from app.core.errors import Conflict
from app.features.polls.service import PollStore
from app.features.polls.schemas import CreatePoll


def test_vote_tally_and_double_vote_blocked():
    store = PollStore()
    poll = store.create("s1", CreatePoll(question="Ready?", options=["Yes", "No"]))
    store.vote("s1", poll.id, 0, "u1")
    res = store.vote("s1", poll.id, 0, "u2")
    assert res.counts == [2, 0] and res.total_votes == 2
    with pytest.raises(Conflict):
        store.vote("s1", poll.id, 1, "u1")               # u1 already voted


def test_anonymous_allows_repeat_identity_without_tracking():
    store = PollStore()
    poll = store.create("s1", CreatePoll(question="Q", options=["A", "B"], anonymous=True))
    store.vote("s1", poll.id, 0, "u1")
    res = store.vote("s1", poll.id, 1, "u1")             # no voter tracking when anonymous
    assert res.total_votes == 2
