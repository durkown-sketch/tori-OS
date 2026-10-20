"""
Transcription Service — Supabase Storage + Whisper abstraction.
"""

import os
import uuid
import logging
import tempfile
import mimetypes
from django.conf import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Handles file uploads and retrievals via Supabase Storage."""

    @staticmethod
    def _client():
        from supabase import create_client
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY
        if not url or not key:
            raise ValueError("Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
        return create_client(url, key)

    @staticmethod
    def upload_file(file_obj, user_id: str):
        """Upload a file to Supabase Storage. Returns (storage_path, public_url)."""
        client = StorageService._client()
        bucket = settings.SUPABASE_STORAGE_BUCKET
        ext = os.path.splitext(file_obj.name)[1] or '.audio'
        storage_path = f"{user_id}/{uuid.uuid4()}{ext}"
        mime_type = mimetypes.guess_type(file_obj.name)[0] or 'audio/mpeg'

        file_obj.seek(0)
        data = file_obj.read()

        client.storage.from_(bucket).upload(
            path=storage_path,
            file=data,
            file_options={"content-type": mime_type, "upsert": "false"}
        )

        signed = client.storage.from_(bucket).create_signed_url(storage_path, 3600)
        url = signed.get('signedURL') or signed.get('signedUrl') or ''
        return storage_path, url

    @staticmethod
    def get_signed_url(storage_path: str, expires_in: int = 3600) -> str:
        client = StorageService._client()
        bucket = settings.SUPABASE_STORAGE_BUCKET
        result = client.storage.from_(bucket).create_signed_url(storage_path, expires_in)
        return result.get('signedURL') or result.get('signedUrl') or ''

    @staticmethod
    def download_to_temp(storage_path: str) -> str:
        """Download a file from storage to a local temp file. Returns temp file path."""
        client = StorageService._client()
        bucket = settings.SUPABASE_STORAGE_BUCKET
        data = client.storage.from_(bucket).download(storage_path)
        ext = os.path.splitext(storage_path)[1] or '.audio'
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        tmp.write(data)
        tmp.flush()
        tmp.close()
        return tmp.name

    @staticmethod
    def delete_file(storage_path: str):
        client = StorageService._client()
        bucket = settings.SUPABASE_STORAGE_BUCKET
        client.storage.from_(bucket).remove([storage_path])


class TranscriptionService:
    """Transcribes audio using the configured provider (Whisper)."""

    @staticmethod
    def transcribe(meeting) -> tuple[str, list, str]:
        """
        Returns (full_text, segments, language).
        Downloads the audio from Supabase, sends to Whisper API.
        """
        if not meeting.audio_file_path:
            raise ValueError("Meeting has no audio file.")

        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set. Cannot transcribe.")

        temp_path = None
        try:
            temp_path = StorageService.download_to_temp(meeting.audio_file_path)
            from openai import OpenAI
            client = OpenAI(api_key=api_key)

            with open(temp_path, 'rb') as f:
                response = client.audio.transcriptions.create(
                    model=settings.WHISPER_MODEL,
                    file=f,
                    response_format='verbose_json',
                    timestamp_granularities=['segment'],
                )

            full_text = response.text or ''
            segments = []
            if hasattr(response, 'segments') and response.segments:
                for seg in response.segments:
                    segments.append({
                        'id': seg.id,
                        'start': seg.start,
                        'end': seg.end,
                        'text': seg.text.strip(),
                    })
            language = getattr(response, 'language', '') or ''
            return full_text, segments, language

        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
