"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
    shipping_name: string | null;
    shipping_email: string | null;
    shipping_phone: string | null;
    shipping_address: string | null;
};

const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 2,
    }).format(amount);

const formatLabel = (value: string) =>
    value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) =>
        char.toUpperCase()
    );

function statusClass(status: string) {
    const value = status.toLowerCase();

    if (["delivered", "completed", "paid", "succeeded"].includes(value)) {
        return "bg-green-100 text-green-800";
    }

    if (
        ["cancelled", "canceled", "failed", "refunded"].includes(value)
    ) {
        return "bg-red-100 text-red-800";
    }

    if (["shipped", "processing"].includes(value)) {
        return "bg-blue-100 text-blue-800";
    }

    return "bg-amber-100 text-amber-800";
}

export default function OrderDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const orderId = params.id;

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadOrder() {
            setLoading(true);
            setError("");

            try {
                const supabase = createClient();
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) throw authError;

                if (!user) {
                    router.replace(
                        `/login?next=${encodeURIComponent(
                            `/account/orders/${orderId}`
                        )}`
                    );
                    return;
                }

                // Only retrieve an order belonging to the signed-in user.
                const { data: orderData, error: orderError } = await supabase
                    .from("orders")
                    .select(
                        "id, status, currency, subtotal, total, payment_method, payment_status, created_at, shipping_name, shipping_email, shipping_phone, shipping_address"
                    )
                    .eq("id", orderId)
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (orderError) throw orderError;

                if (!orderData) {
                    if (!cancelled) setError("Order not found.");
                    return;
                }

                const { data: itemData, error: itemsError } = await supabase
                    .from("order_items")
                    .select(
                        "id, product_id, product_name, image_url, quantity, unit_price, line_total"
                    )
                    .eq("order_id", orderData.id);

                if (itemsError) throw itemsError;

                if (!cancelled) {
                    setOrder(orderData as Order);
                    setItems((itemData ?? []) as OrderItem[]);
                }
            } catch (err) {
                console.error("Failed to load order details:", err);

                if (!cancelled) {
                    setError("Unable to load this order. Please try again.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (orderId) loadOrder();

        return () => {
            cancelled = true;
        };
    }, [orderId, router]);

    if (loading) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-16">
                <p className="text-center text-gray-600">
                    Loading order details...
                </p>
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-16">
                <div className="rounded-xl border border-gray-200 p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Order not available
                    </h1>
                    <p className="mt-3 text-gray-600">
                        {error || "We could not find this order."}
                    </p>
                    <Link
                        href="/account"
                        className="mt-6 inline-flex rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
                    >
                        Back to My Account
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
                href="/account"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
            >
                <span aria-hidden="true">←</span> Back to My Account
            </Link>

            <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Order Details
                    </h1>
                    <p className="mt-2 break-all text-sm text-gray-500">
                        Order ID: {order.id}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        Placed on{" "}
                        {new Date(order.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })}
                    </p>
                </div>

                <span
                    className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${statusClass(order.status)}`}
                >
                    {formatLabel(order.status)}
                </span>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <section className="space-y-6 lg:col-span-2">
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Items in this order
                            </h2>
                        </div>

                        {items.length === 0 ? (
                            <p className="p-5 text-gray-600">
                                No items were found for this order.
                            </p>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 p-5"
                                    >
                                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                                            {item.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.image_url}
                                                    alt={item.product_name}
                                                    className="h-full w-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    No image
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {item.product_name}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Quantity: {item.quantity}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Unit price:{" "}
                                                {formatPrice(
                                                    Number(item.unit_price),
                                                    order.currency
                                                )}
                                            </p>
                                            <p className="mt-3 font-semibold text-gray-900">
                                                {formatPrice(
                                                    Number(item.line_total),
                                                    order.currency
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Shipping details
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500">Name</p>
                                <p className="mt-1 font-medium text-gray-900">
                                    {order.shipping_name || "Not provided"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Email</p>
                                <p className="mt-1 break-all font-medium text-gray-900">
                                    {order.shipping_email || "Not provided"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Phone</p>
                                <p className="mt-1 font-medium text-gray-900">
                                    {order.shipping_phone || "Not provided"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Address</p>
                                <p className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                                    {order.shipping_address || "Not provided"}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Order summary
                    </h2>

                    <div className="mt-5 space-y-4 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium text-gray-900">
                                {formatPrice(
                                    Number(order.subtotal ?? order.total),
                                    order.currency
                                )}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600">Items</span>
                            <span className="font-medium text-gray-900">
                                {items.reduce(
                                    (total, item) => total + Number(item.quantity),
                                    0
                                )}
                            </span>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between gap-4 text-base">
                                <span className="font-semibold text-gray-900">
                                    Order total
                                </span>
                                <span className="font-bold text-gray-900">
                                    {formatPrice(Number(order.total), order.currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-5">
                        <h3 className="font-semibold text-gray-900">
                            Payment information
                        </h3>

                        <div className="mt-3 space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500">Payment method</p>
                                <p className="mt-1 font-medium text-gray-900">
                                    {formatLabel(order.payment_method || "Not provided")}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Payment status</p>
                                <span
                                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(order.payment_status)}`}
                                >
                                    {formatLabel(order.payment_status || "Unknown")}
                                </span>
                            </div>
                        </div>

                        <p className="mt-4 text-xs leading-5 text-gray-500">
                            This project uses a demo checkout. Payment status reflects
                            the order record and does not confirm that a real payment
                            was processed.
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="mt-6 flex w-full justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                        Continue shopping
                    </Link>
                </aside>
            </div>
        </main>
    );
}