import type { Translations } from "./types";

export const en: Translations = {
  header: {
    signIn: "Sign in",
    menu: "Menu",
    language: "Language",
  },
  navLinks: [
    { label: "Services", href: "#servicios" },
    { label: "Blog", href: "/blog" },
    { label: "Methodology", href: "#proceso" },
    { label: "About", href: "#sobre-nosotros" },
    { label: "Support", href: "#mantenimiento" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contacto" },
    { label: "Newsletter", href: "#newsletter" },
  ],
  hero: {
    tagline: "Design & Software Development",
    titleBefore: "We turn ideas into",
    titleHighlight: "high-impact digital platforms",
    titleAfter: ".",
    subtitle:
      "UI/UX design, Full Stack development, and scalable software solutions for businesses and entrepreneurs.",
    ctaPrimary: "Tell us about your project",
    ctaSecondary: "View blog",
    badges: ["Custom projects", "Scalable code", "Post-launch support"],
    marquee: [
      "Innovation",
      "Web Design",
      "Development",
      "Software",
      "Full Stack",
      "UX / UI",
      "Technology",
      "Scalable",
      "Digital",
      "Solutions",
      "Platforms",
      "Web Apps",
      "E-commerce",
      "Automation",
      "APIs",
      "Responsive",
      "Branding",
      "Integrations",
      "Analytics",
      "Mobile First",
    ],
  },
  helpSection: {
    label: "Sound familiar?",
    title: "How can we help you?",
    description:
      "Select your scenario. The system identifies the most efficient digital path for your case.",
    scenarioLabel: "Scenario",
    panelTitle: "ingenio.diagnostic",
    exploreCta: "View solution",
    cards: [
      {
        icon: "lightbulb",
        title: "I have an idea",
        description: "I want to turn my idea into a functional app or web platform.",
        href: "#servicios",
        tags: ["MVP", "Prototype", "Digital product"],
        signal: "init(idea) → validate() → build()",
      },
      {
        icon: "globe",
        title: "I need an online presence",
        description: "I want a professional website that generates clients and builds trust.",
        href: "#servicios",
        tags: ["Landing", "SEO", "Conversion"],
        signal: "deploy(brand) → optimize(seo) → convert()",
      },
      {
        icon: "building",
        title: "My company needs a system",
        description: "I want to automate processes with custom software for my business.",
        href: "#servicios",
        tags: ["CRM", "ERP", "Automation"],
        signal: "map(processes) → automate() → scale()",
      },
      {
        icon: "refresh",
        title: "I already have something, but it doesn't work well",
        description: "I need a redesign, performance improvements, or a technology migration.",
        href: "#servicios",
        tags: ["Redesign", "Performance", "Migration"],
        signal: "audit(stack) → refactor() → relaunch()",
      },
    ],
  },
  services: {
    label: "Services",
    title: "Complete digital solutions.",
    description:
      "From visual design to complex systems. Each service includes everything you need for a professional result.",
    idealFor: "Ideal for:",
    requestQuote: "Request a quote",
    pauseAutoplay: "Pause autoplay",
    resumeAutoplay: "Resume autoplay",
    items: [
      {
        id: "diseno",
        title: "Web Design & UI/UX",
        subtitle: "A first impression that converts",
        description:
          "Corporate websites, high-conversion landing pages, interactive prototyping, and digital brand redesigns.",
        idealFor: "Businesses, entrepreneurs, and professionals seeking a strong online presence.",
        includes: [
          "UX research and wireframes",
          "Visual design in code (browser-native UI)",
          "Interactive prototypes",
          "Responsive design (mobile first)",
          "Consistent design system",
        ],
        examples: ["Conversion landing page", "Corporate website", "Digital brand redesign"],
      },
      {
        id: "fullstack",
        title: "Frontend / Backend Development",
        subtitle: "Interfaces with solid architecture",
        description:
          "Fast, adaptable interfaces connected to robust APIs, databases, and third-party integrations.",
        idealFor: "Projects that need performance, scalability, and maintainable code.",
        includes: [
          "React, Next.js, and TypeScript",
          "REST APIs and backend architecture",
          "Database integration",
          "Performance optimization",
          "Production deployment",
        ],
        examples: ["Interactive dashboard", "Client portal", "External API integration"],
      },
      {
        id: "plataformas",
        title: "Custom Platforms & Systems",
        subtitle: "Software that automates your business",
        description:
          "CRM, ERP, admin panels, automations, and intranets designed for your real processes.",
        idealFor: "Companies with manual processes, teams relying on Excel or legacy systems.",
        includes: [
          "Business process analysis",
          "Full admin panel",
          "Roles, permissions, and reports",
          "Task automation",
          "Integrations with existing tools",
        ],
        examples: ["Internal CRM", "Inventory system", "Corporate intranet"],
      },
      {
        id: "apps",
        title: "Web & Mobile Applications",
        subtitle: "Digital products ready to scale",
        description:
          "Progressive web apps (PWA), cross-platform applications, and scalable e-commerce solutions.",
        idealFor: "Startups, e-commerce, and businesses that need a complete digital product.",
        includes: [
          "Progressive Web Apps (PWA)",
          "Cross-platform architecture",
          "Scalable online stores",
          "Authentication and payments",
          "Analytics and usage metrics",
        ],
        examples: ["Custom e-commerce", "Progressive web app", "Digital marketplace"],
      },
    ],
  },
  portfolio: {
    label: "Blog",
    title: "The stories behind every project.",
    description:
      "Find real cases on our blog: the challenge, the solution, and the result of each digital product we build.",
    challenge: "Challenge",
    solution: "Solution",
    result: "Result",
    viewCase: "View project",
    feedLabel: "In the blog",
    feedTitle: "Latest published cases",
    goToBlog: "Go to blog",
    readMore: "Read more",
    backToBlog: "Back",
    items: [
      {
        id: "brand-ui",
        categoryKey: "design",
        category: "Design",
        brandColor: "#7C3AED",
        title: "NovaStudio Arq Digital",
        previewUrl: "novastudio.design",
        thumbnail: "/portfolio/novastudio-logo.png",
        thumbnailBg: "#f5f5f7",
        thumbnailFit: "contain",
        thumbnailPad: "sm",
        thumbnailScale: 1.35,
        screenshot: "/portfolio/novastudio-presentacion.png",
        screenshotFit: "cover",
        screenshotBg: "#0a1628",
        challenge:
          "An architecture and corporate interiors firm had strong projects, but its digital presence didn’t convey the scale or precision of its work.",
        solution:
          "Full digital identity, design system, typography, UI components, and navigable prototypes for web and project presentations.",
        result:
          "A coherent brand across the website and commercial proposals, with +60% recognition in post-launch surveys.",
      },
      {
        id: "trading-miami",
        categoryKey: "web",
        category: "Web",
        brandColor: "#38BDF8",
        title: "Trading Miami Schooll",
        previewUrl: "tradingmiamischooll.com",
        siteUrl: "https://tradingmiamischooll.com/",
        thumbnail: "/portfolio/trading-miami-thumb.png",
        thumbnailFit: "contain",
        screenshot: "/portfolio/trading-miami-detail.png",
        screenshotFit: "cover",
        challenge:
          "A trading community with a generic Canva logo, no owned website, courses on third-party platforms, and live sessions scattered across Discord, WhatsApp, and other channels.",
        solution:
          "Full rebrand, a client-aligned website, and a community platform that brings teaching, content, and student connection into one place.",
        result:
          "More conversions and interest, global reach, higher traffic, and a brand with the prestige the project deserved.",
      },
      {
        id: "liquifaster",
        categoryKey: "systems",
        category: "Systems",
        brandColor: "#1190FB",
        title: "LiquiFaster",
        previewUrl: "liquifaster.com",
        siteUrl: "https://www.liquifaster.com",
        thumbnail: "/portfolio/liquifaster-logo.png",
        thumbnailBg: "#1190fb",
        thumbnailFit: "contain",
        screenshot: "/portfolio/liquifaster-detail.png",
        screenshotFit: "cover",
        challenge:
          "An insurance claims adjustment firm ran on an obsolete system, Excel spreadsheets, and scattered tools to manage claims.",
        solution:
          "Custom platform centralizing files, inspections, reports, and scheduling, with an analytics dashboard and integrated weather station for surveying.",
        result:
          "Real-time team performance stats, saved operational hours, and removal of unnecessary administrative workload.",
      },
      {
        id: "mls-capital",
        categoryKey: "finance",
        category: "Finance",
        brandColor: "#C9A227",
        title: "MLS Capital",
        previewUrl: "mlscapitalfx.com",
        siteUrl: "https://mlscapitalfx.com/",
        screenshot: "/portfolio/mls-capital.png",
        screenshotFit: "cover",
        screenshotBg: "#0a0a0a",
        challenge:
          "A trading firm offering AI bots, courses, and 1:1 coaching needed a site that felt institutional and steered visitors to the right offer — without looking like another generic trading course.",
        solution:
          "Premium site with a gold/marble identity, three clear paths (build bots, hire algorithms, coaching), founder narrative, risk-aware FAQ, and conversion-led CTAs.",
        result:
          "A clearer funnel into course, bots, and meetings, with a digital presence that matches MLS Capital’s scale.",
      },
      {
        id: "finance",
        categoryKey: "finance",
        category: "Finance",
        brandColor: "#F59E0B",
        title: "Capital Flow Trader",
        previewUrl: "capitalflowtrader.com",
        siteUrl: "https://capitalflowtrader.com/",
        thumbnail: "/portfolio/capital-flow-logo.png",
        thumbnailFit: "contain",
        screenshot: "/portfolio/capital-flow-3d.png",
        challenge:
          "They ran on a generic template site, an unpolished visual identity, and a disorganized internal platform — hurting trust in a industry where credibility is everything.",
        solution:
          "Full rebrand aligned with the firm's positioning, complete site redesign, and front-end plus platform performance optimization for a clear, fast, cohesive experience.",
        result:
          "Stronger qualified client flow and tighter business control, with a digital presence that reflects the brand's scale and seriousness.",
      },
      {
        id: "tu-proyecto",
        categoryKey: "yours",
        category: "Your project",
        brandColor: "#1b75bb",
        title: "We're saving this spot for you",
        previewUrl: "ingeniowebs.com",
        href: "/#contacto",
        cta: "Contact us",
        screenshot: "/portfolio/tu-proyecto.png",
        screenshotFit: "cover",
        screenshotBg: "#0e335f",
        challenge:
          "Your brand could be the next case study. Tell us what you need and we'll build the site, system, or identity to make it real.",
        solution:
          "Book a meeting and we'll map the clearest path to launch or grow your digital project.",
        result:
          "A space on the blog waiting to become your results story.",
      },
    ],
  },
  blog: {
    label: "Blog",
    title: "Ideas, updates, and learnings.",
    mastheadTitle: "Ideas that build the future",
    description: "Design, development, projects, and digital business.",
    searchLabel: "Search the blog",
    searchPlaceholder: "Search articles",
    empty: "The first articles will be published soon.",
    noResults: "No articles matched that search.",
    readMore: "Read article",
    seeMore: "See more",
    exploreTitle: "All articles",
    exploreDescription:
      "Filter by topic or search by text. Always newest to oldest.",
    filterAll: "All",
    filterTopic: "Topic",
    filterDate: "Sort by date",
    filtersLabel: "Filters",
    sortNewest: "Newest",
    sortOldest: "Oldest",
    pickDate: "Pick a date",
    latestInTopic: "Latest post",
    noPostsInTopic: "Coming soon in this topic",
    back: "Back",
    backToBlog: "Back to blog",
    topics: {
      diseno: "Design",
      desarrollo: "Development",
      proyectos: "Projects",
      negocios: "Business",
      novedades: "News",
    },
  },
  process: {
    label: "Methodology",
    title: "A clear process, no surprises.",
    description:
      "You'll know what's delivered, when, and for how much before we start. Constant communication at every stage.",
    slogan: {
      brand: "Ingenio Webs",
      before: "Where ",
      highlight: "great ideas",
      after: " come to life on the web.",
    },
    stepLabel: "Step",
    nextStep: "Next",
    steps: [
      {
        step: "01",
        title: "We talk",
        description:
          "We understand your idea, goals, budget, and timeline. No commitment, full clarity from the start.",
        signal: "discover(idea) → align(goals)",
        tags: ["No commitment", "Clear brief", "Initial scope"],
        icon: "discover",
      },
      {
        step: "02",
        title: "We plan",
        description:
          "We define scope, wireframes, technical architecture, timeline, and fixed budget. No surprises.",
        signal: "scope() → wireframe() → estimate()",
        tags: ["Fixed budget", "Wireframes", "Roadmap"],
        icon: "plan",
      },
      {
        step: "03",
        title: "We build",
        description:
          "Iterative development with visible progress, continuous feedback, testing, and clean, maintainable code.",
        signal: "build(sprint) → test() → iterate()",
        tags: ["Visible progress", "Continuous feedback", "Clean code"],
        icon: "build",
      },
      {
        step: "04",
        title: "We launch",
        description:
          "Production deployment, basic training, and warranty period. Optional maintenance available.",
        signal: "deploy(prod) → train() → support()",
        tags: ["Safe deploy", "Training", "Warranty"],
        icon: "launch",
      },
    ],
  },
  about: {
    heading: {
      label: "About Ingenio Webs",
      title: "Technology with a business mindset.",
    },
    paragraphs: [
      "Ingenio Webs was born with a clear mission: turn real ideas and needs into digital products that work, scale, and deliver measurable results.",
      "It's not just about writing code or designing pretty screens. It's about understanding your business, your users, and your goals to deliver solutions that truly add value.",
      "We work with businesses and entrepreneurs who seek quality, clear communication, and trusted technology partners.",
    ],
    stats: [
      { label: "Focus", value: "Results" },
      { label: "Communication", value: "Constant" },
      { label: "Code", value: "Maintainable" },
    ],
    stackTitle: "Tech stack",
    stackNote:
      "We choose the most suitable technologies for each project, prioritizing performance, maintainability, and long-term scalability.",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Python",
      "PostgreSQL",
      "Design Systems",
      "Tailwind CSS",
      "Docker",
      "Vercel",
    ],
  },
  maintenance: {
    label: "Support & Maintenance",
    title: "Your project, cared for after launch.",
    description:
      "Development includes post-launch warranty. For ongoing support, we offer monthly or annual maintenance plans.",
    warrantyBefore: "Every project includes a warranty period. Maintenance is an",
    warrantyHighlight: "optional",
    warrantyAfter: "service.",
    recommended: "Recommended",
    footerNote:
      "Ask for pricing based on project type. You can hire maintenance at any time.",
    plans: [
      {
        name: "Monthly Plan",
        description:
          "Ongoing support for active sites, e-commerce, and production systems.",
        features: [
          "Security updates",
          "Bug fixes",
          "Minor content changes",
          "Basic monitoring",
          "Priority email support",
        ],
        note: "Month-to-month flexibility",
      },
      {
        name: "Annual Plan",
        description:
          "Same support with annual discount. Ideal for stable corporate websites.",
        features: [
          "Everything in the monthly plan",
          "Scheduled backups",
          "Quarterly performance reports",
          "Included improvement hours",
          "Discount vs. 12 separate months",
        ],
        note: "Best value for money",
        highlighted: true,
      },
    ],
  },
  faq: {
    label: "FAQ",
    title: "Frequently asked questions.",
    description: "Clear answers before you have to ask.",
    items: [
      {
        question: "Do you work with businesses and individuals?",
        answer:
          "Yes. We work with businesses of all sizes, entrepreneurs, and individuals who need professional digital solutions, both in person and remotely.",
      },
      {
        question: "Do you offer design or development only?",
        answer:
          "Both. We can handle UI/UX design, product visual identity, and full development. If you already have designs or references, we can build on those too.",
      },
      {
        question: "How much does a typical project cost?",
        answer:
          "It depends on scope. A landing page can start from $500 USD, a corporate site from $1,500 USD, and custom systems or platforms from $3,000 USD. You always receive a detailed quote before starting.",
      },
      {
        question: "How long does a project take?",
        answer:
          "A landing page can be ready in 2–3 weeks. A corporate site in 4–6 weeks. Custom systems vary by complexity, generally between 2 and 4 months. We set realistic timelines during planning.",
      },
      {
        question: "Do I need all content ready before we start?",
        answer:
          "Not necessarily. We can start with a base structure and placeholder content. Still, having your logo, key copy, and images defined speeds up the process and improves the final result.",
      },
      {
        question: "Will the site be responsive and mobile-optimized?",
        answer:
          "Yes. All our projects are designed mobile-first, tested across devices, and optimized for speed, basic SEO, and a solid user experience.",
      },
      {
        question: "How does payment work?",
        answer:
          "It's usually split into stages: a 50% deposit to reserve the project, partial payments tied to milestones (design, development, launch), and final balance on delivery. Everything is agreed in writing before we begin.",
      },
      {
        question: "Can I request changes during development?",
        answer:
          "Yes, within the agreed scope. We work with incremental deliveries and continuous feedback. If new features fall outside the initial budget, we evaluate and quote them separately.",
      },
      {
        question: "Is maintenance included in the project?",
        answer:
          "No. The project includes development, testing, launch, and a warranty period for fixes on what was delivered. Monthly or annual maintenance is a separate optional service.",
      },
      {
        question: "What does the post-launch warranty cover?",
        answer:
          "Fixing bugs or issues related to what was delivered, at no extra cost during the agreed period. It does not include new content, extra features, or design changes not originally scoped.",
      },
      {
        question: "Can I hire maintenance later?",
        answer:
          "Yes, even if the original project wasn't developed by us. We evaluate your site or system and propose the most suitable plan.",
      },
      {
        question: "Who owns the code and the site?",
        answer:
          "You do. Once the agreed payment is complete, the source code, project files, and site access are yours. We hand over everything you need for full control.",
      },
      {
        question: "Do you work with clients in other cities or countries?",
        answer:
          "Yes. We work remotely with clients anywhere. Meetings are held via video call and communication is constant throughout the project.",
      },
      {
        question: "What technologies do you use?",
        answer:
          "Mainly React, Next.js, TypeScript, and Node.js, choosing the most suitable stack for each project. We prioritize performance, maintainability, and long-term scalability.",
      },
    ],
  },
  newsletter: {
    label: "Newsletter",
    title: "Get ideas and updates.",
    description:
      "Join the list for product tips, launches, and digital opportunities — no spam.",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@email.com",
    submit: "Subscribe",
    submitting: "Sending…",
    successTitle: "Thanks for subscribing!",
    successMessage:
      "You're on the list. We'll only send useful Ingenio Webs updates.",
    alreadyRegisteredTitle: "This email is already registered",
    alreadyRegisteredMessage:
      "That address is already on the newsletter. No need to subscribe again.",
    welcomeSentMessage:
      "We sent you an email with your 10% discount. If you don’t see it, check Promotions or Spam.",
    welcomeFailedMessage:
      "You're on the list, but we couldn’t send the discount email. Check spam or try again in a few minutes.",
    privacyNote:
      "We only use your email for Ingenio Webs updates. Unsubscribe anytime.",
    publicUnsubscribeLabel: "Public unsubscribe:",
  },
  contact: {
    label: "Contact",
    title: "Tell us about your project.",
    description: "We get back to you directly within 24 hours.",
    successTitle: "Message sent.",
    successMessage: "Thank you for reaching out. We'll review your project and get back to you soon.",
    tabForm: "Send message",
    tabMeeting: "Book a meeting",
    formTitle: "Fill out the form and we'll reply within 24 hours",
    meetingTitle: "Book your video call",
    meetingDescription:
      "Pick a time that works for you. Calendly confirms instantly and sends everything by email.",
    meetingDuration: "{minutes} min · Video call",
    meetingBenefits: [
      "Instant email confirmation",
      "Reminder before the meeting",
      "Video call link on the day of the meeting",
    ],
    meetingFormIntro: "Your details to confirm the booking and receive the email invitation.",
    meetingPhone: "Phone (optional)",
    meetingPhonePlaceholder: "+1 555 123-4567",
    meetingPhoneHint: "In case there is an issue with the video call or we need to reach you.",
    meetingCta: "Pick a time on the calendar",
    meetingLoading: "Loading calendar…",
    meetingPoweredNote: "Secure booking with Calendly · Without leaving the site",
    name: "Name *",
    namePlaceholder: "Your name",
    email: "Email *",
    emailPlaceholder: "you@email.com",
    phone: "Phone",
    phonePlaceholder: "+54 9 11 1234-5678",
    clientType: "Client type",
    projectType: "Project type",
    budget: "Estimated budget",
    message: "Describe your project *",
    messagePlaceholder: "Tell us what you need, goals, timeline, references...",
    submit: "Send message",
    submitting: "Sending...",
    clientTypes: ["Business", "Entrepreneur", "Individual"],
    projectTypes: [
      "Website / Landing",
      "Web application",
      "Custom system",
      "Redesign / Improvements",
      "Not sure yet",
    ],
    budgetRanges: [
      "Less than $500 USD",
      "$500 – $1,500 USD",
      "$1,500 – $5,000 USD",
      "More than $5,000 USD",
      "Not sure yet",
    ],
  },
  closing: {
    ariaLabel: "Closing words from Ingenio Webs",
    name: "Marco Bretschneider",
    role: "Founder — Ingenio Webs",
    quoteLines: [
      "We turn ideas into digital products",
      "with solid craft and a deeply",
      "collaborative approach on every project.",
    ],
  },
  footer: {
    description:
      "Web design, Full Stack development, and custom software solutions for businesses and entrepreneurs.",
    linksTitle: "Links",
    contactTitle: "Contact",
    socialTitle: "Social",
    social: {
      linkedin: "LinkedIn",
      instagram: "Instagram",
      tiktok: "TikTok",
      telegram: "Telegram",
    },
    remote: "Remote projects · Worldwide",
    rights: "All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    cookies: "Cookies",
  },
  cookieConsent: {
    title: "Ingenio Webs uses cookies to improve your experience!",
    description:
      "We use first-party and third-party cookies to keep the site running smoothly, measure usage, and enable features like chat and meeting scheduling. You can manage your preferences anytime.",
    accept: "Allow all",
    reject: "Reject all",
    privacyLink: "Privacy Notice",
    cookiesPolicy: "Cookie Policy",
    configure: "Configure preferences",
    prefsTitle: "Cookie preference management",
    prefsDescription:
      "Cookies help us deliver a better experience. Some are required for the site to work; others are optional.",
    prefsManage: "Manage consent preferences",
    moreInfo: "More information",
    confirmChoices: "Confirm my choices",
    alwaysActive: "Always active",
    close: "Close",
    categories: {
      necessary: {
        title: "Strictly necessary cookies",
        description:
          "Required for basic site operation, security, and remembering your cookie decision.",
      },
      performance: {
        title: "Performance cookies",
        description:
          "Help us understand how the site is used so we can improve speed, navigation, and content.",
      },
      functional: {
        title: "Functional cookies",
        description:
          "Allow us to remember preferences (such as language) and enhance site features.",
      },
      targeting: {
        title: "Targeting / advertising cookies",
        description:
          "May be used to measure campaigns or show more relevant content. They are not required to use the site.",
      },
    },
  },
  legal: {
    backHome: "Back to home",
    updatedLabel: "Last updated",
    privacy: {
      title: "Privacy policy",
      updated: "August 3, 2026",
      sections: [
        {
          title: "1. Controller",
          paragraphs: [
            "Ingenio Webs, represented by Marco Bretschneider, is responsible for processing personal data collected through this website and related contact channels.",
            "Contact: info@ingeniowebs.com",
          ],
        },
        {
          title: "2. Data we collect",
          paragraphs: [
            "We may collect your name, email, phone (optional), client type, project details, and the message you send through the form or chat.",
            "If you book a meeting, the data needed to confirm the appointment is also processed through Calendly.",
          ],
        },
        {
          title: "3. Purpose of processing",
          paragraphs: [
            "We use your data to reply to inquiries, schedule meetings, prepare proposals, and provide commercial or technical support related to our services.",
            "We do not sell your personal data to third parties.",
          ],
        },
        {
          title: "4. Third-party services",
          paragraphs: [
            "We may use third-party tools such as Calendly (scheduling), hosting/analytics providers, and messaging services. These providers process data under their own policies and only as needed to deliver the service.",
          ],
        },
        {
          title: "5. Cookies",
          paragraphs: [
            "This site may use essential cookies for basic operation and optional cookies to improve experience or measure usage. You can accept or reject non-essential cookies from the consent popup.",
            "You can change your choice by clearing local browser storage or reopening the notice from the “Cookies” link in the footer.",
          ],
        },
        {
          title: "6. Retention and rights",
          paragraphs: [
            "We keep data for as long as needed to handle your inquiry or business relationship, unless a longer period is required by law.",
            "You may request access, updates, or deletion of your data by emailing info@ingeniowebs.com.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of use",
      updated: "August 3, 2026",
      sections: [
        {
          title: "1. About this site",
          paragraphs: [
            "This website belongs to Ingenio Webs and provides information about our design, development, and digital solution services.",
            "By browsing or using the site, you accept these terms.",
          ],
        },
        {
          title: "2. Services",
          paragraphs: [
            "Published information describes our services in general terms. Scope, timelines, pricing, and specific conditions are defined in a written proposal or agreement with the client.",
          ],
        },
        {
          title: "3. Intellectual property",
          paragraphs: [
            "Texts, trademarks, logos, designs, code, and other site content belong to Ingenio Webs or its licensors unless otherwise stated.",
            "Copying, reproducing, or exploiting this content without prior authorization is not allowed.",
          ],
        },
        {
          title: "4. Acceptable use",
          paragraphs: [
            "You agree not to use the site in an abusive, fraudulent, or harmful way that affects its security, availability, or that of third parties.",
            "We reserve the right to restrict access in case of misuse.",
          ],
        },
        {
          title: "5. Limitation of liability",
          paragraphs: [
            "While we aim to keep information up to date and the site operational, we do not guarantee uninterrupted availability or complete freedom from errors.",
            "To the extent permitted by applicable law, Ingenio Webs is not liable for indirect damages arising from use or inability to use the site.",
          ],
        },
        {
          title: "6. Contact",
          paragraphs: [
            "For questions about these terms: info@ingeniowebs.com",
          ],
        },
      ],
    },
  },
  chatWidget: {
    open: "Open chat",
    close: "Close chat",
    back: "Back",
    panelLabel: "Contact assistant",
    greeting: "Hi! 👋",
    title: "How would you like to reach us?",
    subtitle: "Pick the option that works best for you.",
    whatsappTitle: "Continue on WhatsApp",
    whatsappDesc: "Quick reply on your phone",
    whatsappPrefill:
      "Hi! I'm coming from the IngenioWebs website, my name is ",
    telegramTitle: "Continue on Telegram",
    telegramDesc: "Message us directly in chat",
    formTitle: "Ask here",
    formDesc: "Leave a message and we'll get back to you",
    formHeading: "Tell us about your inquiry",
    formSubtitle: "We'll reply within 24 hours.",
    liveTitle: "Live chat",
    liveDesc: "Talk with us right now",
    liveHeading: "Live chat",
    liveSubtitle: "Share your details and we'll start chatting.",
    liveSupportTitle: "Ingenio Support",
    liveOnlineHint: "Online · quick reply",
    liveMinimize: "Minimize chat",
    liveWelcome:
      "Hi {name}! I'm Mr. Ingenio from support.\nHow can we help you today?",
    liveStart: "Start chat",
    liveStarting: "Connecting...",
    liveReplyPlaceholder: "Type your message...",
    liveSend: "Send",
    liveSending: "Sending...",
    liveClosed:
      "This conversation was closed. If the team reopens it, you can continue here. You can also start a new chat.",
    liveClosedIdle:
      "This conversation was closed due to inactivity. You can start a new chat anytime.",
    liveClosedLeft:
      "You closed the chat. You can start a new one whenever you need.",
    liveNewChat: "New chat",
    liveNewChatHint: "Need help again? Start another conversation.",
    liveResume: "Continue chat",
    liveYou: "You",
    liveAgent: "Mr. Ingenio",
    liveTyping: "is typing",
    liveOnline: "Connected",
    liveOffline: "Disconnected",
    liveSystem: "System",
    liveIdleTitle: "Are you still there?",
    liveIdleBody: "If you don't confirm, the chat will disconnect automatically.",
    liveIdleConfirm: "Yes, I'm here",
    liveIdleCountdown: "Closes in {time}",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@email.com",
    phone: "Phone",
    phonePlaceholder: "+54 11 1234-5678",
    message: "Message",
    messagePlaceholder: "How can we help?",
    submit: "Send inquiry",
    submitting: "Sending...",
    successTitle: "Message sent!",
    successMessage: "Thanks for reaching out. We'll be in touch soon.",
  },
};
