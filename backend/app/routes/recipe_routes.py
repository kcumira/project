"""
recipe_routes.py — Recipe 模組的 API 路由定義

端點說明：
  GET  /api/recipes/expiring/{user_id}     取得即期食材（3天內）
  POST /api/recipes/generate               AI 生成食譜
  GET  /api/recipes/recommended/{user_id}  推薦食譜列表
"""

from fastapi import APIRouter
from app.controllers.recipe_controller import (
    get_expiring_items,
    generate_recipe,
    get_recommended_recipes,
)
from app.schemas.recipe_schema import GenerateRecipeRequest

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.get("/expiring/{user_id}")
def expiring_items(user_id: int):
    """取得該使用者 3 天內即將到期的食材"""
    return get_expiring_items(user_id)


@router.post("/generate")
def generate(request: GenerateRecipeRequest):
    """根據使用者庫存與偏好，透過 AI 生成 1 份食譜"""
    return generate_recipe(request.userId, request.preference, request.selectedIngredients)


@router.get("/recommended/{user_id}")
def recommended(user_id: int):
    """根據使用者庫存，透過 AI 生成 2~3 份推薦食譜"""
    return get_recommended_recipes(user_id)
