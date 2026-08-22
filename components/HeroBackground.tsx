"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface SymbolItem {
  x: number;
  y: number;
  text: string;
  speed: number;
  size: number;
  drift: number;
  opacity: number;
}

interface StarItem {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  phase: number;
}

interface HeroBackgroundProps {
  variant?: "light" | "dark";
  className?: string;
}

const NODE_COUNT_DESKTOP = 52;
const NODE_COUNT_MOBILE = 28;
const CONNECT_DISTANCE = 165;
const SYMBOL_COUNT_DESKTOP = 24;
const SYMBOL_COUNT_MOBILE = 12;
const STAR_COUNT_DESKTOP = 90;
const STAR_COUNT_MOBILE = 48;
const SYMBOL_POOL = [
  "{}",
  "<>",
  "/>",
  "API",
  "UX",
  "UI",
  "JS",
  "TS",
  "React",
  "Next",
  "Node",
  "CSS",
  "HTML",
  "SQL",
  "Git",
  "Design",
  "PWA",
  "SEO",
  "CRM",
  "ERP",
  "SaaS",
  "REST",
  "Docker",
  "Vercel",
  "Tailwind",
  "Full Stack",
  "Ingenio Webs",
  "Ingenio Webs",
  "Ingenio Webs",
  "Ingenio Webs",
];

function pickSymbol(forceBrand = false) {
  if (forceBrand) return "Ingenio Webs";
  return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
}

const THEMES = {
  light: {
    wrapper: "bg-white",
    canvasOpacity: "opacity-75",
    lineAlpha: 0.38,
    lineColor: "27, 117, 187",
    nodeGlow: "rgba(77, 184, 255, 0.14)",
    nodeCore: "rgba(27, 117, 187, 0.72)",
    symbolColor: "27, 117, 187",
    symbolOpacityMin: 0.16,
    symbolOpacityRange: 0.1,
    starColor: "27, 117, 187",
  },
  dark: {
    wrapper: "bg-black",
    canvasOpacity: "opacity-90",
    lineAlpha: 0.38,
    lineColor: "125, 211, 252",
    nodeGlow: "rgba(125, 211, 252, 0.18)",
    nodeCore: "rgba(125, 211, 252, 0.88)",
    symbolColor: "125, 211, 252",
    symbolOpacityMin: 0.18,
    symbolOpacityRange: 0.2,
    starColor: "255, 255, 255",
  },
} as const;

export default function HeroBackground({
  variant = "light",
  className = "",
}: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = THEMES[variant];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let nodes: Node[] = [];
    let symbols: SymbolItem[] = [];
    let stars: StarItem[] = [];
    let tick = 0;

    const init = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const isCompact = rect.width < 768;
      const nodeCount = isCompact ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;
      const symbolCount = isCompact ? SYMBOL_COUNT_MOBILE : SYMBOL_COUNT_DESKTOP;
      const starCount = isCompact ? STAR_COUNT_MOBILE : STAR_COUNT_DESKTOP;

      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        radius: Math.random() * 1.4 + 2,
      }));

      const cols = Math.ceil(
        Math.sqrt(symbolCount * (rect.width / Math.max(rect.height, 1))),
      );
      const rows = Math.ceil(symbolCount / cols);
      const cellW = rect.width / cols;
      const cellH = rect.height / rows;

      symbols = Array.from({ length: symbolCount }, (_, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const isBrand = index % 5 === 0;
        return {
          x: col * cellW + cellW * (0.15 + Math.random() * 0.7),
          y: row * cellH + cellH * (0.2 + Math.random() * 0.6),
          text: pickSymbol(isBrand),
          speed: 0.45 + Math.random() * 0.75,
          size: isBrand ? 15 + Math.random() * 6 : 13 + Math.random() * 7,
          drift: (Math.random() - 0.5) * 0.18,
          opacity:
            theme.symbolOpacityMin +
            Math.random() * theme.symbolOpacityRange +
            (isBrand ? 0.08 : 0),
        };
      });

      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        radius: Math.random() * 1.35 + 0.35,
        baseOpacity: 0.18 + Math.random() * 0.55,
        twinkleSpeed: 0.015 + Math.random() * 0.035,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      tick += 1;

      // Estrellas titilando (detrás de la red)
      stars.forEach((star) => {
        const twinkle =
          0.35 +
          0.65 *
            (0.5 +
              0.5 * Math.sin(tick * star.twinkleSpeed + star.phase));
        const alpha = star.baseOpacity * twinkle;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${theme.starColor}, ${alpha})`;
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Destello suave en estrellas más brillantes
        if (star.radius > 1.1 && alpha > 0.45) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${theme.starColor}, ${alpha * 0.22})`;
          ctx.arc(star.x, star.y, star.radius * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > rect.width) node.vx *= -1;
        if (node.y < 0 || node.y > rect.height) node.vy *= -1;
      });

      symbols.forEach((sym, index) => {
        sym.x += sym.speed;
        sym.y += sym.drift;
        if (sym.x > rect.width + 60) {
          sym.x = -80 - Math.random() * 120;
          sym.y = Math.random() * rect.height;
          sym.text = pickSymbol(index % 5 === 0);
        }
        if (sym.y < 0 || sym.y > rect.height) sym.drift *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DISTANCE) {
            const alpha = (1 - dist / CONNECT_DISTANCE) * theme.lineAlpha;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${theme.lineColor}, ${alpha})`;
            ctx.lineWidth = 1.1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.fillStyle = theme.nodeGlow;
        ctx.arc(node.x, node.y, node.radius + 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = theme.nodeCore;
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      symbols.forEach((sym) => {
        ctx.font = `600 ${sym.size}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(${theme.symbolColor}, ${sym.opacity})`;
        ctx.fillText(sym.text, sym.x, sym.y);
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [theme]);

  return (
    <div
      className={`hero-network-bg pointer-events-none absolute inset-0 overflow-hidden ${theme.wrapper} ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full ${theme.canvasOpacity}`}
      />
      {variant === "light" && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      )}
    </div>
  );
}
