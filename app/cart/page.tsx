"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { getProductStock } from "@/lib/stock";

export default function CartPage() {
    const {
        cartItems,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        cartTotal,
    } = useCart();

    const formatPrice = (price: number) =>
        `₹${price.toLocaleString("en-IN")}`;

    // Empty cart
    if (cartItems.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-16">
                <div className="mx-auto max-w-5xl py-12 text-center sm:py-20">
                    <div className="mb-5 text-5xl" aria-hidden="true">
                        🛒
                    </div>

                    <h1 className="mb-4 text-2xl font-bold sm:text-3xl">
                        Your Cart Is Empty
                    </h1>

                    <p className="mx-auto mb-8 max-w-md text-sm text-gray-600 sm:text-base">
                        You haven't added any products to your cart yet.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-6xl">
                {/* Responsive Header */}
                <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Shopping Cart
                        </h1>

                        <p className="mt-1 text-sm text-gray-600">
                            {cartItems.reduce(
                                (total, item) => total + item.quantity,
                                0
                            )}{" "}
                            item(s) in your cart
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-100 sm:w-auto sm:px-5"
                    >
                        ← Continue Shopping
                    </Link>
                </header>

                {/* Cart and Summary */}
                <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-3 lg:gap-6">
                    {/* Cart Items */}
                    <section
                        aria-label="Cart items"
                        className="min-w-0 space-y-4 lg:col-span-2"
                    >
                        {cartItems.map((item) => {
                            const stock = getProductStock(item.id);
                            const atStockLimit = item.quantity >= stock;

                            return (
                                <article
                                    key={item.id}
                                    className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
                                >
                                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                                        {/* Product Image */}
                                        <Link
                                            href={`/products/${item.id}`}
                                            aria-label={`View ${item.name}`}
                                            className="relative block h-44 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-32"
                                        >
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, 128px"
                                                className="object-contain p-4"
                                            />
                                        </Link>

                                        {/* Product Details */}
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-1 text-xs capitalize text-gray-500 sm:text-sm">
                                                {item.category}
                                            </p>

                                            <Link
                                                href={`/products/${item.id}`}
                                                className="break-words font-semibold text-gray-900 hover:underline"
                                            >
                                                {item.name}
                                            </Link>

                                            <p className="mt-2 text-lg font-bold">
                                                {formatPrice(item.price)}
                                            </p>

                                            <p
                                                className={`mt-1 text-xs font-medium sm:text-sm ${stock <= 0
                                                        ? "text-red-600"
                                                        : atStockLimit
                                                            ? "text-orange-600"
                                                            : "text-green-700"
                                                    }`}
                                            >
                                                {stock <= 0
                                                    ? "Out of stock"
                                                    : atStockLimit
                                                        ? `Stock limit reached (${stock})`
                                                        : `${stock - item.quantity} more available`}
                                            </p>

                                            {/* Quantity Controls */}
                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Quantity
                                                </span>

                                                <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            decreaseQuantity(item.id)
                                                        }
                                                        disabled={item.quantity <= 1}
                                                        aria-label={`Decrease ${item.name} quantity`}
                                                        className="min-h-11 min-w-11 text-xl transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        −
                                                    </button>

                                                    <span
                                                        aria-live="polite"
                                                        className="min-w-10 px-2 text-center font-semibold"
                                                    >
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            increaseQuantity(item.id)
                                                        }
                                                        disabled={
                                                            stock <= 0 ||
                                                            atStockLimit
                                                        }
                                                        aria-label={`Increase ${item.name} quantity`}
                                                        className="min-h-11 min-w-11 text-xl transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subtotal and Remove */}
                                        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:min-w-28 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                                            <div>
                                                <p className="text-xs text-gray-500 sm:text-right">
                                                    Item total
                                                </p>

                                                <p className="mt-1 font-bold text-gray-900 sm:text-right">
                                                    {formatPrice(
                                                        item.price * item.quantity
                                                    )}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeFromCart(item.id)
                                                }
                                                className="min-h-10 rounded-md px-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    {/* Order Summary */}
                    <aside className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
                        <h2 className="mb-5 text-xl font-bold">
                            Order Summary
                        </h2>

                        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-gray-600 sm:text-base">
                            <span>Subtotal</span>

                            <span className="font-semibold text-gray-900">
                                {formatPrice(cartTotal)}
                            </span>
                        </div>

                        <div className="mb-5 flex items-center justify-between gap-3 text-sm sm:text-base">
                            <span className="text-gray-600">
                                Delivery
                            </span>

                            <span className="font-semibold text-green-600">
                                FREE
                            </span>
                        </div>

                        <div className="border-t border-gray-200 pt-5">
                            <div className="mb-5 flex items-start justify-between gap-3 text-lg font-bold">
                                <span>Total</span>

                                <span className="text-right">
                                    {formatPrice(cartTotal)}
                                </span>
                            </div>

                            <Link
                                href="/checkout"
                                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-black px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
                            >
                                Proceed to Checkout
                            </Link>

                            <p className="mt-3 text-center text-xs text-gray-500">
                                Delivery is free on this demo store.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
