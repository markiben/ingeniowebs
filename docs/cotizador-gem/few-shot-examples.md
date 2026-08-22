# Ejemplos few-shot (salida esperada del Gem)

## Ejemplo 1 — Landing de captación

```json
{
  "version": "1.0",
  "client": {
    "name": "Lucía Fernández",
    "company": "Studio Norte",
    "email": "lucia@studionorte.com"
  },
  "project": {
    "title": "Landing page de captación para estudio de arquitectura",
    "summary": "Landing de una página orientada a captar consultas de proyectos residenciales, con mensaje claro de valor, prueba social y formulario de contacto.",
    "objectives": [
      "Comunicar diferencial del estudio en pocos segundos",
      "Aumentar consultas calificadas desde campañas",
      "Dejar una base medible de conversiones"
    ],
    "scope": [
      "Diseño UI de landing responsive",
      "Secciones: hero, servicios, proceso, prueba social y contacto",
      "Formulario de consulta",
      "Integración básica de analytics"
    ],
    "outOfScope": [
      "Sitio multipágina completo",
      "Producción fotográfica",
      "Gestión de campañas publicitarias"
    ],
    "phases": [
      {
        "name": "Discovery y copy structure",
        "description": "Alineación de mensaje, propuesta de valor y estructura de la landing.",
        "deliverables": ["Wireframe", "Outline de contenidos"],
        "estimatedHours": 6
      },
      {
        "name": "Diseño UI",
        "description": "Diseño visual de alta fidelidad mobile-first.",
        "deliverables": ["Mockup desktop/mobile", "Guía breve de estilos"],
        "estimatedHours": 14
      },
      {
        "name": "Desarrollo y puesta en marcha",
        "description": "Implementación, formulario, responsivo y publicación.",
        "deliverables": ["Landing publicada", "Checklist de QA"],
        "estimatedHours": 18
      }
    ],
    "timelineNote": "Plazo orientativo de 2 a 3 semanas según tiempos de feedback.",
    "assumptions": [
      "El cliente entrega fotos y textos base",
      "Un ciclo de revisión por etapa"
    ],
    "notes": "Dominio y hosting pueden gestionarse aparte."
  }
}
```

## Ejemplo 2 — Sitio corporativo

```json
{
  "version": "1.0",
  "client": {
    "name": "Martín Acosta",
    "company": "Acosta & Cia",
    "email": "martin@acostacia.com"
  },
  "project": {
    "title": "Sitio web corporativo multipágina",
    "summary": "Sitio institucional para presentar servicios, equipo y casos, con recorrido claro hacia contacto comercial.",
    "objectives": [
      "Modernizar la presencia digital de la marca",
      "Ordenar la oferta de servicios",
      "Facilitar el contacto comercial"
    ],
    "scope": [
      "Arquitectura de información",
      "Diseño UI de home, servicios, nosotros, casos y contacto",
      "Desarrollo responsive",
      "Formulario de contacto",
      "SEO on-page básico"
    ],
    "outOfScope": [
      "E-commerce",
      "App móvil",
      "Redacción completa de todos los textos largos"
    ],
    "phases": [
      {
        "name": "Discovery y arquitectura",
        "description": "Brief, mapa de sitio y priorización de contenidos.",
        "deliverables": ["Mapa de sitio", "Wireframes clave"],
        "estimatedHours": 10
      },
      {
        "name": "Diseño de sistema y pantallas",
        "description": "Dirección visual, componentes y pantallas principales.",
        "deliverables": ["UI kit", "Mockups de páginas clave"],
        "estimatedHours": 28
      },
      {
        "name": "Desarrollo, QA y lanzamiento",
        "description": "Implementación, formularios, responsivo, SEO base y deploy.",
        "deliverables": ["Sitio en producción", "Manual breve de edición"],
        "estimatedHours": 40
      }
    ],
    "timelineNote": "Plazo orientativo de 5 a 7 semanas según feedback y contenidos.",
    "assumptions": [
      "Acceso a marca (logo, tipografías, colores)",
      "Feedback consolidado en un solo interlocutor"
    ],
    "notes": "Blog o panel CMS pueden sumarse en una segunda etapa."
  }
}
```
