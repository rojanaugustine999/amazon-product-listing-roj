
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

        // Preserve the existing CartContext API.
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
        <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            {/* Product image */}
            <div className="relative shrink-0">
                <Link
                    href={`/products/${product.id}`}
                    aria-label={`View ${product.name}`}
                    className="block"
                >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 sm:aspect-[5/4] lg:aspect-[4/3]">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
                            className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03] sm:p-5"
                        />
                    </div>
                </Link>

                {/* Wishlist button */}
                <button
                    type="button"
                    aria-label={
                        saved
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                    }
                    aria-pressed={saved}
                    onClick={handleWishlistClick}
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-xl shadow-sm transition hover:scale-110 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 sm:h-10 sm:w-10"
                >
                    <span
                        className={
                            saved ? "text-red-600" : "text-gray-600"
                        }
                    >
                        {saved ? "♥" : "♡"}
                    </span>
                </button>
            </div>

            {/* Product information */}
            <div className="flex flex-1 flex-col p-3 sm:p-4">
                <p className="text-xs font-medium capitalize text-gray-500 sm:text-sm">
                    {product.category}
                </p>

                <Link
                    href={`/products/${product.id}`}
                    className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-gray-900 hover:text-blue-700 hover:underline sm:text-base"
                >
                    {product.name}
                </Link>

                {/* Rating */}
                <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                    <span aria-label={`Rated ${product.rating} out of 5`}>
                        ⭐ {product.rating}
                    </span>{" "}
                    <span className="text-gray-500">
                        ({product.reviews} reviews)
                    </span>
                </p>

                {/* Price */}
                <div className="mt-3 flex min-h-7 flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-lg font-bold leading-6 text-gray-950 sm:text-xl">
                        {formatPrice(product.price)}
                    </p>

                    {product.originalPrice > product.price && (
                        <p className="text-xs text-gray-500 line-through sm:text-sm">
                            {formatPrice(product.originalPrice)}
                        </p>
                    )}
                </div>

                {/* Stock availability */}
                <p
                    aria-live="polite"
                    className={`mt-2 min-h-5 text-xs font-medium sm:text-sm ${outOfStock
                            ? "text-red-600"
                            : stock <= 3
                                ? "text-orange-600"
                                : "text-green-700"
                        }`}
                >
                    {outOfStock
                        ? "Out of stock"
                        : stock <= 3
                            ? `Only ${stock} left in stock`
                            : `In stock (${stock} available)`}
                </p>

                {/* Quantity selector */}
                <div className="mt-3 min-h-10">
                    {!outOfStock && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 sm:text-sm">
                                Quantity
                            </span>

                            <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300">
                                <button
                                    type="button"
                                    aria-label="Decrease quantity"
                                    disabled={quantity <= 1}
                                    onClick={() =>
                                        setQuantity((current) =>
                                            Math.max(1, current - 1)
                                        )
                                    }
                                    className="px-3 py-1.5 text-base transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    −
                                </button>

                                <span className="min-w-9 px-2 py-1.5 text-center text-sm font-semibold">
                                    {quantity}
                                </span>

                                <button
                                    type="button"
                                    aria-label="Increase quantity"
                                    disabled={quantity >= stock}
                                    onClick={() =>
                                        setQuantity((current) =>
                                            Math.min(stock, current + 1)
                                        )
                                    }
                                    className="px-3 py-1.5 text-base transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add to Cart */}
                <button
                    type="button"
                    disabled={outOfStock}
                    onClick={handleAddToCart}
                    className="mt-auto flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-black px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 sm:min-h-11"
                >
                    {outOfStock ? "Out of Stock" : "🛒 Add to Cart"}
                </button>
            </div>
        </article>
    );
}
