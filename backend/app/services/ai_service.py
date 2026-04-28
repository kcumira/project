"""
ai_service.py — AI 食譜生成服務

封裝 Google Gemini API 的呼叫邏輯：
  - generate_recipe():              根據食材 + 偏好生成 1 份創意食譜
  - generate_recommended_recipes(): 根據食材生成 2~3 份推薦食譜

使用 Structured Output (JSON Mode) 確保回傳格式穩定，
欄位名稱與前端 UI 完全一致（camelCase）。
"""

import os
import json
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv
from google.api_core.exceptions import ResourceExhausted
from fastapi import HTTPException

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

# ─── 初始化 Gemini Client ────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 使用目前此專案 key 可用的 Flash 模型
MODEL_NAME = "gemini-2.5-flash"


def generate_recipe(ingredients: list[str], preference: str) -> dict:
    """
    根據使用者庫存食材與偏好，生成 1 份創意食譜。

    Args:
        ingredients: 使用者庫存的食材名稱列表，例如 ["Spinach", "Milk", "Mushrooms"]
        preference:  使用者輸入的偏好描述，例如 "Craving something spicy?"

    Returns:
        dict: 包含 title, matchPercentage, cookTime, calories, difficulty, savedIngredients
    """
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    ingredients_str = ", ".join(ingredients)

    prompt = f"""You are a creative chef AI. Based on the user's available ingredients and their preference, 
generate exactly 1 creative recipe.

Available ingredients: {ingredients_str}
User preference: {preference}

You MUST respond with a valid JSON object (no markdown, no extra text) with these exact fields:
{{
  "title": "Recipe name (string)",
  "matchPercentage": (integer 0-100, how well this recipe matches the available ingredients),
  "cookTime": "cooking time like '20m' or '1h 15m' (string)",
  "calories": "estimated calories like '450 Kcal' (string)",
  "difficulty": "Easy, Medium, or Hard (string)",
  "savedIngredients": ["list of ingredients from the user's inventory that this recipe uses"]
}}

Important rules:
- matchPercentage should reflect what percentage of ingredients needed for the recipe are already in the user's inventory
- savedIngredients must only contain items from the user's available ingredients list
- Be creative but realistic with the recipe
- Keep cookTime in short format (e.g., "20m", "1h", "45m")
- Keep calories in format like "450 Kcal"
"""

    model = genai.GenerativeModel(MODEL_NAME)

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.8,
            ),
        )
        result = json.loads(response.text)
        return result
    except ResourceExhausted:
        raise HTTPException(status_code=429, detail="AI 生成受到限流 (Rate Limit 429)，請稍後再試。")


def generate_recommended_recipes(ingredients: list[str]) -> list[dict]:
    """
    根據使用者庫存食材，生成 2~3 份推薦食譜。

    Args:
        ingredients: 使用者庫存的食材名稱列表

    Returns:
        list[dict]: 每份食譜包含 title, matchPercentage, cookTime, calories, difficulty, savedIngredients
    """
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    ingredients_str = ", ".join(ingredients)

    prompt = f"""You are a creative chef AI. Based on the user's available ingredients, 
suggest 3 creative recipes that make the best use of these ingredients (especially items that might expire soon).

Available ingredients: {ingredients_str}

You MUST respond with a valid JSON object (no markdown, no extra text) with this exact structure:
{{
  "recipes": [
    {{
      "title": "Recipe name (string)",
      "matchPercentage": (integer 0-100),
      "cookTime": "e.g. '20m' (string)",
      "calories": "e.g. '450 Kcal' (string)",
      "difficulty": "Easy, Medium, or Hard (string)",
      "savedIngredients": ["list of used ingredients from user's inventory"]
    }}
  ]
}}

Important rules:
- Generate exactly 3 recipes
- matchPercentage should reflect what percentage of ingredients needed are already available
- savedIngredients must only contain items from the user's available ingredients list
- Prioritize recipes that use the most available ingredients
- Vary the difficulty and cooking times across recipes
- Keep cookTime in short format (e.g., "20m", "1h", "45m")
- Keep calories in format like "450 Kcal"
"""

    model = genai.GenerativeModel(MODEL_NAME)

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.9,
            ),
        )
        result = json.loads(response.text)
        return result.get("recipes", [])
    except ResourceExhausted:
        raise HTTPException(status_code=429, detail="AI 生成受到限流 (Rate Limit 429)，請稍後再試。")
