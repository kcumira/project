from fastapi import HTTPException
from app.config.db import get_connection
from app.services.expiry_service import get_days_left, get_food_status

def get_home_summary(user_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 先查 user
        cursor.execute(
            """
            SELECT user_id, user_name, email, role
            FROM user
            WHERE user_id = %s
            """,
            (user_id,)
        )
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 查 inventory
        cursor.execute(
            """
            SELECT inventory_id, expiry_date
            FROM inventoryitem
            WHERE user_id = %s
            """,
            (user_id,)
        )
        items = cursor.fetchall()

        expiring = 0
        use_soon = 0
        fresh = 0

        for item in items:
            days_left = get_days_left(item["expiry_date"])
            status = get_food_status(days_left)

            if status == "expiring":
                expiring += 1
            elif status == "useSoon":
                use_soon += 1
            elif status == "fresh":
                fresh += 1

        return {
            "user": {
                "userId": user["user_id"],
                "userName": user["user_name"],
                "email": user["email"],
                "role": user["role"]
            },
            "inventoryStatus": {
                "expiring": expiring,
                "useSoon": use_soon,
                "fresh": fresh
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch home summary: {str(e)}")
    finally:
        cursor.close()
        conn.close()