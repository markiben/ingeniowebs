"use client";

import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState<"always" | "user">("always");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px), (hover: none) and (pointer: coarse)");
    const sync = () => setReduced(mq.matches ? "always" : "user");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return <MotionConfig reducedMotion={reduced}>{children}</MotionConfig>;
}
