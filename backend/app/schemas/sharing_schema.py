"""
sharing_schema.py — Sharing 模組的 Pydantic 資料驗證

定義前後端資料傳輸的型別：
  - ShareCreate:   建立新的食物分享（POST body）
  - ShareResponse: 回傳的食物分享資料（含 distance 與 expiresIn）
  - PickupRequest: 領取請求（POST body）
  - SharesListResponse: GET /api/shares 的完整回傳結構
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ShareCreate(BaseModel):
    """建立食物分享的請求 Body"""
    title: str
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    category: Optional[str] = "Produce"
    lat: float
    lng: float
    expiryTime: datetime
    userId: int
    userName: Optional[str] = None


class ShareSurplusCreate(BaseModel):
    """從庫存分享剩食的請求 Body"""
    userId: int
    inventoryId: int
    quantity: float
    instructions: str
    locationName: str
    lat: float
    lng: float
    availableUntil: Optional[str] = None


class ShareResponse(BaseModel):
    """
    單筆食物分享的回傳格式。
    包含 distance（英里）與 expiresIn（倒數文字）供 UI 直接使用。
    """
    id: int
    title: str
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    category: Optional[str] = None
    lat: float
    lng: float
    status: str
    expiryTime: Optional[str] = None
    userId: int
    userName: Optional[str] = None
    createdAt: Optional[str] = None
    distance: Optional[float] = None     # 與使用者的距離（英里）
    expiresIn: Optional[str] = None      # 到期倒數文字，例如 "2h left"


class PickupRequest(BaseModel):
    """領取請求的 Body"""
    userId: int


class RequestStatusUpdate(BaseModel):
    """更新領取請求狀態的 Body"""
    userId: int
    status: str


class ShareStatusUpdate(BaseModel):
    """更新分享狀態的 Body"""
    userId: int
    status: str


class SharesListResponse(BaseModel):
    """
    GET /api/shares 的回傳結構。
    前端依此分為兩組顯示：Top Picks Today 與 Expiring Soon。
    """
    topPicks: List[ShareResponse]
    expiringSoon: List[ShareResponse]
