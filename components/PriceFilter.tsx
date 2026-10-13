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
        <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold">
                Price
            </h2>

            <div className="flex flex-wrap gap-3">
                {priceOptions.map((price) => (
                    <button
                        key={price}
                        onClick={() => onPriceChange(price)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${selectedPrice === price
                                ? "bg-black text-white"
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        {price}
                    </button>
                ))}
            </div>
        </div>
    );
}