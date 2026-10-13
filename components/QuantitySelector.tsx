"use client";

type QuantitySelectorProps = {
    quantity: number;
    max: number;
    onChange: (quantity: number) => void;
};

export default function QuantitySelector({
    quantity,
    max,
    onChange,
}: QuantitySelectorProps) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
                Quantity
            </span>

            <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300">
                <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => onChange(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    −
                </button>

                <span
                    aria-live="polite"
                    className="min-w-10 px-3 py-2 text-center font-semibold"
                >
                    {quantity}
                </span>

                <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= max}
                    onClick={() => onChange(Math.min(max, quantity + 1))}
                    className="px-3 py-2 text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    +
                </button>
            </div>
        </div>
    );
}