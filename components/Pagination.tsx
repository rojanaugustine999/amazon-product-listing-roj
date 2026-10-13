"use client";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="mt-8 flex items-center justify-center gap-2">
            <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;

                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={`rounded-lg border px-4 py-2 ${currentPage === page
                                ? "bg-black text-white"
                                : "bg-white"
                            }`}
                    >
                        {page}
                    </button>
                );
            })}

            <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Next
            </button>
        </div>
    );
}