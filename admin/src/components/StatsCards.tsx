"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function StatsCards() {
  const stats = useQuery(api.admin.queries.adminUserStats);

  if (!stats) {
    return (
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.total, color: "var(--color-text)" },
    { label: "Clients", value: stats.clients, color: "#63b3ed" },
    { label: "Barbers", value: stats.barbers, color: "#fc8181" },
    { label: "Active", value: stats.active, color: "#68d391" },
    { label: "Banned", value: stats.banned, color: "var(--color-danger)" },
    { label: "Pending Verifications", value: stats.pendingVerifications, color: "#f6e05e" },
  ];

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "16px 20px",
            minWidth: 140,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: card.color,
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {card.value}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        padding: "16px 20px",
        minWidth: 140,
        opacity: 0.4,
      }}
    >
      <div style={{ height: 26, width: 40, background: "var(--color-border)", borderRadius: 4, marginBottom: 6 }} />
      <div style={{ height: 11, width: 80, background: "var(--color-border)", borderRadius: 4 }} />
    </div>
  );
}
