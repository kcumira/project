from fastapi import HTTPException
from app.config.db import get_connection
from app.services.expiry_service import get_days_left, get_food_status

def get_inventory_by_user(user_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
            SELECT inventory_id, user_id, name, category, quantity, unit,
                   expiry_date, purchase_date, image_url, barcode, notes
            FROM inventoryitem
            WHERE user_id = %s
            ORDER BY expiry_date ASC
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        result = []
        for item in rows:
            days_left = get_days_left(item["expiry_date"])
            status = get_food_status(days_left)

            result.append({
                "inventoryId": item["inventory_id"],
                "userId": item["user_id"],
                "name": item["name"],
                "category": item["category"],
                "quantity": float(item["quantity"]) if item["quantity"] is not None else None,
                "unit": item["unit"],
                "expiryDate": item["expiry_date"],
                "purchaseDate": item["purchase_date"],
                "imageUrl": item["image_url"],
                "barcode": item["barcode"],
                "notes": item["notes"],
                "daysLeft": days_left,
                "status": status
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inventory: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def create_inventory_item(item):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT COALESCE(MAX(inventory_id), 0) + 1 FROM inventoryitem")
        new_id = cursor.fetchone()[0]

        query = """
            INSERT INTO inventoryitem
            (inventory_id, user_id, name, category, quantity, unit, expiry_date, purchase_date, image_url, barcode, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(query, (
            new_id,
            item.userId,
            item.name,
            item.category,
            item.quantity,
            item.unit,
            item.expiryDate,
            item.purchaseDate,
            item.imageUrl,
            item.barcode,
            item.notes
        ))

        conn.commit()

        return {
            "message": "Item created successfully",
            "inventoryId": new_id
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create inventory item: {str(e)}")
    finally:
        cursor.close()
        conn.close()
        
def update_inventory_item(inventory_id: int, item):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 檢查存在
        cursor.execute(
            "SELECT * FROM inventoryitem WHERE inventory_id = %s",
            (inventory_id,)
        )
        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Item not found")

        # 用舊資料補缺
        updated_data = {
            "name": item.name or existing["name"],
            "category": item.category or existing["category"],
            "quantity": item.quantity if item.quantity is not None else existing["quantity"],
            "unit": item.unit or existing["unit"],
            "expiry_date": item.expiryDate or existing["expiry_date"],
            "purchase_date": item.purchaseDate or existing["purchase_date"],
            "image_url": item.imageUrl or existing["image_url"],
            "barcode": item.barcode or existing["barcode"],
            "notes": item.notes or existing["notes"],
        }

        query = """
            UPDATE inventoryitem
            SET name=%s, category=%s, quantity=%s, unit=%s,
                expiry_date=%s, purchase_date=%s,
                image_url=%s, barcode=%s, notes=%s
            WHERE inventory_id=%s
        """

        cursor.execute(query, (
            updated_data["name"],
            updated_data["category"],
            updated_data["quantity"],
            updated_data["unit"],
            updated_data["expiry_date"],
            updated_data["purchase_date"],
            updated_data["image_url"],
            updated_data["barcode"],
            updated_data["notes"],
            inventory_id
        ))

        conn.commit()

        return {"message": "Item updated successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")
    finally:
        cursor.close()
        conn.close()
        
def delete_inventory_item(inventory_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT * FROM inventoryitem WHERE inventory_id = %s",
            (inventory_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Item not found")

        cursor.execute(
            "DELETE FROM inventoryitem WHERE inventory_id = %s",
            (inventory_id,)
        )

        conn.commit()

        return {"message": "Item deleted successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
    finally:
        cursor.close()
        conn.close()