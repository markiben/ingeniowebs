export type Locale = "es" | "en";

export interface NavLink {
  label: string;
  href: string;
}

export interface HelpCard {
  icon: string;
  title: string;
  description: string;
  href: string;
  tags: string[];
  signal: string;
}

export interface Service {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  idealFor: string;
  includes: string[];
  examples: string[];
}

export interface PortfolioItem {
  id: string;
  categoryKey: "design" | "web" | "systems" | "apps" | "finance" | "yours";
  category: string;
  title: string;
  challenge: string;
  solution: string;
  result: string;
  previewUrl: string;
  /** Color principal de la marca (bordes, acentos) */
  brandColor: string;
  /** Miniatura en la grilla (logo). Si no hay, usa screenshot. */
  thumbnail?: string;
  /** Cómo encuadrar la miniatura (default: cover) */
  thumbnailFit?: "cover" | "contain";
  /** Fondo de la miniatura (default: #000 cuando hay thumbnail) */
  thumbnailBg?: string;
  /** Padding de la miniatura logo: sm = más grande, md = default */
  thumbnailPad?: "sm" | "md";
  /** Escala extra del logo en miniatura (default: 1) */
  thumbnailScale?: number;
  /** Captura o imagen principal en el panel de detalle */
  screenshot?: string;
  /** Cómo encuadrar la captura en el panel (default: cover) */
  screenshotFit?: "cover" | "contain";
  /** Margen interno en el panel, ej. "10%" */
  screenshotInset?: string;
  /** Fondo del panel de imagen */
  screenshotBg?: string;
  /** Enlace al sitio en vivo (opcional) */
  siteUrl?: string;
  /** Si existe, la card apunta acá en lugar de /casos/[id] */
  href?: string;
  /** CTA de la card (default: Leer más) */
  cta?: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
  signal: string;
  tags: string[];
  icon: "discover" | "plan" | "build" | "launch";
}

export interface MaintenancePlan {
  name: string;
  description: string;
  features: string[];
  note: string;
  highlighted?: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface SectionHeadingContent {
  label: string;
  title: string;
  description?: string;
}

export interface Translations {
  header: {
    signIn: string;
    menu: string;
    language: string;
  };
  navLinks: NavLink[];
  hero: {
    tagline: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    badges: string[];
    marquee: string[];
  };
  helpSection: SectionHeadingContent & {
    scenarioLabel: string;
    panelTitle: string;
    exploreCta: string;
    cards: HelpCard[];
  };
  services: SectionHeadingContent & {
    idealFor: string;
    requestQuote: string;
    pauseAutoplay: string;
    resumeAutoplay: string;
    items: Service[];
  };
  portfolio: SectionHeadingContent & {
    challenge: string;
    solution: string;
    result: string;
    viewCase: string;
    feedLabel: string;
    feedTitle: string;
    goToBlog: string;
    readMore: string;
    backToBlog: string;
    items: PortfolioItem[];
  };
  blog: {
    label: string;
    title: string;
    mastheadTitle: string;
    description: string;
    searchLabel: string;
    searchPlaceholder: string;
    empty: string;
    noResults: string;
    readMore: string;
    seeMore: string;
    exploreTitle: string;
    exploreDescription: string;
    filterAll: string;
    filterTopic: string;
    filterDate: string;
    filtersLabel: string;
    sortNewest: string;
    sortOldest: string;
    pickDate: string;
    latestInTopic: string;
    noPostsInTopic: string;
    back: string;
    backToBlog: string;
    topics: {
      diseno: string;
      desarrollo: string;
      proyectos: string;
      negocios: string;
      novedades: string;
    };
  };
  process: SectionHeadingContent & {
    slogan: {
      brand: string;
      before: string;
      highlight: string;
      after: string;
    };
    stepLabel: string;
    nextStep: string;
    steps: ProcessStep[];
  };
  about: {
    heading: SectionHeadingContent;
    paragraphs: string[];
    stats: { label: string; value: string }[];
    stackTitle: string;
    stackNote: string;
    technologies: string[];
  };
  maintenance: SectionHeadingContent & {
    warrantyBefore: string;
    warrantyHighlight: string;
    warrantyAfter: string;
    recommended: string;
    footerNote: string;
    plans: MaintenancePlan[];
  };
  faq: SectionHeadingContent & { items: FAQ[] };
  newsletter: SectionHeadingContent & {
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successMessage: string;
    alreadyRegisteredTitle: string;
    alreadyRegisteredMessage: string;
    welcomeSentMessage: string;
    welcomeFailedMessage: string;
    privacyNote: string;
    publicUnsubscribeLabel: string;
  };
  contact: SectionHeadingContent & {
    successTitle: string;
    successMessage: string;
    tabForm: string;
    tabMeeting: string;
    formTitle: string;
    meetingTitle: string;
    meetingDescription: string;
    meetingDuration: string;
    meetingBenefits: string[];
    meetingFormIntro: string;
    meetingPhone: string;
    meetingPhonePlaceholder: string;
    meetingPhoneHint: string;
    meetingCta: string;
    meetingLoading: string;
    meetingPoweredNote: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    clientType: string;
    projectType: string;
    budget: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    clientTypes: string[];
    projectTypes: string[];
    budgetRanges: string[];
  };
  closing: {
    ariaLabel: string;
    name: string;
    role: string;
    quoteLines: [string, string, string];
  };
  footer: {
    description: string;
    linksTitle: string;
    contactTitle: string;
    socialTitle: string;
    social: {
      linkedin: string;
      instagram: string;
      tiktok: string;
      telegram: string;
    };
    remote: string;
    rights: string;
    privacy: string;
    terms: string;
    cookies: string;
  };
  cookieConsent: {
    title: string;
    description: string;
    accept: string;
    reject: string;
    privacyLink: string;
    cookiesPolicy: string;
    configure: string;
    prefsTitle: string;
    prefsDescription: string;
    prefsManage: string;
    moreInfo: string;
    confirmChoices: string;
    alwaysActive: string;
    close: string;
    categories: {
      necessary: { title: string; description: string };
      performance: { title: string; description: string };
      functional: { title: string; description: string };
      targeting: { title: string; description: string };
    };
  };
  legal: {
    backHome: string;
    updatedLabel: string;
    privacy: {
      title: string;
      updated: string;
      sections: { title: string; paragraphs: string[] }[];
    };
    terms: {
      title: string;
      updated: string;
      sections: { title: string; paragraphs: string[] }[];
    };
  };
  chatWidget: {
    open: string;
    close: string;
    back: string;
    panelLabel: string;
    greeting: string;
    title: string;
    subtitle: string;
    whatsappTitle: string;
    whatsappDesc: string;
    whatsappPrefill: string;
    telegramTitle: string;
    telegramDesc: string;
    formTitle: string;
    formDesc: string;
    formHeading: string;
    formSubtitle: string;
    liveTitle: string;
    liveDesc: string;
    liveHeading: string;
    liveSubtitle: string;
    liveSupportTitle: string;
    liveOnlineHint: string;
    liveMinimize: string;
    liveWelcome: string;
    liveStart: string;
    liveStarting: string;
    liveReplyPlaceholder: string;
    liveSend: string;
    liveSending: string;
    liveClosed: string;
    liveClosedIdle: string;
    liveClosedLeft: string;
    liveNewChat: string;
    liveNewChatHint: string;
    liveResume: string;
    liveYou: string;
    liveAgent: string;
    liveTyping: string;
    liveOnline: string;
    liveOffline: string;
    liveSystem: string;
    liveIdleTitle: string;
    liveIdleBody: string;
    liveIdleConfirm: string;
    liveIdleCountdown: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successMessage: string;
  };
}
