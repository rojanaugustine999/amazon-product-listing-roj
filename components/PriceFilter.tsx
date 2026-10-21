"use client";

type PriceFilterProps = {
    selectedPrice: string;
    onPriceChange: (price: string) => void;
};

const priceOptions = [
    "All",
    "Under ₹2000",
    "₹2000 - ₹3999",
    "₹4000+",
];

export default function PriceFilter({
    selectedPrice,
    onPriceChange,
}: PriceFilterProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {priceOptions.map((price) => {
                const selected = selectedPrice === price;

                return (
                    <button
                        key={price}
                        type="button"
                        onClick={() => onPriceChange(price)}
                        aria-pressed={selected}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected
                                ? "bg-gray-900 font-semibold text-white"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
                            }`}
                    >
                        <span>{price}</span>

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