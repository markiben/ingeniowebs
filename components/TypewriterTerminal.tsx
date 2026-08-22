"use client";

import { useEffect, useState } from "react";

interface TypewriterTerminalProps {
  text: string;
  prefix?: string;
  speed?: number;
  delay?: number;
  className?: string;
  showCursor?: boolean;
  /** Keep blinking cursor after typing finishes (default true) */
  keepCursorWhenDone?: boolean;
  /** Hide the live line until typing starts (avoids a stray cursor on the next prompt) */
  hideUntilStart?: boolean;
}

export default function TypewriterTerminal({
  text,
  prefix = "",
  speed = 22,
  delay = 0,
  className = "",
  showCursor = true,
  keepCursorWhenDone = true,
  hideUntilStart = false,
}: TypewriterTerminalProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let startId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setDisplayed(text);
      setStarted(true);
      setDone(true);
      return;
    }

    setDisplayed("");
    setStarted(false);
    setDone(false);

    startId = setTimeout(() => {
      if (cancelled) return;
      setStarted(true);
      let index = 0;
      intervalId = setInterval(() => {
        if (cancelled) return;
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          clearInterval(intervalId);
          setDone(true);
        }
      }, speed);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, delay]);

  const cursorVisible =
    showCursor && started && (!done || keepCursorWhenDone);
  const liveVisible = !hideUntilStart || started;

  return (
    <p className={`help-terminal font-mono leading-relaxed text-emerald-400 ${className}`}>
      <span className="help-terminal-stack">
        <span className="help-terminal-measure" aria-hidden="true">
          {prefix}
          {text}
          {showCursor ? "\u00A0" : null}
        </span>
        <span className="help-terminal-live">
          {liveVisible ? (
            <>
              {prefix ? <span className="text-white/35">{prefix}</span> : null}
              {displayed}
              {cursorVisible ? (
                <span
                  className={`help-terminal-cursor${done ? " help-terminal-cursor-idle" : ""}`}
                  aria-hidden="true"
                />
              ) : null}
            </>
          ) : null}
        </span>
      </span>
    </p>
  );
}
