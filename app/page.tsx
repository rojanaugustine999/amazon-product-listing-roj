import { getProducts } from "@/lib/api";
import ProductListing from "@/components/ProductListing";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const products = await getProducts();

    return <ProductListing products={products} />;
  } catch (error) {
    console.error("Failed to load products:", error);

    return (
      <main className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Products are temporarily unavailable
          </h1>

          <p className="mt-3 text-gray-600">
            We couldn't load the products right now.
            Please try again in a moment.
          </p>

          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Try Again
          </a>
        </div>
      </main>
    );
  }
}
