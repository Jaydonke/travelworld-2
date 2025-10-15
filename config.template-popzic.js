export const CURRENT_WEBSITE_CONTENT = {
  title: "PopZic",
  description: "Your go-to source for the latest in entertainment and pop culture.",
  tagline: "Stay in the loop with PopZic!",
  author: "PopZic Team",
  url: "https://Popzic.com",
  locale: "en-US",
  dir: "ltr",
  charset: "UTF-8",
  basePath: "/",
  postsPerPage: 5,
  googleAnalyticsId: "",

  branding: {
    primaryColor: "#3B82F6",
    secondaryColor: "#8B5CF6",
    surfaceColor: "#F9FAFB",
    fontFamily: "Inter, system-ui, sans-serif",
    logoUrl: "/images/logo.png",
    faviconUrl: "/favicon.ico"
  },

  colorTheme: {
    primary: "blue",
    base: "gray",
    primaryShades: {
      50: "blue-50",
      100: "blue-100", 
      200: "blue-200",
      300: "blue-300",
      400: "blue-400",
      500: "blue-500",
      600: "blue-600",
      700: "blue-700",
      800: "blue-800",
      900: "blue-900",
      950: "blue-950"
    }
  },

  seo: {
    defaultTitle: "PopZic - Your Entertainment Hub",
    titleTemplate: "%s | PopZic",
    defaultDescription: "Explore the latest movies, music, and celebrity news.",
    defaultImage: "/images/og/popzic-1200x630.jpg",
    twitterHandle: "@popzic",
    locale: "en_US",
    type: "website"
  },

  robots: { index: true, follow: true, sitemap: "/sitemap.xml" },

  theme: {
    name: "PopZic",
    category: "Entertainment & Pop Culture",
    focus: "Delivering fresh and engaging content on entertainment trends.",
    targetAudience: "Pop culture enthusiasts and entertainment seekers"
  },

  categories: ["Movies", "Television", "Music", "Celebrities", "Gaming", "Comics", "Fashion", "Social Media"],

  images: {
    optimization: { enabled: true, quality: 85, formats: ["webp", "avif"] },
    lazyLoading: "true,
    placeholder: "blur","
    paths: {
      og: "/images/og/popzic-1200x630.jpg",
      hero: "/images/hero/popzic-hero.png"
    }
  },

  ui: {
    navbar: { sticky: true, showSearch: true, showThemeToggle: false },
    footer: {
      showNewsletter: true, showSocialLinks: true, showCategories: true,
      copyrightText: "© 2025 PopZic. All rights reserved.",
      accessibilityNote: "Images include descriptive alt text; emoji have accessible labels."
    },
    homepage: {
      showHero: true, showFeaturedPosts: true, showCategories: true, showLatestPosts: true,
      heroTitle: "Welcome to PopZic!",
      heroSubtitle: "Your source for the latest in entertainment and pop culture.",
      heroImage: "/images/hero/popzic-hero.png",
      heroImageAlt: "PopZic Hero Image"
    },
    categoriesPage: {
      title: "Content Categories",
      description: "Explore our diverse categories of entertainment.",
      subtitle: "Find content that interests you!"
    },
    images: { enforceAlt: true },
    componentColors: {
      pagination: {
        activeBackground: "from-blue-500 to-blue-600",
        activeText: "text-base-100"
      },
      newsletter: {
        glowEffect: "from-blue-500 to-blue-600",
        glowOpacity: "opacity-30"
      }
    }
  },

  schema: {
    article: { enabled: true, defaultAuthor: "PopZic Team" },
    organization: { enabled: true },
    website: { enabled: true }
  },

  translations: {
    en: {
      hero_description: "Stay updated with the latest news in entertainment.",
      back_to_all_posts: "Back to all articles",
      updated_on: "Updated on",
      read_more: "Read more",
      categories: "Categories",
      table_of_contents: "Table of Contents",
      share_this_post: "Share this article",
      search_placeholder: "Search articles...",
      no_posts_found: "No articles found",
      showing_results_for: "Showing results for",
      newsletter_title: "PopZic Newsletter",
      newsletter_description: "Subscribe for the latest updates.",
      newsletter_placeholder: "Enter your email",
      newsletter_button: "Subscribe",
      footer_rights: "All rights reserved"
    }
  },

  pages: {
    about: {
      title: "About PopZic",
      subtitle: "Discover PopZic",
      mission: "To be the leading source of entertainment news and trends.",
      whatWeDo: {
        title: "What We Do",
        services: "Professional entertainment & pop culture content and resources."
      },
      ourValues: {
        title: "Our Values",
        values: Professional entertainment & pop culture content and resources.
      },
      callToAction: {
        title: "Start Exploring",
        description: "Discover our comprehensive resources on entertainment.",
        buttonText: "Explore Resources",
        buttonLink: "/blog"
      }
    },
    overview: {
      title: "Entertainment Overview",
      description: "Explore the world of entertainment and pop culture.",
      footerTagline: "Stay ahead in the entertainment game.",
      footerDescription: "Your go-to source for news, reviews, and more.",
      footerFocus: "Focusing on quality content and community engagement.",
      sections: { blog: "Articles", info: "Resources", legal: "Legal" }
    },
    support: {
      title: "Help & Support",
      description: "Need help? We're here for you.",
      subtitle: "Your questions answered.",
      faq: {
        title: "Frequently Asked Questions",
        items: [
          { question: "How often is content updated?", answer: "We publish new content weekly." },
          { question: "Is content free?", answer: "Yes, all resources are freely available." },
          { question: "Can I contribute?", answer: "We welcome guest contributions." },
          { question: "How to stay updated?", answer: "Subscribe to our newsletter." },
          { question: "Who creates content?", answer: "Experienced professionals create our content." }
        ]
      }
    }
  },

  siteReferences: {
    homeTitle: "PopZic",
    homeDescription: "Your one-stop destination for entertainment news.",
    homeWelcome: "Welcome to PopZic, your source for entertainment!",
    domain: "Popzic.com",
    generalEmail: "hello@Popzic.com",
    privacyEmail: "privacy@Popzic.com",
    legalEmail: "legal@Popzic.com",
    supportEmail: "support@Popzic.com",
    techEmail: "tech@Popzic.com",
    businessEmail: "partnerships@Popzic.com",
    contentEmail: "content@Popzic.com",
    faqSiteName: "PopZic",
    privacyCompanyStatement: "Your privacy is important to us.",
    privacyServiceDescription: "Learn how we protect your information.",
    githubRepo: "https://github.com/popzic/popzic",
    liveDemoUrl: "https://Popzic.com"
  },

  previewMode: { enabled: false, password: "" },

  newsletter: {
    title: "PopZic Newsletter",
    description: "Stay updated with the latest entertainment news.",
    emailPlaceholder: "Enter your email",
    subscribeButton: "Subscribe",
    privacyNote: "We respect your privacy. Unsubscribe anytime."
  }
};

export const ARTICLE_GENERATION_CONFIG = {
  enabled: "true,
  articles: [
    { topic: "The Rise of Streaming Platforms", keywords: ["streaming", "Netflix", "Hulu", "Amazon Prime"], category: "Movies" },
    { topic: "Top 10 Must-Watch Series of 2023", keywords: ["TV shows", "series", "2023"], category: "Television" },
    { topic: "The Impact of Music Festivals on Culture", keywords: ["music festivals", "culture", "events"], category: "Music" },
    { topic: "Celebrity Fashion Trends", keywords: ["celebrities", "fashion", "trends"], category: "Celebrities" },
    { topic: "The Evolution of Video Games", keywords: ["gaming", "history", "evolution"], category: "Gaming" },
    { topic: "Must-Read Graphic Novels", keywords: ["comics", "graphic novels", "reading list"], category: "Comics" },
    { topic: "Social Media's Influence on Pop Culture", keywords: ["social media", "influence", "pop culture"], category: "Social Media" },
    { topic: "The Impact of TikTok on Music", keywords: ["TikTok", "music", "trends"], category: "Music" },
    { topic: "Exploring the World of Anime", keywords: ["anime", "culture", "trends"], category: "Television" },
    { topic: "The Role of Fashion in Film", keywords: ["fashion", "film", "cinematography"], category: "Movies" },
    { topic: "Gaming Trends to Watch", keywords: ["gaming", "trends", "2023"], category: "Gaming" },
    { topic: "The Best Dressed Celebrities of 2023", keywords: ["celebrities", "fashion", "2023"], category: "Celebrities" },
    { topic: "The Future of Comics", keywords: ["comics", "future", "trends"], category: "Comics" },
    { topic: "Reality TV: The Good, The Bad, and The Ugly", keywords: ["reality TV", "culture", "trends"], category: "Television" },
    { topic: "Exploring Retro Video Games", keywords: ["retro", "gaming", "nostalgia"], category: "Gaming" },
    { topic: "The Power of Music in Movies", keywords: ["music", "film", "soundtracks"], category: "Movies" },
    { topic: "The Rise of K-Pop", keywords: ["K-Pop", "music", "culture"], category: "Music" },
    { topic: "A Look at Influencer Culture", keywords: ["influencers", "social media", "culture"], category: "Social Media" },
    { topic: "The Best Superhero Movies of All Time", keywords: ["superhero", "movies", "best"], category: "Movies" },
    { topic: "The Evolution of Fashion Trends", keywords: ["fashion", "trends", "history"], category: "Fashion" },
    { topic: "Top 5 Must-See Documentaries", keywords: ["documentaries", "films", "must-see"], category: "Movies" },
    { topic: "The Influence of Hip-Hop on Culture", keywords: ["hip-hop", "music", "culture"], category: "Music" },
    { topic: "The Best Streaming Platforms for Anime", keywords: ["streaming", "anime", "platforms"], category: "Television" },
    { topic: "The Impact of Social Media on Celebrity", keywords: ["social media", "celebrities", "impact"], category: "Celebrities" },
    { topic: "The Future of Fashion in Gaming", keywords: ["fashion", "gaming", "future"], category: "Gaming" }
  ],
  apiSettings: {
    model: "gpt-4o-mini",
    temperature: "0.7,
    maxTokens: 8000,"
    concurrentRequests: "5,
    retryAttempts: 3"
  }
};

export const CURRENT_NAVIGATION_LINKS = [
  { href: "/about", text: "About Us" },
  { href: "/categories", text: "Categories" },
  { href: "/blog", text: "Articles" },
  { href: "/contact", text: "Contact" },
  { href: "/support", text: "Support" },
  { href: "/privacy", text: "Privacy" }
];

export const NAV_BAR_LINKS = [
  { text: "Overview", link: "/overview/" },
  { text: "Categories", dropdown: "dynamic" },
  {
    text: "Resources",
    dropdown: [
      { text: "All Articles", link: "/blog/" },
      { text: "Categories", link: "/categories/" }
    ]
  },
  {
    text: "About",
    dropdown: [
      { text: "Contact", link: "/contact/" },
      { text: "Privacy Policy", link: "/privacy/" },
      { text: "Terms of Service", link: "/terms/" }
    ]
  }
];

export const FOOTER_NAVIGATION_LINKS = [
  { href: "/about", text: "About" },
  { href: "/blog", text: "Blog" },
  { href: "/categories", text: "Categories" },
  { href: "/contact", text: "Contact" }
];

export const FOOTER_LEGAL_LINKS = [
  { href: "/terms", text: "Terms of Service" },
  { href: "/privacy", text: "Privacy Policy" },
  { href: "/support", text: "Support" }
];

export const CURRENT_OTHER_LINKS = [
  { href: "/about", text: "About us" },
  { href: "/contact", text: "Contact" },
  { href: "/privacy", text: "Privacy" },
  { href: "/terms", text: "Terms" }
];

export const CURRENT_SOCIAL_LINKS = [
  { href: "https://twitter.com/popzic", text: "Twitter", icon: "newTwitter" },
  { href: "https://linkedin.com/company/popzic", text: "LinkedIn", icon: "linkedin" },
  { href: "https://youtube.com/@popzic", text: "YouTube", icon: "youtube" },
  { href: "https://github.com/popzic", text: "GitHub", icon: "github" }
];

export const CATEGORY_INFO = {
  "Movies": {
    name: "Movies",
    description: "Latest news and reviews about movies.",
    shortDescription: "Explore the world of films.",
    icon: "🎬",
    color: "#3B82F6",
    aboutContent: "All about the latest in cinema.",
    detailedDescription: "From blockbusters to indie films, discover reviews and insights.",
    popularTopics: ["Top Box Office", "Upcoming Releases", "Film Festivals"],
    seoKeywords: "movies, reviews, cinema, films",
    keywords: ["films", "cinema", "blockbusters", "indie", "reviews"]
  },
  "Television": {
    name: "Television",
    description: "Explore the latest TV shows and series.",
    shortDescription: "Find your next binge-watch.",
    icon: "📺",
    color: "#8B5CF6",
    aboutContent: "Your guide to the best TV shows.",
    detailedDescription: "From dramas to comedies, get insights and reviews on your favorite shows.",
    popularTopics: ["Top Series", "New Releases", "Streaming Platforms"],
    seoKeywords: "television, series, shows, reviews",
    keywords: ["TV shows", "series", "dramas", "comedies", "reviews"]
  },
  "Music": {
    name: "Music",
    description: "Stay updated with the latest in the music world.",
    shortDescription: "Discover new artists and trends.",
    icon: "🎵",
    color: "#10B981",
    aboutContent: "All things music, from albums to concerts.",
    detailedDescription: "Explore genres, trends, and the latest hits in the music industry.",
    popularTopics: Entertainment & Pop Culture insights and resources.,
    seoKeywords: "music, albums, artists, concerts",
    keywords: ["music", "albums", "artists", "concerts", "reviews"]
  },
  "Celebrities": {
    name: "Celebrities",
    description: "Get the latest news on your favorite celebrities.",
    shortDescription: "Follow celebrity news and gossip.",
    icon: "🌟",
    color: "#F59E0B",
    aboutContent: "Stay updated with the lives of celebrities.",
    detailedDescription: "From red carpet events to personal stories, find out what your favorite stars are up to.",
    popularTopics: ["Celebrity News", "Interviews", "Fashion"],
    seoKeywords: "celebrities, gossip, news, fashion",
    keywords: ["celebrities", "gossip", "news", "fashion", "events"]
  },
  "Gaming": {
    name: "Gaming",
    description: "Latest updates and reviews in the gaming world.",
    shortDescription: "Explore the gaming universe.",
    icon: "🎮",
    color: "#EF4444",
    aboutContent: "Your source for all things gaming.",
    detailedDescription: "From video game reviews to esports coverage, stay in the loop.",
    popularTopics: ["New Releases", "Esports", "Gaming Events"],
    seoKeywords: "gaming, reviews, esports, events",
    keywords: ["gaming", "video games", "reviews", "esports", "events"]
  },
  "Comics": {
    name: "Comics",
    description: "Discover the latest in comic books and graphic novels.",
    shortDescription: "Your guide to comics.",
    icon: "📚",
    color: "#6366F1",
    aboutContent: "Explore comic book news and reviews.",
    detailedDescription: "From superhero comics to graphic novels, find out what's new in the comic world.",
    popularTopics: ["New Releases", "Comic Book Events", "Author Interviews"],
    seoKeywords: "comics, graphic novels, reviews, news",
    keywords: ["comics", "graphic novels", "superheroes", "reviews", "events"]
  },
  "Fashion": {
    name: "Fashion",
    description: "Stay updated with the latest fashion trends.",
    shortDescription: "Explore fashion insights.",
    icon: "👗",
    color: "#EC4899",
    aboutContent: "Your source for fashion news.",
    detailedDescription: "From runway shows to street style, discover what's trending in fashion.",
    popularTopics: ["Fashion Weeks", "Trends", "Celebrity Styles"],
    seoKeywords: "fashion, trends, styles, news",
    keywords: ["fashion", "trends", "styles", "celebrity", "news"]
  },
  "Social Media": {
    name: "Social Media",
    description: "Explore the impact of social media on culture.",
    shortDescription: "Stay updated with social media trends.",
    icon: "📱",
    color: "#14B8A6",
    aboutContent: "Your guide to social media trends and news.",
    detailedDescription: "From influencer culture to viral trends, find out what's happening on social media.",
    popularTopics: ["Influencer News", "Viral Trends", "Platform Updates"],
    seoKeywords: "social media, trends, influencers, news",
    keywords: ["social media", "influencers", "trends", "news", "updates"]
  }
};