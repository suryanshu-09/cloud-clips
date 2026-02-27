"use client";

import React from "react";

type ButtonVariant = "primary" | "danger" | "ghost" | "success";

interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--color-accent)",
    color: "#000",
    border: "none",
  },
  danger: {
    background: "var(--color-danger)",
    color: "#fff",
    border: "none",
  },
  success: {
    background: "var(--color-success)",
    color: "#fff",
    border: "none",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-muted)",
    border: "1px solid var(--color-border)",
  },
};

export function Button({
  variant = "ghost",
  size = "sm",
  loading = false,
  disabled,
  children,
  style,
  ...props
}: IButtonProps) {
  const padding = size === "sm" ? "5px 12px" : "8px 16px";
  const fontSize = size === "sm" ? 12 : 14;

  return (
    <button
      disabled={disabled || loading}
      style={{
        ...variantStyles[variant],
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: "var(--radius)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        transition: "opacity 0.15s",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...props}
    >
      {loading ? "..." : children}
    </button>
  );
}
