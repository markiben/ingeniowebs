"use client";

import { useEffect, useState } from "react";

export default function useIsMobile(query = "(max-width: 900px)") {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return isMobile;
}
