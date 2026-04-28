from fastapi import HTTPException
from app.config.db import get_connection
import bcrypt
import uuid
from app.services.email_service import send_reset_email


# 🔥 暫存 reset token（MVP 用）
reset_tokens = {}


# =========================
# 🔐 REGISTER
# =========================
def register_user(data):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # 檢查 email 是否存在
        cursor.execute(
            "SELECT * FROM user WHERE email = %s",
            (data.email,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")

        # hash 密碼
        hashed_password = bcrypt.hashpw(
            data.password.encode(),
            bcrypt.gensalt()
        ).decode()

        # 手動產生 user_id（你目前 DB 還沒 AUTO_INCREMENT）
        cursor.execute("SELECT COALESCE(MAX(user_id), 0) + 1 FROM user")
        new_id = cursor.fetchone()[0]

        query = """
            INSERT INTO user (user_id, user_name, email, password, role)
            VALUES (%s, %s, %s, %s, %s)
        """

        cursor.execute(query, (
            new_id,
            data.userName,
            data.email,
            hashed_password,
            "user"
        ))

        conn.commit()

        return {
            "message": "User registered successfully",
            "userId": new_id
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Register failed: {str(e)}")
    finally:
        cursor.close()
        conn.close()


# =========================
# 🔑 LOGIN
# =========================
def login_user(data):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT user_id, user_name, email, password, role, line_id
            FROM user
            WHERE email = %s
            """,
            (data.email,)
        )
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        stored_password = user["password"] or ""
        password_matches = False

        if stored_password.startswith("$2"):
            password_matches = bcrypt.checkpw(
                data.password.encode(),
                stored_password.encode()
            )
        elif data.password == stored_password:
            password_matches = True
            hashed_password = bcrypt.hashpw(
                data.password.encode(),
                bcrypt.gensalt()
            ).decode()
            cursor.execute(
                "UPDATE user SET password = %s WHERE user_id = %s",
                (hashed_password, user["user_id"])
            )
            conn.commit()

        if not password_matches:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {
            "message": "Login successful",
            "user": {
                "userId": user["user_id"],
                "userName": user["user_name"],
                "email": user["email"],
                "role": user["role"],
                "lineId": user["line_id"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
    finally:
        cursor.close()
        conn.close()


# =========================
# 📧 FORGOT PASSWORD
# =========================
def forgot_password(data):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT user_id, email FROM user WHERE email = %s",
            (data.email,)
        )
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="Email not found")

        # 產生 token
        token = str(uuid.uuid4())

        # 存 token（MVP：存在記憶體）
        reset_tokens[token] = user["user_id"]

        # reset link（前端頁面）
        reset_link = f"http://localhost:3000/reset-password?token={token}"

        # 發送 email
        success = send_reset_email(data.email, reset_link)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")

        return {
            "message": "Reset email sent"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forgot password failed: {str(e)}")
    finally:
        cursor.close()
        conn.close()


# =========================
# 🔁 RESET PASSWORD
# =========================
def reset_password(data):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # 檢查 token
        if data.token not in reset_tokens:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        user_id = reset_tokens[data.token]

        # hash 新密碼
        hashed_password = bcrypt.hashpw(
            data.newPassword.encode(),
            bcrypt.gensalt()
        ).decode()

        cursor.execute(
            "UPDATE user SET password = %s WHERE user_id = %s",
            (hashed_password, user_id)
        )

        conn.commit()

        # 用過就刪 token
        del reset_tokens[data.token]

        return {
            "message": "Password reset successful"
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")
    finally:
        cursor.close()
        conn.close()
