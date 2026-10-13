// Demo inventory for learning purposes.
// These values are not real inventory from the Fake Store API.

const DEMO_STOCK = 10;

const stockByProductId: Record<number, number> = {
    1: 5,
    2: 0,
    3: 12,
    4: 3,
    5: 8,
};

export function getProductStock(productId: number): number {
    return stockByProductId[productId] ?? DEMO_STOCK;
}