export const navLinks = [
  { label: "Servicios", href: "#servicios" },
  { label: "Blog", href: "/blog" },
  { label: "Proceso", href: "#proceso" },
  { label: "Mantenimiento", href: "#mantenimiento" },
  { label: "FAQ", href: "#faq" },
  { label: "Contacto", href: "#contacto" },
];

export const helpCards = [
  {
    icon: "lightbulb",
    title: "Tengo una idea",
    description: "Quiero llevar mi idea a una app o plataforma web funcional.",
    href: "#servicios",
  },
  {
    icon: "globe",
    title: "Necesito presencia online",
    description: "Quiero un sitio profesional que genere clientes y transmita confianza.",
    href: "#servicios",
  },
  {
    icon: "building",
    title: "Mi empresa necesita un sistema",
    description: "Quiero automatizar procesos con software a medida para mi negocio.",
    href: "#servicios",
  },
  {
    icon: "refresh",
    title: "Ya tengo algo, pero no funciona bien",
    description: "Necesito rediseño, mejoras de rendimiento o migración tecnológica.",
    href: "#servicios",
  },
];

export const services = [
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
    idealFor: "Empresas con procesos manuales, equipos que dependen de Excel o sistemas obsoletos.",
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
];

export const portfolio = [
  {
    id: "ecommerce",
    category: "E-commerce",
    title: "Tienda Online ModaVerde",
    challenge:
      "Un emprendimiento de moda sostenible necesitaba vender online sin depender de marketplaces con altas comisiones.",
    solution:
      "E-commerce a medida con catálogo dinámico, carrito optimizado, pasarela de pagos e integración con envíos.",
    stack: ["Next.js", "Stripe", "PostgreSQL", "Tailwind CSS"],
    result: "Lanzamiento en 6 semanas con checkout optimizado y +35% de conversión vs. su solución anterior.",
    tags: ["Web", "Apps"],
  },
  {
    id: "crm",
    category: "Sistemas",
    title: "CRM Interno Logística Norte",
    challenge:
      "Una empresa de logística gestionaba clientes y pedidos en hojas de cálculo, generando errores y retrasos.",
    solution:
      "Sistema CRM a medida con gestión de clientes, seguimiento de pedidos, reportes automáticos y roles por equipo.",
    stack: ["React", "Node.js", "PostgreSQL", "Docker"],
    result: "Automatización del 80% del seguimiento manual y reducción de errores operativos.",
    tags: ["Sistemas"],
  },
  {
    id: "landing",
    category: "Diseño Web",
    title: "Landing Consultora FinanzasPro",
    challenge:
      "Una consultora financiera necesitaba captar leads cualificados con una presencia online profesional.",
    solution:
      "Landing page de alta conversión con diseño UI/UX centrado en confianza, formulario inteligente y SEO optimizado.",
    stack: ["Astro", "Tailwind CSS", "Framer Motion"],
    result: "Puntuación 98/100 en Lighthouse y duplicación de consultas en el primer mes.",
    tags: ["Diseño", "Web"],
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Conversamos",
    description:
      "Entendemos tu idea, objetivos, presupuesto y plazos. Sin compromiso, con total claridad desde el inicio.",
  },
  {
    step: "02",
    title: "Planificamos",
    description:
      "Definimos alcance, wireframes, arquitectura técnica, tiempos y presupuesto cerrado. Sin sorpresas.",
  },
  {
    step: "03",
    title: "Construimos",
    description:
      "Desarrollo iterativo con avances visibles, feedback continuo, pruebas y código limpio y mantenible.",
  },
  {
    step: "04",
    title: "Lanzamos",
    description:
      "Deploy en producción, capacitación básica y periodo de garantía. Mantenimiento opcional disponible.",
  },
];

export const technologies = [
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
];

export const maintenancePlans = [
  {
    name: "Plan Mensual",
    description: "Soporte continuo ideal para sitios activos, e-commerce y sistemas en uso diario.",
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
    description: "Mismo nivel de soporte con descuento por compromiso anual. Ideal para webs corporativas estables.",
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
];

export const faqs = [
  {
    question: "¿Trabajan con empresas y particulares?",
    answer:
      "Sí. Trabajamos con empresas de todos los tamaños, emprendedores y particulares que necesitan soluciones digitales profesionales, tanto presenciales como de forma remota.",
  },
  {
    question: "¿El mantenimiento está incluido en el proyecto?",
    answer:
      "No. El proyecto incluye desarrollo, pruebas, lanzamiento y un periodo de garantía para correcciones de lo entregado. El mantenimiento mensual o anual es un servicio opcional aparte.",
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
    question: "¿Puedo contratar mantenimiento más adelante?",
    answer:
      "Sí, incluso si el proyecto original no fue desarrollado por nosotros. Evaluamos tu sitio o sistema y te proponemos el plan más adecuado.",
  },
  {
    question: "¿Trabajan con clientes de otras ciudades o países?",
    answer:
      "Sí. Trabajamos de forma remota con clientes de cualquier ubicación. Las reuniones se realizan por videollamada y la comunicación es constante durante todo el proyecto.",
  },
];

export const projectTypes = [
  "Sitio web / Landing",
  "Aplicación web",
  "Sistema a medida",
  "Rediseño / Mejoras",
  "No estoy seguro",
];

export const clientTypes = ["Empresa", "Emprendedor", "Particular"];

export const budgetRanges = [
  "Menos de $500 USD",
  "$500 – $1.500 USD",
  "$1.500 – $5.000 USD",
  "Más de $5.000 USD",
  "Aún no lo sé",
];

export const maintenanceOptions = ["No", "Plan mensual", "Plan anual", "Aún no lo sé"];
