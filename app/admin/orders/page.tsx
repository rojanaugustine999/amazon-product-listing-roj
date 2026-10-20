
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Order = {
    id: string;
    user_id: string;
    status: string;
    currency: string;
    subtotal: number | null;
    total: number;
    shipping_name: string | null;
    shipping_email: string | null;
    shipping_phone: string | null;
    shipping_address: string | null;
    payment_method: string;
    payment_status: string;
    created_at: string;
};

const ORDER_STATUSES = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
] as const;

function formatPrice(amount: number | null, currency: string) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function statusClass(status: string) {
    switch (status.toLowerCase()) {
        case "delivered":
        case "paid":
        case "completed":
            return "bg-green-100 text-green-800";
        case "cancelled":
        case "failed":
        case "refunded":
            return "bg-red-100 text-red-800";
        case "shipped":
        case "processing":
            return "bg-blue-100 text-blue-800";
        default:
            return "bg-amber-100 text-amber-800";
    }
}

export default function AdminOrdersPage() {
    const router = useRouter();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError("");
        setNotice("");

        try {
            const supabase = createClient();

            // Verify the signed-in user.
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                router.replace("/login?next=%2Fadmin%2Forders");
                return;
            }

            // Verify the user's role in the profiles table.
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) {
                throw new Error("Could not verify your administrator access.");
            }

            if (profile?.role !== "admin") {
                router.replace("/");
                return;
            }

            // RLS must also allow only authorized administrators to read all orders.
            const { data, error: ordersError } = await supabase
                .from("orders")
                .select(
                    "id, user_id, status, currency, subtotal, total, shipping_name, shipping_email, shipping_phone, shipping_address, payment_method, payment_status, created_at"
                )
                .order("created_at", { ascending: false });

            if (ordersError) {
                throw new Error(ordersError.message);
            }

            setOrders((data ?? []) as Order[]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading orders."
            );
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    async function updateOrderStatus(order: Order, newStatus: string) {
        if (newStatus === order.status) return;

        const confirmed = window.confirm(
            `Change order status to "${newStatus}"?`
        );

        if (!confirmed) return;

        setUpdatingId(order.id);
        setError("");
        setNotice("");

        try {
            const supabase = createClient();

            // Re-check authentication and role before attempting the update.
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                router.replace("/login?next=%2Fadmin%2Forders");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError || profile?.role !== "admin") {
                throw new Error("Administrator access is required.");
            }

            const { data, error: updateError } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", order.id)
                .select("id, status")
                .maybeSingle();

            if (updateError) {
                console.error("Order update failed:", updateError);
                throw new Error(updateError.message);
            }

            if (!data) {
                throw new Error(
                    "No order was updated. Check your administrator permissions."
                );
            }

            setOrders((current) =>
                current.map((item) =>
                    item.id === data.id
                        ? { ...item, status: data.status }
                        : item
                )
            );

            setNotice("Order status updated successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not update the order."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    const filteredOrders = orders.filter((order) => {
        const searchText = search.trim().toLowerCase();

        const matchesSearch =
            !searchText ||
            order.id.toLowerCase().includes(searchText) ||
            (order.shipping_name ?? "").toLowerCase().includes(searchText) ||
            (order.shipping_email ?? "").toLowerCase().includes(searchText) ||
            (order.shipping_phone ?? "").toLowerCase().includes(searchText);

        const matchesStatus =
            statusFilter === "all" ||
            order.status.toLowerCase() === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="mx-auto max-w-7xl">
            <Link
                href="/admin"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
                ← Back to Dashboard
            </Link>

            <div className="mb-8 mt-5">
                <p className="text-sm font-medium text-amber-600">
                    ORDER MANAGEMENT
                </p>

                <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Orders
                        </h1>
                        <p className="mt-2 text-gray-600">
                            View customer orders and manage their status.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadOrders()}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "↻ Refresh Orders"}
                    </button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total orders</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {orders.length}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Pending orders</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">
                        {
                            orders.filter(
                                (order) =>
                                    order.status.toLowerCase() === "pending"
                            ).length
                        }
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Delivered orders</p>
                    <p className="mt-2 text-3xl font-bold text-green-700">
                        {
                            orders.filter(
                                (order) =>
                                    order.status.toLowerCase() === "delivered"
                            ).length
                        }
                    </p>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {notice && (
                <div
                    role="status"
                    className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                >
                    {notice}
                </div>
            )}

            <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search order ID, customer, email or phone..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                >
                    <option value="all">All statuses</option>
                    {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-600">
                    Loading orders...
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                    <div className="text-4xl">📦</div>
                    <h2 className="mt-4 text-lg font-bold text-gray-900">
                        No orders found
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {orders.length === 0
                            ? "Customer orders will appear here when available."
                            : "Try changing your search or status filter."}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {filteredOrders.map((order) => (
                        <article
                            key={order.id}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                        >
                            <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 p-5 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Order ID
                                    </p>
                                    <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900">
                                        {order.id}
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {formatDate(order.created_at)}
                                    </p>
                                </div>

                                <div className="flex flex-col items-start gap-2 md:items-end">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(order.status)}`}
                                    >
                                        {order.status}
                                    </span>

                                    <label className="text-xs font-medium text-gray-600">
                                        Update order status
                                    </label>

                                    <select
                                        value={order.status.toLowerCase()}
                                        onChange={(event) =>
                                            void updateOrderStatus(
                                                order,
                                                event.target.value
                                            )
                                        }
                                        disabled={updatingId === order.id}
                                        className="max-w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                                    >
                                        {!ORDER_STATUSES.includes(
                                            order.status.toLowerCase() as (typeof ORDER_STATUSES)[number]
                                        ) && (
                                                <option
                                                    value={order.status.toLowerCase()}
                                                >
                                                    {order.status}
                                                </option>
                                            )}

                                        {ORDER_STATUSES.map((status) => (
                                            <option
                                                key={status}
                                                value={status}
                                            >
                                                {status.charAt(0).toUpperCase() +
                                                    status.slice(1)}
                                            </option>
                                        ))}
                                    </select>

                                    {updatingId === order.id && (
                                        <span className="text-xs text-gray-500">
                                            Updating...
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
                                <section>
                                    <h2 className="font-semibold text-gray-900">
                                        Customer details
                                    </h2>

                                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                                        <p>
                                            <span className="font-medium text-gray-800">
                                                Name:{" "}
                                            </span>
                                            {order.shipping_name || "Not provided"}
                                        </p>
                                        <p className="break-all">
                                            <span className="font-medium text-gray-800">
                                                Email:{" "}
                                            </span>
                                            {order.shipping_email || "Not provided"}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-800">
                                                Phone:{" "}
                                            </span>
                                            {order.shipping_phone || "Not provided"}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-800">
                                                Address:{" "}
                                            </span>
                                            {order.shipping_address || "Not provided"}
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="font-semibold text-gray-900">
                                        Payment details
                                    </h2>

                                    <div className="mt-3 space-y-3 text-sm text-gray-600">
                                        <p>
                                            <span className="font-medium text-gray-800">
                                                Method:{" "}
                                            </span>
                                            <span className="uppercase">
                                                {order.payment_method || "Not specified"}
                                            </span>
                                        </p>

                                        <p className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-gray-800">
                                                Payment status:
                                            </span>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(order.payment_status)}`}
                                            >
                                                {order.payment_status || "Unknown"}
                                            </span>
                                        </p>

                                        <p>
                                            <span className="font-medium text-gray-800">
                                                Subtotal:{" "}
                                            </span>
                                            {formatPrice(
                                                order.subtotal,
                                                order.currency
                                            )}
                                        </p>

                                        <p className="border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
                                            Order total:{" "}
                                            {formatPrice(
                                                order.total,
                                                order.currency
                                            )}
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <p className="mt-5 text-sm text-gray-500">
                Showing {filteredOrders.length} of {orders.length} orders.
            </p>
        </div>
    );
}
