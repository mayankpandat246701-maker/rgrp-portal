"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { playClickSound } from "@/lib/click-sound";

type Variant = "primary" | "secondary" | "ghost" | "onDark" | "outlineOnDark";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 select-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700 " +
  "active:scale-[0.97] active:shadow-inner disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "border border-saffron-300/70 bg-gradient-to-b from-saffron-500/95 to-saffron-600/95 text-white shadow-[0_10px_25px_-10px_rgba(158,74,12,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md hover:from-saffron-500 hover:to-saffron-700 hover:shadow-[0_14px_30px_-10px_rgba(158,74,12,0.75),inset_0_1px_0_rgba(255,255,255,0.35)]",
  secondary:
    "glass text-cocoa-900 hover:bg-white/85 hover:border-saffron-300",
  ghost:
    "border border-transparent text-saffron-700 hover:bg-white/50 hover:border-white/70",
  onDark:
    "border border-white/80 bg-white/90 text-saffron-700 shadow-lg backdrop-blur-md hover:bg-white focus-visible:outline-white",
  outlineOnDark:
    "border border-white/45 bg-white/10 text-white backdrop-blur-md hover:bg-white/25 focus-visible:outline-white",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function glassButtonClasses(variant: Variant = "primary", size: Size = "md", className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

type GlassLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function GlassLink({ variant, size, className, onClick, ...props }: GlassLinkProps) {
  return (
    <Link
      {...props}
      className={glassButtonClasses(variant, size, className)}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        playClickSound();
        onClick?.(event);
      }}
    />
  );
}

type GlassButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function GlassButton({ variant, size, className, onClick, type = "button", ...props }: GlassButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={glassButtonClasses(variant, size, className)}
      onClick={(event) => {
        playClickSound();
        onClick?.(event);
      }}
    />
  );
}
