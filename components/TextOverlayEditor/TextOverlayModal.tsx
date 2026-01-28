"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

type TextOverlayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function TextOverlayModal({ isOpen, onClose, children }: TextOverlayModalProps) {
  const [mounted, setMounted] = useState(false);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;
      
      // Prevent body scroll using overflow instead of position fixed
      // This prevents layout shift/zoom issues
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    } else {
      // Restore body scroll
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      
      // Restore scroll position after a brief delay to allow DOM to settle
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "white",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
