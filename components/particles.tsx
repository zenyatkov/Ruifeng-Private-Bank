"use client";

export function FloatingParticles() {
  return (
    <div className="particles-bg">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="particle" />
      ))}
    </div>
  );
}
