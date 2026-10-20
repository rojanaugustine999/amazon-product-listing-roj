
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Product } from "@/data/products";
import { getProductStock } from "@/lib/stock";
import AddToCartButton from "@/components/AddToCartButton";
import { createClient } from "@/lib/supabase/client";

type SupabaseProduct = {
    id: number;
    name: string;
    category: string;
    price: number | string;
    original_price: number | string;
    rating: number | string;
    reviews: number;
    image: string;
};

export default function ProductDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const id = params.id;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadProduct() {
            if (!id || !/^\d+$/.test(id)) {
                setProduct(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const supabase = createClient();

                const { data, error: queryError } = await supabase
                    .from("products")
                    .select(
                        "id, name, category, price, original_price, rating, reviews, image"
                    )
                    .eq("id", Number(id))
                    .maybeSingle();

                if (queryError) {
                    throw queryError;
                }

                if (!data) {
                    if (active) {
                        setProduct(null);
                    }
                    return;
                }

                const item = data as SupabaseProduct;

                const mappedProduct: Product = {
                    id: Number(item.id),
                    name: item.name,
                    category: item.category,
                    price: Number(item.price),
                    originalPrice: Number(item.original_price),
                    rating: Number(item.rating),
                    reviews: Number(item.reviews),
                    image: item.image,
                };

                if (active) {
                    setProduct(mappedProduct);
                }
            } catch (err) {
                console.error("Failed to load product details:", err);

                if (active) {
                    setError(
                        "Unable to load this product. Please try again."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadProduct();

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <p className="text-gray-600" role="status">
                    Loading product details...
                </p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-12">
                <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center">
                    <p className="text-red-700" role="alert">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => router.refresh()}
                        className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 font-semibold text-white hover:bg-gray-700"
                    >
                        Try again
                    </button>

                    <div>
                        <Link
                            href="/"
                            className="mt-4 inline-block text-sm font-medium text-gray-600 underline"
                        >
                            Back to Products
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-12">
                <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Product not found
                    </h1>

                    <p className="mt-3 text-gray-600">
                        This product may have been removed or the URL may be incorrect.
                    </p>

                    <Link
                        href="/"
                        className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-700"
                    >
                        Back to Products
                    </Link>
                </div>
            </main>
        );
    }

    const stock = getProductStock(product.id);
    const outOfStock = stock <= 0;

    const formatPrice = (price: number) =>
        `₹${price.toLocaleString("en-IN")}`;

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/"
                    className="mb-6 inline-flex items-center font-medium text-gray-600 transition hover:text-black"
                >
                    ← Back to Products
                </Link>

                <div className="grid grid-cols-1 gap-8 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-2 md:gap-12 md:p-8">
                    {/* Product image */}
                    <div className="relative flex min-h-80 items-center justify-center rounded-xl bg-gray-100 p-6">
                        <div className="relative h-80 w-full">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {/* Product details */}
                    <div className="flex flex-col">
                        <p className="text-sm capitalize text-gray-500">
                            {product.category}
                        </p>

                        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                            {product.name}
                        </h1>

                        <p className="mt-3 text-gray-600">
                            ⭐ {product.rating} ({product.reviews} reviews)
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <span className="text-3xl font-bold text-gray-900">
                                {formatPrice(product.price)}
                            </span>

                            {product.originalPrice > product.price && (
                                <span className="text-lg text-gray-500 line-through">
                                    {formatPrice(product.originalPrice)}
                                </span>
                            )}
                        </div>

                        <p
                            className={`mt-5 font-medium ${outOfStock
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

                        <p className="mt-5 leading-7 text-gray-600">
                            Browse this product in our online store.
                            Check the price, availability, and customer
                            rating before adding it to your cart.
                        </p>

                        <div className="mt-6">
                            {outOfStock ? (
                                <button
                                    type="button"
                                    disabled
                                    className="w-full cursor-not-allowed rounded-lg bg-gray-400 px-6 py-3 font-semibold text-white"
                                >
                                    Out of Stock
                                </button>
                            ) : (
                                <AddToCartButton product={product} />
                            )}
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-5 text-sm text-gray-600">
                            <p>✓ Demo stock availability</p>
                            <p className="mt-2">
                                ✓ Add products to your shopping cart
                            </p>
                            <p className="mt-2">
                                ✓ Secure checkout flow demo
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
