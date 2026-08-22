"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, type MotionProps } from "framer-motion";

/** Mobile / touch / reduced-motion: skip fade-ins that can stick at opacity 0 on WebKit. */
export function useMotionEnabled() {
  const reduced = useReducedMotion();
  const [narrow, setNarrow] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px), (hover: none) and (pointer: coarse)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return !narrow && !reduced;
}

export function reveal(
  enabled: boolean,
  props: Pick<MotionProps, "initial" | "animate" | "whileInView" | "viewport" | "transition" | "exit" | "variants">
): Pick<MotionProps, "initial" | "animate" | "whileInView" | "viewport" | "transition" | "exit" | "variants"> {
  if (!enabled) return {};
  return props;
}
