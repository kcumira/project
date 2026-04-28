from fastapi import APIRouter
from app.controllers.home_controller import get_home_summary

router = APIRouter(prefix="/api/home", tags=["home"])

@router.get("/{user_id}/summary")
def home_summary(user_id: int):
    return get_home_summary(user_id)