"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  images: readonly string[];
  intervalMs?: number;
  fadeMs?: number;
};

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function Slideshow({ images, intervalMs = 8000, fadeMs = 800 }: Props) {
  const [order, setOrder] = useState<string[]>(() => Array.from(images));
  const [index, setIndex] = useState(0);
  const [showA, setShowA] = useState(true);
  const [srcA, setSrcA] = useState<string | null>(null);
  const [srcB, setSrcB] = useState<string | null>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    const shuffled = shuffle(images);
    setOrder(shuffled);
    setSrcA(shuffled[0] ?? null);
    setSrcB(null);
    setIndex(0);
  }, [images]);

  useEffect(() => {
    if (reducedMotion.current) return;
    if (order.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % order.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [order, intervalMs]);

  useEffect(() => {
    if (order.length === 0) return;
    if (reducedMotion.current) {
      setSrcA(order[0]);
      setSrcB(null);
      return;
    }
    const next = order[index];
    if (showA) {
      setSrcB(next);
      const t = window.setTimeout(() => setShowA(false), 10);
      return () => window.clearTimeout(t);
    }
    setSrcA(next);
    const t = window.setTimeout(() => setShowA(true), 10);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, order]);

  useEffect(() => {
    if (order.length === 0) return;
    const upcoming = order[(index + 1) % order.length];
    if (!upcoming) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = upcoming;
    document.head.appendChild(link);
    return () => {
      link.parentNode?.removeChild(link);
    };
  }, [order, index]);

  const dropImage = (src: string | null) => {
    if (!src) return;
    setOrder((prev) => prev.filter((s) => s !== src));
  };

  if (order.length === 0 || !srcA) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-bg"
    >
      <img
        src={srcA}
        alt=""
        onError={() => dropImage(srcA)}
        style={{
          transitionDuration: `${fadeMs}ms`,
          opacity: showA ? 1 : 0,
        }}
        className="absolute inset-0 h-full w-full object-cover transition-opacity ease-linear"
      />
      {srcB && (
        <img
          src={srcB}
          alt=""
          onError={() => dropImage(srcB)}
          style={{
            transitionDuration: `${fadeMs}ms`,
            opacity: showA ? 0 : 1,
          }}
          className="absolute inset-0 h-full w-full object-cover transition-opacity ease-linear"
        />
      )}
    </div>
  );
}
