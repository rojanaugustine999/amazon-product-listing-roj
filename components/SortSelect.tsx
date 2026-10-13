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
        <div className="flex flex-wrap items-center gap-3">
            <label
                htmlFor="sort"
                className="font-semibold"
            >
                Sort by:
            </label>

            <select
                id="sort"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full max-w-full rounded-lg border border-gray-300 bg-white px-4 py-2 sm:w-auto sm:min-w-48"
            >
                <option value="default">Default</option>
                <option value="price-low">
                    Price: Low → High
                </option>
                <option value="price-high">
                    Price: High → Low
                </option>
                <option value="name-az">
                    Name: A → Z
                </option>
                <option value="name-za">
                    Name: Z → A
                </option>
            </select>
        </div>
    );
}