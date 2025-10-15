import type { Link } from "../types";

// 动态获取 Astro 配置
const getBaseUrl = () => {
  if (import.meta.env.SITE && import.meta.env.BASE_URL) {
    return `${import.meta.env.SITE}${import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL}`;
  }
  return "https://AutoMobility.com";
};

const getBasePath = () => {
  return import.meta.env.BASE_URL || "/";
};

export const SITE = {
  "title": "AutoMobility",
  "description": "Your destination for the latest in automotive and mobility solutions.",
  "tagline": "Driving the future of transportation.",
  "author": "AutoMobility Team",
  "url": getBaseUrl(),
  "locale": "en-US",
  "dir": "ltr",
  "charset": "UTF-8",
  "basePath": getBasePath(),
  "postsPerPage": 5,
  "googleAnalyticsId": "",
  "theme": {
    "name": "AutoMobility",
    "category": "Automotive & Mobility",
    "focus": "Innovating transportation solutions for a sustainable future.",
    "targetAudience": "Automotive enthusiasts, industry professionals, and mobility advocates."
  },
  "categories": [
    "electric-vehicles",
    "car-reviews",
    "mobility-tech",
    "sustainable-transport",
    "auto-industry-news",
    "driving-tips",
    "car-maintenance",
    "future-transportation"
  ],
  "robots": {
    "index": true,
    "follow": true,
    "sitemap": "/sitemap.xml"
  },
  "schema": {
    "article": {
      "enabled": true,
      "defaultAuthor": "AutoMobility Team"
    },
    "organization": {
      "enabled": true
    },
    "website": {
      "enabled": true
    }
  },
  "pages": {
    "about": {
      "title": "About AutoMobility",
      "subtitle": "Driving innovation in transportation.",
      "mission": "To provide comprehensive insights and resources on automotive and mobility solutions.",
      "whatWeDo": {
        "title": "What We Do",
        "services": [
          {
            "title": "Vehicle Reviews",
            "description": "In-depth reviews of the latest vehicles."
          },
          {
            "title": "Mobility Insights",
            "description": "Analysis of emerging mobility trends."
          },
          {
            "title": "Sustainability Initiatives",
            "description": "Promoting eco-friendly transportation solutions."
          }
        ]
      },
      "ourValues": {
        "title": "Our Values",
        "values": [
          {
            "title": "Innovation",
            "description": "Constantly pushing the boundaries of technology."
          },
          {
            "title": "Sustainability",
            "description": "Committed to a greener future."
          },
          {
            "title": "Community",
            "description": "Building a community of automotive enthusiasts."
          },
          {
            "title": "Integrity",
            "description": "Providing honest and unbiased information."
          }
        ]
      },
      "callToAction": {
        "title": "Join Us",
        "description": "Start your journey today",
        "buttonText": "Explore Resources",
        "buttonLink": "/blog"
      }
    },
    "overview": {
      "title": "What is Automotive & Mobility?",
      "description": "Understanding the evolving landscape of automotive technology and mobility solutions.",
      "footerTagline": "AutoMobility — Driving the future.",
      "footerDescription": "Learn how innovation is shaping transportation.",
      "footerFocus": "Focus: Advancing sustainable transportation.",
      "sections": {
        "blog": "Articles",
        "info": "Resources",
        "legal": "Legal"
      }
    },
    "support": {
      "title": "Help & Support",
      "description": "Get assistance with Automotive & Mobility.",
      "subtitle": "Expert guidance for your journey.",
      "quickActions": [
        {
          "text": "Contact Support",
          "href": "#contact-channels",
          "primary": true
        },
        {
          "text": "Browse FAQ",
          "href": "#faq",
          "primary": false
        }
      ],
      "categories": [
        {
          "id": "getting-started",
          "title": "Getting Started",
          "description": "Learn the basics of automotive and mobility.",
          "email": "learn@AutoMobility.com",
          "icon": "rocket"
        },
        {
          "id": "content",
          "title": "Content Questions",
          "description": "Content help regarding articles and resources.",
          "email": "content@AutoMobility.com",
          "icon": "pencil"
        },
        {
          "id": "community",
          "title": "Community Support",
          "description": "Support from fellow automotive enthusiasts.",
          "email": "community@AutoMobility.com",
          "icon": "users"
        },
        {
          "id": "partnerships",
          "title": "Partnerships & Press",
          "description": "Business inquiries related to partnerships.",
          "email": "partnerships@AutoMobility.com",
          "icon": "handshake"
        }
      ],
      "contactChannels": {
        "title": "Contact Channels",
        "description": "Choose the best way to reach our team.",
        "channels": [
          {
            "title": "General Support",
            "description": "General questions",
            "detail": "Response within 24–48 hours",
            "action": "support@AutoMobility.com"
          },
          {
            "title": "Content Inquiries",
            "description": "Content questions",
            "detail": "Response within 2–3 business days",
            "action": "content@AutoMobility.com"
          },
          {
            "title": "Business & Partnerships",
            "description": "Business inquiries",
            "detail": "Response within 3–5 business days",
            "action": "partnerships@AutoMobility.com"
          },
          {
            "title": "Technical Issues",
            "description": "Technical help",
            "detail": "Response within 24 hours",
            "action": "tech@AutoMobility.com"
          }
        ]
      },
      "faq": {
        "title": "Frequently Asked Questions",
        "items": [
          {
            "question": "How do I get started?",
            "answer": "Start by exploring our resources on the website."
          },
          {
            "question": "Is this service free?",
            "answer": "Yes, basic access is free for all users."
          },
          {
            "question": "How can I contribute?",
            "answer": "Contact us to learn about contribution opportunities."
          },
          {
            "question": "What support is available?",
            "answer": "We offer email and community support."
          },
          {
            "question": "How often is content updated?",
            "answer": "We update our content regularly to ensure accuracy."
          }
        ]
      }
    },
    "terms": {
      "title": "Terms of Service",
      "description": "Terms and conditions for using AutoMobility's website and services.",
      "subtitle": "By using AutoMobility.com, you agree to these terms.",
      "lastUpdated": "January 2025",
      "introduction": "Welcome to AutoMobility. These Terms of Service govern your use of our website.",
      "sections": [
        {
          "id": "acceptance",
          "title": "1. Acceptance of Terms",
          "content": "By accessing our website, you agree to these terms."
        },
        {
          "id": "use-of-content",
          "title": "2. Use of Content",
          "permittedUses": [
            "Personal use",
            "Educational use",
            "Sharing with attribution"
          ],
          "restrictions": [
            "No unauthorized reproduction",
            "No commercial use without permission",
            "No scraping"
          ]
        },
        {
          "id": "content-disclaimer",
          "title": "3. Content Disclaimer",
          "content": "Content is for informational purposes only."
        },
        {
          "id": "user-conduct",
          "title": "4. User Conduct",
          "content": "You agree to act lawfully and respectfully.",
          "prohibitions": [
            {
              "title": "Violate Laws",
              "description": "Do not use for illegal purposes"
            },
            {
              "title": "Mislead Others",
              "description": "Do not provide false information"
            },
            {
              "title": "Spread Malware",
              "description": "Do not transmit harmful code"
            },
            {
              "title": "Unauthorized Access",
              "description": "Do not attempt unauthorized access"
            }
          ]
        },
        {
          "id": "intellectual-property",
          "title": "5. Intellectual Property",
          "content": "All content is protected by copyright.",
          "license": "Limited personal use only."
        },
        {
          "id": "disclaimers",
          "title": "6. Service Disclaimers",
          "content": "Service provided as-is without warranties."
        },
        {
          "id": "limitation",
          "title": "7. Limitation of Liability",
          "content": "We are not liable for damages."
        },
        {
          "id": "termination",
          "title": "8. Termination",
          "content": "We may terminate access at any time."
        },
        {
          "id": "changes",
          "title": "9. Changes to These Terms",
          "content": "We may update terms at any time."
        },
        {
          "id": "contact",
          "title": "10. Contact Information",
          "content": "Contact legal@AutoMobility.com for questions."
        }
      ]
    },
    "privacy": {
      "title": "Privacy Policy",
      "description": "Learn how AutoMobility collects, uses, and protects your personal information.",
      "subtitle": "Your privacy and data security are our priorities.",
      "lastUpdated": "January 2025",
      "introduction": "AutoMobility is committed to protecting your privacy.",
      "sections": [
        {
          "id": "information-collect",
          "title": "1. Information We Collect",
          "subsections": [
            {
              "title": "Information You Provide",
              "content": "We collect information you provide directly.",
              "items": [
                "Email addresses",
                "Contact information",
                "User preferences",
                "Feedback",
                "Account details"
              ]
            },
            {
              "title": "Automatically Collected Information",
              "content": "We automatically collect certain technical data.",
              "items": [
                "Device information",
                "IP address",
                "Browser type",
                "Pages viewed",
                "Referring sites"
              ]
            }
          ]
        },
        {
          "id": "how-we-use",
          "title": "2. How We Use Your Information",
          "content": "We use information to:",
          "uses": [
            "Provide services",
            "Send updates",
            "Respond to inquiries",
            "Improve our site",
            "Ensure security",
            "Legal compliance"
          ]
        },
        {
          "id": "information-sharing",
          "title": "3. Information Sharing",
          "content": "We do not sell personal information."
        },
        {
          "id": "data-security",
          "title": "4. Data Security",
          "content": "We implement security measures to protect your data."
        },
        {
          "id": "your-rights",
          "title": "5. Your Rights",
          "content": "You have rights regarding your personal data."
        },
        {
          "id": "cookies",
          "title": "6. Cookies and Tracking",
          "content": "We use cookies to enhance your experience."
        },
        {
          "id": "children",
          "title": "7. Children's Privacy",
          "content": "Our services are not directed to children under 13."
        },
        {
          "id": "changes",
          "title": "8. Changes to This Policy",
          "content": "We may update this policy periodically."
        },
        {
          "id": "contact",
          "title": "9. Contact Us",
          "content": "Contact privacy@AutoMobility.com with questions."
        }
      ]
    }
  }
};

export const NAVIGATION_LINKS: Link[] = [
  {
    "href": "/about",
    "text": "About Us"
  },
  {
    "href": "/articles",
    "text": "Articles"
  },
  {
    "href": "/events",
    "text": "Events"
  },
  {
    "href": "/categories",
    "text": "Categories"
  },
  {
    "href": "/support",
    "text": "Support"
  },
  {
    "href": "/contact",
    "text": "Contact Us"
  },
  {
    "href": "/privacy",
    "text": "Privacy Policy"
  }
];

export const NAV_BAR_LINKS = [
  {
    "text": "Overview",
    "link": "/overview/"
  },
  {
    "text": "Categories",
    "dropdown": "dynamic"
  },
  {
    "text": "Resources",
    "dropdown": [
      {
        "text": "All Articles",
        "link": "/blog/"
      },
      {
        "text": "Categories",
        "link": "/categories/"
      }
    ]
  },
  {
    "text": "About",
    "dropdown": [
      {
        "text": "Contact",
        "link": "/contact/"
      },
      {
        "text": "Privacy Policy",
        "link": "/privacy/"
      },
      {
        "text": "Terms of Service",
        "link": "/terms/"
      }
    ]
  }
];

export const FOOTER_NAVIGATION_LINKS: Link[] = [
  {
    "href": "/overview",
    "text": "Overview"
  },
  {
    "href": "/blog",
    "text": "Articles"
  },
  {
    "href": "/categories",
    "text": "Categories"
  },
  {
    "href": "/resources",
    "text": "Resources"
  }
];

export const FOOTER_LEGAL_LINKS: Link[] = [
  {
    "href": "/terms",
    "text": "Terms of Service"
  },
  {
    "href": "/privacy",
    "text": "Privacy Policy"
  },
  {
    "href": "/support",
    "text": "Support"
  }
];

export const OTHER_LINKS: Link[] = [
  {
    "href": "/about",
    "text": "About us"
  },
  {
    "href": "/contact",
    "text": "Contact"
  },
  {
    "href": "/privacy",
    "text": "Privacy"
  },
  {
    "href": "/terms",
    "text": "Terms"
  }
];

export const SOCIAL_LINKS: Link[] = [
  {
    "href": "https://twitter.com/popzic",
    "text": "Twitter",
    icon: "newTwitter"
  },
  {
    "href": "https://linkedin.com/company/popzic",
    "text": "LinkedIn",
    icon: "linkedin"
  },
  {
    "href": "https://youtube.com/@popzic",
    "text": "YouTube",
    icon: "youtube"
  },
  {
    "href": "https://github.com/popzic",
    "text": "GitHub",
    icon: "github"
  }
];

// Category Information
export const CATEGORY_INFO = {
  "electric-vehicles": {
    "name": "Electric Vehicles",
    "description": "Explore the latest in electric vehicle technology, reviews, and tips for EV owners.",
    "shortDescription": "Latest news and reviews for electric vehicles.",
    "icon": "⚡",
    "color": "#00FF00",
    "aboutContent": "This category covers everything related to electric vehicles, from comprehensive reviews to how-to guides on maximizing your EV's performance.",
    "detailedDescription": "Dive into the world of electric vehicles with in-depth reviews, comparisons, and tips to help you make informed decisions. Stay updated on the latest trends in the EV market.",
    "popularTopics": [
      "Electric SUVs",
      "Charging Tips",
      "EV Comparisons"
    ],
    "seoKeywords": "electric vehicles, EV reviews, charging tips, sustainable transportation",
    "keywords": [
      "electric cars",
      "EV technology",
      "latest EV news",
      "electric vehicle reviews"
    ]
  },
  "car-reviews": {
    "name": "Car Reviews",
    "description": "Detailed reviews and comparisons of the latest cars on the market.",
    "shortDescription": "Honest reviews and comparisons of cars.",
    "icon": "🚗",
    "color": "#0000FF",
    "aboutContent": "In this category, we provide thorough reviews of various cars, comparing their features, performance, and value.",
    "detailedDescription": "Get insights into the latest car models with our comprehensive reviews and comparisons. Whether you're looking for electric, hybrid, or traditional vehicles, we've got you covered.",
    "popularTopics": [
      "Electric Car Reviews",
      "Hybrid Comparisons",
      "SUV Reviews"
    ],
    "seoKeywords": "car reviews, vehicle comparisons, latest car models, automotive insights",
    "keywords": [
      "car reviews",
      "vehicle features",
      "car comparisons",
      "best cars"
    ]
  },
  "mobility-tech": {
    "name": "Mobility Tech",
    "description": "Discover the latest technology shaping the future of transportation.",
    "shortDescription": "Innovations and trends in mobility technology.",
    "icon": "🔧",
    "color": "#FFA500",
    "aboutContent": "This category focuses on technology innovations in the mobility sector, including autonomous vehicles, ride-sharing, and more.",
    "detailedDescription": "Stay updated with the latest trends and technologies that are transforming how we move. From autonomous vehicles to smart transportation solutions, explore the future of mobility.",
    "popularTopics": [
      "Autonomous Vehicles",
      "Ride-Sharing Innovations",
      "Mobility Apps"
    ],
    "seoKeywords": "mobility technology, transportation innovations, autonomous vehicles, smart transport",
    "keywords": [
      "mobility tech",
      "transportation innovations",
      "future of mobility",
      "latest tech trends"
    ]
  },
  "sustainable-transport": {
    "name": "Sustainable Transport",
    "description": "Explore eco-friendly transportation options and innovations.",
    "shortDescription": "Sustainable solutions for modern transport.",
    "icon": "🌍",
    "color": "#32CD32",
    "aboutContent": "This category highlights sustainable transportation methods, including public transit, biking, and electric solutions.",
    "detailedDescription": "Discover ways to reduce your carbon footprint with sustainable transport options. Learn about the latest innovations and practices that promote eco-friendly commuting.",
    "popularTopics": [
      "Public Transport Benefits",
      "Electric Biking",
      "Sustainable Commuting"
    ],
    "seoKeywords": "sustainable transport, eco-friendly commuting, green transportation, public transit",
    "keywords": [
      "sustainable transport",
      "eco-friendly options",
      "green commuting",
      "latest transport news"
    ]
  },
  "auto-industry-news": {
    "name": "Auto Industry News",
    "description": "Stay informed about the latest happenings in the automotive industry.",
    "shortDescription": "Latest news and trends in the automotive world.",
    "icon": "📰",
    "color": "#FF6347",
    "aboutContent": "This category provides updates and insights on the automotive industry, including market trends and major developments.",
    "detailedDescription": "Get the latest news on automotive innovations, industry shifts, and market trends. Stay informed about what's happening in the world of cars and transportation.",
    "popularTopics": [
      "Market Trends",
      "Industry Innovations",
      "Electric Vehicle News"
    ],
    "seoKeywords": "auto industry news, automotive trends, vehicle market, latest car developments",
    "keywords": [
      "auto industry",
      "latest news",
      "automotive trends",
      "market insights"
    ]
  },
  "driving-tips": {
    "name": "Driving Tips",
    "description": "Practical advice for safe and efficient driving.",
    "shortDescription": "Essential tips for drivers of all levels.",
    "icon": "🚦",
    "color": "#FFD700",
    "aboutContent": "This category offers valuable tips and guides for drivers to enhance their skills and safety on the road.",
    "detailedDescription": "Learn how to drive safely and efficiently with our expert driving tips. From winter preparation to long road trip advice, find everything you need to become a better driver.",
    "popularTopics": [
      "Winter Driving Tips",
      "Road Trip Planning",
      "Beginner Driving Tips"
    ],
    "seoKeywords": "driving tips, safe driving, road trip advice, driving skills",
    "keywords": [
      "driving tips",
      "safe driving",
      "road trip",
      "driving advice"
    ]
  },
  "car-maintenance": {
    "name": "Car Maintenance",
    "description": "Essential advice for keeping your vehicle in top condition.",
    "shortDescription": "Guides and tips for vehicle maintenance.",
    "icon": "🔧",
    "color": "#8B4513",
    "aboutContent": "This category covers everything related to car maintenance, helping you keep your vehicle running smoothly.",
    "detailedDescription": "Find practical guides and tips for maintaining your vehicle. From routine checks to troubleshooting common issues, ensure your car stays in optimal condition.",
    "popularTopics": [
      "Maintenance Tips",
      "Troubleshooting Guides",
      "New Owner Advice"
    ],
    "seoKeywords": "car maintenance, vehicle upkeep, maintenance tips, troubleshooting car issues",
    "keywords": [
      "car maintenance",
      "vehicle care",
      "maintenance advice",
      "troubleshooting tips"
    ]
  },
  "future-transportation": {
    "name": "Future Transportation",
    "description": "Explore visionary concepts and technologies shaping tomorrow's transport.",
    "shortDescription": "Innovations that will define the future of transportation.",
    "icon": "🚀",
    "color": "#4682B4",
    "aboutContent": "This category delves into the innovative concepts and technologies that will shape the future of transportation.",
    "detailedDescription": "Stay ahead of the curve with insights into future transportation technologies and concepts. Explore trends and innovations that promise to redefine how we travel.",
    "popularTopics": [
      "Future Mobility Trends",
      "Transportation Innovations",
      "Smart Cities"
    ],
    "seoKeywords": "future transportation, transportation innovations, mobility solutions, visionary transport",
    "keywords": [
      "future transportation",
      "transport trends",
      "mobility innovations",
      "latest transportation tech"
    ]
  }
};

// Site References
export const SITE_REFERENCES = {
  "homeTitle": "AutoMobility",
  "homeDescription": "Your destination for Automotive & Mobility insights.",
  "homeWelcome": "Welcome to AutoMobility",
  "domain": "AutoMobility.com",
  "generalEmail": "hello@AutoMobility.com",
  "privacyEmail": "privacy@AutoMobility.com",
  "legalEmail": "legal@AutoMobility.com",
  "supportEmail": "support@AutoMobility.com",
  "techEmail": "tech@AutoMobility.com",
  "businessEmail": "partnerships@AutoMobility.com",
  "contentEmail": "content@AutoMobility.com",
  "faqSiteName": "AutoMobility",
  "privacyCompanyStatement": "At AutoMobility, we are committed to protecting your privacy and securing your data.",
  "privacyServiceDescription": "Automotive & Mobility education and resources",
  "githubRepo": "https://github.com/automobility/automobility",
  "liveDemoUrl": "https://AutoMobility.com"
};

// Hero Configuration
export const HERO_CONFIG = {};

// Overview Configuration
export const OVERVIEW_CONFIG = {
  "title": "What is Automotive & Mobility?",
  "description": "Understanding the evolving landscape of automotive technology and mobility solutions.",
  "footerTagline": "AutoMobility — Driving the future.",
  "footerDescription": "Learn how innovation is shaping transportation.",
  "footerFocus": "Focus: Advancing sustainable transportation.",
  "sections": {
    "blog": "Articles",
    "info": "Resources",
    "legal": "Legal"
  }
};

// Newsletter Configuration
export const NEWSLETTER_CONFIG = {
  "title": "AutoMobility Newsletter",
  "description": "Get weekly Automotive & Mobility insights and updates.",
  "emailPlaceholder": "Enter your email",
  "subscribeButton": "Subscribe",
  "privacyNote": "We respect your privacy. Unsubscribe anytime."
};

// Legal Links Configuration
export const LEGAL_LINKS_CONFIG = {};

// SEO Configuration
export const SEO_CONFIG = {
  "defaultTitle": "AutoMobility - Automotive & Mobility",
  "titleTemplate": "%s | AutoMobility",
  "defaultDescription": "Explore the cutting-edge of automotive technology and mobility solutions.",
  "defaultImage": "/images/og/automobility-1200x630.jpg",
  "twitterHandle": "@automobility",
  "locale": "en_US",
  "type": "website"
};

// Article Configuration
export const ARTICLE_CONFIG = {};

// Image Configuration  
export const IMAGE_CONFIG = {
  "optimization": {
    "enabled": true,
    "quality": 85,
    "formats": [
      "webp",
      "avif"
    ]
  },
  "lazyLoading": true,
  "placeholder": "blur",
  "paths": {
    "og": "/images/og/automobility-1200x630.jpg",
    "hero": "/images/hero/automobility-hero.png"
  }
};

// Preview Mode Configuration
export const PREVIEW_MODE_CONFIG = {
  "enabled": false,
  "password": ""
};

// UI Text Configuration
export const UI_CONFIG = {
  "navbar": {
    "sticky": true,
    "showSearch": true,
    "showThemeToggle": false
  },
  "footer": {
    "showNewsletter": true,
    "showSocialLinks": true,
    "showCategories": true,
    "copyrightText": "© 2025 AutoMobility. All rights reserved.",
    "accessibilityNote": "Images include descriptive alt text; emoji have accessible labels."
  },
  "homepage": {
    "showHero": true,
    "showFeaturedPosts": true,
    "showCategories": true,
    "showLatestPosts": true,
    "heroTitle": "Welcome to AutoMobility",
    "heroSubtitle": "Explore the future of transportation.",
    "heroImage": "/images/hero/automobility-hero.png",
    "heroImageAlt": "Automotive & Mobility hero image"
  },
  "categoriesPage": {
    "title": "Content Categories",
    "description": "Explore our categories of automotive and mobility content.",
    "subtitle": "Find what interests you"
  },
  "images": {
    "enforceAlt": true
  },
  "componentColors": {
    "pagination": {
      "activeBackground": "from-blue-500 to-blue-600",
      "activeText": "text-base-100"
    },
    "newsletter": {
      "glowEffect": "from-blue-500 to-blue-600",
      "glowOpacity": "opacity-30"
    }
  }
};

// Advertising Configuration
export const ADVERTISING_CONFIG = {};

// Branding Configuration
export const BRANDING_CONFIG = {
  "primaryColor": "#3B82F6",
  "secondaryColor": "#1D4ED8",
  "surfaceColor": "#F9FAFB",
  "fontFamily": "Inter, system-ui, sans-serif",
  "logoUrl": "/images/logo.png",
  "faviconUrl": "/favicon.ico"
};

// Pages Configuration (About, Overview, Support, Terms, Privacy, etc.)
export const PAGES_CONFIG = {
  "about": {
    "title": "About AutoMobility",
    "subtitle": "Driving innovation in transportation.",
    "mission": "To provide comprehensive insights and resources on automotive and mobility solutions.",
    "whatWeDo": {
      "title": "What We Do",
      "services": [
        {
          "title": "Vehicle Reviews",
          "description": "In-depth reviews of the latest vehicles."
        },
        {
          "title": "Mobility Insights",
          "description": "Analysis of emerging mobility trends."
        },
        {
          "title": "Sustainability Initiatives",
          "description": "Promoting eco-friendly transportation solutions."
        }
      ]
    },
    "ourValues": {
      "title": "Our Values",
      "values": [
        {
          "title": "Innovation",
          "description": "Constantly pushing the boundaries of technology."
        },
        {
          "title": "Sustainability",
          "description": "Committed to a greener future."
        },
        {
          "title": "Community",
          "description": "Building a community of automotive enthusiasts."
        },
        {
          "title": "Integrity",
          "description": "Providing honest and unbiased information."
        }
      ]
    },
    "callToAction": {
      "title": "Join Us",
      "description": "Start your journey today",
      "buttonText": "Explore Resources",
      "buttonLink": "/blog"
    }
  },
  "overview": {
    "title": "What is Automotive & Mobility?",
    "description": "Understanding the evolving landscape of automotive technology and mobility solutions.",
    "footerTagline": "AutoMobility — Driving the future.",
    "footerDescription": "Learn how innovation is shaping transportation.",
    "footerFocus": "Focus: Advancing sustainable transportation.",
    "sections": {
      "blog": "Articles",
      "info": "Resources",
      "legal": "Legal"
    }
  },
  "support": {
    "title": "Help & Support",
    "description": "Get assistance with Automotive & Mobility.",
    "subtitle": "Expert guidance for your journey.",
    "quickActions": [
      {
        "text": "Contact Support",
        "href": "#contact-channels",
        "primary": true
      },
      {
        "text": "Browse FAQ",
        "href": "#faq",
        "primary": false
      }
    ],
    "categories": [
      {
        "id": "getting-started",
        "title": "Getting Started",
        "description": "Learn the basics of automotive and mobility.",
        "email": "learn@AutoMobility.com",
        "icon": "rocket"
      },
      {
        "id": "content",
        "title": "Content Questions",
        "description": "Content help regarding articles and resources.",
        "email": "content@AutoMobility.com",
        "icon": "pencil"
      },
      {
        "id": "community",
        "title": "Community Support",
        "description": "Support from fellow automotive enthusiasts.",
        "email": "community@AutoMobility.com",
        "icon": "users"
      },
      {
        "id": "partnerships",
        "title": "Partnerships & Press",
        "description": "Business inquiries related to partnerships.",
        "email": "partnerships@AutoMobility.com",
        "icon": "handshake"
      }
    ],
    "contactChannels": {
      "title": "Contact Channels",
      "description": "Choose the best way to reach our team.",
      "channels": [
        {
          "title": "General Support",
          "description": "General questions",
          "detail": "Response within 24–48 hours",
          "action": "support@AutoMobility.com"
        },
        {
          "title": "Content Inquiries",
          "description": "Content questions",
          "detail": "Response within 2–3 business days",
          "action": "content@AutoMobility.com"
        },
        {
          "title": "Business & Partnerships",
          "description": "Business inquiries",
          "detail": "Response within 3–5 business days",
          "action": "partnerships@AutoMobility.com"
        },
        {
          "title": "Technical Issues",
          "description": "Technical help",
          "detail": "Response within 24 hours",
          "action": "tech@AutoMobility.com"
        }
      ]
    },
    "faq": {
      "title": "Frequently Asked Questions",
      "items": [
        {
          "question": "How do I get started?",
          "answer": "Start by exploring our resources on the website."
        },
        {
          "question": "Is this service free?",
          "answer": "Yes, basic access is free for all users."
        },
        {
          "question": "How can I contribute?",
          "answer": "Contact us to learn about contribution opportunities."
        },
        {
          "question": "What support is available?",
          "answer": "We offer email and community support."
        },
        {
          "question": "How often is content updated?",
          "answer": "We update our content regularly to ensure accuracy."
        }
      ]
    }
  },
  "terms": {
    "title": "Terms of Service",
    "description": "Terms and conditions for using AutoMobility's website and services.",
    "subtitle": "By using AutoMobility.com, you agree to these terms.",
    "lastUpdated": "January 2025",
    "introduction": "Welcome to AutoMobility. These Terms of Service govern your use of our website.",
    "sections": [
      {
        "id": "acceptance",
        "title": "1. Acceptance of Terms",
        "content": "By accessing our website, you agree to these terms."
      },
      {
        "id": "use-of-content",
        "title": "2. Use of Content",
        "permittedUses": [
          "Personal use",
          "Educational use",
          "Sharing with attribution"
        ],
        "restrictions": [
          "No unauthorized reproduction",
          "No commercial use without permission",
          "No scraping"
        ]
      },
      {
        "id": "content-disclaimer",
        "title": "3. Content Disclaimer",
        "content": "Content is for informational purposes only."
      },
      {
        "id": "user-conduct",
        "title": "4. User Conduct",
        "content": "You agree to act lawfully and respectfully.",
        "prohibitions": [
          {
            "title": "Violate Laws",
            "description": "Do not use for illegal purposes"
          },
          {
            "title": "Mislead Others",
            "description": "Do not provide false information"
          },
          {
            "title": "Spread Malware",
            "description": "Do not transmit harmful code"
          },
          {
            "title": "Unauthorized Access",
            "description": "Do not attempt unauthorized access"
          }
        ]
      },
      {
        "id": "intellectual-property",
        "title": "5. Intellectual Property",
        "content": "All content is protected by copyright.",
        "license": "Limited personal use only."
      },
      {
        "id": "disclaimers",
        "title": "6. Service Disclaimers",
        "content": "Service provided as-is without warranties."
      },
      {
        "id": "limitation",
        "title": "7. Limitation of Liability",
        "content": "We are not liable for damages."
      },
      {
        "id": "termination",
        "title": "8. Termination",
        "content": "We may terminate access at any time."
      },
      {
        "id": "changes",
        "title": "9. Changes to These Terms",
        "content": "We may update terms at any time."
      },
      {
        "id": "contact",
        "title": "10. Contact Information",
        "content": "Contact legal@AutoMobility.com for questions."
      }
    ]
  },
  "privacy": {
    "title": "Privacy Policy",
    "description": "Learn how AutoMobility collects, uses, and protects your personal information.",
    "subtitle": "Your privacy and data security are our priorities.",
    "lastUpdated": "January 2025",
    "introduction": "AutoMobility is committed to protecting your privacy.",
    "sections": [
      {
        "id": "information-collect",
        "title": "1. Information We Collect",
        "subsections": [
          {
            "title": "Information You Provide",
            "content": "We collect information you provide directly.",
            "items": [
              "Email addresses",
              "Contact information",
              "User preferences",
              "Feedback",
              "Account details"
            ]
          },
          {
            "title": "Automatically Collected Information",
            "content": "We automatically collect certain technical data.",
            "items": [
              "Device information",
              "IP address",
              "Browser type",
              "Pages viewed",
              "Referring sites"
            ]
          }
        ]
      },
      {
        "id": "how-we-use",
        "title": "2. How We Use Your Information",
        "content": "We use information to:",
        "uses": [
          "Provide services",
          "Send updates",
          "Respond to inquiries",
          "Improve our site",
          "Ensure security",
          "Legal compliance"
        ]
      },
      {
        "id": "information-sharing",
        "title": "3. Information Sharing",
        "content": "We do not sell personal information."
      },
      {
        "id": "data-security",
        "title": "4. Data Security",
        "content": "We implement security measures to protect your data."
      },
      {
        "id": "your-rights",
        "title": "5. Your Rights",
        "content": "You have rights regarding your personal data."
      },
      {
        "id": "cookies",
        "title": "6. Cookies and Tracking",
        "content": "We use cookies to enhance your experience."
      },
      {
        "id": "children",
        "title": "7. Children's Privacy",
        "content": "Our services are not directed to children under 13."
      },
      {
        "id": "changes",
        "title": "8. Changes to This Policy",
        "content": "We may update this policy periodically."
      },
      {
        "id": "contact",
        "title": "9. Contact Us",
        "content": "Contact privacy@AutoMobility.com with questions."
      }
    ]
  }
};
