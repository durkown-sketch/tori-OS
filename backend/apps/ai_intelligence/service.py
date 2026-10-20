"""
AI Intelligence Service
Provider-agnostic interface for generating meeting insights.
Supports: Google Gemini (primary), NVIDIA NIM (alternative)
"""

import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

INSIGHTS_SCHEMA = {
    "executive_summary": "string — 3-5 sentence summary of the meeting",
    "detailed_notes": "string — comprehensive paragraph-form meeting notes",
    "key_points": ["array of strings — main discussion points"],
    "decisions": ["array of strings — explicit decisions made"],
    "action_items": [
        {
            "task": "string — what needs to be done",
            "owner": "string or null — person responsible if mentioned",
            "deadline": "string or null — due date if mentioned",
            "priority": "high | medium | low"
        }
    ],
    "unresolved_questions": ["array of strings — questions that remain open"],
    "topics": ["array of strings — main topic keywords"]
}

SYSTEM_PROMPT = """You are an expert meeting analyst. Your task is to analyze meeting transcripts and produce structured, accurate insights.

Rules:
- Only report what is explicitly stated in the transcript. Do not invent facts.
- Use null for missing fields (owner, deadline) when not mentioned.
- Be concise and accurate.
- Return ONLY valid JSON matching the schema provided. No markdown, no code fences.
"""

USER_PROMPT_TEMPLATE = """Analyze the following meeting transcript and return a JSON object with exactly these fields:

Schema:
{schema}

Transcript:
{transcript}

Return only the JSON object."""


def _build_prompt(transcript: str) -> str:
    return USER_PROMPT_TEMPLATE.format(
        schema=json.dumps(INSIGHTS_SCHEMA, indent=2),
        transcript=transcript[:50000]  # guard against huge transcripts
    )


def _parse_insights(raw: str) -> dict:
    """Parse and validate the AI JSON response."""
    raw = raw.strip()
    # Strip markdown code fences if present
    if raw.startswith('```'):
        raw = raw.split('```')[1]
        if raw.startswith('json'):
            raw = raw[4:]
    data = json.loads(raw)
    return {
        'executive_summary': str(data.get('executive_summary', '')),
        'detailed_notes': str(data.get('detailed_notes', '')),
        'key_points': list(data.get('key_points', [])),
        'decisions': list(data.get('decisions', [])),
        'action_items': list(data.get('action_items', [])),
        'unresolved_questions': list(data.get('unresolved_questions', [])),
        'topics': list(data.get('topics', [])),
    }


class GeminiProvider:
    def generate(self, transcript: str) -> dict:
        import google.generativeai as genai
        key = settings.GEMINI_API_KEY
        if not key:
            raise ValueError("GEMINI_API_KEY not configured.")
        genai.configure(api_key=key)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        prompt = _build_prompt(transcript)
        response = model.generate_content(
            [SYSTEM_PROMPT, prompt],
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=4096,
            )
        )
        raw = response.text
        result = _parse_insights(raw)
        result['provider'] = 'gemini'
        result['model_used'] = settings.GEMINI_MODEL
        return result


class NvidiaProvider:
    def generate(self, transcript: str) -> dict:
        from openai import OpenAI
        key = settings.NVIDIA_API_KEY
        if not key:
            raise ValueError("NVIDIA_API_KEY not configured.")
        client = OpenAI(
            base_url=settings.NVIDIA_BASE_URL,
            api_key=key,
        )
        prompt = _build_prompt(transcript)
        response = client.chat.completions.create(
            model=settings.NVIDIA_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=4096,
        )
        raw = response.choices[0].message.content
        result = _parse_insights(raw)
        result['provider'] = 'nvidia'
        result['model_used'] = settings.NVIDIA_MODEL
        return result


class AIIntelligenceService:
    """Provider-independent interface. Selects provider from settings."""

    @staticmethod
    def generate_insights(transcript: str) -> dict:
        if not transcript.strip():
            raise ValueError("Empty transcript.")

        provider_name = settings.AI_PROVIDER.lower()

        if provider_name == 'gemini':
            provider = GeminiProvider()
        elif provider_name == 'nvidia':
            provider = NvidiaProvider()
        else:
            raise ValueError(f"Unknown AI provider: '{provider_name}'. Set AI_PROVIDER to 'gemini' or 'nvidia'.")

        logger.info(f"Generating insights with provider: {provider_name}")
        try:
            return provider.generate(transcript)
        except Exception as exc:
            logger.exception(f"AI provider '{provider_name}' failed: {exc}")
            raise
