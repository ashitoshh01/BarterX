import random
import logging
from django.utils import timezone
from .models import ImageModerationResult

logger = logging.getLogger(__name__)

def moderate_uploaded_image(user, image_file, item=None):
    """
    Simulates content moderation for uploaded images.
    Blocks images containing 'unsafe', 'explicit', 'nudity', or 'violence' in the filename.
    Flags images containing 'suspicious' or 'flagged' in the filename.
    Logs all results in ImageModerationResult database model.
    """
    filename = image_file.name.lower()
    status = 'APPROVED'
    confidence = round(random.uniform(0.92, 0.99), 2)
    reason = "Image meets safety standards."
    detected_categories = []

    if any(word in filename for word in ["explicit", "nudity", "adult", "porn", "xxx"]):
        status = 'BLOCKED'
        confidence = round(random.uniform(0.95, 0.99), 2)
        reason = "Potential explicit or adult content detected."
        detected_categories = ["Adult/Nudity"]
    elif any(word in filename for word in ["violence", "blood", "gore", "weapon"]):
        status = 'BLOCKED'
        confidence = round(random.uniform(0.94, 0.98), 2)
        reason = "Potential violence or graphic imagery detected."
        detected_categories = ["Violence/Weapons"]
    elif any(word in filename for word in ["suspicious", "flagged", "spam"]):
        status = 'FLAGGED'
        confidence = round(random.uniform(0.75, 0.89), 2)
        reason = "Suspicious content flagged for manual administrator review."
        detected_categories = ["Suspicious/Spam"]

    result = ImageModerationResult.objects.create(
        user=user,
        image=image_file,
        item=item,
        status=status,
        confidence=confidence,
        detected_categories=detected_categories,
        reason=reason
    )

    logger.info(f"Moderation check for user {user.username} on image {image_file.name}: Result={status}, Reason={reason}")
    
    # Return (is_allowed, status, confidence, reason, result_instance)
    # FLAGGED images are allowed to be submitted but will go to review queue
    return status != 'BLOCKED', status, confidence, reason, result
