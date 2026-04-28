"""
sharing_service.py — Sharing 模組的計算服務

提供純邏輯函式，不涉及資料庫操作：
  - haversine_distance(): 計算兩點之間的距離（英里）
  - format_time_left():   將到期時間轉為人類可讀的倒數文字
"""

import math
from datetime import datetime


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    使用 Haversine 公式計算地球上兩點之間的大圓距離。

    Haversine 公式推導：
      a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
      c = 2 * atan2(√a, √(1-a))
      d = R * c

    Args:
        lat1, lng1: 使用者的緯度與經度（度）
        lat2, lng2: 食物分享點的緯度與經度（度）

    Returns:
        兩點之間的距離，單位為英里（mi），四捨五入至小數點第一位
    """
    R = 3958.8  # 地球半徑（英里）

    # 將角度轉為弧度
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    # Haversine 核心公式
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return round(distance, 1)


def format_time_left(expiry_time: datetime) -> str:
    """
    計算從現在到到期時間的剩餘時間，並格式化為人類可讀的文字。

    回傳格式範例：
      - "2h left"   → 剩餘 2 小時
      - "45m left"  → 剩餘 45 分鐘
      - "3d left"   → 剩餘 3 天
      - "Expired"   → 已過期

    Args:
        expiry_time: 到期的 datetime 物件

    Returns:
        格式化的倒數文字
    """
    now = datetime.now()
    diff = expiry_time - now

    if diff.total_seconds() <= 0:
        return "Expired"

    total_minutes = int(diff.total_seconds() / 60)
    total_hours = int(total_minutes / 60)
    total_days = int(total_hours / 24)

    if total_days > 0:
        return f"{total_days}d left"
    elif total_hours > 0:
        return f"{total_hours}h left"
    else:
        return f"{total_minutes}m left"
