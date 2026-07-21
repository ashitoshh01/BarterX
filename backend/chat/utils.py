import os
from django.core.exceptions import ValidationError

ALLOWED_EXTENSIONS = {
    # Documents
    '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt',
    # Archives
    '.zip', '.rar', '.tar', '.gz',
    # Images
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'
}

MAX_UPLOAD_SIZE = 25 * 1024 * 1024  # 25MB

def validate_chat_attachment(file_obj):
    """Validate that attachment file type is allowed and within 25MB."""
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f"File extension '{ext}' is not supported. Allowed: PDF, DOCX, ZIP, and major image formats.")
        
    if file_obj.size > MAX_UPLOAD_SIZE:
        raise ValidationError("File size exceeds the maximum 25MB limit.")
