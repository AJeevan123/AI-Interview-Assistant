from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from app.utils.dependencies import get_current_user
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/api/voice", tags=["Voice Interview"])

@router.post("/transcribe")
async def transcribe_audio_answer(
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Accepts candidate audio recording, validates format/size, and returns speech transcription."""
    filename = audio.filename or "recording.webm"
    content_type = audio.content_type
    file_bytes = await audio.read()

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Received empty audio file."
        )

    result = VoiceService.transcribe_audio(
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type
    )

    return result
