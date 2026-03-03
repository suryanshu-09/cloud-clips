"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/Button";
import type { Id } from "../../../convex/_generated/dataModel";

export function VerificationsClient() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const verifyBarber = useMutation(api.admin.mutations.verifyBarber);

  const result = useQuery(api.admin.queries.listPendingVerifications, {
    cursor,
    pageSize: 25,
  });

  async function handleVerify(userId: Id<"users">) {
    setLoadingId(userId);
    try {
      await verifyBarber({ userId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
        Barber Verifications
      </h1>
      <p style={{ margin: "0 0 24px", color: "var(--color-text-muted)" }}>
        Review and approve barbers awaiting verification.
      </p>

      {result === undefined ? (
        <div style={{ color: "var(--color-text-muted)", padding: "32px 0", textAlign: "center" }}>
          Loading...
        </div>
      ) : result.profiles.length === 0 ? (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "48px 0",
            textAlign: "center",
            color: "var(--color-text-muted)",
          }}
        >
          No pending verifications.
        </div>
      ) : (
        <>
          <div
            style={{
              marginBottom: 12,
              fontSize: 12,
              color: "var(--color-text-muted)",
            }}
          >
            {result.total} pending
          </div>
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
            }}
          >
            <table>
              <thead>
                <tr>
                  <th>Barber</th>
                  <th>Business Name</th>
                  <th>Location</th>
                  <th>Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.profiles.map((profile) => {
                  const isLoading = loadingId === profile.userId;
                  return (
                    <tr key={profile.profileId}>
                      {/* Barber */}
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {profile.user?.name ?? "—"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {profile.user?.email}
                        </div>
                      </td>

                      {/* Business Name */}
                      <td>{profile.businessName}</td>

                      {/* Location */}
                      <td style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        {profile.location.city
                          ? `${profile.location.city}, ${profile.location.state ?? ""}`
                          : profile.location.address}
                      </td>

                      {/* Applied */}
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button
                            variant="primary"
                            loading={isLoading}
                            onClick={() =>
                              handleVerify(profile.userId as Id<"users">)
                            }
                          >
                            Verify
                          </Button>
                          <Link href={`/users/${profile.userId}`}>
                            <Button variant="ghost">View Profile</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(result.nextCursor || cursor) && (
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
        </>
      )}
    </div>
  );
}
