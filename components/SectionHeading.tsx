"use client";

interface SectionHeadingProps {
  label: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  variant?: "light" | "dark";
  spacing?: "default" | "compact";
  titleClassName?: string;
}

export default function SectionHeading({
  label,
  title,
  description,
  align = "center",
  variant = "light",
  spacing = "default",
  titleClassName = "",
}: SectionHeadingProps) {
  const isDark = variant === "dark";
  const spacingClass = spacing === "compact" ? "mb-8 md:mb-10" : "mb-10 md:mb-12";

  return (
    <div
      className={`section-heading ${spacingClass} ${align === "center" ? "text-center" : "text-left"}`}
    >
      <p
        className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${
          isDark ? "text-iw-blue-light" : "text-iw-blue"
        }`}
      >
        {label}
      </p>
      <h2
        className={`text-3xl font-semibold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-[1.12] ${
          titleClassName
            ? titleClassName
            : isDark
              ? "text-white"
              : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 max-w-2xl text-base leading-relaxed md:text-lg ${
            isDark ? "text-white/65" : "text-muted"
          } ${align === "center" ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
