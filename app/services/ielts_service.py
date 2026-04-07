import logging
import re
from dataclasses import dataclass

from groq import AsyncGroq

from app.config import settings

logger = logging.getLogger(__name__)

IELTS_WRITING_PROMPT = """You are an IELTS examiner. Analyze the following text according to IELTS Writing Task 2 criteria.

Student's text:
"{text}"

Evaluate and provide feedback for each criterion:

1. Task Response (TR): How well did the candidate address all parts of the task?
2. Coherence and Cohesion (CC): How well organized and connected is the writing?
3. Lexical Resource (LR): How good is the vocabulary range and accuracy?
4. Grammatical Range and Accuracy (GRA): How good is the grammar range and accuracy?

For each criterion provide:
- Score (0-9 band scale)
- Strengths
- Weaknesses
- Specific suggestions for improvement

Return STRICTLY in this format:

Task Response: <score>/9
Strengths: <list of strengths>
Weaknesses: <list of weaknesses>
Suggestions: <specific improvement suggestions>

Coherence and Cohesion: <score>/9
Strengths: <list of strengths>
Weaknesses: <list of weaknesses>
Suggestions: <specific improvement suggestions>

Lexical Resource: <score>/9
Strengths: <list of strengths>
Weaknesses: <list of weaknesses>
Suggestions: <specific improvement suggestions>

Grammatical Range and Accuracy: <score>/9
Strengths: <list of strengths>
Weaknesses: <list of weaknesses>
Suggestions: <specific improvement suggestions>

Overall Band Score: <average score>/9
Overall Feedback: <summary feedback>"""

@dataclass(frozen=True)
class IELTSCriteria:
    """Individual IELTS writing criterion evaluation."""
    name: str
    score: float
    strengths: str
    weaknesses: str
    suggestions: str

@dataclass(frozen=True)
class IELTSWritingEvaluation:
    """Complete IELTS writing evaluation."""
    task_response: IELTSCriteria
    coherence_cohesion: IELTSCriteria
    lexical_resource: IELTSCriteria
    grammatical_range: IELTSCriteria
    overall_score: float
    overall_feedback: str

class IELTSService:
    """Service for IELTS writing evaluation using Groq AI."""

    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model
        logger.info("IELTSService initialized with model: %s", self._model)

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
    def _parse_evaluation(text: str) -> IELTSWritingEvaluation:
        """Parse the IELTS evaluation response from Groq."""
        def parse_criterion(criterion_name: str, text: str) -> IELTSCriteria:
            # Extract score with more flexible pattern
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
            
            # Extract sections with more robust patterns
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
                    # Clean up common formatting issues
                    content = re.sub(r'\n+', ' ', content)  # Replace newlines with spaces
                    content = re.sub(r'\s+', ' ', content)  # Normalize whitespace
                    parsed[section.replace(":", "").lower()] = content
                else:
                    parsed[section.replace(":", "").lower()] = "Not specified"
            
            return IELTSCriteria(
                name=criterion_name,
                score=min(max(score, 0.0), 9.0),  # Clamp score between 0-9
                strengths=parsed.get("strengths", "Not specified"),
                weaknesses=parsed.get("weaknesses", "Not specified"),
                suggestions=parsed.get("suggestions", "Not specified")
            )
        
        # Parse all criteria with error handling
        try:
            task_response = parse_criterion("Task Response", text)
            coherence_cohesion = parse_criterion("Coherence and Cohesion", text)
            lexical_resource = parse_criterion("Lexical Resource", text)
            grammatical_range = parse_criterion("Grammatical Range and Accuracy", text)
        except Exception as e:
            logger.warning("Error parsing IELTS criteria: %s", e)
            # Return default values if parsing fails
            default_criteria = IELTSCriteria("Unknown", 0.0, "Parse error", "Parse error", "Parse error")
            return IELTSWritingEvaluation(
                task_response=default_criteria,
                coherence_cohesion=default_criteria,
                lexical_resource=default_criteria,
                grammatical_range=default_criteria,
                overall_score=0.0,
                overall_feedback="Failed to parse evaluation response"
            )
        
        # Extract overall score and feedback with fallbacks
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
        
        return IELTSWritingEvaluation(
            task_response=task_response,
            coherence_cohesion=coherence_cohesion,
            lexical_resource=lexical_resource,
            grammatical_range=grammatical_range,
            overall_score=min(max(overall_score, 0.0), 9.0),  # Clamp between 0-9
            overall_feedback=overall_feedback
        )

# Module-level singleton
ielts_service = IELTSService()
