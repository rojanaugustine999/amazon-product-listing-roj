"use client";

type CategoryFilterProps = {
    categories: string[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
};

export default function CategoryFilter({
    categories,
    selectedCategory,
    onCategoryChange,
}: CategoryFilterProps) {
    return (
        <div className="mb-8 flex flex-wrap gap-3">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onCategoryChange(category)}
                    className={`rounded-full border px-5 py-2 text-sm font-medium transition ${selectedCategory === category
                            ? "bg-black text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}