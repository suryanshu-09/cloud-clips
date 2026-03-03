"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserTable } from "@/components/UserTable";
import { StatsCards } from "@/components/StatsCards";
import { Button } from "@/components/Button";

type RoleFilter = "client" | "barber" | "admin" | undefined;

export function UsersPageClient() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>(undefined);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        setDebouncedSearch(value);
        setCursor(undefined);
      }, 300);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  const result = useQuery(
    api.admin.queries.listUsers,
    {
      search: debouncedSearch || undefined,
      role,
      cursor,
      pageSize: 25,
    }
  );

  // Force re-query after mutation by incrementing key
  // (Convex queries auto-revalidate reactively, so this is a UX hint reset)
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    void refreshKey; // suppress lint
  }, [refreshKey]);

  return (
    <div>
      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
        User Management
      </h1>
      <p style={{ margin: "0 0 24px", color: "var(--color-text-muted)" }}>
        Search, filter, ban, delete users and verify barbers.
      </p>

      {/* Stats */}
      <StatsCards />

      {/* Filters row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
        />

        <select
          value={role ?? ""}
          onChange={(e) => {
            const val = e.target.value as RoleFilter | "";
            setRole(val === "" ? undefined : (val as RoleFilter));
            setCursor(undefined);
          }}
        >
          <option value="">All roles</option>
          <option value="client">Client</option>
          <option value="barber">Barber</option>
          <option value="admin">Admin</option>
        </select>

        {(search || role) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
              setRole(undefined);
              setCursor(undefined);
            }}
          >
            Clear filters
          </Button>
        )}

        {result && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-muted)" }}>
            {result.total} user{result.total !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {/* Table */}
      {result === undefined ? (
        <div style={{ color: "var(--color-text-muted)", padding: "32px 0", textAlign: "center" }}>
          Loading...
        </div>
      ) : (
        <UserTable users={result.users} onRefresh={handleRefresh} />
      )}

      {/* Pagination */}
      {result && (result.nextCursor || cursor) && (
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "center" }}>
          {cursor && (
            <Button variant="ghost" onClick={() => setCursor(undefined)}>
              First page
            </Button>
          )}
          {result.nextCursor && (
            <Button
              variant="ghost"
              onClick={() => setCursor(result.nextCursor ?? undefined)}
            >
              Next page
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
