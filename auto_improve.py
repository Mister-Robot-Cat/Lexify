#!/usr/bin/env python3
"""
Autonomous project improvement agent.
Runs 2-3 times daily to make minor code improvements.
"""
import os
import sys
import random
import logging
import subprocess
from datetime import datetime
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.groq_service import groq_service

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')
logger = logging.getLogger(__name__)

# Improvement categories with weights (higher = more common)
IMPROVEMENT_TYPES = [
    ("refactor", 30, "Minor refactoring: better variable names, extract helper functions, DRY improvements"),
    ("docs", 25, "Documentation: improve docstrings, add comments to complex logic, update README"),
    ("error_handling", 20, "Error handling: add try/except blocks, improve error messages, add logging"),
    ("performance", 15, "Performance: optimize slow operations, reduce API calls, caching improvements"),
    ("style", 10, "Code style: consistent formatting, type hints, f-strings instead of concatenation"),
]


def get_random_file() -> Path | None:
    """Get a random Python file from the project (excluding venv, __pycache__)."""
    project_root = Path(__file__).parent
    py_files = []
    
    for pattern in ["app/**/*.py", "web/**/*.py", "*.py"]:
        py_files.extend(project_root.glob(pattern))
    
    # Filter out unwanted files
    py_files = [
        f for f in py_files 
        if "__pycache__" not in str(f) 
        and ".venv" not in str(f)
        and "test" not in f.name.lower()
        and f.name != "auto_improve.py"  # Don't modify self
        and f.stat().st_size < 50000  # Skip huge files
    ]
    
    return random.choice(py_files) if py_files else None


def analyze_code(file_path: Path) -> str:
    """Read file and identify improvement opportunities."""
    content = file_path.read_text(encoding='utf-8')
    
    issues = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        if len(line) > 100 and not line.strip().startswith('#'):
            issues.append(f"Line {i}: Long line ({len(line)} chars)")
        if 'TODO' in line.upper() or 'FIXME' in line.upper():
            issues.append(f"Line {i}: Has TODO/FIXME comment")
        if 'except:' in line and 'except Exception' not in line:
            issues.append(f"Line {i}: Bare except clause")
        if ' % ' in line and '"' in line:  # Old-style string formatting
            issues.append(f"Line {i}: Uses old % formatting, consider f-strings")
    
    return '\n'.join(issues[:5])  # Top 5 issues


def generate_improvement(file_path: Path, code: str, issues: str, improvement_type: str) -> str | None:
    """Ask AI to generate improvement."""
    
    prompt = f"""You are a careful code improvement agent. Make ONE small, safe improvement to this Python code.

File: {file_path.name}
Improvement type: {improvement_type}

Current code issues spotted:
{issues if issues else "None obvious - look for minor improvements like better naming, docstrings, or formatting"}

CODE:
```python
{code}
```

Rules:
1. Make ONLY minor, safe changes (don't break functionality)
2. Prefer: better variable names, added docstrings, type hints, f-strings, early returns
3. NEVER: change logic significantly, remove features, or modify database schemas
4. Keep the same file structure and imports
5. Respond with ONLY the improved code, no explanations, no markdown backticks

IMPROVED CODE:"""

    try:
        response = groq_service.client.chat.completions.create(
            model=groq_service.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4000,
            temperature=0.3,  # Low creativity for safety
        )
        improved = response.choices[0].message.content.strip()
        
        # Clean up response
        if improved.startswith('```python'):
            improved = improved[9:]
        if improved.startswith('```'):
            improved = improved[3:]
        if improved.endswith('```'):
            improved = improved[:-3]
        
        return improved.strip()
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        return None


def verify_syntax(code: str) -> bool:
    """Check if code is valid Python."""
    try:
        compile(code, '<string>', 'exec')
        return True
    except SyntaxError as e:
        logger.error(f"Syntax error in generated code: {e}")
        return False


def git_commit_and_push(file_path: Path, improvement_type: str) -> bool:
    """Stage, commit and push changes."""
    try:
        # Configure git if needed
        subprocess.run(['git', 'config', 'user.email'], capture_output=True, check=False)
        
        # Stage
        subprocess.run(['git', 'add', str(file_path)], check=True, capture_output=True)
        
        # Check if there are changes
        result = subprocess.run(['git', 'diff', '--cached', '--quiet'], capture_output=True)
        if result.returncode == 0:
            logger.info("No changes to commit")
            return False
        
        # Commit
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        commit_msg = f"[{improvement_type}] {file_path.name} - auto improvement ({timestamp})"
        subprocess.run(['git', 'commit', '-m', commit_msg], check=True, capture_output=True)
        
        # Push
        subprocess.run(['git', 'push'], check=True, capture_output=True)
        
        logger.info(f"✅ Successfully committed and pushed: {commit_msg}")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Git operation failed: {e}")
        return False


def main():
    """Main automation loop."""
    logger.info("🤖 Starting auto-improvement agent...")
    
    # Randomly decide if we should run (2-3 times per day = ~10-15% chance per hour)
    # Or use: if datetime.now().hour in [9, 15, 21] for specific times
    if random.random() > 0.3:  # 70% chance to skip
        logger.info("⏭️ Skipping this run (random throttle)")
        return
    
    # Select improvement type
    weights = [w for _, w, _ in IMPROVEMENT_TYPES]
    improvement_type = random.choices(IMPROVEMENT_TYPES, weights=weights)[0][0]
    improvement_desc = [d for t, _, d in IMPROVEMENT_TYPES if t == improvement_type][0]
    
    logger.info(f"Selected improvement type: {improvement_type} - {improvement_desc}")
    
    # Get target file
    target_file = get_random_file()
    if not target_file:
        logger.error("No suitable files found")
        return
    
    logger.info(f"Target file: {target_file}")
    
    # Read and analyze
    original_code = target_file.read_text(encoding='utf-8')
    issues = analyze_code(target_file)
    
    # Generate improvement
    logger.info("Generating improvement via AI...")
    improved_code = generate_improvement(target_file, original_code, issues, improvement_type)
    
    if not improved_code:
        logger.error("Failed to generate improvement")
        return
    
    # Verify safety
    if not verify_syntax(improved_code):
        logger.error("Generated code has syntax errors, aborting")
        return
    
    # Check for major changes (safety)
    original_lines = len(original_code.splitlines())
    new_lines = len(improved_code.splitlines())
    if abs(original_lines - new_lines) > 20:  # More than 20 lines changed
        logger.warning(f"Too many lines changed ({original_lines} -> {new_lines}), aborting for safety")
        return
    
    # Apply changes
    target_file.write_text(improved_code, encoding='utf-8')
    logger.info(f"Applied changes to {target_file}")
    
    # Git operations
    if git_commit_and_push(target_file, improvement_type):
        logger.info("🎉 Auto-improvement complete!")
    else:
        # Revert if git failed
        target_file.write_text(original_code, encoding='utf-8')
        logger.info("Reverted changes due to git failure")


if __name__ == "__main__":
    main()
