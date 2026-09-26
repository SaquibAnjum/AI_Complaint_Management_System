"""AI Complaint Classification Service using Google Gemini API."""

import os
import json
import re
import logging
from app.utils.validators import ALLOWED_CATEGORIES, ALLOWED_PRIORITIES, ALLOWED_DEPARTMENTS

logger = logging.getLogger(__name__)

# Fallback defaults when AI is unavailable or fails
DEFAULT_FALLBACK = {
    "category": "Other",
    "priority": "MEDIUM",
    "department": "Administration",
    "summary": "Complaint submitted. Awaiting administrative review.",
    "reasoning": "Fallback classification used as AI service was unavailable or unconfigured.",
    "ai_status": "FAILED",
}


class AIService:
    """Service class for Gemini AI complaint analysis."""

    def __init__(self, api_key=None, model_name=None):
        self._api_key = api_key
        self._model_name = model_name
        self._client = None
        self._cached_key = None

    @property
    def api_key(self):
        return self._api_key or os.getenv("GEMINI_API_KEY", "").strip()

    @property
    def model_name(self):
        return self._model_name or os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()

    def _get_client(self):
        """Lazy initialization of Google GenAI client."""
        current_key = self.api_key
        if not current_key:
            return None
        if self._client is None or self._cached_key != current_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=current_key)
                self._cached_key = current_key
            except Exception as e:
                logger.error(f"Failed to initialize google-genai Client: {e}")
                self._client = None
        return self._client

    def analyze_complaint(self, title: str, description: str) -> dict:
        """Analyze complaint content and return structured classification suggestion.
        
        Guaranteed to return valid dictionary with keys:
        - category
        - priority
        - department
        - summary
        - reasoning
        - ai_status ('SUCCESS' or 'FAILED')
        """
        # Quick fallback if no API key is set
        if not self.api_key:
            fallback = DEFAULT_FALLBACK.copy()
            fallback["summary"] = (description[:120] + "...") if len(description) > 120 else description
            fallback["reasoning"] = "No GEMINI_API_KEY configured. Fallback defaults applied."
            return fallback

        client = self._get_client()
        if not client:
            fallback = DEFAULT_FALLBACK.copy()
            fallback["summary"] = (description[:120] + "...") if len(description) > 120 else description
            return fallback

        prompt = f"""
You are an expert AI complaint classification assistant for an institutional complaint management system.
Analyze the following user complaint and classify it strictly according to the guidelines below.

[USER COMPLAINT]
Title: {title}
Description: {description}

[ALLOWED OPTIONS]
Allowed Categories: {json.dumps(ALLOWED_CATEGORIES)}
Allowed Priorities: {json.dumps(ALLOWED_PRIORITIES)}
Allowed Departments: {json.dumps(ALLOWED_DEPARTMENTS)}

[INSTRUCTIONS]
1. Select the single best matching "category" from the Allowed Categories list.
2. Assign a "priority" from Allowed Priorities (LOW, MEDIUM, HIGH, CRITICAL). Use CRITICAL only for safety, water/power outages, or severe security hazards.
3. Select the single most relevant "department" from Allowed Departments.
4. Provide a concise 1-sentence "summary" capturing the core grievance.
5. Provide a short 1-sentence "reasoning" explaining why this classification was chosen.
6. Return ONLY a valid, raw JSON object. Do not include markdown codeblocks or extra text.

[JSON OUTPUT FORMAT]
{{
  "category": "Hostel",
  "priority": "HIGH",
  "department": "Maintenance",
  "summary": "Water supply issue reported in hostel wing B.",
  "reasoning": "Urgent utility shortage affecting resident students."
}}
"""

        try:
            candidates = [self.model_name]
            for fb in ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]:
                if fb not in candidates:
                    candidates.append(fb)

            response = None
            last_err = None
            for model_id in candidates:
                try:
                    response = client.models.generate_content(
                        model=model_id,
                        contents=prompt,
                    )
                    if response:
                        break
                except Exception as m_err:
                    last_err = m_err
                    logger.warning(f"Model {model_id} failed: {m_err}")
                    continue

            if not response:
                raise last_err or RuntimeError("No response from Gemini API models")

            response_text = response.text if hasattr(response, "text") else str(response)
            parsed = self._clean_and_parse_json(response_text)

            # Validate extracted fields against allowed values
            category = parsed.get("category", "").strip()
            priority = parsed.get("priority", "").strip().upper()
            department = parsed.get("department", "").strip()
            summary = parsed.get("summary", "").strip()
            reasoning = parsed.get("reasoning", "").strip()

            if category not in ALLOWED_CATEGORIES:
                category = "Other"
            if priority not in ALLOWED_PRIORITIES:
                priority = "MEDIUM"
            if department not in ALLOWED_DEPARTMENTS:
                department = "Administration"
            if not summary:
                summary = (description[:120] + "...") if len(description) > 120 else description

            return {
                "category": category,
                "priority": priority,
                "department": department,
                "summary": summary,
                "reasoning": reasoning or "Classified by Gemini AI.",
                "ai_status": "SUCCESS",
            }

        except Exception as err:
            logger.warning(f"Gemini AI classification encountered an error: {err}")
            fallback = DEFAULT_FALLBACK.copy()
            fallback["summary"] = (description[:120] + "...") if len(description) > 120 else description
            fallback["reasoning"] = f"AI classification error: {str(err)[:100]}"
            return fallback

    def _clean_and_parse_json(self, text: str) -> dict:
        """Extract and parse JSON object from text with regex fallback."""
        if not text:
            raise ValueError("Empty response from AI")

        # Strip potential markdown formatting
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Try to locate the first {...} block using regex
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            raise ValueError(f"Could not parse valid JSON from AI response: {text[:100]}")


# Global singleton service instance
ai_service = AIService()
