import requests
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

def send_reset_email(to_email: str, reset_link: str):
    api_key = os.getenv("RESEND_API_KEY")

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": "Annona <notify@annona.world>",
                "to": [to_email],
                "subject": "Reset your SmartFood password",
                "html": f"""
                    <h2>Password Reset</h2>
                    <p>Click the button below to reset your password:</p>
                    <a href="{reset_link}" style="
                        display:inline-block;
                        padding:10px 20px;
                        background:black;
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                    ">
                        Reset Password
                    </a>
                    <p>If you didn’t request this, ignore this email.</p>
                """
            }
        )

        print("Resend response:", response.status_code, response.text)

        return response.status_code == 200

    except Exception as e:
        print("Email error:", e)
        return False
