"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface INavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: INavItem[] = [
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/verifications", label: "Verifications", icon: "✅" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        flexShrink: 0,
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "var(--color-accent)",
            letterSpacing: "-0.01em",
          }}
        >
          Cloud Clips
        </span>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            marginTop: 2,
          }}
        >
          Admin Dashboard
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: "var(--radius)",
                color: isActive ? "var(--color-text)" : "var(--color-text-muted)",
                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                fontWeight: isActive ? 500 : 400,
                marginBottom: 2,
                transition: "background 0.1s, color 0.1s",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--color-border)",
          fontSize: 11,
          color: "var(--color-text-muted)",
        }}
      >
        Phase 10 · Admin
      </div>
    </aside>
  );
}
