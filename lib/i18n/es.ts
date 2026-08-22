import type { Translations } from "./types";

export const es: Translations = {
  header: {
    signIn: "Iniciar sesión",
    menu: "Menú",
    language: "Idioma",
  },
  navLinks: [
    { label: "Servicios", href: "#servicios" },
    { label: "Blog", href: "/blog" },
    { label: "Metodología", href: "#proceso" },
    { label: "Nosotros", href: "#sobre-nosotros" },
    { label: "Soporte", href: "#mantenimiento" },
    { label: "FAQ", href: "#faq" },
    { label: "Contacto", href: "#contacto" },
    { label: "Newsletter", href: "#newsletter" },
  ],
  hero: {
    tagline: "Diseño & Desarrollo de Software",
    titleBefore: "Transformamos ideas en",
    titleHighlight: "plataformas digitales",
    titleAfter: "de alto impacto.",
    subtitle:
      "Diseño UI/UX, desarrollo Full Stack y soluciones de software escalables para empresas y emprendedores.",
    ctaPrimary: "Cuéntanos tu proyecto",
    ctaSecondary: "Ver blog",
    badges: ["Proyectos a medida", "Código escalable", "Soporte post-lanzamiento"],
    marquee: [
      "Innovación",
      "Diseño Web",
      "Desarrollo",
      "Software",
      "Full Stack",
      "UX / UI",
      "Tecnología",
      "Escalable",
      "Digital",
      "Soluciones",
      "Plataformas",
      "Apps Web",
      "E-commerce",
      "Automatización",
      "APIs",
      "Responsive",
      "Branding",
      "Integraciones",
      "Analytics",
      "Mobile First",
    ],
  },
  helpSection: {
    label: "¿Te suena familiar?",
    title: "¿En qué podemos ayudarte?",
    description:
      "Selecciona tu escenario. El sistema identifica la ruta digital más eficiente para tu caso.",
    scenarioLabel: "Escenario",
    panelTitle: "ingenio.diagnostic",
    exploreCta: "Ver solución",
    cards: [
      {
        icon: "lightbulb",
        title: "Tengo una idea",
        description: "Quiero llevar mi idea a una app o plataforma web funcional.",
        href: "#servicios",
        tags: ["MVP", "Prototipo", "Producto digital"],
        signal: "init(idea) → validate() → build()",
      },
      {
        icon: "globe",
        title: "Necesito presencia online",
        description: "Quiero un sitio profesional que genere clientes y transmita confianza.",
        href: "#servicios",
        tags: ["Landing", "SEO", "Conversión"],
        signal: "deploy(brand) → optimize(seo) → convert()",
      },
      {
        icon: "building",
        title: "Mi empresa necesita un sistema",
        description: "Quiero automatizar procesos con software a medida para mi negocio.",
        href: "#servicios",
        tags: ["CRM", "ERP", "Automatización"],
        signal: "map(processes) → automate() → scale()",
      },
      {
        icon: "refresh",
        title: "Ya tengo algo, pero no funciona bien",
        description: "Necesito rediseño, mejoras de rendimiento o migración tecnológica.",
        href: "#servicios",
        tags: ["Rediseño", "Performance", "Migración"],
        signal: "audit(stack) → refactor() → relaunch()",
      },
    ],
  },
  services: {
    label: "Servicios",
    title: "Soluciones digitales completas.",
    description:
      "Desde el diseño visual hasta sistemas complejos. Cada servicio incluye lo que necesitas para un resultado profesional.",
    idealFor: "Ideal para:",
    requestQuote: "Solicitar cotización",
    pauseAutoplay: "Pausar avance automático",
    resumeAutoplay: "Reanudar avance automático",
    items: [
      {
        id: "diseno",
        title: "Diseño Web & UI/UX",
        subtitle: "Primera impresión que convierte",
        description:
          "Sitios corporativos, landing pages de alta conversión, prototipado interactivo y rediseño de marcas digitales.",
        idealFor: "Empresas, emprendedores y profesionales que buscan una imagen sólida online.",
        includes: [
          "Investigación UX y wireframes",
          "Diseño visual en código (UI en el navegador)",
          "Prototipos interactivos",
          "Diseño responsive (mobile first)",
          "Sistema de diseño coherente",
        ],
        examples: ["Landing de conversión", "Sitio corporativo", "Rediseño de marca digital"],
      },
      {
        id: "fullstack",
        title: "Desarrollo Frontend / Backend",
        subtitle: "Interfaces con arquitectura sólida",
        description:
          "Interfaces rápidas y adaptables conectadas a APIs robustas, bases de datos e integraciones de terceros.",
        idealFor: "Proyectos que necesitan rendimiento, escalabilidad y código mantenible.",
        includes: [
          "React, Next.js y TypeScript",
          "APIs REST y arquitectura backend",
          "Integración con bases de datos",
          "Optimización de rendimiento",
          "Despliegue en producción",
        ],
        examples: ["Dashboard interactivo", "Portal de clientes", "Integración con APIs externas"],
      },
      {
        id: "plataformas",
        title: "Plataformas & Sistemas a Medida",
        subtitle: "Software que automatiza tu negocio",
        description:
          "CRM, ERP, paneles de administración, automatizaciones e intranets diseñados para tus procesos reales.",
        idealFor:
          "Empresas con procesos manuales, equipos que dependen de Excel o sistemas obsoletos.",
        includes: [
          "Análisis de procesos de negocio",
          "Panel de administración completo",
          "Roles, permisos y reportes",
          "Automatización de tareas",
          "Integraciones con herramientas existentes",
        ],
        examples: ["CRM interno", "Sistema de inventario", "Intranet corporativa"],
      },
      {
        id: "apps",
        title: "Aplicaciones Web & Móviles",
        subtitle: "Productos digitales listos para crecer",
        description:
          "Web apps progresivas (PWA), aplicaciones multiplataforma y soluciones e-commerce escalables.",
        idealFor: "Startups, e-commerce y negocios que necesitan un producto digital completo.",
        includes: [
          "Progressive Web Apps (PWA)",
          "Arquitectura multiplataforma",
          "Tiendas online escalables",
          "Autenticación y pagos",
          "Analytics y métricas de uso",
        ],
        examples: ["E-commerce a medida", "App web progresiva", "Marketplace digital"],
      },
    ],
  },
  portfolio: {
    label: "Blog",
    title: "Historias detrás de cada proyecto.",
    description:
      "Encontrá en nuestro blog casos reales: el reto, la solución y el resultado de cada producto digital que construimos.",
    challenge: "Reto",
    solution: "Solución",
    result: "Resultado",
    viewCase: "Ver proyecto",
    feedLabel: "En el blog",
    feedTitle: "Últimos casos publicados",
    goToBlog: "Ir al blog",
    readMore: "Leer más",
    backToBlog: "Volver",
    items: [
      {
        id: "brand-ui",
        categoryKey: "design",
        category: "Diseño",
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
          "Un estudio de arquitectura e interiorismo corporativo tenía proyectos sólidos, pero su presencia digital no transmitía la escala ni la precisión de su trabajo.",
        solution:
          "Identidad digital completa, design system, tipografías, componentes UI y prototipos navegables para web y presentaciones de obra.",
        result:
          "Marca coherente en sitio y propuestas comerciales, con +60% de reconocimiento en encuestas post-lanzamiento.",
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
          "Comunidad de trading con logo genérico de Canva, sin web propia, curso en plataformas de terceros y vivos repartiendo links entre Discord, WhatsApp y otros canales.",
        solution:
          "Rebranding completo, sitio web acorde al diseño del cliente y plataforma de comunidad que concentra enseñanza, contenido y conexión con los alumnos en un solo lugar.",
        result:
          "Más conversiones e interés, alcance global, mayor tráfico y una marca con el prestigio que el proyecto merecía.",
      },
      {
        id: "liquifaster",
        categoryKey: "systems",
        category: "Sistemas",
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
          "Un estudio de liquidaciones de seguros operaba con un sistema obsoleto, planillas de Excel y herramientas dispersas para gestionar siniestros.",
        solution:
          "Plataforma a medida que centraliza expedientes, inspecciones, informes y agenda, con dashboard analítico y estación meteorológica integrada para peritaje.",
        result:
          "Estadísticas de rendimiento del equipo en tiempo real, horas operativas ahorradas y eliminación de cargas administrativas innecesarias.",
      },
      {
        id: "mls-capital",
        categoryKey: "finance",
        category: "Finanzas",
        brandColor: "#C9A227",
        title: "MLS Capital",
        previewUrl: "mlscapitalfx.com",
        siteUrl: "https://mlscapitalfx.com/",
        screenshot: "/portfolio/mls-capital.png",
        screenshotFit: "cover",
        screenshotBg: "#0a0a0a",
        challenge:
          "Una firma de trading con bots de IA, formaciones y coaching 1:1 necesitaba una web que transmitiera seriedad institucional y guiara al visitante a la oferta correcta, sin parecer un curso genérico más del rubro.",
        solution:
          "Sitio premium con identidad oro/mármol, tres rutas claras (crear bots, contratar algoritmos, coaching) y narrativa de fundador, FAQ de riesgos y CTAs orientados a conversión.",
        result:
          "Embudo más claro hacia curso, bots y reuniones, con una presencia digital alineada a la escala de MLS Capital.",
      },
      {
        id: "finance",
        categoryKey: "finance",
        category: "Finanzas",
        brandColor: "#F59E0B",
        title: "Capital Flow Trader",
        previewUrl: "capitalflowtrader.com",
        siteUrl: "https://capitalflowtrader.com/",
        thumbnail: "/portfolio/capital-flow-logo.png",
        thumbnailFit: "contain",
        screenshot: "/portfolio/capital-flow-3d.png",
        challenge:
          "Operaban con una web de plantilla genérica, identidad visual poco profesional y una plataforma interna desorganizada que restaba credibilidad en un rubro donde la confianza lo es todo.",
        solution:
          "Rebranding completo alineado a la propuesta de la firma, rediseño integral del sitio y optimización de rendimiento en front y plataforma para una experiencia clara, rápida y coherente.",
        result:
          "Mayor flujo de clientes cualificados y control operativo del negocio, con una presencia digital que transmite la escala y seriedad de la marca.",
      },
      {
        id: "tu-proyecto",
        categoryKey: "yours",
        category: "Tu proyecto",
        brandColor: "#1b75bb",
        title: "Reservamos este espacio para ti",
        previewUrl: "ingeniowebs.com",
        href: "/#contacto",
        cta: "Contactanos",
        screenshot: "/portfolio/tu-proyecto.png",
        screenshotFit: "cover",
        screenshotBg: "#0e335f",
        challenge:
          "Tu marca puede ser el próximo caso. Contanos qué necesitás y armamos la web, el sistema o la identidad que lo haga realidad.",
        solution:
          "Agenda una reunión y te proponemos el camino más claro para lanzar o potenciar tu proyecto digital.",
        result:
          "Un espacio en el blog que espera convertirse en tu historia de resultados.",
      },
    ],
  },
  blog: {
    label: "Blog",
    title: "Ideas, novedades y aprendizajes.",
    mastheadTitle: "Ideas que construyen el futuro",
    description: "Diseño, desarrollo, proyectos y negocio digital.",
    searchLabel: "Buscar en el blog",
    searchPlaceholder: "Buscar artículos",
    empty: "Pronto vamos a publicar los primeros artículos.",
    noResults: "No encontramos artículos con esa búsqueda.",
    readMore: "Leer artículo",
    seeMore: "Ver más",
    exploreTitle: "Todos los artículos",
    exploreDescription:
      "Filtrá por tópico o buscá por texto. Siempre del más reciente al más antiguo.",
    filterAll: "Todos",
    filterTopic: "Tópico",
    filterDate: "Ordenar por fecha",
    filtersLabel: "Filtros",
    sortNewest: "Más recientes",
    sortOldest: "Más antiguos",
    pickDate: "Elegir fecha",
    latestInTopic: "Última publicación",
    noPostsInTopic: "Pronto en este tópico",
    back: "Volver",
    backToBlog: "Volver al blog",
    topics: {
      diseno: "Diseño",
      desarrollo: "Desarrollo",
      proyectos: "Proyectos",
      negocios: "Negocios",
      novedades: "Novedades",
    },
  },
  process: {
    label: "Metodología",
    title: "Un proceso claro, sin sorpresas.",
    description:
      "Sabrás qué se entrega, cuándo y por cuánto antes de empezar. Comunicación constante en cada fase.",
    slogan: {
      brand: "Ingenio Webs",
      before: "Donde las ",
      highlight: "grandes ideas",
      after: " cobran vida en la red.",
    },
    stepLabel: "Paso",
    nextStep: "Siguiente",
    steps: [
      {
        step: "01",
        title: "Conversamos",
        description:
          "Entendemos tu idea, objetivos, presupuesto y plazos. Sin compromiso, con total claridad desde el inicio.",
        signal: "discover(idea) → align(goals)",
        tags: ["Sin compromiso", "Brief claro", "Alcance inicial"],
        icon: "discover",
      },
      {
        step: "02",
        title: "Planificamos",
        description:
          "Definimos alcance, wireframes, arquitectura técnica, tiempos y presupuesto cerrado. Sin sorpresas.",
        signal: "scope() → wireframe() → estimate()",
        tags: ["Presupuesto cerrado", "Wireframes", "Roadmap"],
        icon: "plan",
      },
      {
        step: "03",
        title: "Construimos",
        description:
          "Desarrollo iterativo con avances visibles, feedback continuo, pruebas y código limpio y mantenible.",
        signal: "build(sprint) → test() → iterate()",
        tags: ["Avances visibles", "Feedback continuo", "Código limpio"],
        icon: "build",
      },
      {
        step: "04",
        title: "Lanzamos",
        description:
          "Deploy en producción, capacitación básica y periodo de garantía. Mantenimiento opcional disponible.",
        signal: "deploy(prod) → train() → support()",
        tags: ["Deploy seguro", "Capacitación", "Garantía"],
        icon: "launch",
      },
    ],
  },
  about: {
    heading: {
      label: "Sobre Ingenio Webs",
      title: "Tecnología con visión de negocio.",
    },
    paragraphs: [
      "Ingenio Webs nace con una misión clara: transformar ideas y necesidades reales en productos digitales que funcionan, escalan y generan resultados medibles.",
      "No se trata solo de escribir código o diseñar pantallas bonitas. Se trata de entender tu negocio, tus usuarios y tus objetivos para entregar soluciones que realmente aporten valor.",
      "Trabajamos con empresas y emprendedores que buscan calidad, comunicación clara y partners tecnológicos de confianza.",
    ],
    stats: [
      { label: "Enfoque", value: "Resultados" },
      { label: "Comunicación", value: "Constante" },
      { label: "Código", value: "Mantenible" },
    ],
    stackTitle: "Stack tecnológico",
    stackNote:
      "Seleccionamos las tecnologías más adecuadas para cada proyecto, priorizando rendimiento, mantenibilidad y escalabilidad a largo plazo.",
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
    label: "Soporte y Mantenimiento",
    title: "Tu proyecto, cuidado después del lanzamiento.",
    description:
      "El desarrollo incluye garantía post-lanzamiento. Para soporte continuo, ofrecemos planes de mantenimiento mensual o anual.",
    warrantyBefore: "Cada proyecto incluye un periodo de garantía. El mantenimiento es un servicio",
    warrantyHighlight: "opcional",
    warrantyAfter: "aparte.",
    recommended: "Recomendado",
    footerNote:
      "Consultá precios según tipo de proyecto. Podés contratar mantenimiento en cualquier momento.",
    plans: [
      {
        name: "Plan Mensual",
        description:
          "Soporte continuo para sitios activos, e-commerce y sistemas en producción.",
        features: [
          "Actualizaciones de seguridad",
          "Corrección de errores",
          "Cambios menores de contenido",
          "Monitoreo básico",
          "Soporte prioritario por email",
        ],
        note: "Flexibilidad mes a mes",
      },
      {
        name: "Plan Anual",
        description:
          "Mismo soporte con descuento anual. Ideal para webs corporativas estables.",
        features: [
          "Todo lo del plan mensual",
          "Backups programados",
          "Informes trimestrales de rendimiento",
          "Horas de mejoras incluidas",
          "Descuento vs. 12 meses sueltos",
        ],
        note: "Mejor relación costo-beneficio",
        highlighted: true,
      },
    ],
  },
  faq: {
    label: "FAQ",
    title: "Preguntas frecuentes.",
    description: "Respuestas claras antes de que tengas que preguntarlas.",
    items: [
      {
        question: "¿Trabajan con empresas y particulares?",
        answer:
          "Sí. Trabajamos con empresas de todos los tamaños, emprendedores y particulares que necesitan soluciones digitales profesionales, tanto presenciales como de forma remota.",
      },
      {
        question: "¿Ofrecen diseño o solo desarrollo?",
        answer:
          "Ambos. Podemos encargarnos del diseño UI/UX, la identidad visual del producto y el desarrollo completo. Si ya tenés diseño o referencias, también trabajamos sobre eso.",
      },
      {
        question: "¿Cuánto cuesta un proyecto típico?",
        answer:
          "Depende del alcance. Una landing page puede partir desde $500 USD, un sitio corporativo desde $1.500 USD, y sistemas o plataformas a medida desde $3.000 USD. Siempre recibes un presupuesto detallado antes de empezar.",
      },
      {
        question: "¿Cuánto tarda un proyecto?",
        answer:
          "Una landing puede estar lista en 2–3 semanas. Un sitio corporativo en 4–6 semanas. Sistemas a medida varían según complejidad, generalmente entre 2 y 4 meses. Definimos plazos realistas en la fase de planificación.",
      },
      {
        question: "¿Necesito tener todo el contenido listo antes de empezar?",
        answer:
          "No es obligatorio. Podemos arrancar con una estructura base y textos provisionales. Igual, tener logo, textos clave e imágenes definidas acelera mucho el proceso y mejora el resultado final.",
      },
      {
        question: "¿El sitio será responsive y optimizado para móviles?",
        answer:
          "Sí. Todos nuestros proyectos se diseñan mobile-first, se prueban en distintos dispositivos y se optimizan para velocidad, SEO básico y buena experiencia de usuario.",
      },
      {
        question: "¿Cómo funciona el proceso de pago?",
        answer:
          "Suele dividirse en etapas: un 50% de anticipo para reservar el proyecto, pagos parciales ligados a hitos (diseño, desarrollo, lanzamiento) y saldo final al entregar. Todo queda acordado por escrito antes de iniciar.",
      },
      {
        question: "¿Puedo pedir cambios durante el desarrollo?",
        answer:
          "Sí, dentro del alcance acordado. Trabajamos con entregas parciales y feedback continuo. Si surgen funcionalidades nuevas fuera del presupuesto inicial, las evaluamos y cotizamos por separado.",
      },
      {
        question: "¿El mantenimiento está incluido en el proyecto?",
        answer:
          "No. El proyecto incluye desarrollo, pruebas, lanzamiento y un periodo de garantía para correcciones de lo entregado. El mantenimiento mensual o anual es un servicio opcional aparte.",
      },
      {
        question: "¿Qué incluye la garantía post-lanzamiento?",
        answer:
          "Corrección de errores o fallos relacionados con lo entregado, sin costo adicional durante el periodo acordado. No incluye contenido nuevo, funcionalidades extra ni cambios de diseño no previstos.",
      },
      {
        question: "¿Puedo contratar mantenimiento más adelante?",
        answer:
          "Sí, incluso si el proyecto original no fue desarrollado por nosotros. Evaluamos tu sitio o sistema y te proponemos el plan más adecuado.",
      },
      {
        question: "¿Quién es dueño del código y del sitio?",
        answer:
          "Vos. Al completar el pago acordado, el código fuente, los archivos del proyecto y el acceso al sitio quedan a tu nombre. Te entregamos todo lo necesario para que tengas control total.",
      },
      {
        question: "¿Trabajan con clientes de otras ciudades o países?",
        answer:
          "Sí. Trabajamos de forma remota con clientes de cualquier ubicación. Las reuniones se realizan por videollamada y la comunicación es constante durante todo el proyecto.",
      },
      {
        question: "¿Qué tecnologías utilizan?",
        answer:
          "Principalmente React, Next.js, TypeScript y Node.js, eligiendo la stack más adecuada para cada proyecto. Priorizamos rendimiento, mantenibilidad y escalabilidad a largo plazo.",
      },
    ],
  },
  newsletter: {
    label: "Newsletter",
    title: "Recibí ideas y novedades.",
    description:
      "Sumate a la lista y te contamos lanzamientos, tips de producto digital y oportunidades sin spam.",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Email",
    emailPlaceholder: "tu@email.com",
    submit: "Suscribirme",
    submitting: "Enviando…",
    successTitle: "¡Gracias por suscribirte!",
    successMessage:
      "Ya estás en la lista. Te vamos a escribir solo con novedades útiles de Ingenio Webs.",
    alreadyRegisteredTitle: "Este email ya está registrado",
    alreadyRegisteredMessage:
      "Ese correo ya forma parte de la newsletter. No hace falta volver a suscribirte.",
    welcomeSentMessage:
      "Te enviamos un email con tu 10% de descuento. Si no lo ves, mirá en Promociones o Spam.",
    welcomeFailedMessage:
      "Ya estás en la lista, pero no pudimos enviar el email del descuento. Revisá spam o intentá de nuevo en unos minutos.",
    privacyNote:
      "Solo usamos tu email para novedades de Ingenio Webs. Podés darte de baja cuando quieras.",
    publicUnsubscribeLabel: "Baja pública:",
  },
  contact: {
    label: "Contacto",
    title: "Cuéntanos tu proyecto.",
    description: "Te respondemos directamente en menos de 24 hs.",
    successTitle: "Mensaje enviado.",
    successMessage:
      "Gracias por contactarnos. Revisaremos tu proyecto y te responderemos pronto.",
    tabForm: "Enviar mensaje",
    tabMeeting: "Agendar reunión",
    formTitle: "Completá el formulario y te respondemos en menos de 24 hs",
    meetingTitle: "Reserva tu videollamada",
    meetingDescription:
      "Elige el horario que te quede mejor. Calendly confirma la cita al instante y te envía todo por email.",
    meetingDuration: "{minutes} min · Videollamada",
    meetingBenefits: [
      "Confirmación inmediata por email",
      "Recordatorio antes de la reunión",
      "Link de videollamada el día del encuentro",
    ],
    meetingFormIntro: "Tus datos para confirmar la cita y recibir la invitación por email.",
    meetingPhone: "Teléfono (opcional)",
    meetingPhonePlaceholder: "+54 9 11 1234-5678",
    meetingPhoneHint: "Por si hay algún problema con la videollamada o necesitamos contactarte.",
    meetingCta: "Elegir horario en el calendario",
    meetingLoading: "Cargando calendario…",
    meetingPoweredNote: "Agenda segura con Calendly · Sin salir de la web",
    name: "Nombre *",
    namePlaceholder: "Tu nombre",
    email: "Email *",
    emailPlaceholder: "tu@email.com",
    phone: "Teléfono",
    phonePlaceholder: "+54 9 11 1234-5678",
    clientType: "Tipo de cliente",
    projectType: "Tipo de proyecto",
    budget: "Presupuesto estimado",
    message: "Describe tu proyecto *",
    messagePlaceholder: "Cuéntanos qué necesitas, objetivos, plazos, referencias...",
    submit: "Enviar mensaje",
    submitting: "Enviando...",
    clientTypes: ["Empresa", "Emprendedor", "Particular"],
    projectTypes: [
      "Sitio web / Landing",
      "Aplicación web",
      "Sistema a medida",
      "Rediseño / Mejoras",
      "No estoy seguro",
    ],
    budgetRanges: [
      "Menos de $500 USD",
      "$500 – $1.500 USD",
      "$1.500 – $5.000 USD",
      "Más de $5.000 USD",
      "Aún no lo sé",
    ],
  },
  closing: {
    ariaLabel: "Palabras de cierre de Ingenio Webs",
    name: "Marco Bretschneider",
    role: "Fundador — Ingenio Webs",
    quoteLines: [
      "Transformamos ideas en productos digitales",
      "con ingenio técnico y una colaboración",
      "profunda en cada proyecto.",
    ],
  },
  footer: {
    description:
      "Diseño web, desarrollo Full Stack y soluciones de software a medida para empresas y emprendedores.",
    linksTitle: "Enlaces",
    contactTitle: "Contacto",
    socialTitle: "Redes",
    social: {
      linkedin: "LinkedIn",
      instagram: "Instagram",
      tiktok: "TikTok",
      telegram: "Telegram",
    },
    remote: "Proyectos remotos · Worldwide",
    rights: "Todos los derechos reservados.",
    privacy: "Privacidad",
    terms: "Términos",
    cookies: "Cookies",
  },
  cookieConsent: {
    title: "¡Ingenio Webs utiliza cookies para mejorar tu experiencia!",
    description:
      "Usamos cookies propias y de terceros para que el sitio funcione bien, medir el uso y habilitar funciones como el chat y la agenda de reuniones. Podés gestionar tus preferencias cuando quieras.",
    accept: "Permitir todo",
    reject: "Rechazar todo",
    privacyLink: "Aviso de Privacidad",
    cookiesPolicy: "Política de Cookies",
    configure: "Configurar preferencias",
    prefsTitle: "Gestión de preferencias de cookies",
    prefsDescription:
      "Las cookies nos ayudan a ofrecer una mejor experiencia. Algunas son necesarias para el funcionamiento del sitio; otras son opcionales.",
    prefsManage: "Gestionar preferencias de consentimiento",
    moreInfo: "Más información",
    confirmChoices: "Confirmar mis elecciones",
    alwaysActive: "Siempre activas",
    close: "Cerrar",
    categories: {
      necessary: {
        title: "Cookies estrictamente necesarias",
        description:
          "Imprescindibles para el funcionamiento básico del sitio, seguridad y recordar tu decisión de cookies.",
      },
      performance: {
        title: "Cookies de rendimiento",
        description:
          "Nos ayudan a entender cómo se usa el sitio para mejorar velocidad, navegación y contenido.",
      },
      functional: {
        title: "Cookies funcionales",
        description:
          "Permiten recordar preferencias (como idioma) y mejorar funciones del sitio.",
      },
      targeting: {
        title: "Cookies de segmentación / publicidad",
        description:
          "Pueden usarse para medir campañas o mostrar contenido más relevante. Hoy no son esenciales para usar el sitio.",
      },
    },
  },
  legal: {
    backHome: "Volver al inicio",
    updatedLabel: "Última actualización",
    privacy: {
      title: "Política de privacidad",
      updated: "3 de agosto de 2026",
      sections: [
        {
          title: "1. Responsable",
          paragraphs: [
            "Ingenio Webs, representada por Marco Bretschneider, es responsable del tratamiento de los datos personales recopilados a través de este sitio web y de los canales de contacto asociados.",
            "Contacto: info@ingeniowebs.com",
          ],
        },
        {
          title: "2. Datos que recopilamos",
          paragraphs: [
            "Podemos recopilar nombre, email, teléfono (opcional), tipo de cliente, información del proyecto y el mensaje que nos envíes a través del formulario o del chat.",
            "Si agendás una reunión, también se procesan los datos necesarios para confirmar la cita a través de Calendly.",
          ],
        },
        {
          title: "3. Finalidad del tratamiento",
          paragraphs: [
            "Usamos tus datos para responder consultas, coordinar reuniones, elaborar propuestas y brindar soporte comercial o técnico relacionado con nuestros servicios.",
            "No vendemos tus datos personales a terceros.",
          ],
        },
        {
          title: "4. Servicios de terceros",
          paragraphs: [
            "Podemos utilizar herramientas de terceros como Calendly (agenda), proveedores de hosting/analítica y servicios de mensajería. Estos proveedores tratan datos según sus propias políticas y solo en la medida necesaria para prestar el servicio.",
          ],
        },
        {
          title: "5. Cookies",
          paragraphs: [
            "Este sitio puede utilizar cookies esenciales para su funcionamiento y cookies opcionales para mejorar la experiencia o medir el uso. Podés aceptar o rechazar las cookies no esenciales desde el aviso emergente.",
            "Podés cambiar tu decisión borrando el almacenamiento local del navegador o volviendo a abrir el aviso desde el enlace “Cookies” del pie de página.",
          ],
        },
        {
          title: "6. Conservación y derechos",
          paragraphs: [
            "Conservamos los datos el tiempo necesario para gestionar tu consulta o relación comercial, salvo obligaciones legales que requieran un plazo mayor.",
            "Podés solicitar acceso, actualización o eliminación de tus datos escribiendo a info@ingeniowebs.com.",
          ],
        },
      ],
    },
    terms: {
      title: "Términos de uso",
      updated: "3 de agosto de 2026",
      sections: [
        {
          title: "1. Sobre este sitio",
          paragraphs: [
            "Este sitio web pertenece a Ingenio Webs y tiene fines informativos y comerciales sobre servicios de diseño, desarrollo y soluciones digitales.",
            "Al navegar o utilizar el sitio, aceptás estos términos.",
          ],
        },
        {
          title: "2. Servicios",
          paragraphs: [
            "La información publicada describe de forma general nuestros servicios. Cualquier alcance, plazos, precios o condiciones particulares se definen por escrito en una propuesta o acuerdo específico con el cliente.",
          ],
        },
        {
          title: "3. Propiedad intelectual",
          paragraphs: [
            "Los textos, marcas, logos, diseños, código y demás contenidos del sitio son propiedad de Ingenio Webs o de sus licenciantes, salvo indicación contraria.",
            "No está permitido copiar, reproducir o explotar estos contenidos sin autorización previa.",
          ],
        },
        {
          title: "4. Uso aceptable",
          paragraphs: [
            "Te comprometés a no utilizar el sitio de forma abusiva, fraudulenta o que afecte su seguridad, disponibilidad o la de terceros.",
            "Nos reservamos el derecho de limitar el acceso ante usos indebidos.",
          ],
        },
        {
          title: "5. Limitación de responsabilidad",
          paragraphs: [
            "Aunque procuramos mantener la información actualizada y el sitio operativo, no garantizamos disponibilidad ininterrumpida ni ausencia total de errores.",
            "Ingenio Webs no será responsable por daños indirectos derivados del uso o imposibilidad de uso del sitio, en la medida permitida por la ley aplicable.",
          ],
        },
        {
          title: "6. Contacto",
          paragraphs: [
            "Para consultas sobre estos términos: info@ingeniowebs.com",
          ],
        },
      ],
    },
  },
  chatWidget: {
    open: "Abrir chat",
    close: "Cerrar chat",
    back: "Volver",
    panelLabel: "Asistente de contacto",
    greeting: "¡Hola! 👋",
    title: "¿Cómo prefieres contactarnos?",
    subtitle: "Elige la opción que te resulte más cómoda.",
    whatsappTitle: "Continuar por WhatsApp",
    whatsappDesc: "Respuesta rápida en tu móvil",
    whatsappPrefill:
      "Hola! Vengo de la página de IngenioWebs, mi nombre es ",
    telegramTitle: "Continuar por Telegram",
    telegramDesc: "Escribinos directo por chat",
    formTitle: "Consultar aquí",
    formDesc: "Déjanos tu mensaje y te respondemos",
    formHeading: "Cuéntanos tu consulta",
    formSubtitle: "Te responderemos en menos de 24 horas.",
    liveTitle: "Chat en directo",
    liveDesc: "Hablá con nosotros ahora mismo",
    liveHeading: "Chat en directo",
    liveSubtitle: "Dejanos tus datos y empezamos a chatear.",
    liveSupportTitle: "Soporte Ingenio",
    liveOnlineHint: "En línea · respuesta rápida",
    liveMinimize: "Minimizar chat",
    liveWelcome:
      "¡Hola {name}! Soy Mr. Ingenio de soporte.\n¿En qué podemos ayudarte hoy?",
    liveStart: "Iniciar chat",
    liveStarting: "Conectando...",
    liveReplyPlaceholder: "Escribí tu mensaje...",
    liveSend: "Enviar",
    liveSending: "Enviando...",
    liveClosed:
      "Esta conversación fue cerrada. Si el equipo la reabre, vas a poder seguir acá. También podés abrir un chat nuevo.",
    liveClosedIdle:
      "Esta conversación se cerró por inactividad. Podés abrir un chat nuevo cuando quieras.",
    liveClosedLeft:
      "Cerraste el chat. Podés abrir uno nuevo cuando lo necesites.",
    liveNewChat: "Nuevo chat",
    liveNewChatHint: "¿Necesitás ayuda de nuevo? Empezá otra conversación.",
    liveResume: "Continuar chat",
    liveYou: "Vos",
    liveAgent: "Mr. Ingenio",
    liveTyping: "está escribiendo",
    liveOnline: "Conectado",
    liveOffline: "Desconectado",
    liveSystem: "Sistema",
    liveIdleTitle: "¿Seguís ahí?",
    liveIdleBody:
      "Si no confirmás, el chat se desconecta automáticamente.",
    liveIdleConfirm: "Sí, sigo aquí",
    liveIdleCountdown: "Se cierra en {time}",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Email",
    emailPlaceholder: "tu@email.com",
    phone: "Teléfono",
    phonePlaceholder: "+54 11 1234-5678",
    message: "Mensaje",
    messagePlaceholder: "¿En qué podemos ayudarte?",
    submit: "Enviar consulta",
    submitting: "Enviando...",
    successTitle: "¡Mensaje enviado!",
    successMessage: "Gracias por escribirnos. Te contactaremos muy pronto.",
  },
};
