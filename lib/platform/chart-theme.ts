import type { PlatformTheme } from "@/components/platform/PlatformThemeContext";

export function chartTheme(theme: PlatformTheme) {
  const dark = theme === "dark";
  return {
    grid: dark ? "rgba(96,165,250,0.14)" : "rgba(15,23,42,0.08)",
    tick: dark ? "#9ec0db" : "#64748b",
    tooltipBg: dark ? "#16304a" : "#ffffff",
    tooltipBorder: dark ? "rgba(56,189,248,0.28)" : "rgba(15,23,42,0.1)",
    tooltipColor: dark ? "#e8f1fa" : "#0f172a",
    legend: dark ? "#9ec0db" : "#64748b",
    pieLabel: dark ? "#f5f9fc" : "#0f172a",
    cursorFill: dark
      ? "rgba(125, 211, 252, 0.18)"
      : "rgba(27, 117, 187, 0.14)",
  };
}
