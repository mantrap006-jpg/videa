"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&q=85",
    alt: "Camera and creative video production equipment"
  },
  {
    src: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=85",
    alt: "Creator recording a video with a microphone"
  },
  {
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85",
    alt: "Creative workspace with computer and video tools"
  },
  {
    src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
    alt: "People discovering digital content together"
  },
  {
    src: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85",
    alt: "Cinema auditorium and movie entertainment"
  },
  {
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85",
    alt: "Live concert with a crowd enjoying music"
  },
  {
    src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85",
    alt: "Concert stage lights and live music performance"
  },
  {
    src: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1200&q=85",
    alt: "Festival crowd sharing a live event experience"
  },
  {
    src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=85",
    alt: "Gaming and esports event"
  }
];

export default function HeroImageCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mh-hero-slideshow" aria-label="Videa video creator highlights">
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          className={`mh-hero-slide${index === active ? " is-active" : ""}`}
          src={slide.src}
          alt={index === active ? slide.alt : ""}
          aria-hidden={index !== active}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          decoding="async"
        />
      ))}
      <div className="mh-art-shade" />
      <div className="mh-slide-indicators" aria-hidden="true">
        {slides.map((slide, index) => (
          <span key={slide.src} className={index === active ? "is-active" : ""} />
        ))}
      </div>
    </div>
  );
}
