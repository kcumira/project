"""
sharing_controller.py — Sharing 模組的業務邏輯

處理食物分享的核心操作：
  - get_shares():       查詢可用分享，計算距離，區分 top_picks / expiring_soon
  - create_share():     建立新的食物分享
  - request_pickup():   處理領取請求，更新狀態為 requested
"""

from datetime import datetime, timedelta, date
from fastapi import HTTPException
from app.config.db import get_connection
from app.models.sharing_model import row_to_dict
from app.services.sharing_service import haversine_distance, format_time_left
import traceback


ACTIVE_REQUEST_STATUSES = {"requested", "accepted"}


def _format_dt(value):
    return value.isoformat() if value else None


def _request_row_to_dict(row: dict) -> dict:
    share = row_to_dict(row)
    share["distance"] = None
    share["expiresIn"] = None

    if row["snapshot_expiry_date"]:
        expiry_dt = datetime.combine(row["snapshot_expiry_date"], datetime.max.time())
        share["expiresIn"] = format_time_left(expiry_dt)

    return {
        "requestId": row["request_id"],
        "requestStatus": row["request_status"],
        "requestedAt": _format_dt(row["request_time"]),
        "latestMustReceiveTime": _format_dt(row["latest_must_receive_time"]),
        "requester": {
            "userId": row["requester_id"],
            "userName": row.get("requester_name"),
        },
        "owner": {
            "userId": row["owner_id"],
            "userName": row.get("user_name"),
        },
        "share": share,
    }


def _share_row_to_dict(row: dict) -> dict:
    share = row_to_dict(row)
    share["distance"] = None

    if row["snapshot_expiry_date"]:
        expiry_dt = datetime.combine(row["snapshot_expiry_date"], datetime.max.time())
        share["expiresIn"] = format_time_left(expiry_dt)
    else:
        share["expiresIn"] = None

    return {
        **share,
        "requestCount": row.get("request_count", 0),
        "activeRequestCount": row.get("active_request_count", 0),
    }


def get_shares(user_lat: float, user_lng: float, category: str = None):
    """
    取得食物分享列表，並區分為 top_picks 與 expiring_soon。

    邏輯說明：
      1. 查詢所有 status='available' 的分享
      2. 若有 category 篩選條件，加入 WHERE 子句
      3. 對每筆結果計算與使用者的距離（Haversine）
      4. expiring_soon: snapshot_expiry_date 距離今天 < 1 天
      5. top_picks: 其餘的可用分享，依距離排序

    Args:
        user_lat: 使用者緯度
        user_lng: 使用者經度
        category: 可選的分類篩選（Produce / Meals / Bread）

    Returns:
        dict: { "topPicks": [...], "expiringSoon": [...] }
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 動態組合 SQL 查詢條件
        query = """
            SELECT fs.share_id, fs.community_id, fs.user_id, fs.inventory_id,
                   fs.lat, fs.lng, fs.description, fs.category, fs.image_url, fs.status,
                   fs.pickup_instructions, fs.snapshot_name, fs.snapshot_expiry_date, fs.posted_at,
                   u.user_name
            FROM foodshare fs
            LEFT JOIN user u ON fs.user_id = u.user_id
            WHERE fs.status = 'available'
        """
        params = []

        if category and category != "All Items":
            query += " AND fs.category = %s"
            params.append(category)

        query += " ORDER BY fs.posted_at DESC"

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        today = date.today()
        expiry_threshold = today + timedelta(days=1)

        top_picks = []
        expiring_soon = []

        for row in rows:
            # 將 DB row 轉為 camelCase dict
            share = row_to_dict(row)

            # 計算距離
            share["distance"] = haversine_distance(user_lat, user_lng, row["lat"], row["lng"])

            # 計算到期倒數文字
            if row["snapshot_expiry_date"]:
                # snapshot_expiry_date 是 date 型別，轉為 datetime 做計算
                expiry_dt = datetime.combine(row["snapshot_expiry_date"], datetime.max.time())
                share["expiresIn"] = format_time_left(expiry_dt)
            else:
                share["expiresIn"] = None

            # 依到期日分組：明天前到期 → expiring_soon，其餘 → top_picks
            if row["snapshot_expiry_date"] and row["snapshot_expiry_date"] <= expiry_threshold:
                expiring_soon.append(share)
            else:
                top_picks.append(share)

        # top_picks 依距離由近到遠排序
        top_picks.sort(key=lambda x: x["distance"])

        # expiring_soon 依到期日由近到遠排序
        expiring_soon.sort(key=lambda x: x["expiryTime"] or "")

        return {
            "topPicks": top_picks,
            "expiringSoon": expiring_soon,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch shares: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def get_share_detail(share_id: int, user_lat: float = None, user_lng: float = None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT fs.share_id, fs.community_id, fs.user_id, fs.inventory_id,
                   fs.lat, fs.lng, fs.description, fs.category, fs.image_url, fs.status,
                   fs.pickup_instructions, fs.snapshot_name, fs.snapshot_expiry_date, fs.posted_at,
                   u.user_name
            FROM foodshare fs
            LEFT JOIN user u ON fs.user_id = u.user_id
            WHERE fs.share_id = %s
            """,
            (share_id,)
        )
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Share not found")

        share = row_to_dict(row)

        if user_lat is not None and user_lng is not None:
            share["distance"] = haversine_distance(user_lat, user_lng, row["lat"], row["lng"])
        else:
            share["distance"] = None

        if row["snapshot_expiry_date"]:
            expiry_dt = datetime.combine(row["snapshot_expiry_date"], datetime.max.time())
            share["expiresIn"] = format_time_left(expiry_dt)
        else:
            share["expiresIn"] = None

        return share

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch share detail: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def create_share(item):
    """
    建立新的食物分享。

    Args:
        item: ShareCreate schema（Pydantic model）

    Returns:
        dict: 成功訊息與新建的 share ID
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT COALESCE(MAX(share_id), 0) + 1 FROM foodshare")
        new_id = cursor.fetchone()[0]

        query = """
            INSERT INTO foodshare
            (share_id, user_id, lat, lng, description, category, image_url, status,
             snapshot_name, snapshot_expiry_date, posted_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'available', %s, %s, NOW())
        """

        cursor.execute(query, (
            new_id,
            item.userId,
            item.lat,
            item.lng,
            item.description,
            item.category,
            item.imageUrl,
            item.title,
            item.expiryTime,
        ))

        conn.commit()

        return {
            "message": "Share created successfully",
            "shareId": new_id,
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create share: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def create_surplus_share(item):
    """
    從庫存中分享剩食。
    扣除庫存數量，並新增一筆 foodshare。
    """
    conn = get_connection()
    # 使用 dictionary 格式返回庫存查詢結果
    cursor = conn.cursor(dictionary=True)

    try:
        # 開始 Transaction
        conn.start_transaction()

        # 1. 查詢庫存並加上排他鎖 (FOR UPDATE)
        cursor.execute(
            "SELECT * FROM inventoryitem WHERE inventory_id = %s FOR UPDATE",
            (item.inventoryId,)
        )
        inventory_item = cursor.fetchone()

        if not inventory_item:
            raise HTTPException(status_code=404, detail="Inventory item not found")

        if inventory_item["user_id"] != item.userId:
            raise HTTPException(status_code=403, detail="Unauthorized to share this item")

        if inventory_item["expiry_date"] and inventory_item["expiry_date"] < date.today():
            raise HTTPException(status_code=400, detail="Expired items cannot be shared")

        current_quantity = float(inventory_item["quantity"]) if inventory_item["quantity"] is not None else 1.0
        remaining_quantity = current_quantity - item.quantity

        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than zero")

        if remaining_quantity < 0:
            raise HTTPException(status_code=400, detail="Not enough quantity in inventory")

        cursor.execute("SELECT COALESCE(MAX(share_id), 0) + 1 AS new_id FROM foodshare")
        new_share_id = cursor.fetchone()["new_id"]

        # 2. 先新增 foodshare 紀錄，確保有此紀錄
        insert_query = """
            INSERT INTO foodshare
            (share_id, user_id, inventory_id, lat, lng, description, category, image_url, status,
             pickup_instructions, snapshot_name, snapshot_expiry_date, posted_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'available', %s, %s, %s, NOW())
        """
        
        # 標題與圖片等基礎資訊從庫存來
        title = inventory_item["name"]
        category = inventory_item["category"]
        image_url = inventory_item["image_url"]

        # availableUntil 的處理，如果前端有傳，要把 JS 的 ISO string (含 Z) 轉為 datetime
        if item.availableUntil:
            try:
                date_str = item.availableUntil.replace("Z", "+00:00")
                expiry = datetime.fromisoformat(date_str)
            except Exception:
                expiry = inventory_item["expiry_date"]
        else:
            expiry = inventory_item["expiry_date"]

        # 放個簡單的描述
        unit = inventory_item["unit"] if inventory_item["unit"] else "units"
        description = f"Shared {item.quantity:g} {unit} from inventory at {item.locationName}."

        cursor.execute(insert_query, (
            new_share_id,
            item.userId,
            item.inventoryId,
            item.lat,
            item.lng,
            description,
            category,
            image_url,
            item.instructions,
            title,
            expiry
        ))

        # 3. 更新庫存 (為避免 Foreign Key ON DELETE RESTRICT 衝突，不直接刪除，而是設為 0)
        cursor.execute(
            "UPDATE inventoryitem SET quantity = %s WHERE inventory_id = %s",
            (remaining_quantity, item.inventoryId)
        )

        # 提交 Transaction
        conn.commit()

        return {
            "message": "Surplus shared successfully",
            "shareId": new_share_id
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to share surplus: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def get_user_sharing_status(user_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    request_select = """
        SELECT sr.request_id, sr.share_id, sr.user_id AS requester_id,
               sr.request_time, sr.latest_must_receive_time, sr.status AS request_status,
               requester.user_name AS requester_name,
               fs.share_id, fs.community_id, fs.user_id, fs.user_id AS owner_id, fs.inventory_id,
               fs.lat, fs.lng, fs.description, fs.category, fs.image_url, fs.status,
               fs.pickup_instructions, fs.snapshot_name, fs.snapshot_expiry_date, fs.posted_at,
               owner.user_name
        FROM sharerequest sr
        JOIN foodshare fs ON sr.share_id = fs.share_id
        LEFT JOIN user requester ON sr.user_id = requester.user_id
        LEFT JOIN user owner ON fs.user_id = owner.user_id
    """

    try:
        cursor.execute(
            request_select + """
            WHERE sr.user_id = %s
            ORDER BY sr.request_time DESC
            """,
            (user_id,)
        )
        outgoing_requests = [_request_row_to_dict(row) for row in cursor.fetchall()]

        cursor.execute(
            request_select + """
            WHERE fs.user_id = %s
            ORDER BY sr.request_time DESC
            """,
            (user_id,)
        )
        incoming_requests = [_request_row_to_dict(row) for row in cursor.fetchall()]

        cursor.execute(
            """
            SELECT fs.share_id, fs.community_id, fs.user_id, fs.inventory_id,
                   fs.lat, fs.lng, fs.description, fs.category, fs.image_url, fs.status,
                   fs.pickup_instructions, fs.snapshot_name, fs.snapshot_expiry_date, fs.posted_at,
                   owner.user_name,
                   (SELECT COUNT(*) FROM sharerequest sr WHERE sr.share_id = fs.share_id) AS request_count,
                   (SELECT COUNT(*) FROM sharerequest sr
                    WHERE sr.share_id = fs.share_id AND sr.status IN ('requested', 'accepted')) AS active_request_count
            FROM foodshare fs
            LEFT JOIN user owner ON fs.user_id = owner.user_id
            WHERE fs.user_id = %s
            ORDER BY fs.posted_at DESC
            """,
            (user_id,)
        )
        my_shares = [_share_row_to_dict(row) for row in cursor.fetchall()]

        return {
            "outgoingRequests": outgoing_requests,
            "incomingRequests": incoming_requests,
            "myShares": my_shares,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sharing status: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def update_request_status(request_id: int, user_id: int, status: str):
    normalized_status = status.lower().strip()
    allowed_statuses = {"accepted", "rejected", "cancelled", "completed"}

    if normalized_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Unsupported request status")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        conn.start_transaction()
        cursor.execute(
            """
            SELECT sr.*, fs.user_id AS owner_id, fs.status AS share_status
            FROM sharerequest sr
            JOIN foodshare fs ON sr.share_id = fs.share_id
            WHERE sr.request_id = %s
            FOR UPDATE
            """,
            (request_id,)
        )
        request = cursor.fetchone()

        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        is_owner = request["owner_id"] == user_id
        is_requester = request["user_id"] == user_id

        if normalized_status in {"accepted", "rejected"} and not is_owner:
            raise HTTPException(status_code=403, detail="Only the share owner can review this request")

        if normalized_status == "cancelled" and not is_requester:
            raise HTTPException(status_code=403, detail="Only the requester can cancel this request")

        if normalized_status == "completed" and not (is_owner or is_requester):
            raise HTTPException(status_code=403, detail="Only related users can complete this request")

        current_status = request["status"]

        if normalized_status == "accepted":
            if current_status != "requested":
                raise HTTPException(status_code=400, detail="Only requested pickups can be accepted")
            cursor.execute("UPDATE sharerequest SET status = 'accepted' WHERE request_id = %s", (request_id,))
            cursor.execute("UPDATE foodshare SET status = 'accepted' WHERE share_id = %s", (request["share_id"],))

        elif normalized_status == "rejected":
            if current_status not in ACTIVE_REQUEST_STATUSES:
                raise HTTPException(status_code=400, detail="This request can no longer be rejected")
            cursor.execute("UPDATE sharerequest SET status = 'rejected' WHERE request_id = %s", (request_id,))
            cursor.execute("UPDATE foodshare SET status = 'available' WHERE share_id = %s", (request["share_id"],))

        elif normalized_status == "cancelled":
            if current_status not in ACTIVE_REQUEST_STATUSES:
                raise HTTPException(status_code=400, detail="This request can no longer be cancelled")
            cursor.execute("UPDATE sharerequest SET status = 'cancelled' WHERE request_id = %s", (request_id,))
            cursor.execute("UPDATE foodshare SET status = 'available' WHERE share_id = %s", (request["share_id"],))

        elif normalized_status == "completed":
            if current_status not in ACTIVE_REQUEST_STATUSES:
                raise HTTPException(status_code=400, detail="This request can no longer be completed")
            cursor.execute("UPDATE sharerequest SET status = 'completed' WHERE request_id = %s", (request_id,))
            cursor.execute("UPDATE foodshare SET status = 'completed' WHERE share_id = %s", (request["share_id"],))

            cursor.execute("SELECT pickup_id FROM pickuprecord WHERE request_id = %s", (request_id,))
            pickup = cursor.fetchone()
            if not pickup:
                cursor.execute("SELECT COALESCE(MAX(pickup_id), 0) + 1 AS new_id FROM pickuprecord")
                new_pickup_id = cursor.fetchone()["new_id"]
                cursor.execute(
                    """
                    INSERT INTO pickuprecord
                    (pickup_id, request_id, admin_id, picked_up_at, confirmed_by_owner)
                    VALUES (%s, %s, NULL, NOW(), %s)
                    """,
                    (new_pickup_id, request_id, 1 if is_owner else 0)
                )

        conn.commit()

        return {
            "message": "Request status updated",
            "requestId": request_id,
            "status": normalized_status,
            "shareId": request["share_id"],
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update request status: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def update_share_status(share_id: int, user_id: int, status: str):
    normalized_status = status.lower().strip()
    allowed_statuses = {"available", "cancelled"}

    if normalized_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Unsupported share status")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        conn.start_transaction()
        cursor.execute("SELECT * FROM foodshare WHERE share_id = %s FOR UPDATE", (share_id,))
        share = cursor.fetchone()

        if not share:
            raise HTTPException(status_code=404, detail="Share not found")

        if share["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only the share owner can update this share")

        if share["status"] == "completed":
            raise HTTPException(status_code=400, detail="Completed shares cannot be changed")

        if normalized_status == "available":
            cursor.execute(
                """
                SELECT COUNT(*) AS active_count
                FROM sharerequest
                WHERE share_id = %s AND status IN ('requested', 'accepted')
                """,
                (share_id,)
            )
            if cursor.fetchone()["active_count"] > 0:
                raise HTTPException(status_code=400, detail="Resolve active requests before reopening this share")

        if normalized_status == "cancelled":
            cursor.execute(
                """
                UPDATE sharerequest
                SET status = 'cancelled'
                WHERE share_id = %s AND status IN ('requested', 'accepted')
                """,
                (share_id,)
            )

        cursor.execute("UPDATE foodshare SET status = %s WHERE share_id = %s", (normalized_status, share_id))

        conn.commit()

        return {
            "message": "Share status updated",
            "shareId": share_id,
            "status": normalized_status,
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update share status: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def request_pickup(share_id: int, user_id: int):
    """
    處理食物領取請求：將指定 share 的 status 更新為 'requested'。

    Args:
        share_id: 食物分享的 ID
        user_id:  請求領取的使用者 ID

    Returns:
        dict: 成功訊息
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 查詢該分享是否存在且可領取
        cursor.execute(
            "SELECT * FROM foodshare WHERE share_id = %s",
            (share_id,)
        )
        share = cursor.fetchone()

        if not share:
            raise HTTPException(status_code=404, detail="Share not found")

        if share["status"] != "available":
            raise HTTPException(status_code=400, detail="This share is no longer available")

        if share["user_id"] == user_id:
            raise HTTPException(status_code=400, detail="You cannot pick up your own share")

        cursor.execute(
            """
            SELECT request_id, status
            FROM sharerequest
            WHERE share_id = %s AND user_id = %s AND status IN ('requested', 'accepted')
            """,
            (share_id, user_id)
        )
        existing_request = cursor.fetchone()

        if existing_request:
            return {
                "message": "Pickup already requested",
                "shareId": share_id,
                "requestId": existing_request["request_id"],
                "status": existing_request["status"],
            }

        cursor.execute("SELECT COALESCE(MAX(request_id), 0) + 1 AS new_id FROM sharerequest")
        new_request_id = cursor.fetchone()["new_id"]

        cursor.execute(
            """
            INSERT INTO sharerequest
            (request_id, share_id, user_id, request_time, latest_must_receive_time, status)
            VALUES (%s, %s, %s, NOW(), %s, 'requested')
            """,
            (
                new_request_id,
                share_id,
                user_id,
                datetime.combine(share["snapshot_expiry_date"], datetime.max.time()) if share.get("snapshot_expiry_date") else None,
            )
        )

        # 更新狀態為 requested
        cursor.execute(
            "UPDATE foodshare SET status = 'requested' WHERE share_id = %s",
            (share_id,)
        )

        conn.commit()

        return {
            "message": "Pickup requested successfully",
            "shareId": share_id,
            "requestId": new_request_id,
            "status": "requested",
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to request pickup: {str(e)}")
    finally:
        cursor.close()
        conn.close()
