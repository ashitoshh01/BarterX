import os
import django
import random
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, Category, BarterItem, BarterInterest, ChatRoom, ChatMessage, DealConfirmation

def generate_data():
    print("Generating V1 product-only test data...")

    # Product-only templates with reliable placeholder images
    item_templates = [
        ("Vintage Camera", "Classic 35mm camera, fully functional.", "https://placehold.co/400x400/png?text=Camera"),
        ("Leather Handbag", "Handmade leather bag, excellent condition.", "https://placehold.co/400x400/png?text=Handbag"),
        ("Smart Watch", "Latest model with fitness tracking.", "https://placehold.co/400x400/png?text=Smart+Watch"),
        ("Gaming Console", "Well maintained, comes with 2 controllers.", "https://placehold.co/400x400/png?text=Console"),
        ("Acoustic Guitar", "Solid wood construction, great sound.", "https://placehold.co/400x400/png?text=Guitar"),
        ("Mountain Bike", "21-speed mountain bike, lightly used.", "https://placehold.co/400x400/png?text=Bike"),
        ("Coffee Table", "Minimalist oak coffee table.", "https://placehold.co/400x400/png?text=Table"),
        ("Headphones", "Studio quality sound, great for travel.", "https://placehold.co/400x400/png?text=Headphones")
    ]

    # Clear existing test data
    BarterItem.objects.all().delete()
    BarterInterest.objects.all().delete()
    ChatRoom.objects.all().delete()
    ChatMessage.objects.all().delete()
    DealConfirmation.objects.all().delete()

    # Get Users and filter only product Categories
    users = list(User.objects.all())
    product_categories = list(Category.objects.filter(is_service=False))

    if not product_categories:
        print("No product categories found. Check database.")
        return

    # Create 500 Realistic Product Items
    items = []
    for _ in range(500):
        owner = random.choice(users)
        template = random.choice(item_templates)
        item = BarterItem.objects.create(
            title=f"{template[0]} - {random.randint(1, 100)}",
            description=template[1],
            offering=template[0],
            wanting=template[0], # V1 product-for-product
            image_url=template[2],
            owner=owner,
            category=random.choice(product_categories),
            status='active'
        )
        items.append(item)

    # Create 200 Interests
    for _ in range(200):
        requester = random.choice(users)
        receiver = random.choice(users)
        while requester == receiver:
            receiver = random.choice(users)
        
        requested_item = random.choice(items)
        offered_item = random.choice(items)
        
        interest = BarterInterest.objects.create(
            requester=requester,
            receiver=receiver,
            requested_item=requested_item,
            offered_item=offered_item,
            status=random.choice(['pending', 'accepted', 'completed'])
        )

        if interest.status in ['accepted', 'completed']:
            room = ChatRoom.objects.create(barter_interest=interest, user1=requester, user2=receiver)
            ChatMessage.objects.create(room=room, sender=requester, message="Interested in a trade?")
            ChatMessage.objects.create(room=room, sender=receiver, message="Sounds good, let's discuss.")
        
        if interest.status == 'completed':
            DealConfirmation.objects.create(barter_interest=interest, user1_confirmed=True, user2_confirmed=True)

    print("V1 product-only data generation complete.")

if __name__ == "__main__":
    generate_data()
