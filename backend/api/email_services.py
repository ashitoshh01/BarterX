import os
import requests
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def _get_resend_key():
    key = os.environ.get("RESEND_API") or os.environ.get("RESEND_API_KEY")
    if key:
        return key.strip().strip('"').strip("'")
    
    # Try reading from backend/.env or frontend/.env
    for env_path in [
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / "frontend" / ".env"
    ]:
        if env_path.exists():
            try:
                for line in env_path.read_text().splitlines():
                    if line.startswith("RESEND_API=") or line.startswith("RESEND_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
            except Exception:
                pass
    return "re_4rFRz4CL_7PfjYZtcJBh5cvD2LoMy8FSP"

def send_otp_email(email, otp):
    """
    Sends a 6-digit verification code to the target user email address via Resend API.
    Falls back to Django send_mail if Resend API call is unsuccessful.
    """
    resend_key = _get_resend_key()
    if resend_key:
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": "BarterX <onboarding@resend.dev>",
                "to": [email],
                "subject": "BarterX - Verify Your Email Address",
                "html": f"""
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #08080a; color: #f5f5f7; padding: 40px 20px; text-align: center;">
                    <div style="max-width: 460px; margin: 0 auto; background: #131317; border: 1px solid #26262e; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                        <h2 style="font-size: 26px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 8px;">Verify Your Account</h2>
                        <p style="color: #a8a8b3; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">Welcome to <strong>BarterX</strong>! Use the 6-digit verification code below to verify your email and complete registration.</p>
                        
                        <div style="background: #1a1a20; border: 1px solid #3a3a44; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                            <span style="font-family: 'JetBrains Mono', Monaco, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #dbfe01;">{otp}</span>
                        </div>
                        
                        <p style="color: #6e6e78; font-size: 12px; margin: 0;">⏱️ Code expires in <strong>5 minutes</strong>. Do not share this code with anyone.</p>
                    </div>
                </div>
                """
            }
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in (200, 201):
                logger.info(f"Resend OTP email sent successfully to {email}")
                return True
            else:
                logger.warning(f"Resend API status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error calling Resend API: {e}")

    # Fallback to standard Django mailer
    from django.core.mail import send_mail
    subject = "BarterX - Verify Your Email Address"
    message = (
        "Thank you for joining BarterX!\n\n"
        f"Your verification code is: {otp}\n\n"
        "This code will expire in 5 minutes.\n\n"
        "Best regards,\nThe BarterX Team"
    )
    send_mail(subject, message, "no-reply@barterx.com", [email])
    return True
