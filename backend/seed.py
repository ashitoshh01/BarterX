import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import BarterItem

items = [
    {
        "title": "Sony A7 III Camera",
        "description": "Mint condition body. Shutter count around 12k. Includes 2 batteries.",
        "offering": "Sony A7 III Body",
        "wanting": "DJI Mavic 3 Pro or similar drone",
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
        "owner": "Alex M.",
        "location": "New York, NY",
    },
    {
        "title": "iPad Pro 12.9\" (M1)",
        "description": "128GB, Space Gray, Wi-Fi model. Always used with screen protector.",
        "offering": "iPad Pro + Apple Pencil 2",
        "wanting": "MacBook Pro M1 (16GB RAM preferred)",
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
        "owner": "Sarah K.",
        "location": "San Francisco, CA",
    },
    {
        "title": "Vintage Leather Jacket",
        "description": "Genuine brown leather jacket, size L. Excellent patina, minor wear on cuffs.",
        "offering": "Leather Jacket (Size L)",
        "wanting": "Doc Martens Boots (Size 10)",
        "category": "Fashion",
        "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
        "owner": "Marcus T.",
        "location": "Austin, TX",
    },
    {
        "title": "Fender Stratocaster",
        "description": "Player Series Strat in 3-Color Sunburst. Maple fingerboard. Perfect setup.",
        "offering": "Fender Stratocaster",
        "wanting": "Analog Synthesizer / Drum Machine",
        "category": "Music",
        "image_url": "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80",
        "owner": "Elena R.",
        "location": "Seattle, WA",
    },
    {
        "title": "Ergonomic Office Chair",
        "description": "High-back mesh chair with 3D armrests and lumbar support.",
        "offering": "Ergonomic Office Chair",
        "wanting": "Mechanical Keyboard (Custom/Hot-swap)",
        "category": "Home & Living",
        "image_url": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
        "owner": "David L.",
        "location": "Chicago, IL",
    },
    {
        "title": "UI/UX Design Mentorship",
        "description": "Offering 5 hours of 1-on-1 design mentoring, portfolio reviews, and resume prep.",
        "offering": "5h Design Mentorship",
        "wanting": "React Native developer mentoring / code help",
        "category": "Services",
        "image_url": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
        "owner": "Chloe W.",
        "location": "Remote",
    }
]

print("Seeding barter database...")
for item_data in items:
    BarterItem.objects.get_or_create(
        title=item_data["title"],
        defaults=item_data
    )
print("Database seeding completed successfully!")
