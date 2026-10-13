"use client";

type SearchBarProps = {
    search: string;
    setSearch: (value: string) => void;
};

export default function SearchBar({
    search,
    setSearch,
}: SearchBarProps) {
    return (
        <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="mb-8 w-full rounded-lg border bg-white px-4 py-3 outline-none focus:ring-2"
        />
    );
}