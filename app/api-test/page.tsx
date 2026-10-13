import { getProducts } from "@/lib/api";
import type { Product } from "@/data/products";

export const dynamic = "force-dynamic";

export default async function ApiTestPage() {
    let products: Product[] = [];

    try {
        products = await getProducts();
    } catch (error) {
        console.error("Failed to load API products:", error);

        return (
            <main className="min-h-screen bg-gray-50 p-6">
                <div className="mx-auto max-w-6xl rounded-xl border bg-white p-6">
                    <h1 className="text-2xl font-bold text-red-600">
                        Unable to Load Products
                    </h1>

                    <p className="mt-3 text-gray-600">
                        The product service is temporarily unavailable.
                        Please try again later.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-6xl">
                <h1 className="mb-8 text-3xl font-bold">
                    API Products
                </h1>

                {products.length === 0 ? (
                    <p className="text-gray-600">
                        No products are currently available.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {products.map((product: Product) => (
                            <div
                                key={product.id}
                                className="rounded-xl border bg-white p-4 shadow-sm"
                            >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-48 w-full object-contain"
                                />

                                <p className="mt-4 text-sm text-gray-500">
                                    {product.category}
                                </p>

                                <h2 className="mt-1 font-semibold">
                                    {product.name}
                                </h2>

                                <p className="mt-2 text-xl font-bold">
                                    ₹{product.price.toLocaleString("en-IN")}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    ⭐ {product.rating} ({product.reviews} reviews)
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
