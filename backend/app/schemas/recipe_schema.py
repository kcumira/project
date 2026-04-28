"""
recipe_schema.py — Recipe 模組的 Pydantic 資料驗證

定義前後端資料傳輸的型別：
  - ExpiringItemResponse: 即期食材回傳格式
  - GenerateRecipeRequest: AI 食譜生成的請求 Body
  - RecipeResponse:        單筆食譜的回傳格式（與前端 UI 欄位一致）
  - RecommendedRecipesResponse: 推薦食譜列表回傳
"""

from pydantic import BaseModel
from typing import Optional, List


class ExpiringItemResponse(BaseModel):
    """即期食材回傳格式，對應前端橫向列表的卡片"""
    inventoryId: int
    name: str
    imageUrl: Optional[str] = None
    daysLeft: int
    quantity: Optional[float] = None
    unit: Optional[str] = None


class GenerateRecipeRequest(BaseModel):
    """AI 食譜生成請求的 Body"""
    userId: int
    preference: str  # 使用者輸入的偏好，例如 "Craving something spicy?"
    selectedIngredients: Optional[List[str]] = None


class RecipeResponse(BaseModel):
    """
    單筆食譜的回傳格式。
    欄位名稱與前端 Recipes.tsx 的 UI 完全對齊。
    """
    title: str
    matchPercentage: int              # 食材匹配度百分比，如 95
    cookTime: str                     # 烹飪時間，如 "20m"
    calories: str                     # 卡路里，如 "450 Kcal"
    difficulty: str                   # 難度，如 "Easy"
    savedIngredients: List[str]       # 這份食譜用到了哪些庫存食材


class RecommendedRecipesResponse(BaseModel):
    """推薦食譜列表的回傳結構"""
    recipes: List[RecipeResponse]
