"""
sharing_routes.py — Sharing 模組的 API 路由定義

端點清單：
  GET  /api/shares                    → 取得食物分享列表（含距離計算）
  POST /api/shares                    → 建立新的食物分享
  POST /api/request-pickup/{share_id} → 請求領取食物
"""

from fastapi import APIRouter, Query
from typing import Optional
from app.controllers.sharing_controller import (
    get_shares,
    create_share,
    request_pickup,
    create_surplus_share,
    get_share_detail,
    get_user_sharing_status,
    update_request_status,
    update_share_status,
)
from app.controllers.inventory_controller import get_inventory_by_user
from app.schemas.sharing_schema import (
    ShareCreate,
    ShareSurplusCreate,
    PickupRequest,
    RequestStatusUpdate,
    ShareStatusUpdate,
)

router = APIRouter(prefix="/api", tags=["sharing"])


@router.get("/shares")
def list_shares(
    lat: float = Query(..., description="使用者緯度"),
    lng: float = Query(..., description="使用者經度"),
    category: Optional[str] = Query(None, description="分類篩選: Produce / Meals / Bread"),
):
    """
    取得食物分享列表。

    回傳 topPicks（依距離排序）和 expiringSoon（24 小時內到期）兩組資料。
    前端需傳入使用者座標以計算距離。
    """
    return get_shares(lat, lng, category)


@router.get("/shares/{share_id}")
def share_detail(
    share_id: int,
    lat: Optional[float] = Query(None, description="使用者緯度"),
    lng: Optional[float] = Query(None, description="使用者經度"),
):
    return get_share_detail(share_id, lat, lng)


@router.post("/shares")
def add_share(item: ShareCreate):
    """
    建立新的食物分享。

    Body 範例:
    {
        "title": "3 Organic Apples",
        "description": "Fresh from my garden",
        "category": "Produce",
        "lat": 25.033,
        "lng": 121.565,
        "expiryTime": "2026-03-31T18:00:00",
        "userId": 1,
        "userName": "Sarah J."
    }
    """
    return create_share(item)


@router.get("/sharing/inventory/{user_id}")
def list_user_inventory(user_id: int):
    """
    取得使用者的庫存，供分享剩食介面選擇。
    直接調用 inventory_controller 的方法。
    """
    return get_inventory_by_user(user_id)


@router.post("/sharing/create")
def add_surplus_share(item: ShareSurplusCreate):
    """
    將使用者選擇的庫存分享出去，建立新的食物分享並扣除庫存。
    """
    return create_surplus_share(item)


@router.get("/sharing/status/{user_id}")
def sharing_status(user_id: int):
    """
    取得使用者在分享流程裡的狀態：
    - outgoingRequests: 我送出的領取請求
    - incomingRequests: 別人對我的分享送出的請求
    - myShares: 我發布過的分享
    """
    return get_user_sharing_status(user_id)


@router.patch("/sharing/requests/{request_id}")
def change_request_status(request_id: int, body: RequestStatusUpdate):
    """
    更新領取請求狀態。
    支援 accepted / rejected / cancelled / completed。
    """
    return update_request_status(request_id, body.userId, body.status)


@router.patch("/sharing/shares/{share_id}")
def change_share_status(share_id: int, body: ShareStatusUpdate):
    """
    更新分享狀態。
    目前支援 available / cancelled。
    """
    return update_share_status(share_id, body.userId, body.status)


@router.post("/request-pickup/{share_id}")
def pickup(share_id: int, body: PickupRequest):
    """
    請求領取指定的食物分享。

    將該分享的 status 從 'available' 更新為 'requested'。
    """
    return request_pickup(share_id, body.userId)
