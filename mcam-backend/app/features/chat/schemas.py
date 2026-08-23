from datetime import datetime
from pydantic import BaseModel


class ChatMessageOut(BaseModel):
    id: str
    user_id: str
    display_name: str
    body: str
    pinned: bool = False
    is_announcement: bool = False
    created_at: datetime
