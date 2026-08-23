from fastapi import APIRouter
from app.core.deps import CurrentUser
from app.features.audio.schemas import AssessmentOut, InstrumentProfileOut, MetricsIn
from app.features.audio.service import AudioService

router = APIRouter(prefix="/v1/audio", tags=["audio"])
_svc = AudioService()


@router.get("/instruments", response_model=list[str])
async def instruments(user: dict = CurrentUser):
    return _svc.instruments()


@router.get("/profiles/{instrument}", response_model=InstrumentProfileOut)
async def profile(instrument: str, user: dict = CurrentUser):
    return _svc.profile(instrument)


@router.post("/assess", response_model=AssessmentOut)
async def assess_audio(metrics: MetricsIn, user: dict = CurrentUser):
    return _svc.assess(metrics)
