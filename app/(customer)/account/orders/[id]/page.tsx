"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Order = {
    id: string;
    status: string;
    currency: string | null;
    subtotal: number | null;
    total: number;
    payment_method: string | null;
    payment_status: string | null;
    created_at: string;
};

function formatPrice(amount: number, currency: string | null) {
    const safeCurrency =
        currency && /^[A-Z]{3}$/.test(currency) ? currency : "INR";

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: safeCurrency,
            maximumFractionDigits: 2,
        }).format(Number(amount) || 0);
    } catch {
        return `₹${(Number(amount) || 0).toLocaleString("en-IN")}`;
    }
}

function formatLabel(value: string | null | undefined) {
    if (!value) return "Not available";

    return value
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusStyle(status: string) {
    const value = status.toLowerCase().replace(/[_-]/g, " ").trim();

    if (
        ["delivered", "completed", "complete", "paid", "succeeded"].some(
            (item) => value.includes(item)
        )
    ) {
        return "bg-green-50 text-green-700 ring-green-200";
    }

    if (
        ["cancelled", "canceled", "failed", "refunded"].some((item) =>
            value.includes(item)
        )
    ) {
        return "bg-red-50 text-red-700 ring-red-200";
    }

    if (
        ["shipped", "processing", "out for delivery"].some((item) =>
            value.includes(item)
        )
    ) {
        return "bg-blue-50 text-blue-700 ring-blue-200";
    }

    return "bg-amber-50 text-amber-800 ring-amber-200";
}

export default function CustomerOrdersPage() {
    const router = useRouter();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const loadOrders = useCallback(async () => {
        const supabase = createClient();

        setError("");

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                router.replace(
                    `/login?next=${encodeURIComponent("/account/orders")}`
                );
                return;
            }

            // Restrict this query to orders belonging to the signed-in customer.
            const { data, error: ordersError } = await supabase
                .from("orders")
                .select(
                    "id, status, currency, subtotal, total, payment_method, payment_status, created_at"
                )
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (ordersError) throw ordersError;

            setOrders(
                (data ?? []).map((order) => ({
                    ...order,
                    id: String(order.id),
                    status: String(order.status ?? "pending"),
                    currency: order.currency ?? "INR",
                    subtotal:
                        order.subtotal === null ? null : Number(order.subtotal),
                    total: Number(order.total) || 0,
                    payment_method: order.payment_method ?? null,
                    payment_status: order.payment_status ?? null,
                    created_at: String(order.created_at),
                }))
            );
        } catch (err) {
            console.error("Failed to load customer orders:", err);
            setError("Unable to load your orders. Please try again.");
        }
    }, [router]);

    useEffect(() => {
        let active = true;

        async function run() {
            setLoading(true);
            await loadOrders();
            if (active) setLoading(false);
        }

        void run();

        return () => {
            active = false;
        };
    }, [loadOrders]);

    async function handleRefresh() {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    }

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">
                        Your account
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                        My Orders
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Track your purchases and review your payment details.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading || refreshing}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {refreshing ? "Refreshing..." : "↻ Refresh orders"}
                </button>
            </div>

            {!loading && !error && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-600">
                            Total orders
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {orders.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-600">
                            Total order value
                        </p>
                        <p className="mt-2 break-words text-2xl font-bold text-gray-900">
                            {formatPrice(
                                orders.reduce((sum, order) => sum + order.total, 0),
                                orders[0]?.currency ?? "INR"
                            )}
                        </p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-4" aria-label="Loading orders">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6"
                        >
                            <div className="h-4 w-40 rounded bg-gray-200" />
                            <div className="mt-4 h-4 w-56 rounded bg-gray-100" />
                            <div className="mt-6 h-10 rounded bg-gray-100" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 p-6"
                >
                    <h2 className="font-semibold text-red-800">
                        Could not load orders
                    </h2>
                    <p className="mt-2 text-sm text-red-700">{error}</p>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
                    >
                        Try again
                    </button>
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-14 text-center">
                    <div className="text-5xl" aria-hidden="true">
                        🛍️
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-gray-900">
                        No orders yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">
                        When you place an order, it will appear here with its status
                        and payment information.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        Explore products
                    </Link>
                </div>
            ) : (
                <div className="space-y-5">
                    {orders.map((order) => (
                        <article
                            key={order.id}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md"
                        >
                            <div className="flex flex-col gap-4 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Order number
                                    </p>
                                    <h2 className="mt-1 break-all text-lg font-bold text-gray-900">
                                        #{order.id.slice(0, 8)}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Placed on{" "}
                                        {new Date(order.created_at).toLocaleString("en-IN", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                                            order.status
                                        )}`}
                                    >
                                        {formatLabel(order.status)}
                                    </span>

                                    <p className="text-xl font-bold text-gray-900">
                                        {formatPrice(order.total, order.currency)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 p-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Payment method
                                    </p>
                                    <p className="mt-1 font-medium text-gray-900">
                                        {formatLabel(order.payment_method)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Payment status
                                    </p>
                                    <p className="mt-1 font-medium text-gray-900">
                                        {formatLabel(order.payment_status)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
                                <p className="text-sm text-gray-500">
                                    {order.subtotal !== null
                                        ? `Subtotal: ${formatPrice(order.subtotal, order.currency)}`
                                        : "Order summary available"}
                                </p>

                                <Link
                                    href={`/account/orders/${encodeURIComponent(order.id)}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                                >
                                    View Details <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
