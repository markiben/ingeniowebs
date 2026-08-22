"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

interface AboutLayersProps {
  stackTitle: string;
  stackNote: string;
  stats: { label: string; value: string }[];
  technologies: string[];
}

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function AboutLayers({
  stackTitle,
  stackNote,
  stats,
  technologies,
}: AboutLayersProps) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [18, -18]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    const playVideo = () => {
      void video.play().catch(() => {});
    };

    const handleEnded = () => {
      video.currentTime = 0;
      playVideo();
    };

    video.addEventListener("ended", handleEnded);
    playVideo();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) playVideo();
      },
      { threshold: 0.2 }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener("ended", handleEnded);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="about-showcase">
      <div className="about-showcase-ring" aria-hidden="true" />

      <motion.div style={{ y: heroY }} className="about-showcase-hero">
        <motion.div
          className="about-showcase-frame"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.01 }}
          variants={fadeUp}
        >
          <div className="about-showcase-media">
            <video
              ref={videoRef}
              className="about-showcase-video"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-label="Ingenio Webs"
              poster="/logo.png"
            >
              <source src="/about/logogirando.mp4" type="video/mp4" />
            </video>
            <Image
              src="/logo.png"
              alt=""
              fill
              className="about-showcase-video-static object-cover"
              aria-hidden="true"
            />
          </div>
        </motion.div>

        <motion.div
          className="about-showcase-stats"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.01 }}
          variants={fadeUp}
          transition={{ delay: 0.08 }}
        >
          {stats.map((item) => (
            <div key={item.label} className="about-showcase-stat">
              <span className="about-showcase-stat-label">{item.label}</span>
              <span className="about-showcase-stat-value">{item.value}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="about-showcase-panel"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.01 }}
        variants={fadeUp}
        transition={{ delay: 0.14 }}
      >
        <p className="about-showcase-panel-title">{stackTitle}</p>
        <div className="about-showcase-tags">
          {technologies.map((tech) => (
            <span key={tech} className="about-showcase-tag">
              {tech}
            </span>
          ))}
        </div>
        <p className="about-showcase-panel-note">{stackNote}</p>
      </motion.div>
    </div>
  );
}
