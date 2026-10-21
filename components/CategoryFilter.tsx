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
        <div className="flex flex-col gap-1.5">
            {categories.map((category) => {
                const selected = selectedCategory === category;

                return (
                    <button
                        key={category}
                        type="button"
                        onClick={() => onCategoryChange(category)}
                        aria-pressed={selected}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected
                                ? "bg-gray-900 font-semibold text-white"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
                            }`}
                    >
                        <span>{category}</span>

                        {selected && (
                            <span aria-hidden="true" className="text-xs">
                                ✓
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}