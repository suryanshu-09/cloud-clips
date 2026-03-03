"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/Button";
import type { Id } from "../../../../convex/_generated/dataModel";

interface IUserDetailClientProps {
  userId: string;
}

export function UserDetailClient({ userId }: IUserDetailClientProps) {
  const router = useRouter();
  const user = useQuery(api.admin.queries.adminGetUser, {
    userId: userId as Id<"users">,
  });

  const banUser = useMutation(api.admin.mutations.banUser);
  const unbanUser = useMutation(api.admin.mutations.unbanUser);
  const deleteUser = useMutation(api.admin.mutations.deleteUser);
  const verifyBarber = useMutation(api.admin.mutations.verifyBarber);
  const revokeVerification = useMutation(api.admin.mutations.revokeBarberVerification);
  const changeRole = useMutation(api.admin.mutations.changeUserRole);

  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setLoading(true);
    try {
      await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  if (user === undefined) {
    return <div style={{ color: "var(--color-text-muted)" }}>Loading...</div>;
  }

  if (user === null) {
    return <div style={{ color: "var(--color-danger)" }}>User not found.</div>;
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          background: "none",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          padding: 0,
          marginBottom: 24,
          fontSize: 13,
        }}
      >
        ← Back to users
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name ?? "Avatar"}
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: "var(--color-text-muted)",
            }}
          >
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {user.name ?? "Unnamed User"}
          </h1>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
            {user.email}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span className={`badge badge-${user.role}`}>{user.role}</span>
            <span className={`badge ${user.isActive ? "badge-active" : "badge-banned"}`}>
              {user.isActive ? "Active" : "Banned"}
            </span>
            {user.emailVerified && (
              <span className="badge badge-verified">Email Verified</span>
            )}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <InfoCard label="User ID" value={user._id} mono />
        <InfoCard label="Phone" value={user.phone ?? "—"} />
        <InfoCard
          label="Joined"
          value={new Date(user.createdAt).toLocaleString()}
        />
        <InfoCard
          label="Last Updated"
          value={new Date(user.updatedAt).toLocaleString()}
        />
        <InfoCard
          label="Appointments (as client)"
          value={String(user.stats.appointmentsAsClient)}
        />
        <InfoCard
          label="Appointments (as barber)"
          value={String(user.stats.appointmentsAsBarber)}
        />
      </div>

      {/* Barber profile section */}
      {user.barberProfile && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
            Barber Profile
          </h2>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <InfoCard
              label="Business Name"
              value={user.barberProfile.businessName}
            />
            <InfoCard
              label="Verification"
              value={user.barberProfile.isVerified ? "Verified" : "Not Verified"}
            />
            <InfoCard
              label="Rating"
              value={
                user.barberProfile.averageRating != null
                  ? `${user.barberProfile.averageRating.toFixed(1)} (${user.barberProfile.reviewCount ?? 0} reviews)`
                  : "No ratings yet"
              }
            />
            <InfoCard
              label="City"
              value={user.barberProfile.location.city ?? user.barberProfile.location.address}
            />
          </div>

          {/* Verification actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {!user.barberProfile.isVerified ? (
              <Button
                variant="primary"
                loading={loading}
                onClick={() => run(() => verifyBarber({ userId: user._id }))}
              >
                Verify Barber
              </Button>
            ) : (
              <Button
                variant="danger"
                loading={loading}
                onClick={() =>
                  run(() => revokeVerification({ userId: user._id }))
                }
              >
                Revoke Verification
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Role change */}
      {user.role !== "admin" && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
            }}
          >
            Change Role
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {(["client", "barber", "admin"] as const)
              .filter((r) => r !== user.role)
              .map((r) => (
                <Button
                  key={r}
                  variant="ghost"
                  loading={loading}
                  onClick={() =>
                    run(() => changeRole({ userId: user._id, newRole: r }))
                  }
                >
                  Make {r}
                </Button>
              ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      {user.role !== "admin" && (
        <div
          style={{
            background: "rgba(229,62,62,0.06)",
            border: "1px solid rgba(229,62,62,0.25)",
            borderRadius: "var(--radius)",
            padding: 16,
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-danger)",
            }}
          >
            Danger Zone
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {user.isActive ? (
              <Button
                variant="danger"
                loading={loading}
                onClick={() => run(() => banUser({ userId: user._id }))}
              >
                Ban User
              </Button>
            ) : (
              <Button
                variant="success"
                loading={loading}
                onClick={() => run(() => unbanUser({ userId: user._id }))}
              >
                Unban User
              </Button>
            )}

            {confirmDelete ? (
              <>
                <Button
                  variant="danger"
                  loading={loading}
                  onClick={() => {
                    setConfirmDelete(false);
                    run(async () => {
                      await deleteUser({ userId: user._id });
                      router.push("/users");
                    });
                  }}
                >
                  Confirm Delete
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                Delete Account
              </Button>
            )}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
            Deleting anonymizes the account PII while preserving booking history.
          </p>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        padding: "10px 14px",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontFamily: mono ? "monospace" : undefined,
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}
