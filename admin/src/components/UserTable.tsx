"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";
import { Button } from "./Button";
import type { Id } from "../../convex/_generated/dataModel";

export interface IUserRow {
  _id: Id<"users">;
  email: string;
  name?: string;
  role: "client" | "barber" | "admin";
  isActive: boolean;
  createdAt: number;
}

interface IUserTableProps {
  users: IUserRow[];
  onRefresh: () => void;
}

export function UserTable({ users, onRefresh }: IUserTableProps) {
  const banUser = useMutation(api.admin.mutations.banUser);
  const unbanUser = useMutation(api.admin.mutations.unbanUser);
  const deleteUser = useMutation(api.admin.mutations.deleteUser);
  const verifyBarber = useMutation(api.admin.mutations.verifyBarber);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function asyncAction(userId: Id<"users">, fn: () => Promise<unknown>) {
    setLoadingId(userId);
    try {
      await fn();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setLoadingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 0",
          color: "var(--color-text-muted)",
        }}
      >
        No users found.
      </div>
    );
  }

  return (
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
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isLoading = loadingId === user._id;
            return (
              <tr key={user._id}>
                {/* User */}
                <td>
                  <Link href={`/users/${user._id}`} style={{ color: "var(--color-text)", textDecoration: "none" }}>
                    <div style={{ fontWeight: 500 }}>{user.name ?? "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {user.email}
                    </div>
                  </Link>
                </td>

                {/* Role */}
                <td>
                  <span className={`badge badge-${user.role}`}>{user.role}</span>
                </td>

                {/* Status */}
                <td>
                  <span
                    className={`badge ${user.isActive ? "badge-active" : "badge-banned"}`}
                  >
                    {user.isActive ? "Active" : "Banned"}
                  </span>
                </td>

                {/* Joined */}
                <td style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                {/* Actions */}
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {/* Ban / Unban */}
                    {user.role !== "admin" &&
                      (user.isActive ? (
                        <Button
                          variant="danger"
                          loading={isLoading}
                          onClick={() =>
                            asyncAction(user._id, () =>
                              banUser({ userId: user._id })
                            )
                          }
                        >
                          Ban
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          loading={isLoading}
                          onClick={() =>
                            asyncAction(user._id, () =>
                              unbanUser({ userId: user._id })
                            )
                          }
                        >
                          Unban
                        </Button>
                      ))}

                    {/* Verify barber */}
                    {user.role === "barber" && (
                      <Button
                        variant="primary"
                        loading={isLoading}
                        onClick={() =>
                          asyncAction(user._id, () =>
                            verifyBarber({ userId: user._id })
                          )
                        }
                      >
                        Verify
                      </Button>
                    )}

                    {/* Delete */}
                    {user.role !== "admin" && (
                      <>
                        {confirmDelete === user._id ? (
                          <>
                            <Button
                              variant="danger"
                              loading={isLoading}
                              onClick={() => {
                                setConfirmDelete(null);
                                asyncAction(user._id, () =>
                                  deleteUser({ userId: user._id })
                                );
                              }}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setConfirmDelete(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => setConfirmDelete(user._id)}
                          >
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
