import { useEffect, useRef, useState } from "react";

interface MotionVideoProps {
  src: string;
  poster: string;
  className?: string;
  eager?: boolean;
  label: string;
}

export function MotionVideo({ src, poster, className = "", eager = false, label }: MotionVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (eager || inView || !containerRef.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { rootMargin: "180px" });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [eager, inView]);

  return (
    <div ref={containerRef} className={`motion-video ${className}`} role="img" aria-label={label}>
      {inView && !reducedMotion ? (
        <video autoPlay muted loop playsInline preload={eager ? "metadata" : "none"} poster={poster} aria-hidden="true">
          <source src={src} type="video/mp4" />
        </video>
      ) : <img src={poster} alt="" aria-hidden="true" loading={eager ? "eager" : "lazy"} />}
    </div>
  );
}
