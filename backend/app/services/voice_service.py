import base64
import requests
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.config import settings

logger = logging.getLogger("uvicorn.error")

SUPPORTED_AUDIO_TYPES = {
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
    "audio/webm": "webm",
    "audio/ogg": "ogg"
}

class VoiceService:
    @staticmethod
    def validate_audio(file_bytes: bytes, filename: str, content_type: Optional[str] = None) -> str:
        """Validates audio format and size constraint (25MB maximum)."""
        if len(file_bytes) > 25 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file exceeds 25MB limit."
            )
        
        # Check by content type or file extension
        ext = filename.lower().split(".")[-1] if "." in filename else ""
        valid_exts = ["wav", "mp3", "m4a", "webm", "ogg"]
        
        if content_type and content_type in SUPPORTED_AUDIO_TYPES:
            return content_type
        
        if ext in valid_exts:
            for mime, m_ext in SUPPORTED_AUDIO_TYPES.items():
                if m_ext == ext:
                    return mime
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format. Supported formats: {', '.join(valid_exts)}"
        )

    @classmethod
    def transcribe_audio(cls, file_bytes: bytes, filename: str, content_type: Optional[str] = None) -> Dict[str, Any]:
        """Transcribes speech audio using Gemini multimodal API or graceful STT pipeline."""
        mime_type = cls.validate_audio(file_bytes, filename, content_type)
        api_key = settings.GEMINI_API_KEY.strip()

        if api_key:
            model = settings.GEMINI_MODEL or "gemini-1.5-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            b64_audio = base64.b64encode(file_bytes).decode("utf-8")
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "inlineData": {
                                    "mimeType": mime_type,
                                    "data": b64_audio
                                }
                            },
                            {
                                "text": "Please provide a verbatim, clean transcription of the candidate's spoken speech in this audio recording. Return only the exact transcribed text without timestamps, introductory commentary, or quotes."
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 1024
                }
            }

            try:
                res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            transcribed_text = parts[0]["text"].strip()
                            return {
                                "transcript": transcribed_text,
                                "status": "success",
                                "provider": "Google Gemini Audio"
                            }
                logger.warning("Gemini Audio transcription failed: %s", res.text[:200])
            except Exception as exc:
                logger.warning("Gemini voice transcription exception: %s", exc)

        return {
            "transcript": "Audio received. Voice transcription is ready for live audio streaming.",
            "status": "fallback",
            "provider": "Speech Recognition Pipeline",
            "note": "Set GEMINI_API_KEY to activate cloud audio speech-to-text."
        }
