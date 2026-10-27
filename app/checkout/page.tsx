"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";


type RazorpaySuccessResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
    modal: {
        ondismiss: () => void;
    };
};

declare global {
    interface Window {
        Razorpay?: new (
            options: RazorpayOptions
        ) => {
            open: () => void;
        };
    }
}

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const scriptUrl = "https://checkout.razorpay.com/v1/checkout.js";
        const existingScript = document.querySelector(
            `script[src="${scriptUrl}"]`
        ) as HTMLScriptElement | null;

        if (existingScript) {
            existingScript.addEventListener("load", () =>
                resolve(Boolean(window.Razorpay)),
                { once: true }
            );
            existingScript.addEventListener("error", () => resolve(false), {
                once: true,
            });
            return;
        }

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.onload = () => resolve(Boolean(window.Razorpay));
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function CheckoutPage() {
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const router = useRouter();

    const { cartItems, clearCart, cartTotal } = useCart();

    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pinCode: "",
    });

    const updateField = (
        field: keyof typeof formData,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        setError("");
    };

    const formatPrice = (price: number) =>
        `₹${price.toLocaleString("en-IN")}`;


    const startRazorpayPayment = async (
        method: "upi" | "card"
    ): Promise<void> => {
        const scriptLoaded = await loadRazorpayScript();

        if (!scriptLoaded || !window.Razorpay) {
            throw new Error(
                "Could not load Razorpay Checkout. Please check your internet connection and try again."
            );
        }

        const orderResponse = await fetch("/api/razorpay/order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                items: cartItems.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                })),
                paymentMethod: method,
                shipping: {
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone,
                    address: formData.address.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    pinCode: formData.pinCode.trim(),
                },
            }),
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(
                orderData.error || "Could not create the payment order."
            );
        }

        if (
            !orderData.orderId ||
            !orderData.razorpayOrderId ||
            !orderData.keyId ||
            !Number.isSafeInteger(orderData.amount) ||
            orderData.amount <= 0 ||
            orderData.currency !== "INR"
        ) {
            throw new Error("The server returned an invalid payment order.");
        }

        await new Promise<void>((resolve, reject) => {
            let completed = false;

            const fail = (message: string) => {
                if (completed) return;
                completed = true;
                reject(new Error(message));
            };

            const checkout = new window.Razorpay!({
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Amazon Product Listing",
                description: "Product purchase",
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: formData.fullName.trim(),
                    email: formData.email.trim(),
                    contact: formData.phone,
                },
                handler: async (response) => {
                    try {
                        const verifyResponse = await fetch(
                            "/api/razorpay/verify",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    orderId: orderData.orderId,
                                    razorpay_order_id:
                                        response.razorpay_order_id,
                                    razorpay_payment_id:
                                        response.razorpay_payment_id,
                                    razorpay_signature:
                                        response.razorpay_signature,
                                }),
                            }
                        );

                        const verifyData = await verifyResponse.json();

                        if (!verifyResponse.ok || !verifyData.success) {
                            fail(
                                verifyData.error ||
                                "We could not confirm the payment. Check your order status before trying to pay again."
                            );
                            return;
                        }

                        if (completed) return;
                        completed = true;
                        resolve();
                    } catch {
                        fail(
                            "Payment may have succeeded, but confirmation could not be completed. Check your order status before trying to pay again."
                        );
                    }
                },
                modal: {
                    ondismiss: () => {
                        fail(
                            "Payment window closed. Your order may still be pending; check its status before retrying."
                        );
                    },
                },
            });

            checkout.open();
        });
    };

    const handlePlaceOrder = async () => {
        if (isPlacingOrder) return;

        if (cartItems.length === 0) {
            setError("Your cart is empty. Please add a product first.");
            return;
        }

        if (!formData.fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{10}$/.test(formData.phone)) {
            setError("Phone number must be exactly 10 digits.");
            return;
        }

        if (!formData.address.trim()) {
            setError("Please enter your delivery address.");
            return;
        }

        if (!formData.city.trim()) {
            setError("Please enter your city.");
            return;
        }

        if (!formData.state.trim()) {
            setError("Please enter your state.");
            return;
        }

        if (!/^\d{6}$/.test(formData.pinCode)) {
            setError("PIN code must be exactly 6 digits.");
            return;
        }

        if (!["cod", "upi", "card"].includes(paymentMethod)) {
            setError("Please select a valid payment method.");
            return;
        }

        setError("");
        setIsPlacingOrder(true);

        try {
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setError("Please log in before placing your order.");
                return;
            }

            // Online payments create the order and its items through the
            // server-side Razorpay API. Keep the existing COD flow below.
            if (paymentMethod === "upi" || paymentMethod === "card") {
                await startRazorpayPayment(paymentMethod);
                clearCart();
                router.push("/order-success");
                return;
            }

            const subtotal = Number(cartTotal.toFixed(2));

            const shippingAddress = [
                formData.address.trim(),
                formData.city.trim(),
                formData.state.trim(),
                formData.pinCode.trim(),
            ].join(", ");

            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    user_id: user.id,
                    status: "pending",
                    currency: "INR",
                    subtotal,
                    total: subtotal,
                    shipping_name: formData.fullName.trim(),
                    shipping_email: formData.email.trim(),
                    shipping_phone: formData.phone,
                    shipping_address: shippingAddress,
                    payment_method: paymentMethod,
                    payment_status: "unpaid",
                })
                .select("id")
                .single();

            if (orderError || !order) {
                throw new Error(
                    orderError?.message || "Could not create your order."
                );
            }

            const orderItems = cartItems.map((item) => ({
                order_id: order.id,
                product_id: String(item.id),
                product_name: item.name,
                image_url:
                    "image" in item && typeof item.image === "string"
                        ? item.image
                        : null,
                quantity: item.quantity,
                unit_price: Number(item.price.toFixed(2)),
                line_total: Number(
                    (item.price * item.quantity).toFixed(2)
                ),
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems);

            if (itemsError) {
                // Remove the incomplete order if saving its items fails.
                // This cleanup requires a matching DELETE RLS policy.
                await supabase
                    .from("orders")
                    .delete()
                    .eq("id", order.id)
                    .eq("user_id", user.id);

                throw new Error(
                    `Order items could not be saved: ${itemsError.message}`
                );
            }

            clearCart();
            router.push("/order-success");
        } catch (error) {
            console.error("Checkout failed:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while placing your order."
            );
        } finally {
            setIsPlacingOrder(false);
        }
    };


    if (cartItems.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-2xl rounded-xl bg-white px-5 py-12 text-center shadow-sm sm:px-8 sm:py-16">
                    <h1 className="text-2xl font-bold sm:text-3xl">
                        Your Cart Is Empty
                    </h1>

                    <p className="mt-3 text-sm text-gray-600 sm:text-base">
                        Add some products before proceeding to checkout.
                    </p>

                    <Link
                        href="/"
                        className="mt-6 inline-block rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                {/* Header */}
                <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Checkout
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Complete your delivery and payment details.
                        </p>
                    </div>

                    <Link
                        href="/cart"
                        className="inline-flex w-fit items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-100 sm:px-5 sm:py-3 sm:text-base"
                    >
                        ← Back to Cart
                    </Link>
                </header>

                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3 lg:gap-8">
                    {/* Checkout Form */}
                    <div className="min-w-0 space-y-5 lg:col-span-2 lg:space-y-6">
                        {/* Customer Information */}
                        <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="mb-5 text-lg font-bold sm:text-xl">
                                Customer Information
                            </h2>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold">
                                        Full Name
                                    </label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Enter your full name"
                                        value={formData.fullName}
                                        onChange={(e) => updateField("fullName", e.target.value)}
                                        className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-black sm:px-4"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) => updateField("email", e.target.value)}
                                        className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-black sm:px-4"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold">
                                        Phone Number
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        inputMode="numeric"
                                        autoComplete="tel"
                                        maxLength={10}
                                        placeholder="10-digit phone number"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            updateField(
                                                "phone",
                                                e.target.value.replace(/\D/g, "").slice(0, 10)
                                            )
                                        }
                                        className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-black sm:px-4"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Delivery Address */}
                        <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="mb-5 text-lg font-bold sm:text-xl">
                                Delivery Address
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="address" className="mb-1.5 block text-sm font-semibold">
                                        House / Street / Area
                                    </label>
                                    <textarea
                                        id="address"
                                        rows={3}
                                        autoComplete="street-address"
                                        placeholder="Enter your complete delivery address"
                                        value={formData.address}
                                        onChange={(e) => updateField("address", e.target.value)}
                                        className="w-full min-w-0 resize-y rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-black sm:px-4"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="city" className="mb-1.5 block text-sm font-semibold">
                                            City
                                        </label>
                                        <input
                                            id="city"
                                            type="text"
                                            autoComplete="address-level2"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={(e) => updateField("city", e.target.value)}
                                            className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-black sm:px-4"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="state" className="mb-1.5 block text-sm font-semibold">
                                            State
                                        </label>
                                        <input
                                            id="state"
                                            type="text"
                                            autoComplete="address-level1"
                                            placeholder="State"
                                            value={formData.state}
                                            onChange={(e) => updateField("state", e.target.value)}
                                            className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-black sm:px-4"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="pinCode" className="mb-1.5 block text-sm font-semibold">
                                            PIN Code
                                        </label>
                                        <input
                                            id="pinCode"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="postal-code"
                                            maxLength={6}
                                            placeholder="6-digit PIN code"
                                            value={formData.pinCode}
                                            onChange={(e) =>
                                                updateField(
                                                    "pinCode",
                                                    e.target.value.replace(/\D/g, "").slice(0, 6)
                                                )
                                            }
                                            className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-black sm:px-4"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Payment Method */}
                        <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="mb-5 text-lg font-bold sm:text-xl">
                                Payment Method
                            </h2>

                            <div className="space-y-3">
                                {[
                                    {
                                        value: "cod",
                                        title: "Cash on Delivery",
                                        description: "Pay when your order arrives",
                                    },
                                    {
                                        value: "upi",
                                        title: "UPI",
                                        description: "Pay using UPI",
                                    },
                                    {
                                        value: "card",
                                        title: "Credit / Debit Card",
                                        description: "Pay using a credit or debit card",
                                    },
                                ].map((method) => (
                                    <label
                                        key={method.value}
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition sm:p-4 ${paymentMethod === method.value
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 hover:bg-gray-50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={method.value}
                                            checked={paymentMethod === method.value}
                                            onChange={() => setPaymentMethod(method.value)}
                                            className="mt-1 h-4 w-4 shrink-0 accent-black"
                                        />

                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold sm:text-base">
                                                {method.title}
                                            </span>
                                            <span className="mt-1 block text-sm text-gray-500">
                                                {method.description}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Order Summary */}
                    <aside className="h-fit min-w-0 rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6">
                        <h2 className="mb-5 text-lg font-bold sm:mb-6 sm:text-xl">
                            Order Summary
                        </h2>

                        <div className="mb-5 space-y-4 text-sm sm:mb-6">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-600">
                                    Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
                                </span>
                                <span className="shrink-0 font-medium">
                                    {formatPrice(cartTotal)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-600">Delivery</span>
                                <span className="shrink-0 font-semibold text-green-600">
                                    FREE
                                </span>
                            </div>

                            <hr className="border-gray-200" />

                            <div className="flex items-center justify-between gap-3 text-lg font-bold">
                                <span>Total</span>
                                <span className="shrink-0">
                                    {formatPrice(cartTotal)}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="mb-4 rounded-lg bg-red-50 px-3 py-3 text-sm font-semibold text-red-600 sm:px-4"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder}
                            className="w-full rounded-lg bg-black px-4 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:py-4"
                        >
                            {isPlacingOrder
                                ? "Placing Order..."
                                : `Place Order · ${formatPrice(cartTotal)}`}
                        </button>

                        <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                            Razorpay Test Mode is for simulated payments only. COD remains available.
                        </p>
                    </aside>
                </div>
            </div>
        </main>
    );
}