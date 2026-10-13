import { getProducts } from "@/lib/api";

export default async function ApiTestPage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-6xl">
                <h1 className="mb-8 text-3xl font-bold">
                    API Products
                </h1>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.map((product) => (
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
            </div>
        </main>
    );
}
