from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.database.models import User

router = APIRouter()

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "telegram_id": current_user.telegram_id,
        "language": current_user.language,
        "ui_language": current_user.ui_language,
        "learning_language": current_user.learning_language
    }
