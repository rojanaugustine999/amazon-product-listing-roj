
"use client";

type SortSelectProps = {
    sortBy: string;
    onSortChange: (value: string) => void;
};

export default function SortSelect({
    sortBy,
    onSortChange,
}: SortSelectProps) {
    return (
        <select
            id="sort"
            aria-label="Sort products"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="block w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
        >
            <option value="default">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-az">Name: A to Z</option>
            <option value="name-za">Name: Z to A</option>
        </select>
    );
}
