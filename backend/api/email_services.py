import logging

logger = logging.getLogger(__name__)

def send_otp_email(email, otp):
    """
    Prototype verification service.
    Logs the 6-digit OTP code to the server output and returns it for screen display/testing.
    Does not make external HTTP API requests.
    """
    logger.info(f"User email received: {email}")
    logger.info(f"Generated OTP for prototype verification: {otp}")
    
    print(f"\n==================================================")
    print(f"  [PROTOTYPE MODE] User Email: {email}")
    print(f"  --> VERIFICATION OTP CODE: {otp}")
    print(f"==================================================\n")
    
    return True, "Verification code generated successfully.", otp
