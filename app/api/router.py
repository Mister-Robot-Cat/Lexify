from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.ielts import router as ielts_router
from app.api.quiz import router as quiz_router
from app.api.shadowing import router as shadowing_router
from app.api.topics import router as topics_router
from app.api.users import router as users_router
from app.api.words import router as words_router

api_router = APIRouter()

# Register all web platform sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(words_router, prefix="/words", tags=["words"])
api_router.include_router(quiz_router, prefix="/quiz", tags=["quiz"])
api_router.include_router(chat_router, prefix="/chat", tags=["tutor"])
api_router.include_router(ielts_router, prefix="/ielts", tags=["ielts"])
api_router.include_router(topics_router, prefix="/topics", tags=["topics"])
api_router.include_router(shadowing_router, prefix="/shadowing", tags=["shadowing"])
