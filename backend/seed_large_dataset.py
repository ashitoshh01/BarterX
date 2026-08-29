import os
import random
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, Category, BarterItem

def seed_data():
    print("Starting large dataset seeding with realistic Indian names...")
    
    # 1. Create or get default categories
    categories_data = [
        {"name": "Electronics", "is_service": False},
        {"name": "Books & Study", "is_service": False},
        {"name": "Fashion & Wear", "is_service": False},
        {"name": "Bikes & Rides", "is_service": False},
        {"name": "Music & Arts", "is_service": False},
        {"name": "Tutoring & Tech", "is_service": True},
        {"name": "Design & Video", "is_service": True},
    ]
    
    categories = []
    for cat_info in categories_data:
        cat, created = Category.objects.get_or_create(
            name=cat_info["name"],
            defaults={
                "is_service": cat_info["is_service"],
                "description": f"Seeded {cat_info['name']} category"
            }
        )
        categories.append(cat)
    print(f"Seeded {len(categories)} categories.")

    # 2. Seed 55 diverse users with Indian names
    cities = [
        {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
        {"city": "Delhi", "state": "Delhi", "lat": 28.7041, "lon": 77.1025},
        {"city": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
        {"city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
        {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
        {"city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867},
    ]

    indian_names = [
        "Aarav Mehta", "Aanya Sharma", "Aditya Patel", "Ananya Iyer", "Arjun Verma",
        "Anika Rao", "Atharva Joshi", "Avani Deshmukh", "Kabir Gupta", "Diya Sen",
        "Reyansh Das", "Isha Nair", "Shaurya Choudhury", "Kavya Reddy", "Vihaan Saxena",
        "Kiara Mishra", "Krishna Trivedi", "Myra Kapoor", "Sai Pillai", "Pari Bhatt",
        "Rohan Kulkarni", "Riya Malhotra", "Dev Adhikari", "Saanvi Dubey", "Neil Fernandes",
        "Prisha Singhal", "Ranveer Goel", "Tanvi Bhatia", "Vikram Rathore", "Shruti Hegde",
        "Sanjay Menon", "Sneha Rao", "Arjun Banerjee", "Pooja Hegde", "Amit Shah",
        "Priya Swaminathan", "Yash Wardhan", "Divya Pillai", "Rahul Dravid", "Simran Kaur",
        "Raj Malhotra", "Ritu Phogat", "Rohit Sharma", "Komal Pandey", "Suresh Kumar",
        "Manish Sisodia", "Ramesh Babu", "Neha Dhupia", "Shikha Pandey", "Jyoti Singh",
        "Deepak Chahar", "Sandhya Raju", "Alok Pandey", "Geeta Phogat", "Abhishek Sen"
    ]

    professions = ["Software Engineer", "Design Student", "Civil Engineer", "MBA Candidate", "Music Producer", "Content Creator", "Freelance Writer", "Architect"]
    bios = [
        "Love swapping old gear for fresh stuff.",
        "Avid reader always looking for rare books.",
        "Tech geek wanting to upgrade setup.",
        "Fitness lover and occasional guitarist.",
        "Looking for cool services and study guides.",
        "Sustainable living advocate. Cashless is the future!"
    ]

    titles_pool = {
        "Electronics": [
            ("Mechanical Keyboard", "RK61 mechanical keyboard with blue switches", "mechanical keyboard", "headphones, monitor", "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600"),
            ("Noise Cancelling Headphones", "Sony WH-CH720N wireless headphones", "noise cancelling headphones", "keyboard, charger", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"),
            ("USB-C Hub", "Anker 5-in-1 USB-C hub with HDMI", "usb-c hub", "mouse, pad", "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600"),
            ("Computer Monitor", "Dell 24 inch IPS full HD monitor", "computer monitor", "mechanical keyboard, desk lamp", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600")
        ],
        "Books & Study": [
            ("Cracking the Coding Interview", "Legendary CTCI book, 6th edition", "cracking the coding interview", "python book, textbook", "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600"),
            ("Atomic Habits", "Self-help bestseller book by James Clear", "atomic habits", "novel, fiction", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"),
            ("GATE prep material", "Complete GATE study notes for CS branch", "gate prep material", "aptitude book", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600"),
            ("College Calculus Textbook", "Thomas Calculus 14th edition", "calculus textbook", "geometry set, compass", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600")
        ],
        "Fashion & Wear": [
            ("Denim Jacket", "Levis classic denim jacket size L", "denim jacket", "sneakers, hoodie", "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600"),
            ("Running Sneakers", "Nike Pegasus size 9, barely worn", "running sneakers", "boots, sports watch", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"),
            ("Leather Backpack", "Compact leather backpack for laptop", "leather backpack", "sling bag", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"),
            ("Winter Hoodie", "Over-sized warm fleece hoodie", "winter hoodie", "jacket, beanie", "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600")
        ],
        "Bikes & Rides": [
            ("Geared Mountain Bike", "Hercules Roadeo mountain bike with 21 gears", "mountain bike", "skateboard, helmet", "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600"),
            ("Skateboard", "Decathlon Maplewood skateboard complete", "skateboard", "roller skates, helmet", "https://images.unsplash.com/photo-1520156565986-b1dd234d413d?w=600"),
            ("Cycling Helmet", "High-visibility cycle helmet, medium size", "cycling helmet", "lights, lock", "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=600")
        ],
        "Music & Arts": [
            ("Acoustic Guitar", "Yamaha F310 acoustic guitar with carry bag", "acoustic guitar", "keyboard, mic", "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600"),
            ("Midi Keyboard Controller", "Akai LPK25 mini MIDI controller", "midi keyboard", "headphones", "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600"),
            ("Studio Microphone", "Condenser microphone with pop filter", "studio mic", "stand, interface", "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600")
        ],
        "Tutoring & Tech": [
            ("React Next.js Tutoring", "Will teach you modern React & Next.js basics", "react tutoring", "ui design service", "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600"),
            ("Python Bootcamp help", "Assistance in writing data science Python scripts", "python bootcamp tutoring", "logo design", "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600"),
            ("DSA Practice Companion", "Mock interviews and DSA problem-solving sessions", "dsa companion", "resume review", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600")
        ],
        "Design & Video": [
            ("Custom Logo Design", "Professional vector logo for your project", "custom logo design", "copywriting, coding", "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600"),
            ("Video Editing service", "Will edit your YouTube/Reel shorts", "video editing service", "music beat, voiceover", "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600"),
            ("Resume Overhaul", "Professional resume design and formatting", "resume overhaul", "mock interview", "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600")
        ]
    }

    # Delete all previously seeded listings to avoid duplicate name collisions
    BarterItem.objects.filter(owner__username__startswith="swapper_").delete()
    # Also delete users created previously under swapper_username prefix
    User.objects.filter(username__startswith="swapper_").delete()
    print("Deleted old seeded users and listings.")

    user_count = 0
    item_count = 0

    for idx, name in enumerate(indian_names):
        first_name = name.split(" ")[0]
        username = f"swapper_{first_name.lower()}_{idx}"
        email = f"{first_name.lower()}{idx}@example.com"
        
        # Create user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "first_name": name}
        )
        if created:
            user.set_password("barterpass123")
            user.save()
            user_count += 1
            
        # Get or create profile
        profile, p_created = UserProfile.objects.get_or_create(user=user)
        
        # Populate realistic details
        loc_data = random.choice(cities)
        profile.display_name = name
        profile.city = loc_data["city"]
        profile.state = loc_data["state"]
        profile.location = f"{loc_data['city']}, {loc_data['state']}"
        profile.latitude = loc_data["lat"] + random.uniform(-0.02, 0.02)
        profile.longitude = loc_data["lon"] + random.uniform(-0.02, 0.02)
        profile.profession = random.choice(professions)
        profile.bio = random.choice(bios)
        profile.trust_score = random.randint(45, 95)
        profile.coin_balance = random.randint(100, 1000)
        # Leave profile_picture_url empty — frontend will show the Baarter default avatar
        profile.save()

        # Seed 2 random listings for this user
        chosen_cats = random.sample(categories, 2)
        for cat in chosen_cats:
            pool = titles_pool.get(cat.name, [])
            if pool:
                title, desc, offering, wanting, img_url = random.choice(pool)
                # Ensure unique title per user
                title_full = f"{title} ({first_name})"
                
                item, item_created = BarterItem.objects.get_or_create(
                    owner=user,
                    title=title_full,
                    defaults={
                        "description": desc,
                        "offering": offering,
                        "wanting": wanting,
                        "category": cat,
                        "condition": "like_new" if not cat.is_service else "not_applicable",
                        "purchase_price": random.randint(200, 1500),
                        "location": profile.location,
                        "latitude": profile.latitude,
                        "longitude": profile.longitude,
                        "city": profile.city,
                        "state": profile.state,
                        "status": "active",
                        "image_url": img_url
                    }
                )
                if item_created:
                    item_count += 1

    print(f"Seeding complete! Added {user_count} new users with realistic Indian names and {item_count} new active listings!")

if __name__ == "__main__":
    seed_data()
