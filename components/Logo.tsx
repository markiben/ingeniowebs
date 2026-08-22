import Image from "next/image";

interface LogoProps {
  className?: string;
  height?: number;
  variant?: "default" | "navbar" | "hero";
}

const WORDMARK_RATIO = 1000 / 250;
const MARK_RATIO = 1;

export default function Logo({ className = "", height = 44, variant = "default" }: LogoProps) {
  const isNavbar = variant === "navbar";
  const isHero = variant === "hero" || className.includes("hero-logo");

  const src = isNavbar
    ? "/logobarrasuperior.png"
    : isHero
      ? "/logoportada.png"
      : "/logo.png";

  const ratio = isHero ? MARK_RATIO : WORDMARK_RATIO;

  return (
    <span
      className={`${isHero ? "flex w-full justify-center" : "inline-flex shrink-0 items-center"} ${className}`}
    >
      <Image
        src={src}
        alt="Ingenio Webs"
        width={isHero ? 1024 : 1000}
        height={isHero ? 1024 : 250}
        priority
        className={`block object-contain${isHero ? " hero-logo-img" : ""}${isHero ? "" : " mix-blend-screen"}`}
        style={
          isHero
            ? undefined
            : {
                height: `${height}px`,
                width: "auto",
                maxWidth: `min(100%, ${Math.round(height * ratio)}px)`,
              }
        }
      />
    </span>
  );
}
