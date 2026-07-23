"use client";

import { useEffect, useState } from "react";
import { HERO_SLIDES } from "@/lib/asian-banks";

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/70 to-ink-950/40" />
        </div>
      ))}
      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-500 ${i === current ? "w-8 bg-jade-400" : "w-2 bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
      {/* Slide caption */}
      <div className="absolute bottom-16 right-8 z-10 text-right">
        <p className="text-lg font-display font-semibold text-white/90">{HERO_SLIDES[current].title}</p>
        <p className="text-sm text-jade-300/80">{HERO_SLIDES[current].subtitle}</p>
      </div>
    </div>
  );
}
