"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function WishlistPage() {
    const {
        wishlistItems,
        toggleWishlist,
    } = useWishlist();

    const { addToCart } = useCart();

    const formatPrice = (price: number) =>
        `₹${price.toLocaleString("en-IN")} `;

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            My Wishlist <span className="text-red-600">♥</span>
                        </h1>

                        <p className="mt-2 text-gray-600">
                            {wishlistItems.length} saved product(s)
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="rounded-lg border border-gray-300 px-5 py-3 font-semibold transition hover:bg-gray-100"
                    >
                        Continue Shopping
                    </Link>
                </div>

                {/* Empty Wishlist */}
                {wishlistItems.length === 0 ? (
                    <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                        <div className="mb-4 text-5xl text-gray-300">
                            ♡
                        </div>

                        <h2 className="mb-2 text-xl font-semibold">
                            Your wishlist is empty
                        </h2>

                        <p className="mb-6 text-gray-600">
                            Save products you love and find them here later.
                        </p>

                        <Link
                            href="/"
                            className="inline-block rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
                        >
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    /* Wishlist Products */
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {wishlistItems.map((product) => (
                            <article
                                key={product.id}
                                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                {/* Product Image */}
                                <Link
                                    href={`/products/${product.id}`}
                                    className="block"
                                >
                                    <div className="relative h-56 bg-gray-100">
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            className="object-contain p-5"
                                        />
                                    </div>
                                </Link>

                                {/* Product Information */}
                                <div className="p-4">
                                    <p className="text-sm text-gray-500">
                                        {product.category}
                                    </p>

                                    <Link
                                        href={`/products/${product.id}`}
                                        className="mt-1 block font-semibold hover:underline"
                                    >
                                        {product.name}
                                    </Link>

                                    {/* Rating */}
                                    <p className="mt-2 text-sm text-gray-600">
                                        ⭐ {product.rating} ({product.reviews} reviews)
                                    </p>

                                    {/* Price */}
                                    <p className="mt-3 text-xl font-bold">
                                        {formatPrice(product.price)}
                                    </p>

                                    {/* Add to Cart */}
                                    <button
                                        type="button"
                                        onClick={() => addToCart(product)}
                                        className="mt-4 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
                                    >
                                        Add to Cart
                                    </button>

                                    {/* Remove from Wishlist */}
                                    <button
                                        type="button"
                                        onClick={() => toggleWishlist(product)}
                                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                        ♥ Remove from Wishlist
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}