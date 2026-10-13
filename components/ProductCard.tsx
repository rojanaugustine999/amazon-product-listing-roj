"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { getProductStock } from "@/lib/stock";


import type { Product } from "@/data/products";

type ProductCardProps = {
    product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();

    const [quantity, setQuantity] = useState(1);

    const stock = getProductStock(product.id);
    const saved = isInWishlist(product.id);
    const outOfStock = stock <= 0;

    const formatPrice = (price: number) =>
        `₹${price.toLocaleString("en-IN")}`;

    function handleWishlistClick(
        event: React.MouseEvent<HTMLButtonElement>
    ) {
        event.preventDefault();
        event.stopPropagation();

        toggleWishlist(product);

        showToast(
            saved ? "Removed from wishlist!" : "Added to wishlist!",
            "success"
        );
    }

    function handleAddToCart() {
        if (outOfStock) {
            showToast("This product is out of stock!", "error");
            return;
        }

        if (quantity > stock) {
            showToast(`Only ${stock} unit(s) available!`, "error");
            return;
        }

        // The current CartContext may add one unit per call.
        // Add the selected quantity without changing its API.
        for (let i = 0; i < quantity; i++) {
            addToCart(product, quantity);
        }

        showToast(
            quantity === 1
                ? "Added to cart!"
                : `${quantity} units added to cart!`,
            "success"
        );
    }

    return (
        <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            {/* Product image and wishlist button */}
            <div className="relative">
                <Link
                    href={`/products/${product.id}`}
                    aria-label={`View ${product.name}`}
                    className="block"
                >
                    <div className="relative h-52 bg-gray-100 sm:h-60 lg:h-64">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-contain p-5"
                        />
                    </div>
                </Link>

                <button
                    type="button"
                    aria-label={
                        saved
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                    }
                    aria-pressed={saved}
                    onClick={handleWishlistClick}
                    className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:scale-110 hover:bg-gray-100"
                >
                    <span className={saved ? "text-red-600" : "text-gray-700"}>
                        {saved ? "♥" : "♡"}
                    </span>
                </button>
            </div>

            {/* Product information */}
            <div className="p-4">
                <p className="text-sm capitalize text-gray-500">
                    {product.category}
                </p>

                <Link
                    href={`/products/${product.id}`}
                    className="mt-1 block font-semibold text-gray-900 hover:underline"
                >
                    {product.name}
                </Link>

                <p className="mt-2 text-sm text-gray-600">
                    ⭐ {product.rating} ({product.reviews} reviews)
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                    </p>

                    {product.originalPrice > product.price && (
                        <p className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                        </p>
                    )}
                </div>

                {/* Stock availability */}
                <p
                    className={`mt-2 text-sm font-medium ${outOfStock ? "text-red-600" : stock <= 3 ? "text-orange-600" : "text-green-700"
                        }`}
                >
                    {outOfStock
                        ? "Out of stock"
                        : stock <= 3
                            ? `Only ${stock} left in stock`
                            : `In stock (${stock} available)`}
                </p>

                {/* Quantity selector */}
                {!outOfStock && (
                    <div className="mt-3 flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                            Quantity
                        </span>

                        <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300">
                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={quantity <= 1}
                                onClick={() =>
                                    setQuantity((current) => Math.max(1, current - 1))
                                }
                                className="px-3 py-1.5 text-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                −
                            </button>

                            <span className="min-w-9 px-2 py-1.5 text-center font-semibold">
                                {quantity}
                            </span>

                            <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={quantity >= stock}
                                onClick={() =>
                                    setQuantity((current) => Math.min(stock, current + 1))
                                }
                                className="px-3 py-1.5 text-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}

                {/* Add to Cart */}
                <button
                    type="button"
                    disabled={outOfStock}
                    onClick={handleAddToCart}
                    className="mt-4 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    {outOfStock ? "Out of Stock" : "🛒 Add to Cart"}
                </button>
            </div>
        </article>
    );
}
