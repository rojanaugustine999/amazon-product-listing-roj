
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
                items: items.filter((item) => item.order_id === order.id),
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
            const { data, error: authError } = await supabase.auth.getUser();

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
                setError("Unable to load your profile. Please try again.");
            } else {
                setFullName(
                    profile?.full_name ||
                    String(data.user.user_metadata?.full_name ?? "")
                );
            }

            setLoading(false);

            await loadOrders(data.user.id);
        }

        void loadAccount();

        return () => {
            active = false;
        };
    }, [router, loadOrders]);

    async function handleLogout() {
        const supabase = createClient();
        const { error: logoutError } = await supabase.auth.signOut();

        if (logoutError) {
            setError("Unable to log out. Please try again.");
            return;
        }

        router.replace("/login");
        router.refresh();
    }

    function formatPrice(amount: number, currency: string) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency || "INR",
        }).format(Number(amount) || 0);
    }

    if (loading) {
        return (
            <main className="p-10 text-center">
                Loading your account...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto max-w-3xl rounded-xl border bg-white p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold">My Account</h1>

                    <button
                        onClick={handleLogout}
                        className="rounded-lg border px-4 py-2 hover:bg-gray-100"
                    >
                        Log out
                    </button>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="mt-4 rounded-lg bg-red-50 p-3 text-red-700"
                    >
                        {error}
                    </p>
                )}

                <section className="mt-8 rounded-lg bg-gray-50 p-5">
                    <h2 className="text-xl font-semibold">Profile</h2>

                    <p className="mt-3">
                        <strong>Name:</strong> {fullName || "Not provided"}
                    </p>

                    <p className="mt-2 break-all">
                        <strong>Email:</strong> {user?.email}
                    </p>

                    <p className="mt-2 break-all text-sm text-gray-500">
                        <strong>Customer ID:</strong> {user?.id}
                    </p>
                </section>

                <section className="mt-6 rounded-lg border p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold">My Orders</h2>

                        <button
                            onClick={() => user && void loadOrders(user.id)}
                            disabled={ordersLoading}
                            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                        >
                            {ordersLoading ? "Loading..." : "Refresh orders"}
                        </button>
                    </div>

                    {ordersLoading ? (
                        <p className="mt-4 text-gray-600">
                            Loading your orders...
                        </p>
                    ) : ordersError ? (
                        <div className="mt-4">
                            <p role="alert" className="text-red-700">
                                {ordersError}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                Check your Supabase query permissions and Row
                                Level Security (RLS) policies.
                            </p>
                        </div>
                    ) : orders.length === 0 ? (
                        <p className="mt-4 text-gray-600">
                            You haven&apos;t placed any orders yet.
                        </p>
                    ) : (
                        <div className="mt-5 space-y-5">
                            {orders.map((order) => (
                                <article
                                    key={order.id}
                                    className="rounded-lg border p-4"
                                >
                                    <div className="flex flex-wrap justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold">
                                                Order #{order.id.slice(0, 8)}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {new Date(
                                                    order.created_at
                                                ).toLocaleString("en-IN")}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold">
                                                {formatPrice(
                                                    order.total,
                                                    order.currency
                                                )}
                                            </p>
                                            <p className="mt-1 text-sm capitalize text-gray-600">
                                                {order.status}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 divide-y">
                                        {order.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex flex-wrap justify-between gap-3 py-3"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Unit price:{" "}
                                                        {formatPrice(
                                                            item.unit_price,
                                                            order.currency
                                                        )}
                                                    </p>
                                                </div>

                                                <p className="font-medium">
                                                    {formatPrice(
                                                        item.line_total,
                                                        order.currency
                                                    )}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 border-t pt-3 text-sm text-gray-600">
                                        <p>
                                            Payment method:{" "}
                                            <span className="capitalize">
                                                {order.payment_method}
                                            </span>
                                        </p>
                                        <p className="mt-1">
                                            Payment status:{" "}
                                            <span className="capitalize">
                                                {order.payment_status}
                                            </span>
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <Link
                    href="/"
                    className="mt-6 inline-block font-semibold underline"
                >
                    Continue shopping
                </Link>
            </div>
        </main>
    );
}
