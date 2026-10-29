import { EducationalVideo, Testimonial } from '../types';

export const EDUCATIONAL_VIDEOS: EducationalVideo[] = [
  {
    id: "vid-1",
    title: "Truth About 'Refurbished' vs Original Pre-Owned Phones",
    topic: "Market Transparency",
    duration: "11:42",
    description: "Understand why Cortek avoids refurbished devices and how cheap aftermarket LCD panels and replica shells hurt buyers in the Karol Bagh second-hand market.",
    youtubeUrl: "https://www.youtube.com/@Cortekenterprises",
    thumbnailGradient: "from-amber-950 via-slate-900 to-slate-950",
    viewsCount: "Cortek YouTube Channel"
  },
  {
    id: "vid-2",
    title: "How to Detect Fake 100% Battery Health Boost Chips",
    topic: "Hardware Inspection",
    duration: "08:15",
    description: "Watch a live demonstration of how some sellers program battery chips to show false 100% health, and how to verify real 3uTools and coconutBattery cycle logs.",
    youtubeUrl: "https://www.youtube.com/@Cortekenterprises",
    thumbnailGradient: "from-blue-950 via-slate-900 to-slate-950",
    viewsCount: "Cortek YouTube Channel"
  },
  {
    id: "vid-3",
    title: "10-Point Checklist Before Paying for Any Used Phone",
    topic: "Buyer Guide",
    duration: "14:20",
    description: "Step-by-step physical and software testing guide: True Tone check, Face ID infrared sensor test, OLED black uniformity, and carrier IMEI blacklist verification.",
    youtubeUrl: "https://www.youtube.com/@Cortekenterprises",
    thumbnailGradient: "from-emerald-950 via-slate-900 to-slate-950",
    viewsCount: "Cortek YouTube Channel"
  }
];

export const DEMO_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    customerName: "Aman Sharma",
    city: "Rohini, New Delhi",
    devicePurchased: "iPhone 13 (128GB - Midnight)",
    rating: 5,
    comment: "Found them through their YouTube channel explaining original vs fake screens. Visited their Karol Bagh shop, tested the phone completely on 3uTools rig, checked TrueTone and original battery health right in front of me. 100% transparent dealing and got proper store tax invoice!",
    date: "2 weeks ago",
    verifiedPurchase: true,
    isGoogleReview: true,
    reviewerBadge: "Local Guide • 42 reviews",
    likesCount: 14
  },
  {
    id: "test-2",
    customerName: "Rohan Verma",
    city: "Noida, Sector 62",
    devicePurchased: "Samsung Galaxy S23 Ultra (256GB)",
    rating: 5,
    comment: "I checked stock on their WhatsApp catalog first, confirmed the counter price, and drove to Karol Bagh. Honest disclosure about a tiny hairline mark on the frame which was exactly as photographed. Original box and S-Pen tested. Best pre-owned experience in Delhi NCR.",
    date: "1 month ago",
    verifiedPurchase: true,
    isGoogleReview: true,
    reviewerBadge: "Verified Google Reviewer",
    likesCount: 9
  },
  {
    id: "test-3",
    customerName: "Karanjit Singh",
    city: "Janakpuri, New Delhi",
    devicePurchased: "OnePlus 11 5G (256GB)",
    rating: 5,
    comment: "Most shops in Gaffar market try to push refurbished pieces with cheap duplicate screens. Cortek gave me original box, bill, and genuine 100W SuperVOOC charger. Tested my Jio 5G SIM on the spot. Highly recommended!",
    date: "3 weeks ago",
    verifiedPurchase: true,
    isGoogleReview: true,
    reviewerBadge: "Local Guide • 18 reviews",
    likesCount: 11
  },
  {
    id: "test-4",
    customerName: "Priyanka Malhotra",
    city: "Lajpat Nagar, New Delhi",
    devicePurchased: "iPhone 14 Pro (128GB - Deep Purple)",
    rating: 5,
    comment: "Was worried about battery boost chips, but the Cortek team plugged the phone into their diagnostic computer and showed me genuine factory cycle logs and 89% untouched battery health. Very polite staff and honest pricing.",
    date: "1 month ago",
    verifiedPurchase: true,
    isGoogleReview: true,
    reviewerBadge: "Verified Google Reviewer",
    likesCount: 8
  },
  {
    id: "test-5",
    customerName: "Vikramaditya Roy",
    city: "Gurugram, Cyber City",
    devicePurchased: "Google Pixel 8 (128GB - Hazel)",
    rating: 5,
    comment: "Cleanest second-hand phone experience in Delhi. The device was in immaculate condition. No hidden charges, no bargaining gimmicks. Exactly what they showed on video.",
    date: "2 months ago",
    verifiedPurchase: true,
    isGoogleReview: true,
    reviewerBadge: "Local Guide • 65 reviews",
    likesCount: 19
  },
  {
    id: "test-6",
    customerName: "Sahil Gupta",
    city: "Paschim Vihar, Delhi",
    devicePurchased: "iPhone 12 (128GB - Blue)",
    rating: 5,
    comment: "Took the Blue Line metro to Karol Bagh Gate 4, walked 3 mins to Cortek. Tested Face ID and camera zoom thoroughly. Great price compared to online refurbished portals.",
    date: "Recent Store Visit",
    verifiedPurchase: true,
    isGoogleReview: true,
    reviewerBadge: "Verified Google Reviewer",
    likesCount: 7
  }
];

export const BUYER_INSPECTION_CHECKLIST = [
  {
    step: "1",
    title: "Verify IMEI & Serial Number",
    description: "Match IMEI on SIM tray, device settings (`*#06#`), and bill to verify legitimate ownership.",
    keyCheck: "Dial *#06# & verify on official brand warranty portal"
  },
  {
    step: "2",
    title: "Inspect Original Display & True Tone",
    description: "Check for original OLED deep blacks. Look for True Tone toggle and seamless brightness sensors (cheap duplicate screens lack True Tone).",
    keyCheck: "Display > True Tone toggle active & no discoloration"
  },
  {
    step: "3",
    title: "Check True Battery Health",
    description: "Look at Settings > Battery Health and compare with real-world drain. Honest 85%-92% health on a 1-2 year old device is normal and safer than fake 100% boosted batteries.",
    keyCheck: "No 'Unknown Part' warning in iOS / Android diagnostics"
  },
  {
    step: "4",
    title: "Test All Cameras & Microphones",
    description: "Switch through 0.5x Ultra-Wide, 1x, and Telephoto zoom lenses. Record a 5-second video speaking into top and bottom microphones to test audio clarity.",
    keyCheck: "Smooth optical autofocus & no sensor dust spots"
  },
  {
    step: "5",
    title: "Verify Face ID / Biometrics",
    description: "Ensure TrueDepth infrared sensor or in-display optical/ultrasonic fingerprint reader enrolls swiftly without error.",
    keyCheck: "Setup Face ID / Fingerprint cleanly"
  },
  {
    step: "6",
    title: "Test Cellular 5G, Wi-Fi & Bluetooth",
    description: "Insert your SIM card, make a call on speakerphone, check 5G data connectivity, and connect to Wi-Fi/Bluetooth.",
    keyCheck: "Clear earpiece audio & active 5G/4G signal bars"
  },
  {
    step: "7",
    title: "Check Fast Charging & Port",
    description: "Plug in the charger from both sides of the cable to ensure pins are clean and fast charging initiates immediately.",
    keyCheck: "No loose wobble in port, steady charging"
  }
];
