from fastapi import APIRouter
from app.schemas.auth_schema import LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.controllers.auth_controller import login_user, register_user, forgot_password, reset_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
def login(data: LoginRequest):
    return login_user(data)

@router.post("/register")
def register(data: RegisterRequest):
    return register_user(data)

@router.post("/forgot-password")
def forgot(data: ForgotPasswordRequest):
    return forgot_password(data)

@router.post("/reset-password")
def reset(data: ResetPasswordRequest):
    return reset_password(data)
