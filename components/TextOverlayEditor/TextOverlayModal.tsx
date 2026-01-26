"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TextOverlayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function TextOverlayModal({ isOpen, onClose, children }: TextOverlayModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.inset = "0";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.inset = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.inset = "";
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
