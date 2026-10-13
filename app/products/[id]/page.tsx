import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductById } from "@/lib/api";
import { getProductStock } from "@/lib/stock";
import AddToCartButton from "@/components/AddToCartButton";

type ProductPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ProductDetailsPage({
    params,
}: ProductPageProps) {
    const { id } = await params;

    // Invalid product IDs should show the Not Found page.
    if (!/^\d+$/.test(id)) {
        notFound();
    }

    // Only a genuinely missing product should show Not Found.
    // Other API failures should reach the error boundary.
    const product = await getProductById(id).catch((error: unknown) => {
        if (
            error instanceof Error &&
            error.message === "Product not found."
        ) {
            notFound();
        }

        throw error;
    });

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
                            Browse this product in our online store. Check the
                            price, availability, and customer rating before
                            adding it to your cart.
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
