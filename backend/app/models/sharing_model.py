"""
sharing_model.py — FoodShare 資料模型定義

定義 foodshare 資料表的結構與 row-to-dict 映射工具。
專案使用 mysql.connector + raw SQL，此檔案提供：
  1. 資料表欄位對照說明
  2. row_to_dict() 將資料庫查詢結果轉為前端 camelCase 格式

foodshare 資料表欄位：
  share_id           INT          PK
  community_id       INT
  user_id            INT
  inventory_id       INT
  lat                DOUBLE
  lng                DOUBLE
  description        TEXT
  category           VARCHAR(50)
  image_url          VARCHAR(500)
  status             VARCHAR(50)
  pickup_instructions TEXT
  snapshot_name      VARCHAR(255)   ← 食物名稱（快照自 inventory）
  snapshot_expiry_date DATE        ← 到期日（快照自 inventory）
  posted_at          DATETIME      ← 發布時間
"""


def row_to_dict(row: dict) -> dict:
    """
    將資料庫 dictionary cursor 查詢的單筆 row 轉為前端 camelCase 格式。

    Args:
        row: mysql.connector cursor(dictionary=True) 回傳的字典

    Returns:
        camelCase 格式的字典，供 API response 使用
    """
    return {
        "id": row["share_id"],
        "title": row["snapshot_name"] or "Unnamed Item",
        "description": row["description"],
        "imageUrl": row["image_url"],
        "category": row["category"],
        "lat": row["lat"],
        "lng": row["lng"],
        "status": row["status"],
        "expiryTime": row["snapshot_expiry_date"].isoformat() if row["snapshot_expiry_date"] else None,
        "userId": row["user_id"],
        "userName": row.get("user_name"),
        "createdAt": row["posted_at"].isoformat() if row["posted_at"] else None,
        "pickupInstructions": row["pickup_instructions"],
        "communityId": row["community_id"],
        "inventoryId": row["inventory_id"],
    }
