import os
# pyrefly: ignore [missing-import]
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
from api.models import BarterItem, Category, UserProfile

# Define categories
categories_data = [
    {"name": "Electronics & Gadgets", "is_service": False},
    {"name": "Fashion & Apparel", "is_service": False},
    {"name": "Media & Entertainment", "is_service": False},
    {"name": "Lifestyle & Home", "is_service": False},
    {"name": "Technology & IT Services", "is_service": True},
]

print("Seeding categories...")
category_map = {}
for cat in categories_data:
    category, created = Category.objects.get_or_create(
        name=cat["name"],
        defaults={"is_service": cat["is_service"]}
    )
    category_map[cat["name"]] = category

# Define users mapping plain name to a valid username and metadata
users_data = {
    "Alex M.": {"username": "alex_m", "email": "alex@example.com"},
    "Sarah K.": {"username": "sarah_k", "email": "sarah@example.com"},
    "Marcus T.": {"username": "marcus_t", "email": "marcus@example.com"},
    "Elena R.": {"username": "elena_r", "email": "elena@example.com"},
    "David L.": {"username": "david_l", "email": "david@example.com"},
    "Chloe W.": {"username": "chloe_w", "email": "chloe@example.com"},
}

print("Seeding users...")
user_map = {}
for display_name, udata in users_data.items():
    user, created = User.objects.get_or_create(
        username=udata["username"],
        defaults={
            "email": udata["email"],
            "first_name": display_name.split()[0],
            "last_name": display_name.split()[1] if len(display_name.split()) > 1 else ""
        }
    )
    if created:
        user.set_password("password123")
        user.save()
    
    # Ensure profile exists
    UserProfile.objects.get_or_create(user=user)
    user_map[display_name] = user

items = [
    {
        "title": "Sony A7 III Camera",
        "description": "Mint condition body. Shutter count around 12k. Includes 2 batteries.",
        "offering": "Sony A7 III Body",
        "wanting": "DJI Mavic 3 Pro or similar drone",
        "category_name": "Electronics & Gadgets",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Alex M.",
        "location": "Mumbai, MH",
    },
    {
        "title": "iPad Pro 12.9\" (M1)",
        "description": "128GB, Space Gray, Wi-Fi model. Always used with screen protector.",
        "offering": "iPad Pro + Apple Pencil 2",
        "wanting": "MacBook Pro M1 (16GB RAM preferred)",
        "category_name": "Electronics & Gadgets",
        "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Sarah K.",
        "location": "Bengaluru, KA",
    },
    {
        "title": "Vintage Leather Jacket",
        "description": "Genuine brown leather jacket, size L. Excellent patina, minor wear on cuffs.",
        "offering": "Leather Jacket (Size L)",
        "wanting": "Doc Martens Boots (Size 10)",
        "category_name": "Fashion & Apparel",
        "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Marcus T.",
        "location": "New Delhi, DL",
    },
    {
        "title": "Fender Stratocaster",
        "description": "Player Series Strat in 3-Color Sunburst. Maple fingerboard. Perfect setup.",
        "offering": "Fender Stratocaster",
        "wanting": "Analog Synthesizer / Drum Machine",
        "category_name": "Media & Entertainment",
        "image_url": "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Elena R.",
        "location": "Pune, MH",
    },
    {
        "title": "Ergonomic Office Chair",
        "description": "High-back mesh chair with 3D armrests and lumbar support.",
        "offering": "Ergonomic Office Chair",
        "wanting": "Mechanical Keyboard (Custom/Hot-swap)",
        "category_name": "Lifestyle & Home",
        "image_url": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
        "owner_name": "David L.",
        "location": "Hyderabad, TS",
    },
    {
        "title": "UI/UX Design Mentorship",
        "description": "Offering 5 hours of 1-on-1 design mentoring, portfolio reviews, and resume prep.",
        "offering": "5h Design Mentorship",
        "wanting": "React Native developer mentoring / code help",
        "category_name": "Technology & IT Services",
        "image_url": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Chloe W.",
        "location": "Remote",
    }
]

print("Seeding barter items...")
for item_data in items:
    category = category_map[item_data["category_name"]]
    owner = user_map[item_data["owner_name"]]
    
    BarterItem.objects.get_or_create(
        title=item_data["title"],
        defaults={
            "description": item_data["description"],
            "offering": item_data["offering"],
            "wanting": item_data["wanting"],
            "category": category,
            "image_url": item_data["image_url"],
            "owner": owner,
            "location": item_data["location"],
            "status": "active"
        }
    )
print("Database seeding completed successfully!")
