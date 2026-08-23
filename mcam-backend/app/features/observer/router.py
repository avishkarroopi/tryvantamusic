from fastapi import APIRouter, HTTPException
from app.core.container import container
from app.core.deps import CurrentUser
from app.features.observer.analytics import ObservationInput, TalkSegment
from app.features.observer.schemas import ObservationIn, ReportOut, TrendOut

router = APIRouter(prefix="/v1/observer", tags=["observer"])


@router.post("/sessions/{session_id}/ingest", response_model=ReportOut)
async def ingest(session_id: str, obs: ObservationIn, user: dict = CurrentUser):
    inp = ObservationInput(
        duration_seconds=obs.duration_seconds,
        segments=[TalkSegment(role=s.role, seconds=s.seconds) for s in obs.segments],
        questions=obs.questions, student_responses=obs.student_responses,
        repeated_mistakes=obs.repeated_mistakes, audio_quality=obs.audio_quality,
        network_quality=obs.network_quality, planned_objectives=obs.planned_objectives,
        completed_objectives=obs.completed_objectives)
    return container.observer.ingest(session_id, inp)


@router.get("/sessions/{session_id}/report", response_model=ReportOut)
async def report(session_id: str, user: dict = CurrentUser):
    r = container.observer.last_report(session_id)
    if r is None:
        raise HTTPException(status_code=404, detail="No report yet for this session")
    return r


@router.get("/students/{student_key}/trend", response_model=TrendOut)
async def trend(student_key: str, user: dict = CurrentUser):
    return container.observer.trend(student_key).__dict__
