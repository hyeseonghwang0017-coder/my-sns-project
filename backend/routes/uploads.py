from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from utils.auth import get_current_user
from utils.cloudinary import upload_image

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image_file(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    try:
        result = upload_image(file.file)
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Image upload failed")
