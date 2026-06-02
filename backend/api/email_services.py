from django.core.mail import send_mail

def send_otp_email(email, otp):
    """
    Sends a 6-digit verification code to the target user email address.
    """
    subject = "BarterX - Verify Your Email Address"
    message = (
        "Thank you for joining BarterX!\n\n"
        f"Your verification code is: {otp}\n\n"
        "This code will expire in 5 minutes. If you did not request this, please ignore this email.\n\n"
        "Best regards,\n"
        "The BarterX Team"
    )
    from_email = "no-reply@barterx.com"
    send_mail(subject, message, from_email, [email])
