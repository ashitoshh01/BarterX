import os
# pyrefly: ignore [missing-import]
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
from api.models import BarterItem, Category, UserProfile

# ─── All 23 Categories ───────────────────────────────────────────────────────
# is_service=False → Product categories (physical goods)
# is_service=True  → Service categories
categories_data = [
    # Products
    {"name": "Fashion & Apparel",              "is_service": False},
    {"name": "Lifestyle & Home",               "is_service": False},
    {"name": "Media & Entertainment",          "is_service": False},
    {"name": "Jewellery & Accessories",        "is_service": False},
    {"name": "Automotive & Accessories",       "is_service": False},
    {"name": "Electronics & Gadgets",          "is_service": False},
    {"name": "Hospitality & Equipment",        "is_service": False},
    {"name": "Travel & Luggage",               "is_service": False},
    {"name": "Beauty & Personal Care",         "is_service": False},
    {"name": "Healthcare & Wellness",          "is_service": False},
    {"name": "Entertainment & Gaming",         "is_service": False},
    {"name": "Events & Celebrations",          "is_service": False},
    # Services
    {"name": "Marketing & Advertising",        "is_service": True},
    {"name": "Finance & Accounting",           "is_service": True},
    {"name": "Operations & Supply Chain",      "is_service": True},
    {"name": "Human Resources & Recruitment",  "is_service": True},
    {"name": "Legal & Compliance",             "is_service": True},
    {"name": "Sales & Business Development",   "is_service": True},
    {"name": "Technology & IT Services",       "is_service": True},
    {"name": "Agriculture & Farming",          "is_service": True},
    {"name": "Construction & Real Estate",     "is_service": True},
    {"name": "Transport & Logistics",          "is_service": True},
    {"name": "Household & Craftsman Services", "is_service": True},
]

print("Seeding categories...")
category_map = {}
for cat in categories_data:
    category, created = Category.objects.get_or_create(
        name=cat["name"],
        defaults={"is_service": cat["is_service"]}
    )
    category_map[cat["name"]] = category
    status = "CREATED" if created else "EXISTS "
    print(f"  [{status}] {cat['name']}")

# ─── Seed Users ───────────────────────────────────────────────────────────────
users_data = {
    "Alex M.":   {"username": "alex_m",   "email": "alex@example.com"},
    "Sarah K.":  {"username": "sarah_k",  "email": "sarah@example.com"},
    "Marcus T.": {"username": "marcus_t", "email": "marcus@example.com"},
    "Elena R.":  {"username": "elena_r",  "email": "elena@example.com"},
    "David L.":  {"username": "david_l",  "email": "david@example.com"},
    "Chloe W.":  {"username": "chloe_w",  "email": "chloe@example.com"},
    "Riya S.":   {"username": "riya_s",   "email": "riya@example.com"},
    "Arjun P.":  {"username": "arjun_p",  "email": "arjun@example.com"},
}

print("\nSeeding users...")
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
    UserProfile.objects.get_or_create(user=user)
    user_map[display_name] = user

# ─── Seed Items (2 per category, covering all 23) ────────────────────────────
items = [
    # Electronics & Gadgets
    {
        "title": "Sony A7 III Camera",
        "description": "Mint condition body. Shutter count ~12k. Includes 2 batteries.",
        "offering": "Sony A7 III Body",
        "wanting": "DJI Mavic 3 Pro or similar drone",
        "category_name": "Electronics & Gadgets",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Alex M.", "location": "Mumbai, MH", "condition": "like_new",
    },
    {
        "title": "iPad Pro 12.9\" (M1)",
        "description": "128GB, Space Gray, Wi-Fi. Always used with screen protector.",
        "offering": "iPad Pro + Apple Pencil 2",
        "wanting": "MacBook Pro M1 (16GB RAM preferred)",
        "category_name": "Electronics & Gadgets",
        "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Sarah K.", "location": "Bengaluru, KA", "condition": "like_new",
    },
    # Fashion & Apparel
    {
        "title": "Vintage Leather Jacket",
        "description": "Genuine brown leather, size L. Excellent patina, minor wear on cuffs.",
        "offering": "Leather Jacket (Size L)",
        "wanting": "Doc Martens Boots (Size 10)",
        "category_name": "Fashion & Apparel",
        "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Marcus T.", "location": "New Delhi, DL", "condition": "used",
    },
    {
        "title": "Nike Air Jordan 1 Retro High",
        "description": "Size UK 9, Chicago colorway. Worn twice, comes with original box.",
        "offering": "Air Jordan 1 Chicago UK9",
        "wanting": "Adidas Yeezy Boost 350 (any colorway, UK9)",
        "category_name": "Fashion & Apparel",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Arjun P.", "location": "Chennai, TN", "condition": "like_new",
    },
    # Media & Entertainment
    {
        "title": "Fender Stratocaster",
        "description": "Player Series Strat in 3-Color Sunburst. Maple fingerboard.",
        "offering": "Fender Stratocaster",
        "wanting": "Analog Synthesizer / Drum Machine",
        "category_name": "Media & Entertainment",
        "image_url": "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Elena R.", "location": "Pune, MH", "condition": "used",
    },
    {
        "title": "Collection of 50 Vinyl Records",
        "description": "Classic rock, jazz, and blues. All in excellent playable condition.",
        "offering": "50 Vinyl Records (mixed genres)",
        "wanting": "High-quality turntable or audio equipment",
        "category_name": "Media & Entertainment",
        "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
        "owner_name": "David L.", "location": "Kolkata, WB", "condition": "used",
    },
    # Lifestyle & Home
    {
        "title": "Ergonomic Office Chair",
        "description": "High-back mesh chair with 3D armrests and lumbar support.",
        "offering": "Ergonomic Office Chair",
        "wanting": "Mechanical Keyboard (Custom/Hot-swap)",
        "category_name": "Lifestyle & Home",
        "image_url": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
        "owner_name": "David L.", "location": "Hyderabad, TS", "condition": "used",
    },
    {
        "title": "Espresso Machine (Breville Barista Express)",
        "description": "Built-in grinder, barely used. Makes café-quality espresso at home.",
        "offering": "Breville Barista Express Espresso Machine",
        "wanting": "Air fryer or high-end blender",
        "category_name": "Lifestyle & Home",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Chloe W.", "location": "Bengaluru, KA", "condition": "like_new",
    },
    # Jewellery & Accessories
    {
        "title": "Gold Plated Watch (Fossil)",
        "description": "Fossil Gen 5 smartwatch, gold plated stainless steel. Excellent condition.",
        "offering": "Fossil Gen 5 Gold Smartwatch",
        "wanting": "Garmin sports watch or Apple Watch",
        "category_name": "Jewellery & Accessories",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Riya S.", "location": "Jaipur, RJ", "condition": "like_new",
    },
    {
        "title": "Silver Ethnic Necklace Set",
        "description": "Handcrafted silver necklace with earrings. Traditional Rajasthani design.",
        "offering": "Silver Ethnic Necklace + Earring Set",
        "wanting": "Silk saree or designer dupatta",
        "category_name": "Jewellery & Accessories",
        "image_url": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Elena R.", "location": "Jaipur, RJ", "condition": "brand_new",
    },
    # Automotive & Accessories
    {
        "title": "Car Dash Cam (Garmin 67W)",
        "description": "1440p front camera, GPS. 6 months old, with all accessories.",
        "offering": "Garmin 67W Dash Cam",
        "wanting": "OBD2 scanner or car emergency kit",
        "category_name": "Automotive & Accessories",
        "image_url": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Arjun P.", "location": "Mumbai, MH", "condition": "like_new",
    },
    {
        "title": "Motorcycle Helmet (AGV K6)",
        "description": "Full face, size L. Used for one season, no drops. With original bag.",
        "offering": "AGV K6 Full Face Helmet (L)",
        "wanting": "Riding gloves + jacket combo",
        "category_name": "Automotive & Accessories",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Marcus T.", "location": "Pune, MH", "condition": "used",
    },
    # Hospitality & Equipment
    {
        "title": "Commercial Coffee Grinder",
        "description": "Mazzer Mini grinder, professional grade. Ideal for café or heavy home use.",
        "offering": "Mazzer Mini Coffee Grinder",
        "wanting": "Commercial blender or juicer",
        "category_name": "Hospitality & Equipment",
        "image_url": "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Chloe W.", "location": "Remote", "condition": "used",
    },
    # Travel & Luggage
    {
        "title": "Samsonite Hardshell Luggage Set",
        "description": "20\" + 28\" set, spinner wheels, TSA lock. Used on 3 trips.",
        "offering": "Samsonite 2-piece Luggage Set",
        "wanting": "Osprey hiking backpack (65L+)",
        "category_name": "Travel & Luggage",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Riya S.", "location": "Delhi, DL", "condition": "used",
    },
    # Beauty & Personal Care
    {
        "title": "Dyson Airwrap Styler",
        "description": "Complete set with all attachments. Used 5 times. Like new condition.",
        "offering": "Dyson Airwrap Complete",
        "wanting": "Dyson Supersonic Hair Dryer or skincare device",
        "category_name": "Beauty & Personal Care",
        "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Sarah K.", "location": "Mumbai, MH", "condition": "like_new",
    },
    # Healthcare & Wellness
    {
        "title": "Yoga Mat & Block Set (Manduka)",
        "description": "PRO 6mm mat + 2 blocks + strap. Barely used. Perfect for home practice.",
        "offering": "Manduka PRO Yoga Kit",
        "wanting": "Foam roller set or resistance bands",
        "category_name": "Healthcare & Wellness",
        "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Riya S.", "location": "Remote", "condition": "like_new",
    },
    # Entertainment & Gaming
    {
        "title": "PlayStation 5 (Disc Edition)",
        "description": "PS5 with 2 controllers and 4 games. All in excellent condition.",
        "offering": "PS5 Disc + 2 Controllers + 4 Games",
        "wanting": "Xbox Series X or Nintendo Switch OLED",
        "category_name": "Entertainment & Gaming",
        "image_url": "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Arjun P.", "location": "Hyderabad, TS", "condition": "used",
    },
    # Events & Celebrations
    {
        "title": "DSLR Camera Rental — Events",
        "description": "Canon EOS 90D with 18-135mm lens. Available for weddings/events.",
        "offering": "Canon 90D DSLR for events",
        "wanting": "Photography editing software license or drone rental",
        "category_name": "Events & Celebrations",
        "image_url": "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Alex M.", "location": "Mumbai, MH", "condition": "used",
    },
    # Technology & IT Services
    {
        "title": "UI/UX Design Mentorship",
        "description": "5 hours of 1-on-1 design mentoring, portfolio reviews, and resume prep.",
        "offering": "5h Design Mentorship",
        "wanting": "React Native developer mentoring / code help",
        "category_name": "Technology & IT Services",
        "image_url": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Chloe W.", "location": "Remote", "condition": "not_applicable",
    },
    {
        "title": "Full-Stack Web Dev (10 hours)",
        "description": "10 hours of React + Django development. Perfect for MVPs or side projects.",
        "offering": "10h Full-Stack Development",
        "wanting": "Cloud credits (AWS/GCP) or domain + hosting",
        "category_name": "Technology & IT Services",
        "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Arjun P.", "location": "Remote", "condition": "not_applicable",
    },
    # Marketing & Advertising
    {
        "title": "Social Media Marketing (1 month)",
        "description": "Full Instagram + LinkedIn management for 1 month. Content + scheduling.",
        "offering": "1 Month Social Media Management",
        "wanting": "Graphic design work or video editing",
        "category_name": "Marketing & Advertising",
        "image_url": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Riya S.", "location": "Remote", "condition": "not_applicable",
    },
    # Finance & Accounting
    {
        "title": "Tax Filing Assistance (ITR)",
        "description": "Filing ITR for salaried individuals + freelancers. GST returns included.",
        "offering": "CA-assisted Tax Filing (ITR + GST)",
        "wanting": "Legal documentation help or trademark registration",
        "category_name": "Finance & Accounting",
        "image_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
        "owner_name": "David L.", "location": "Remote", "condition": "not_applicable",
    },
    # Legal & Compliance
    {
        "title": "Contract Drafting (5 documents)",
        "description": "Draft up to 5 standard business contracts — NDA, MOU, service agreements.",
        "offering": "5 Business Contracts Drafted",
        "wanting": "Accounting services or business registration help",
        "category_name": "Legal & Compliance",
        "image_url": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Marcus T.", "location": "Remote", "condition": "not_applicable",
    },
    # Household & Craftsman Services
    {
        "title": "Home Painting (2 BHK)",
        "description": "Interior painting for 2 BHK apartment. Paint + labour included.",
        "offering": "2 BHK Interior Painting",
        "wanting": "Plumbing or electrical repair work",
        "category_name": "Household & Craftsman Services",
        "image_url": "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Elena R.", "location": "Bengaluru, KA", "condition": "not_applicable",
    },
    # Transport & Logistics
    {
        "title": "Local Goods Transport (Mini Truck)",
        "description": "Mini truck available for local shifting/goods delivery within city.",
        "offering": "Mini Truck Transport (within city)",
        "wanting": "Packing + moving services or warehouse space",
        "category_name": "Transport & Logistics",
        "image_url": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Alex M.", "location": "Mumbai, MH", "condition": "not_applicable",
    },
    # Agriculture & Farming
    {
        "title": "Organic Vegetable Farm Share (1 month)",
        "description": "Weekly box of organic vegetables from my farm. Enough for a family of 4.",
        "offering": "1 Month Organic Veg Box (weekly delivery)",
        "wanting": "Composting equipment or seeds",
        "category_name": "Agriculture & Farming",
        "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Sarah K.", "location": "Nashik, MH", "condition": "not_applicable",
    },
    # Construction & Real Estate
    {
        "title": "Architectural Blueprint Drafting",
        "description": "Drafting residential building plans, AutoCAD + hand drawings. Up to 3000 sq ft.",
        "offering": "Residential Architectural Blueprints",
        "wanting": "Structural engineering consultation or interior design",
        "category_name": "Construction & Real Estate",
        "image_url": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Arjun P.", "location": "Ahmedabad, GJ", "condition": "not_applicable",
    },
    # Human Resources & Recruitment
    {
        "title": "Resume & LinkedIn Makeover",
        "description": "Professional resume writing + LinkedIn optimisation for tech roles.",
        "offering": "Resume + LinkedIn Profile Optimisation",
        "wanting": "Mock interview sessions or career coaching",
        "category_name": "Human Resources & Recruitment",
        "image_url": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Chloe W.", "location": "Remote", "condition": "not_applicable",
    },
    # Sales & Business Development
    {
        "title": "B2B Lead Generation (100 leads)",
        "description": "Verified B2B leads in SaaS/tech sector. LinkedIn sourced, ready to pitch.",
        "offering": "100 Verified B2B Leads",
        "wanting": "Cold email copywriting or sales script writing",
        "category_name": "Sales & Business Development",
        "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop&q=80",
        "owner_name": "Marcus T.", "location": "Remote", "condition": "not_applicable",
    },
    # Operations & Supply Chain
    {
        "title": "Inventory Management Setup",
        "description": "Set up a simple inventory tracking system using Excel/Notion for small businesses.",
        "offering": "Inventory Management System Setup",
        "wanting": "Bookkeeping or payroll management help",
        "category_name": "Operations & Supply Chain",
        "image_url": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80",
        "owner_name": "David L.", "location": "Remote", "condition": "not_applicable",
    },
]

print("\nSeeding barter items...")
created_count = 0
skipped_count = 0
for item_data in items:
    category = category_map[item_data["category_name"]]
    owner = user_map[item_data["owner_name"]]
    _, created = BarterItem.objects.get_or_create(
        title=item_data["title"],
        defaults={
            "description": item_data["description"],
            "offering": item_data["offering"],
            "wanting": item_data["wanting"],
            "category": category,
            "image_url": item_data["image_url"],
            "owner": owner,
            "location": item_data["location"],
            "condition": item_data.get("condition", "not_applicable"),
            "status": "active"
        }
    )
    if created:
        created_count += 1
    else:
        skipped_count += 1

print(f"\n[OK] Database seeding completed!")
print(f"   Categories : {len(categories_data)} total")
print(f"   Items      : {created_count} created, {skipped_count} already existed")
print(f"   Users      : {len(users_data)} total")
