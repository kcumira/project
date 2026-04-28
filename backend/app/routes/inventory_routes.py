from fastapi import APIRouter
from app.controllers.inventory_controller import get_inventory_by_user, create_inventory_item, update_inventory_item, delete_inventory_item
from app.schemas.inventory_schema import InventoryCreate, InventoryUpdate

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

@router.get("/{user_id}")
def get_inventory(user_id: int):
    return get_inventory_by_user(user_id)

@router.post("")
def create_inventory(item: InventoryCreate):
    return create_inventory_item(item)

@router.put("/{inventory_id}")
def update_inventory(inventory_id: int, item: InventoryUpdate):
    return update_inventory_item(inventory_id, item)

@router.delete("/{inventory_id}")
def delete_inventory(inventory_id: int):
    return delete_inventory_item(inventory_id)
