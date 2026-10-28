"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AdminUser = {
    id: string;
    email: string;
    full_name: string;
    role: "admin" | "customer";
    created_at: string;
};

type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

function formatDate(value: string) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminUsersPage() {
    const router = useRouter();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    // Search input state
    const [searchInput, setSearchInput] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // 1. Identify currently signed-in administrator to prevent self-demotion in UI
    useEffect(() => {
        let active = true;

        async function getCurrentUser() {
            try {
                const supabase = createClient();
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (active && user) {
                    setCurrentUserId(user.id);
                }
            } catch {
                // Handled by admin layout check
            }
        }

        getCurrentUser();

        return () => {
            active = false;
        };
    }, []);

    // 2. Fetch users from the secure backend API endpoint /api/admin/users
    const loadUsers = useCallback(
        async (page: number, search: string) => {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: "20",
                });

                if (search.trim()) {
                    params.set("search", search.trim().slice(0, 100));
                }

                const response = await fetch(
                    `/api/admin/users?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                        cache: "no-store",
                    }
                );

                if (response.status === 401) {
                    router.replace("/login?next=%2Fadmin%2Fusers");
                    return;
                }

                if (response.status === 403) {
                    router.replace("/account");
                    return;
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error || "Failed to load users.");
                }

                setUsers(data.users || []);
                setPagination(
                    data.pagination || {
                        page,
                        limit: 20,
                        total: data.users?.length || 0,
                        totalPages: 1,
                    }
                );
            } catch (err) {
                console.error("Could not load users:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong while loading users."
                );
            } finally {
                setLoading(false);
            }
        },
        [router]
    );

    useEffect(() => {
        loadUsers(currentPage, activeSearch);
    }, [currentPage, activeSearch, loadUsers]);

    // 3. Search handler
    function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCurrentPage(1);
        setActiveSearch(searchInput.trim());
    }

    function handleClearSearch() {
        setSearchInput("");
        setActiveSearch("");
        setCurrentPage(1);
    }

    // 4. Role change handler calling PATCH /api/admin/users
    async function handleRoleChange(user: AdminUser, newRole: "admin" | "customer") {
        if (user.role === newRole) return;

        if (user.id === currentUserId) {
            setError("You cannot change your own administrator role.");
            return;
        }

        const actionText =
            newRole === "admin"
                ? `Promote "${user.full_name || user.email}" to Administrator?`
                : `Demote "${user.full_name || user.email}" to Customer?`;

        const confirmed = window.confirm(
            `${actionText}\n\nThey will ${
                newRole === "admin"
                    ? "receive full administrator access to products, orders, and user management."
                    : "lose administrator access."
            }`
        );

        if (!confirmed) return;

        setUpdatingUserId(user.id);
        setError("");
        setNotice("");

        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                    role: newRole,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Failed to update user role.");
            }

            // Update local state directly for instantaneous feedback
            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === user.id ? { ...u, role: newRole } : u
                )
            );

            setNotice(
                `Role for "${user.full_name || user.email}" was updated to ${
                    newRole === "admin" ? "Administrator" : "Customer"
                }.`
            );
        } catch (err) {
            console.error("Failed to update role:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update user role. Please try again."
            );
        } finally {
            setUpdatingUserId(null);
        }
    }

    const startItem =
        pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const endItem = Math.min(
        pagination.page * pagination.limit,
        pagination.total
    );

    return (
        <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        View customer accounts, verify registration details, and
                        manage administrator permissions.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
                        Total Users:{" "}
                        <strong className="text-gray-900">{pagination.total}</strong>
                    </span>
                    <button
                        onClick={() => loadUsers(currentPage, activeSearch)}
                        disabled={loading}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        title="Refresh user list"
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Error & Notice Alerts */}
            {error && (
                <div
                    role="alert"
                    className="mb-5 flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => setError("")}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Dismiss error"
                    >
                        ✕
                    </button>
                </div>
            )}

            {notice && (
                <div
                    role="status"
                    className="mb-5 flex items-start justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✓</span>
                        <span>{notice}</span>
                    </div>
                    <button
                        onClick={() => setNotice("")}
                        className="text-green-500 hover:text-green-700"
                        aria-label="Dismiss message"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                    <div className="relative flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                            🔍
                        </span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            maxLength={100}
                            placeholder="Search by user name or email address..."
                            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                        >
                            Search
                        </button>

                        {(activeSearch || searchInput) && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                disabled={loading}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </form>

                {activeSearch && (
                    <p className="mt-3 text-xs text-gray-500">
                        Showing results matching:{" "}
                        <strong className="text-gray-900">&ldquo;{activeSearch}&rdquo;</strong>
                    </p>
                )}
            </div>

            {/* Table Container */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <div className="p-16 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                        <p className="mt-4 text-sm font-medium text-gray-600">
                            Loading users...
                        </p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="text-4xl">👥</div>
                        <h2 className="mt-4 text-lg font-bold text-gray-900">
                            No users found
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {activeSearch
                                ? "No accounts matched your search. Try another name or email."
                                : "No registered user accounts are currently present."}
                        </p>
                        {activeSearch && (
                            <button
                                onClick={handleClearSearch}
                                className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                            >
                                Reset search
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">
                                            User
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            Email Address
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            Role
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            Registered On
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-right"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {users.map((user) => {
                                        const isCurrentUser =
                                            user.id === currentUserId;
                                        const isUpdating =
                                            updatingUserId === user.id;
                                        const initial = (
                                            user.full_name?.charAt(0) ||
                                            user.email?.charAt(0) ||
                                            "U"
                                        ).toUpperCase();

                                        return (
                                            <tr
                                                key={user.id}
                                                className={`transition hover:bg-gray-50/80 ${
                                                    isCurrentUser
                                                        ? "bg-amber-50/30"
                                                        : ""
                                                }`}
                                            >
                                                {/* User Name & Avatar */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-950 font-bold text-white shadow-sm">
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="truncate font-semibold text-gray-900">
                                                                    {user.full_name ||
                                                                        "Unnamed user"}
                                                                </p>
                                                                {isCurrentUser && (
                                                                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-0.5 truncate font-mono text-xs text-gray-400">
                                                                {user.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email Address */}
                                                <td className="px-6 py-4">
                                                    <p className="break-all font-medium text-gray-800">
                                                        {user.email || "No email"}
                                                    </p>
                                                </td>

                                                {/* Role Badge */}
                                                <td className="px-6 py-4">
                                                    {user.role === "admin" ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                                                            Administrator
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                            Customer
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Registration Date */}
                                                <td className="px-6 py-4 text-xs text-gray-600">
                                                    {formatDate(user.created_at)}
                                                </td>

                                                {/* Action Controls */}
                                                <td className="px-6 py-4 text-right">
                                                    {isCurrentUser ? (
                                                        <span
                                                            className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed select-none"
                                                            title="You cannot modify your own administrator permissions"
                                                        >
                                                            🔒 Current User
                                                        </span>
                                                    ) : user.role === "admin" ? (
                                                        <button
                                                            onClick={() =>
                                                                handleRoleChange(
                                                                    user,
                                                                    "customer"
                                                                )
                                                            }
                                                            disabled={isUpdating}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50 hover:border-amber-400 disabled:opacity-50"
                                                        >
                                                            {isUpdating
                                                                ? "Updating..."
                                                                : "Demote to Customer"}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                handleRoleChange(
                                                                    user,
                                                                    "admin"
                                                                )
                                                            }
                                                            disabled={isUpdating}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                                                        >
                                                            {isUpdating
                                                                ? "Updating..."
                                                                : "Promote to Admin"}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50/50 px-6 py-4 sm:flex-row">
                            <p className="text-xs text-gray-600">
                                Showing{" "}
                                <strong className="font-semibold text-gray-900">
                                    {startItem}
                                </strong>{" "}
                                to{" "}
                                <strong className="font-semibold text-gray-900">
                                    {endItem}
                                </strong>{" "}
                                of{" "}
                                <strong className="font-semibold text-gray-900">
                                    {pagination.total}
                                </strong>{" "}
                                users
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setCurrentPage((p) => Math.max(p - 1, 1))
                                    }
                                    disabled={pagination.page <= 1 || loading}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    ← Previous
                                </button>

                                <span className="px-2 text-xs font-medium text-gray-600">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>

                                <button
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(p + 1, pagination.totalPages)
                                        )
                                    }
                                    disabled={
                                        pagination.page >= pagination.totalPages ||
                                        loading
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
