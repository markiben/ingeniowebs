"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type PlatformTheme = "light" | "dark";

const PlatformThemeContext = createContext<PlatformTheme>("dark");

export function PlatformThemeProvider({
  theme,
  children,
}: {
  theme: PlatformTheme;
  children: ReactNode;
}) {
  return (
    <PlatformThemeContext.Provider value={theme}>
      {children}
    </PlatformThemeContext.Provider>
  );
}

export function usePlatformTheme() {
  return useContext(PlatformThemeContext);
}
