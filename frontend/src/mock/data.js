// Mock data for BAARTER — realistic Gen-Z swap marketplace

export const CURRENT_USER = {
  id: "u_me",
  handle: "@lumen",
  name: "Lumen Reyes",
  bio: "Trading vibes for value. Skater. Film photographer. Runs a plant swap in Brooklyn.",
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
  location: "Brooklyn, NY",
  coins: 1240,
  trustScore: 92,
  swapsCompleted: 47,
  rating: 4.9,
  verified: true,
  joined: "2024-08-12",
  badges: ["Swap Star", "Trusted Trader", "First 100"],
};

export const USERS = {
  u_me: CURRENT_USER,
  u_kai: {
    id: "u_kai",
    handle: "@kaiwave",
    name: "Kai Nakamura",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    location: "Los Angeles, CA",
    trustScore: 88, rating: 4.8, swapsCompleted: 31, verified: true,
  },
  u_zoe: {
    id: "u_zoe",
    handle: "@zoethrift",
    name: "Zoe Patel",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    location: "Austin, TX",
    trustScore: 95, rating: 5.0, swapsCompleted: 62, verified: true,
  },
  u_ren: {
    id: "u_ren",
    handle: "@renmakes",
    name: "Ren Okoye",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    location: "Chicago, IL",
    trustScore: 79, rating: 4.6, swapsCompleted: 18, verified: false,
  },
  u_mira: {
    id: "u_mira",
    handle: "@mirapaints",
    name: "Mira Chen",
    avatar: "https://images.unsplash.com/photo-1502378735452-bc7d86632805?w=200&h=200&fit=crop",
    location: "Seattle, WA",
    trustScore: 91, rating: 4.9, swapsCompleted: 40, verified: true,
  },
  u_dex: {
    id: "u_dex",
    handle: "@dex.codes",
    name: "Dex Ramos",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop",
    location: "Miami, FL",
    trustScore: 84, rating: 4.7, swapsCompleted: 22, verified: true,
  },
};

export const CATEGORIES = [
  { id: "fashion", name: "Fashion & Thrift", tint: "tint-pink", emoji: "◈" },
  { id: "electronics", name: "Electronics", tint: "tint-blue", emoji: "◆" },
  { id: "books", name: "Books & Zines", tint: "tint-amber", emoji: "❋" },
  { id: "music", name: "Music & Vinyl", tint: "tint-purple", emoji: "♪" },
  { id: "art", name: "Art & Craft", tint: "tint-mint", emoji: "✦" },
  { id: "sports", name: "Sports & Skate", tint: "tint-pink", emoji: "▲" },
  { id: "plants", name: "Plants", tint: "tint-lime", emoji: "❊" },
  { id: "tutoring", name: "Tutoring", tint: "tint-amber", emoji: "❃", type: "service" },
  { id: "design", name: "Design Gigs", tint: "tint-purple", emoji: "✷", type: "service" },
  { id: "code", name: "Code & Tech", tint: "tint-blue", emoji: "◇", type: "service" },
  { id: "photo", name: "Photography", tint: "tint-pink", emoji: "◐", type: "service" },
];

export const LISTINGS = [
  {
    id: "l_1", type: "product", category: "fashion",
    title: "Vintage Levi's 501 — perfectly worn-in",
    description: "Thrifted in Berlin '23. Size 30/32. Some fade at knees which honestly makes them better.",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800",
    ],
    owner: "u_zoe", condition: "Loved", estValue: 80,
    wants: ["fashion", "books", "plants"], tags: ["vintage", "denim", "unisex"],
    location: "Austin, TX", posted: "2 days ago", views: 214, saves: 38,
  },
  {
    id: "l_2", type: "product", category: "sports",
    title: "Element skateboard deck + Independent trucks",
    description: "Barely used. Cruised it around the neighborhood a handful of times.",
    images: [
      "https://images.unsplash.com/photo-1597019558926-3eef445fdf60?w=800",
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800",
    ],
    owner: "u_kai", condition: "Like new", estValue: 120,
    wants: ["electronics", "music"], tags: ["skateboard", "element"],
    location: "Los Angeles, CA", posted: "5 hours ago", views: 88, saves: 12,
  },
  {
    id: "l_3", type: "product", category: "electronics",
    title: "Canon AE-1 film camera (working)",
    description: "50mm lens included. Light meter works. Shot two rolls with it last month — dreamy.",
    images: [
      "https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=800",
      "https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=800",
    ],
    owner: "u_ren", condition: "Vintage", estValue: 220,
    wants: ["music", "art", "sports"], tags: ["camera", "35mm", "canon"],
    location: "Chicago, IL", posted: "1 day ago", views: 402, saves: 74,
  },
  {
    id: "l_4", type: "service", category: "tutoring",
    title: "Spanish conversation practice (2× 45min)",
    description: "Native speaker. I'll help you sound like a local, not a textbook. Zoom or in-person Austin.",
    images: ["https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800"],
    owner: "u_zoe", condition: "Service", estValue: 60,
    wants: ["design", "art"], tags: ["spanish", "language", "remote-ok"],
    location: "Austin, TX / Remote", posted: "3 days ago", views: 96, saves: 15,
  },
  {
    id: "l_5", type: "service", category: "design",
    title: "Logo & brand kit for your side project",
    description: "One logo mark + 2 color options + type spec + 3 social templates. Turnaround: 5 days.",
    images: ["https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800"],
    owner: "u_mira", condition: "Service", estValue: 300,
    wants: ["electronics", "photo", "code"], tags: ["logo", "branding", "remote"],
    location: "Remote", posted: "8 hours ago", views: 176, saves: 41,
  },
  {
    id: "l_6", type: "product", category: "music",
    title: "Sony MDR-7506 studio headphones",
    description: "Classic. Iconic. Coiled cable. Pads are fresh (replaced last month).",
    images: ["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800"],
    owner: "u_dex", condition: "Good", estValue: 95,
    wants: ["books", "fashion", "sports"], tags: ["headphones", "sony", "studio"],
    location: "Miami, FL", posted: "12 hours ago", views: 60, saves: 8,
  },
  {
    id: "l_7", type: "product", category: "plants",
    title: "Monstera Deliciosa cutting (rooted)",
    description: "From my mother plant. 4 healthy leaves already. Ships in wet paper towel.",
    images: ["https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800"],
    owner: "u_me", condition: "Alive & thriving", estValue: 25,
    wants: ["books", "art", "music"], tags: ["monstera", "plant", "cutting"],
    location: "Brooklyn, NY", posted: "1 day ago", views: 141, saves: 22,
  },
  {
    id: "l_8", type: "service", category: "code",
    title: "Portfolio website in a weekend",
    description: "Next.js + Tailwind, hosted on Vercel. You bring content, I bring the code.",
    images: ["https://images.unsplash.com/photo-1522252234503-e356532cafd5?w=800"],
    owner: "u_dex", condition: "Service", estValue: 400,
    wants: ["electronics", "photo", "design"], tags: ["dev", "portfolio", "nextjs"],
    location: "Remote", posted: "4 days ago", views: 233, saves: 55,
  },
  {
    id: "l_9", type: "product", category: "books",
    title: "'Just Kids' by Patti Smith — hardcover",
    description: "Great condition. Read once. A few dog-ears (sorry).",
    images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800"],
    owner: "u_mira", condition: "Read once", estValue: 18,
    wants: ["music", "plants", "fashion"], tags: ["memoir", "patti-smith"],
    location: "Seattle, WA", posted: "6 hours ago", views: 44, saves: 6,
  },
  {
    id: "l_10", type: "service", category: "photo",
    title: "1hr portrait shoot (film or digital)",
    description: "I'll shoot you or your product. Delivered 15 edited photos in 7 days.",
    images: ["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800"],
    owner: "u_ren", condition: "Service", estValue: 180,
    wants: ["fashion", "electronics", "art"], tags: ["portrait", "film"],
    location: "Chicago, IL", posted: "2 days ago", views: 128, saves: 30,
  },
  {
    id: "l_11", type: "product", category: "art",
    title: "Original acrylic canvas 40×50cm 'City Rain'",
    description: "Painted last winter. Vibes: melancholy but hopeful.",
    images: ["https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800"],
    owner: "u_mira", condition: "New", estValue: 140,
    wants: ["photo", "books", "plants"], tags: ["original", "acrylic"],
    location: "Seattle, WA", posted: "3 days ago", views: 98, saves: 19,
  },
  {
    id: "l_12", type: "product", category: "fashion",
    title: "Doc Martens 1460 — black, size 8",
    description: "Broken in the good way. No scuffs. Selling because they don't fit anymore.",
    images: ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800"],
    owner: "u_kai", condition: "Loved", estValue: 90,
    wants: ["music", "fashion", "art"], tags: ["docs", "boots"],
    location: "Los Angeles, CA", posted: "18 hours ago", views: 165, saves: 27,
  },
];

export const AI_MATCHES = [
  {
    id: "m_1", yourItem: "l_7",  theirItem: "l_9", score: 96,
    reason: "Zoe's plants ↔ Mira's book — both list 'plants' and 'books' in wants.",
  },
  {
    id: "m_2", yourItem: "l_7", theirItem: "l_6", score: 88,
    reason: "Dex wants plants, you're into studio audio. Trust match ✓",
  },
  {
    id: "m_3", yourItem: "l_7", theirItem: "l_11", score: 82,
    reason: "Original art trade — Mira collects plant cuttings.",
  },
];

export const PROPOSALS = [
  {
    id: "p_1", direction: "incoming", from: "u_kai", to: "u_me",
    theirItem: "l_2", yourItem: "l_7", status: "pending",
    message: "Hey! Would love the monstera for my skateboard. I can ship or meet.",
    created: "3h ago",
  },
  {
    id: "p_2", direction: "outgoing", from: "u_me", to: "u_mira",
    theirItem: "l_5", yourItem: "l_7", status: "accepted",
    message: "Plant cutting + I'll throw in a zine for the logo work?",
    created: "1d ago",
  },
  {
    id: "p_3", direction: "incoming", from: "u_zoe", to: "u_me",
    theirItem: "l_1", yourItem: "l_7", status: "counter",
    message: "Would you add 100 coins with the plant?",
    created: "5h ago",
  },
];

export const CHATS = [];

export const NOTIFICATIONS = [
  { id: "n_1", type: "match", text: "New AI match: Zoe's Vintage Levi's 🔥", time: "10m", read: false },
  { id: "n_2", type: "proposal", text: "Kai sent you a swap proposal", time: "3h", read: false },
  { id: "n_3", type: "chat", text: "Mira sent a message", time: "1h", read: true },
  { id: "n_4", type: "coins", text: "You earned +50 BC for completing a swap!", time: "1d", read: true },
  { id: "n_5", type: "system", text: "Your trust score went up to 92 ✨", time: "2d", read: true },
];

export const SWAP_TRACKER = [
  { id: "s_1", stage: "Proposal", status: "done", time: "Mon 3:12pm" },
  { id: "s_2", stage: "Accepted", status: "done", time: "Mon 6:40pm" },
  { id: "s_3", stage: "Contract Signed", status: "done", time: "Tue 10:20am" },
  { id: "s_4", stage: "Shipped / Handoff", status: "current", time: "Tue 4:15pm" },
  { id: "s_5", stage: "Received", status: "pending", time: "-" },
  { id: "s_6", stage: "Rated & Closed", status: "pending", time: "-" },
];

export const CONTRACTS = [
  {
    id: "ct_1", partyA: "u_me", partyB: "u_mira", swap: "p_2",
    items: ["Monstera cutting (rooted)", "Logo & brand kit"],
    terms: [
      "Delivery within 7 days of signature",
      "Both parties agree to rate the swap upon completion",
      "Disputes resolved through BAARTER mediation",
    ],
    status: "signed", signedA: true, signedB: true, date: "2025-11-14",
  },
  {
    id: "ct_2", partyA: "u_me", partyB: "u_kai", swap: "p_1",
    items: ["Monstera cutting (rooted)", "Element skateboard + trucks"],
    terms: [
      "Shipping cost split 50/50",
      "Item condition confirmed via video call",
      "Return window: 3 days",
    ],
    status: "pending", signedA: true, signedB: false, date: "-",
  },
];

export const DISPUTES = [
  {
    id: "d_1", swap: "p_2", against: "u_ren", status: "open",
    reason: "Item not as described",
    detail: "Camera arrived with light leak not mentioned in listing.",
    opened: "1 day ago",
  },
];

export const WALLET_HISTORY = [
  { id: "w_1", type: "earn", amount: 50, reason: "Swap completed", time: "1d ago" },
  { id: "w_2", type: "earn", amount: 200, reason: "Trust score bonus", time: "3d ago" },
  { id: "w_3", type: "spend", amount: -100, reason: "Boosted a listing", time: "5d ago" },
  { id: "w_4", type: "earn", amount: 25, reason: "Referral bonus (@kaiwave)", time: "1w ago" },
  { id: "w_5", type: "earn", amount: 500, reason: "Welcome bonus", time: "3w ago" },
];

export const REVIEWS = [
  {
    id: "r_1", from: "u_mira", to: "u_me", rating: 5,
    text: "Fast, kind, plant arrived healthy. 10/10 would swap again.", time: "2 weeks ago",
  },
  {
    id: "r_2", from: "u_zoe", to: "u_me", rating: 5,
    text: "Great communication. Would totally trade again.", time: "1 month ago",
  },
  {
    id: "r_3", from: "u_dex", to: "u_me", rating: 4,
    text: "Solid trade. Packaging could be better.", time: "2 months ago",
  },
];
