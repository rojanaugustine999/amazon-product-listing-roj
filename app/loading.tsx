export default function Loading() {
    return (
        <main
            className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8"
            aria-busy="true"
            aria-label="Loading products"
        >
            <div className="mx-auto w-full max-w-7xl">
                {/* Header skeleton */}
                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-gray-200 sm:h-10 sm:w-64" />

                    <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 sm:w-40" />
                </div>

                {/* Search skeleton */}
                <div className="mb-5 h-12 w-full animate-pulse rounded-lg bg-gray-200 sm:mb-6 sm:h-14" />

                {/* Filters skeleton */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-11 animate-pulse rounded-lg bg-gray-200"
                        />
                    ))}
                </div>

                {/* Results heading skeleton */}
                <div className="mb-5 h-5 w-40 max-w-full animate-pulse rounded bg-gray-200" />

                {/* Product grid skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            key={index}
                            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                        >
                            {/* Product image */}
                            <div className="aspect-square animate-pulse bg-gray-200" />

                            {/* Product information */}
                            <div className="space-y-3 p-4">
                                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />

                                <div className="h-5 w-full animate-pulse rounded bg-gray-200" />

                                <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />

                                <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />

                                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Screen-reader status */}
                <p className="sr-only" role="status">
                    Loading products. Please wait.
                </p>
            </div>
        </main>
    );
}
