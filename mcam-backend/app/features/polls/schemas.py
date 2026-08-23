from pydantic import BaseModel


class CreatePoll(BaseModel):
    question: str
    options: list[str]
    anonymous: bool = False


class PollOut(BaseModel):
    id: str
    question: str
    options: list[str]
    anonymous: bool
    counts: list[int]
    total_votes: int
    closed: bool = False
