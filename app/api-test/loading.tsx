export default function Loading() {
    return (
        <main
            className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 sm:px-6 sm:py-8"
            aria-busy="true"
            aria-label="Loading API products"
        >
            <div className="mx-auto w-full max-w-6xl">
                {/* Page heading skeleton */}
                <div className="mb-8">
                    <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-gray-200 sm:h-10 sm:w-72" />

                    <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-gray-200" />
                </div>

                {/* Product grid skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            key={index}
                            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                        >
                            {/* Image placeholder */}
                            <div className="aspect-square animate-pulse bg-gray-200" />

                            {/* Product details placeholders */}
                            <div className="space-y-3 p-4">
                                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />

                                <div className="h-5 w-full animate-pulse rounded bg-gray-200" />

                                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

                                <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />

                                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>

                <p className="sr-only" role="status">
                    Loading products. Please wait.
                </p>
            </div>
        </main>
    );
}
