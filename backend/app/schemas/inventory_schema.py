from pydantic import BaseModel
from typing import Optional
from datetime import date

class InventoryCreate(BaseModel):
    userId: int
    name: str
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expiryDate: date
    purchaseDate: Optional[date] = None
    imageUrl: Optional[str] = None
    barcode: Optional[str] = None
    notes: Optional[str] = None
    
class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expiryDate: Optional[date] = None
    purchaseDate: Optional[date] = None
    imageUrl: Optional[str] = None
    barcode: Optional[str] = None
    notes: Optional[str] = None