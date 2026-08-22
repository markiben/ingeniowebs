"use client";

interface HeroMarqueeProps {
  words: string[];
}

export default function HeroMarquee({ words }: HeroMarqueeProps) {
  const track = [...words, ...words];

  return (
    <div id="hero-marquee" className="hero-marquee relative z-20 mt-auto w-full shrink-0" aria-hidden="true">
      <div className="hero-marquee-track">
        {track.map((word, i) => (
          <span key={`${word}-${i}`} className="hero-marquee-item">
            {word}
            <span className="hero-marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
