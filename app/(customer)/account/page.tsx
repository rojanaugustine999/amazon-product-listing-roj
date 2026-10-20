
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
    id: string;
    product_id: string;
    product_name: string;
    image_url: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
};

type Order = {
    id: string;
    status: string;
    currency: string;
    subtotal: number | null;
    total: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
    items: OrderItem[];
};

export default function AccountPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [fullName, setFullName] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState("");
    const [ordersError, setOrdersError] = useState("");

    const loadOrders = useCallback(async (userId: string) => {
        const supabase = createClient();

        setOrdersLoading(true);
        setOrdersError("");

        try {
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .select(
                    "id, status, currency, subtotal, total, payment_method, payment_status, created_at"
                )
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (orderError) throw orderError;

            const savedOrders = orderData ?? [];

            if (savedOrders.length === 0) {
                setOrders([]);
                return;
            }

            const orderIds = savedOrders.map((order) => order.id);

            const { data: itemData, error: itemError } = await supabase
                .from("order_items")
                .select(
                    "id, order_id, product_id, product_name, image_url, quantity, unit_price, line_total"
                )
                .in("order_id", orderIds);

            if (itemError) throw itemError;

            const items = itemData ?? [];

            const combinedOrders: Order[] = savedOrders.map((order) => ({
                ...order,
                items: items
                    .filter((item) => item.order_id === order.id)
                    .map(({ order_id: _orderId, ...item }) => item),
            }));

            setOrders(combinedOrders);
        } catch (err) {
            console.error("Failed to load orders:", err);
            setOrdersError(
                "Unable to load your orders. Please refresh the page and try again."
            );
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    useEffect(() => {
        const supabase = createClient();
        let active = true;

        async function loadAccount() {
            try {
                const { data, error: authError } =
                    await supabase.auth.getUser();

                if (!active) return;

                if (authError || !data.user) {
                    router.replace("/login?next=%2Faccount");
                    router.refresh();
                    return;
                }

                setUser(data.user);

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", data.user.id)
                    .maybeSingle();

                if (!active) return;

                if (profileError) {
                    console.error("Failed to load profile:", profileError);
                    setError(
                        "Your account loaded, but your profile details could not be retrieved."
                    );
                }

                setFullName(
                    profile?.full_name ||
                    String(data.user.user_metadata?.full_name ?? "")
                );

                setLoading(false);

                await loadOrders(data.user.id);
            } catch (err) {
                console.error("Failed to load account:", err);

                if (active) {
                    setError(
                        "Unable to load your account. Please refresh the page."
                    );
                    setLoading(false);
                    setOrdersLoading(false);
                }
            }
        }

        void loadAccount();

        return () => {
            active = false;
        };
    }, [router, loadOrders]);

    async function handleLogout() {
        if (loggingOut) return;

        setLoggingOut(true);
        setError("");

        try {
            const supabase = createClient();
            const { error: logoutError } = await supabase.auth.signOut();

            if (logoutError) throw logoutError;

            router.replace("/login");
            router.refresh();
        } catch (err) {
            console.error("Failed to log out:", err);
            setError("Unable to log out. Please try again.");
            setLoggingOut(false);
        }
    }

    function formatPrice(amount: number, currencyCode: string) {
        const safeCurrency = /^[A-Z]{3}$/.test(currencyCode)
            ? currencyCode
            : "INR";

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

    function formatStatus(status: string) {
        return status
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    function getStatusStyle(status: string) {
        const value = status.toLowerCase().replace(/[_-]/g, " ");

        if (
            [
                "paid",
                "delivered",
                "completed",
                "complete",
                "success",
            ].some((item) => value.includes(item))
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
            ["shipped", "processing"].some((item) =>
                value.includes(item)
            )
        ) {
            return "bg-blue-50 text-blue-700 ring-blue-200";
        }

        return "bg-amber-50 text-amber-800 ring-amber-200";
    }

    function getPaymentStatusStyle(status: string) {
        const value = status.toLowerCase().replace(/[_-]/g, " ");

        if (value === "paid" || value === "succeeded") {
            return "bg-green-50 text-green-700 ring-green-200";
        }

        if (value === "refunded") {
            return "bg-purple-50 text-purple-700 ring-purple-200";
        }

        if (
            value === "failed" ||
            value === "cancelled" ||
            value === "canceled"
        ) {
            return "bg-red-50 text-red-700 ring-red-200";
        }

        return "bg-amber-50 text-amber-800 ring-amber-200";
    }

    const displayName = fullName.trim() || "Customer";

    const initials =
        displayName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "C";

    const totalSpent = orders.reduce(
        (sum, order) => sum + (Number(order.total) || 0),
        0
    );

    const latestOrder = orders[0];
    const currency = orders[0]?.currency || "INR";

    if (loading) {
        return (
            <main className="min-h-[60vh] bg-gray-50 px-4 py-16">
                <div className="mx-auto max-w-5xl animate-pulse space-y-5">
                    <div className="h-9 w-48 rounded-lg bg-gray-200" />

                    <div className="h-36 rounded-2xl bg-white shadow-sm" />

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="h-28 rounded-2xl bg-white shadow-sm" />
                        <div className="h-28 rounded-2xl bg-white shadow-sm" />
                        <div className="h-28 rounded-2xl bg-white shadow-sm" />
                    </div>

                    <div className="h-56 rounded-2xl bg-white shadow-sm" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-5xl">
                {/* Page heading */}
                <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Your account
                        </p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            My Account
                        </h1>

                        <p className="mt-2 text-sm text-gray-600">
                            Manage your profile and track your orders.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loggingOut ? "Logging out..." : "Log out"}
                    </button>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </p>
                )}

                {/* Profile card */}
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xl font-bold text-white ring-4 ring-gray-100"
                            aria-label={`Profile initials ${initials}`}
                        >
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {displayName}
                                </h2>

                                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                    Customer
                                </span>
                            </div>

                            <p className="mt-1 break-all text-sm text-gray-600">
                                {user?.email || "No email available"}
                            </p>

                            <p className="mt-2 break-all text-xs text-gray-400">
                                Customer ID: {user?.id}
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                        >
                            Continue shopping
                        </Link>
                    </div>
                </section>

                {/* Account summary */}
                <section
                    aria-label="Account summary"
                    className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-gray-600">
                                Total orders
                            </p>

                            <span
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg"
                                aria-hidden="true"
                            >
                                📦
                            </span>
                        </div>

                        <p className="mt-3 text-3xl font-bold text-gray-900">
                            {ordersLoading ? "—" : orders.length}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Orders placed by you
                        </p>
                    </article>

                    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-gray-600">
                                Total order value
                            </p>

                            <span
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-lg"
                                aria-hidden="true"
                            >
                                ₹
                            </span>
                        </div>

                        <p className="mt-3 break-words text-2xl font-bold text-gray-900">
                            {ordersLoading
                                ? "—"
                                : formatPrice(totalSpent, currency)}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Combined value of your orders
                        </p>
                    </article>

                    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-gray-600">
                                Latest order
                            </p>

                            <span
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg"
                                aria-hidden="true"
                            >
                                🧾
                            </span>
                        </div>

                        <div className="mt-3">
                            {ordersLoading ? (
                                <p className="text-2xl font-bold text-gray-900">
                                    —
                                </p>
                            ) : latestOrder ? (
                                <span
                                    className={`inline-flex max-w-full rounded-full px-3 py-1.5 text-sm font-semibold capitalize ring-1 ring-inset ${getStatusStyle(
                                        latestOrder.status
                                    )}`}
                                >
                                    {formatStatus(latestOrder.status)}
                                </span>
                            ) : (
                                <p className="text-lg font-bold text-gray-900">
                                    No orders yet
                                </p>
                            )}
                        </div>

                        <p className="mt-2 break-all text-xs text-gray-500">
                            {latestOrder
                                ? `Order #${latestOrder.id.slice(0, 8)}`
                                : "Your recent order status"}
                        </p>
                    </article>
                </section>

                {/* Order history */}
                <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                                My Orders
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                View your purchases and payment details.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (user) void loadOrders(user.id);
                            }}
                            disabled={ordersLoading || !user}
                            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {ordersLoading ? "Loading..." : "↻ Refresh orders"}
                        </button>
                    </div>

                    {ordersError ? (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                            <p role="alert" className="text-sm text-red-700">
                                {ordersError}
                            </p>

                            <p className="mt-2 text-xs text-red-600">
                                Check your Supabase query permissions and Row
                                Level Security (RLS) policies.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    if (user) void loadOrders(user.id);
                                }}
                                className="mt-3 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                            >
                                Try again
                            </button>
                        </div>
                    ) : ordersLoading ? (
                        <div className="mt-6 space-y-4" aria-label="Loading orders">
                            {[1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="animate-pulse rounded-xl border border-gray-200 p-5"
                                >
                                    <div className="h-4 w-36 rounded bg-gray-200" />
                                    <div className="mt-4 h-3 w-52 rounded bg-gray-100" />
                                    <div className="mt-5 h-12 rounded bg-gray-100" />
                                </div>
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
                            <div className="text-4xl" aria-hidden="true">
                                🛍️
                            </div>

                            <h3 className="mt-4 text-lg font-bold text-gray-900">
                                No orders yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                                When you place an order, you will find its
                                details here.
                            </p>

                            <Link
                                href="/"
                                className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
                            >
                                Explore products
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-5">
                            {orders.map((order) => (
                                <article
                                    key={order.id}
                                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-sm"
                                >
                                    {/* Order header */}
                                    <div className="flex flex-col gap-4 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Order number
                                            </p>

                                            <h3 className="mt-1 break-all font-bold text-gray-900">
                                                #{order.id.slice(0, 8)}
                                            </h3>

                                            <p className="mt-1 text-xs text-gray-500">
                                                {new Date(
                                                    order.created_at
                                                ).toLocaleString("en-IN", {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                                            <p className="text-lg font-bold text-gray-900">
                                                {formatPrice(
                                                    order.total,
                                                    order.currency
                                                )}
                                            </p>

                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusStyle(
                                                    order.status
                                                )}`}
                                            >
                                                {formatStatus(order.status)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order items */}
                                    <div className="divide-y divide-gray-100 px-4 sm:px-5">
                                        {order.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex gap-3 py-4 sm:gap-4"
                                            >
                                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-20 sm:w-20">
                                                    {item.image_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.product_name}
                                                            loading="lazy"
                                                            className="h-full w-full object-contain p-1"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display =
                                                                    "none";

                                                                const fallback =
                                                                    event.currentTarget
                                                                        .nextElementSibling;

                                                                if (
                                                                    fallback instanceof
                                                                    HTMLElement
                                                                ) {
                                                                    fallback.style.display =
                                                                        "inline";
                                                                }
                                                            }}
                                                        />
                                                    ) : null}

                                                    <span
                                                        className="text-2xl"
                                                        aria-hidden="true"
                                                        style={{
                                                            display: item.image_url
                                                                ? "none"
                                                                : "inline",
                                                        }}
                                                    >
                                                        📦
                                                    </span>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="break-words font-semibold text-gray-900">
                                                        {item.product_name}
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Quantity: {item.quantity}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Unit price:{" "}
                                                        {formatPrice(
                                                            item.unit_price,
                                                            order.currency
                                                        )}
                                                    </p>
                                                </div>

                                                <p className="shrink-0 text-right text-sm font-semibold text-gray-900">
                                                    {formatPrice(
                                                        item.line_total,
                                                        order.currency
                                                    )}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Payment information and order details link */}
                                    <div className="border-t border-gray-200 bg-white px-4 py-4 sm:px-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                                                <p className="text-gray-600">
                                                    Payment method:{" "}
                                                    <span className="font-medium capitalize text-gray-900">
                                                        {formatStatus(order.payment_method)}
                                                    </span>
                                                </p>

                                                <p className="flex flex-wrap items-center gap-2 text-gray-600">
                                                    Payment status:
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getPaymentStatusStyle(
                                                            order.payment_status
                                                        )}`}
                                                    >
                                                        {formatStatus(order.payment_status)}
                                                    </span>
                                                </p>
                                            </div>

                                            <Link
                                                href={`/account/orders/${order.id}`}
                                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                                            >
                                                View Details
                                                <span aria-hidden="true">→</span>
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* Continue shopping */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black hover:underline"
                    >
                        <span aria-hidden="true">←</span>
                        Continue shopping
                    </Link>
                </div>
            </div>
        </main>
    );
}
