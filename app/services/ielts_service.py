import logging
import re

from groq import AsyncGroq
from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

from app.config import settings

logger = logging.getLogger(__name__)

IELTS_WRITING_PROMPT = """<persona>
You are an IELTS examiner with expertise in academic writing assessment. Function: evaluate student writing against official IELTS Task 2 criteria.
</persona>

<student_submission>
{text}
</student_submission>

<evaluation_criteria>
### Task Response (TR)
Assess: Does the response fully address all parts of the prompt? Is there a clear position? Are ideas developed with supporting evidence?

### Coherence and Cohesion (CC)  
Assess: Is the writing logically organized? Are paragraphs well-structured? Are linking devices used appropriately?

### Lexical Resource (LR)
Assess: Is vocabulary range wide and accurate? Are collocations natural? Are there spelling errors?

### Grammatical Range and Accuracy (GRA)
Assess: Is there variety in sentence structures? Are complex sentences used correctly? Are there grammar errors?
</evaluation_criteria>

<output_schema>
Return EXACTLY this structure (no markdown, no extra text, strict adherence to field names and format):

Task Response: <score>/9
Strengths: <specific positive aspects>
Weaknesses: <areas needing improvement>
Suggestions: <actionable recommendations>

Coherence and Cohesion: <score>/9
Strengths: <specific positive aspects>
Weaknesses: <areas needing improvement>
Suggestions: <actionable recommendations>

Lexical Resource: <score>/9
Strengths: <specific positive aspects>
Weaknesses: <areas needing improvement>
Suggestions: <actionable recommendations>

Grammatical Range and Accuracy: <score>/9
Strengths: <specific positive aspects>
Weaknesses: <areas needing improvement>
Suggestions: <actionable recommendations>

Overall Band Score: <score>/9
Overall Feedback: <2-3 sentence summary of performance and key improvement areas>
</output_schema>

<scoring_guidelines>
- Scores must be in 0.5 increments (e.g., 6.0, 6.5, 7.0)
- Each criterion score should reflect independent assessment
- Overall Band Score: average of 4 criteria, rounded to nearest 0.5
</scoring_guidelines>

<edge_cases>
- Text under 150 words: Evaluate normally but note: "Warning: Below recommended word count"
- Text that does not address any task: Score TR as 3.0 or below
- Non-essay content (lists, gibberish): Score all criteria as 1.0-2.0 with explanation
</edge_cases>"""

class IELTSCriteria(BaseModel):
    """Individual IELTS writing criterion evaluation."""

    model_config = {"frozen": True}

    name: str = Field(description="Criterion name (TR, CC, LR, GRA)")
    score: float = Field(ge=0.0, le=9.0, description="Band score 0-9")
    strengths: str = Field(min_length=1, default="Not specified", description="Positive aspects")
    weaknesses: str = Field(min_length=1, default="Not specified", description="Areas for improvement")
    suggestions: str = Field(min_length=1, default="Not specified", description="Actionable recommendations")

    @field_validator("score")
    @classmethod
    def validate_band_score(cls, v: float) -> float:
        """Ensure score is in 0.5 increments."""
        # Round to nearest 0.5
        rounded = round(v * 2) / 2
        return min(max(rounded, 0.0), 9.0)


class IELTSWritingEvaluation(BaseModel):
    """Complete IELTS writing evaluation with full validation."""

    model_config = {"frozen": True}

    task_response: IELTSCriteria = Field(description="Task Response evaluation")
    coherence_cohesion: IELTSCriteria = Field(description="Coherence and Cohesion evaluation")
    lexical_resource: IELTSCriteria = Field(description="Lexical Resource evaluation")
    grammatical_range: IELTSCriteria = Field(description="Grammatical Range and Accuracy evaluation")
    overall_score: float = Field(ge=0.0, le=9.0, description="Overall Band Score 0-9")
    overall_feedback: str = Field(min_length=1, description="Summary feedback")

    @field_validator("overall_score")
    @classmethod
    def validate_overall_score(cls, v: float) -> float:
        """Ensure overall score is in 0.5 increments."""
        rounded = round(v * 2) / 2
        return min(max(rounded, 0.0), 9.0)

    @model_validator(mode="after")
    def check_overall_consistency(self):
        """Warn if overall score deviates significantly from average of criteria."""
        criteria_scores = [
            self.task_response.score,
            self.coherence_cohesion.score,
            self.lexical_resource.score,
            self.grammatical_range.score,
        ]
        avg_score = sum(criteria_scores) / 4
        # Allow 1.0 point deviation (generous for IELTS scoring)
        if abs(self.overall_score - avg_score) > 1.0:
            logging.warning(
                "IELTS overall score (%.1f) deviates significantly from criteria average (%.1f)",
                self.overall_score,
                avg_score,
            )
        return self

class IELTSService:
    """Service for IELTS writing evaluation using Groq AI."""

    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model
        logger.info("IELTSService initialized with model: %s", self._model)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def evaluate_writing(self, text: str) -> IELTSWritingEvaluation:
        """Evaluate writing text according to IELTS criteria.

        Args:
            text: The writing text to evaluate (minimum 150 words recommended)

        Returns:
            IELTSWritingEvaluation with detailed feedback for each criterion.

        Raises:
            ValueError: If the response cannot be parsed.
            Exception: On API communication errors.
        """
        if len(text.strip()) < 50:
            raise ValueError("Text too short for meaningful evaluation (minimum 50 characters)")
            
        prompt = IELTS_WRITING_PROMPT.format(text=text)
        logger.debug("Sending IELTS evaluation prompt for text length: %d", len(text))

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024,
            )
            raw_text = response.choices[0].message.content.strip()
            logger.debug("IELTS evaluation raw response length: %d", len(raw_text))
            
            if not raw_text:
                raise ValueError("Empty response from IELTS evaluation API")
                
            return self._parse_evaluation(raw_text)
        except Exception as e:
            logger.exception("IELTS evaluation API call failed: %s", str(e))
            raise ValueError(f"Failed to evaluate text: {str(e)}")

    @staticmethod
    def _parse_criterion_data(criterion_name: str, text: str) -> dict:
        """Extract criterion data from LLM response for Pydantic validation."""
        # Extract score with flexible patterns
        score_patterns = [
            rf"{criterion_name}: (\d+\.?\d*)/9",
            rf"{criterion_name}:\s*(\d+\.?\d*)/9",
            rf"{re.escape(criterion_name)}:\s*(\d+\.?\d*)/9"
        ]

        score = 0.0
        for pattern in score_patterns:
            score_match = re.search(pattern, text, re.IGNORECASE)
            if score_match:
                try:
                    score = float(score_match.group(1))
                    break
                except ValueError:
                    continue

        # Extract sections with robust patterns
        sections = ["Strengths:", "Weaknesses:", "Suggestions:"]
        parsed = {}

        for i, section in enumerate(sections):
            if i < len(sections) - 1:
                next_section = sections[i + 1]
                pattern = rf"{section}\s*(.*?)(?=\n\s*{next_section}|\Z)"
            else:
                pattern = rf"{section}\s*(.*)"

            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                content = match.group(1).strip()
                # Clean up formatting issues
                content = re.sub(r'\n+', ' ', content)
                content = re.sub(r'\s+', ' ', content)
                parsed[section.replace(":", "").lower()] = content
            else:
                parsed[section.replace(":", "").lower()] = "Not specified"

        return {
            "name": criterion_name,
            "score": score,
            "strengths": parsed.get("strengths", "Not specified"),
            "weaknesses": parsed.get("weaknesses", "Not specified"),
            "suggestions": parsed.get("suggestions", "Not specified"),
        }

    def _parse_evaluation(self, text: str) -> IELTSWritingEvaluation:
        """Parse the IELTS evaluation response from Groq with Pydantic validation."""
        # Parse all criteria
        try:
            tr_data = self._parse_criterion_data("Task Response", text)
            cc_data = self._parse_criterion_data("Coherence and Cohesion", text)
            lr_data = self._parse_criterion_data("Lexical Resource", text)
            gra_data = self._parse_criterion_data("Grammatical Range and Accuracy", text)
        except Exception as e:
            logger.warning("Error parsing IELTS criteria data: %s", e)
            # Return fallback with defaults
            default_data = {
                "name": "Unknown",
                "score": 0.0,
                "strengths": "Parse error",
                "weaknesses": "Parse error",
                "suggestions": "Parse error",
            }
            try:
                return IELTSWritingEvaluation.model_validate({
                    "task_response": default_data,
                    "coherence_cohesion": default_data,
                    "lexical_resource": default_data,
                    "grammatical_range": default_data,
                    "overall_score": 0.0,
                    "overall_feedback": "Failed to parse evaluation response",
                })
            except ValidationError as ve:
                logger.error("Fallback validation failed: %s", ve)
                raise ValueError(f"Cannot parse IELTS response: {ve}") from ve

        # Extract overall score and feedback
        overall_patterns = [
            r"Overall Band Score: (\d+\.?\d*)/9",
            r"Overall Band Score:\s*(\d+\.?\d*)/9",
            r"Overall:\s*(\d+\.?\d*)/9"
        ]

        overall_score = 0.0
        for pattern in overall_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    overall_score = float(match.group(1))
                    break
                except ValueError:
                    continue

        feedback_patterns = [
            r"Overall Feedback: (.*)",
            r"Overall Feedback:\s*(.*)",
            r"Overall:\s*(.*)"
        ]

        overall_feedback = "No overall feedback provided"
        for pattern in feedback_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                overall_feedback = match.group(1).strip()
                break

        # Build data dict for Pydantic validation
        data = {
            "task_response": tr_data,
            "coherence_cohesion": cc_data,
            "lexical_resource": lr_data,
            "grammatical_range": gra_data,
            "overall_score": overall_score,
            "overall_feedback": overall_feedback,
        }

        try:
            validated = IELTSWritingEvaluation.model_validate(data)
            return validated
        except ValidationError as e:
            logger.error(
                "IELTS evaluation validation failed: %s. Data: %s",
                e,
                data,
            )
            raise ValueError(f"Invalid IELTS response format: {e}") from e

# Module-level singleton
ielts_service = IELTSService()
