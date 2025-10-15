// ============================================
// 网站配置模板 - OptiNook Digital Marketing
// ============================================
// 这是一个示例配置文件，展示所有可配置的选项
// 复制此文件为 config.template.js 并修改为您的网站内容

export const CURRENT_WEBSITE_CONTENT = {
  // === 基础网站信息 ===
  title: "OptiNook",
  description: "Master digital marketing with proven SEO strategies, content optimization techniques, and data-driven growth solutions.",
  tagline: "Digital Marketing Excellence",
  author: "OptiNook Team",
  url: "https://optinook.com",
  locale: "en-US",
  dir: "ltr",
  charset: "UTF-8",
  basePath: "/",
  postsPerPage: 6,
  googleAnalyticsId: "G-XXXXXXXXXX", // 替换为你的Google Analytics ID

  // === 主题配置 ===
  theme: {
    name: "OptiNook Digital Marketing",
    category: "Digital Marketing & SEO",
    focus: "SEO optimization, content marketing, social media strategies, and online business growth",
    targetAudience: "Digital marketers, content creators, entrepreneurs, and business owners"
  },

  // === 分类配置 ===
  categories: [
    "seo-optimization",
    "content-marketing",
    "social-media",
    "email-marketing",
    "affiliate-marketing",
    "digital-advertising",
    "analytics-insights",
    "conversion-optimization"
  ],

  // === SEO配置 ===
  seo: {
    defaultTitle: "OptiNook - Digital Marketing & SEO Strategies",
    titleTemplate: "%s | OptiNook",
    defaultDescription: "Master digital marketing with proven SEO strategies, content optimization techniques, and data-driven growth solutions.",
    defaultImage: "/images/og-image.jpg",
    twitterHandle: "@optinook",
    locale: "en_US",
    type: "website"
  },

  // === 作者配置 ===
  authors: {
    mode: "random", // 可选: "random", "fixed", "rotating"
    defaultAuthor: "OptiNook Team",
    availableAuthors: [
      "Sarah Chen",
      "Michael Roberts",
      "Emily Johnson",
      "David Kim",
      "Jessica Martinez"
    ]
  },

  // === 图片配置 ===
  images: {
    optimization: {
      enabled: true,
      quality: 85,
      formats: ["webp", "avif"]
    },
    lazyLoading: true,
    placeholder: "blur"
  },

  // === 文章配置 ===
  articles: {
    showAuthor: true,
    showDate: true,
    showReadTime: true,
    showCategories: true,
    showTags: true,
    showRelated: true,
    relatedCount: 3,
    enableComments: false,
    enableSharing: true
  },

  // === UI配置 ===
  ui: {
    navbar: {
      sticky: true,
      showSearch: true,
      showThemeToggle: false
    },
    footer: {
      showNewsletter: true,
      showSocialLinks: true,
      showCategories: true,
      copyrightText: "© 2025 OptiNook. All rights reserved."
    },
    homepage: {
      showHero: true,
      showFeaturedPosts: true,
      showCategories: true,
      showLatestPosts: true,
      heroTitle: "Master Digital Marketing",
      heroSubtitle: "Expert strategies for SEO, content marketing, and online growth"
    }
  },

  // === 广告配置 ===
  advertising: {
    enableAds: true,
    adSenseId: "ca-pub-XXXXXXXXXX", // 替换为你的AdSense ID
    positions: {
      header: false,
      sidebar: true,
      inArticle: true,
      footer: false
    }
  },

  // === 预览模式配置 ===
  previewMode: {
    enabled: false,
    password: "preview123"
  },

  // === 品牌配置 ===
  branding: {
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    fontFamily: "Inter, system-ui, sans-serif",
    logoUrl: "/images/logo.png",
    faviconUrl: "/favicon.ico"
  },

  // === 站点引用 ===
  siteReferences: {
    generalEmail: "hello@optinook.com",
    supportEmail: "support@optinook.com",
    businessEmail: "business@optinook.com",
    privacyEmail: "privacy@optinook.com"
  },

  // === 页面内容配置 ===
  pages: {
    // About页面
    about: {
      title: "About OptiNook",
      subtitle: "Your trusted partner in digital marketing excellence",
      mission: "We empower businesses to thrive in the digital landscape through innovative marketing strategies, data-driven insights, and proven optimization techniques.",
      whatWeDo: {
        title: "What We Do",
        services: [
          {
            title: "SEO Optimization",
            description: "Boost your search rankings with proven SEO strategies and technical optimization."
          },
          {
            title: "Content Marketing",
            description: "Create compelling content that engages audiences and drives conversions."
          },
          {
            title: "Social Media Strategy",
            description: "Build brand awareness and engagement across all social platforms."
          },
          {
            title: "Analytics & Insights",
            description: "Make data-driven decisions with comprehensive analytics and reporting."
          }
        ]
      },
      ourValues: {
        title: "Our Values",
        values: [
          {
            title: "Innovation",
            description: "Stay ahead with cutting-edge digital marketing strategies."
          },
          {
            title: "Results-Driven",
            description: "Focus on measurable outcomes and ROI for every campaign."
          },
          {
            title: "Transparency",
            description: "Clear communication and honest reporting at every step."
          },
          {
            title: "Excellence",
            description: "Deliver exceptional quality in everything we do."
          }
        ]
      },
      callToAction: {
        title: "Ready to Grow Your Business?",
        description: "Let's work together to achieve your digital marketing goals.",
        buttonText: "Get Started",
        buttonLink: "/contact"
      }
    },

    // Contact页面
    contact: {
      title: "Get in Touch",
      description: "Have a question or ready to start your digital marketing journey? We'd love to hear from you.",
      contactInfo: {
        email: "hello@optinook.com",
        emailNote: "We typically respond within 24 hours.",
        location: "Global",
        locationNote: "Serving clients worldwide",
        businessHours: "Monday - Friday",
        businessHoursDetail: "9:00 AM - 6:00 PM EST"
      },
      form: {
        nameLabel: "Your Name",
        emailLabel: "Email Address",
        subjectLabel: "Subject",
        messageLabel: "How can we help you?",
        submitButton: "Send Message",
        successMessage: "Thank you! We'll get back to you soon.",
        errorMessage: "Something went wrong. Please try again."
      }
    },

    // Privacy页面
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "January 2025",
      subtitle: "Your privacy is important to us",
      sections: [
        {
          title: "Information We Collect",
          content: "We collect information you provide directly, such as when you contact us or subscribe to our newsletter."
        },
        {
          title: "How We Use Information",
          content: "We use your information to provide services, communicate with you, and improve our offerings."
        },
        {
          title: "Data Security",
          content: "We implement appropriate security measures to protect your personal information."
        }
      ]
    },

    // Terms页面
    terms: {
      title: "Terms of Service",
      lastUpdated: "January 2025",
      subtitle: "Please read these terms carefully",
      sections: [
        {
          title: "Acceptance of Terms",
          content: "By using our services, you agree to these terms and conditions."
        },
        {
          title: "Use of Services",
          content: "You may use our services for lawful purposes only."
        },
        {
          title: "Intellectual Property",
          content: "All content on this site is protected by copyright and other intellectual property laws."
        }
      ]
    }
  }
};

// === 导航链接 ===
export const CURRENT_NAVIGATION_LINKS = [
  { href: "/", text: "Home" },
  { href: "/about", text: "About" },
  { href: "/articles", text: "Articles" },
  { href: "/categories", text: "Categories" },
  { href: "/contact", text: "Contact" }
];

// === 页脚链接 ===
export const CURRENT_OTHER_LINKS = [
  { href: "/about", text: "About Us" },
  { href: "/contact", text: "Contact" },
  { href: "/privacy", text: "Privacy Policy" },
  { href: "/terms", text: "Terms of Service" },
  { href: "/sitemap", text: "Sitemap" }
];

// === 社交媒体链接 ===
export const CURRENT_SOCIAL_LINKS = [
  { href: "https://twitter.com/optinook", text: "Twitter", icon: "newTwitter" },
  { href: "https://linkedin.com/company/optinook", text: "LinkedIn", icon: "linkedIn" },
  { href: "https://facebook.com/optinook", text: "Facebook", icon: "facebook" },
  { href: "https://instagram.com/optinook", text: "Instagram", icon: "instagram" }
];

// === 分类信息 ===
export const CATEGORY_INFO = {
  "seo-optimization": {
    name: "SEO Optimization",
    description: "Master search engine optimization techniques",
    icon: "🔍",
    color: "#3B82F6"
  },
  "content-marketing": {
    name: "Content Marketing",
    description: "Create content that converts",
    icon: "📝",
    color: "#10B981"
  },
  "social-media": {
    name: "Social Media",
    description: "Build your social presence",
    icon: "📱",
    color: "#8B5CF6"
  },
  "email-marketing": {
    name: "Email Marketing",
    description: "Effective email campaigns",
    icon: "📧",
    color: "#F59E0B"
  },
  "affiliate-marketing": {
    name: "Affiliate Marketing",
    description: "Maximize affiliate revenue",
    icon: "🤝",
    color: "#EF4444"
  },
  "digital-advertising": {
    name: "Digital Advertising",
    description: "PPC and display advertising",
    icon: "📢",
    color: "#14B8A6"
  },
  "analytics-insights": {
    name: "Analytics & Insights",
    description: "Data-driven decisions",
    icon: "📊",
    color: "#6366F1"
  },
  "conversion-optimization": {
    name: "Conversion Optimization",
    description: "Improve conversion rates",
    icon: "🎯",
    color: "#EC4899"
  }
};