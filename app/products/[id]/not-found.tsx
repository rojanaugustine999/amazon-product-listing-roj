import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
            <div className="text-center">
                <h1 className="text-4xl font-bold">
                    Product Not Found
                </h1>

                <p className="mt-3 text-gray-600">
                    Sorry, we couldn't find the product you're looking for.
                </p>

                <Link
                    href="/"
                    className="mt-6 inline-block rounded-lg bg-black px-6 py-3 font-semibold text-white"
                >
                    Back to Products
                </Link>
            </div>
        </main>
    );
}