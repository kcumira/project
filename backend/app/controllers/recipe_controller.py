"""
recipe_controller.py — Recipe 模組的業務邏輯

處理食譜相關的核心操作：
  - get_expiring_items():         查詢 3 天內即期食材（供橫向列表顯示）
  - generate_recipe():           結合庫存 + AI 生成 1 份食譜
  - get_recommended_recipes():   結合庫存 + AI 生成 2~3 份推薦食譜
"""

from datetime import date, timedelta
from fastapi import HTTPException
from app.config.db import get_connection
from app.services.ai_service import (
    generate_recipe as ai_generate_recipe,
    generate_recommended_recipes as ai_generate_recommended,
)


def get_expiring_items(user_id: int):
    """
    查詢 3 天內即將到期的食材。

    SQL 邏輯：
      - expiry_date >= 今天（排除已過期）
      - expiry_date <= 今天 + 3 天
      - 依 expiry_date ASC 排序（最先到期的排前面）

    Args:
        user_id: 使用者 ID

    Returns:
        list[dict]: 即期食材列表（camelCase 格式）
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        today = date.today()
        threshold = today + timedelta(days=3)

        query = """
            SELECT inventory_id, name, image_url, expiry_date, quantity, unit
            FROM inventoryitem
            WHERE user_id = %s
              AND expiry_date >= %s
              AND expiry_date <= %s
            ORDER BY expiry_date ASC
        """
        cursor.execute(query, (user_id, today, threshold))
        rows = cursor.fetchall()

        result = []
        for item in rows:
            days_left = (item["expiry_date"] - today).days
            result.append({
                "inventoryId": item["inventory_id"],
                "name": item["name"],
                "imageUrl": item["image_url"],
                "daysLeft": days_left,
                "quantity": float(item["quantity"]) if item["quantity"] is not None else None,
                "unit": item["unit"],
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch expiring items: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def _get_user_ingredients(user_id: int) -> list[str]:
    """
    內部輔助函式：查詢使用者所有庫存食材的名稱。

    Args:
        user_id: 使用者 ID

    Returns:
        list[str]: 食材名稱列表，例如 ["Spinach", "Milk", "Mushrooms"]
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
            SELECT name FROM inventoryitem
            WHERE user_id = %s
            ORDER BY expiry_date ASC
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        return [row["name"] for row in rows]

    finally:
        cursor.close()
        conn.close()


def generate_recipe(user_id: int, preference: str, selected_ingredients: list[str] = None):
    """
    結合使用者庫存食材與偏好，透過 Gemini AI 生成 1 份創意食譜。

    流程：
      1. 查詢該使用者所有庫存食材名稱
      2. 將食材清單 + 偏好傳入 AI Service
      3. 回傳 AI 生成的食譜

    Args:
        user_id:    使用者 ID
        preference: 偏好描述（如 "Craving something spicy?"）

    Returns:
        dict: AI 生成的食譜（title, matchPercentage, cookTime, calories, difficulty, savedIngredients）
    """
    if selected_ingredients:
        user_ingredients = set(_get_user_ingredients(user_id))
        ingredients = [
            ingredient
            for ingredient in selected_ingredients
            if ingredient in user_ingredients
        ]
    else:
        ingredients = _get_user_ingredients(user_id)

    if not ingredients:
        raise HTTPException(
            status_code=400,
            detail="No matching ingredients found in your inventory. Please add or select some items first."
        )

    try:
        recipe = ai_generate_recipe(ingredients, preference)
        return recipe

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI recipe generation failed: {str(e)}")


def get_recommended_recipes(user_id: int):
    """
    從資料庫中取得推薦食譜，包含額外的營養與時間欄位。

    Args:
        user_id: 使用者 ID

    Returns:
        dict: { "recipes": [...] }
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SHOW COLUMNS FROM recipe")
        columns = {row["Field"] for row in cursor.fetchall()}

        optional_columns = [
            "image_url",
            "cook_time",
            "calories",
            "match_percentage",
            "saved_ingredients",
        ]
        selected_columns = ["recipe_id", "title", "difficulty"]
        selected_columns.extend(column for column in optional_columns if column in columns)

        order_clause = "ORDER BY match_percentage DESC" if "match_percentage" in columns else "ORDER BY recipe_id DESC"
        query = f"""
            SELECT {", ".join(selected_columns)}
            FROM recipe
            {order_clause}
            LIMIT 3
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        result = []
        for row in rows:
            import json
            saved_ing = []
            if row.get("saved_ingredients"):
                if isinstance(row["saved_ingredients"], str):
                    try:
                        saved_ing = json.loads(row["saved_ingredients"])
                    except json.JSONDecodeError:
                        pass
                elif isinstance(row["saved_ingredients"], list):
                    saved_ing = row["saved_ingredients"]

            # Parsing to numeric since frontend Recipe interface uses numbers for calories and cookTime
            cook_time_val = 20
            if row.get("cook_time"):
                try:
                    cook_time_val = int(str(row["cook_time"]).replace('m', '').strip())
                except ValueError:
                    pass

            calories_val = 0
            if row.get("calories"):
                try:
                    calories_val = int(str(row["calories"]).replace('Kcal', '').strip())
                except ValueError:
                    pass

            result.append({
                "id": row["recipe_id"],
                "title": row["title"],
                "imageUrl": row.get("image_url"),
                "cookTime": cook_time_val,
                "calories": calories_val,
                "difficulty": row["difficulty"] or "Medium",
                "matchPercentage": row.get("match_percentage") or 0,
                "savedIngredients": saved_ing
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommended recipes from database: {str(e)}")
    finally:
        cursor.close()
        conn.close()
