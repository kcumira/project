from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.vision_service import analyze_food_image

router = APIRouter(prefix="/api/scan", tags=["scan"])


@router.post("/food")
async def scan_food_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    if len(image_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image is too large. Please upload an image under 8MB.")

    return analyze_food_image(image_bytes, file.content_type)

