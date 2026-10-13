import type { Product } from "@/data/products";
import { products as fallbackProducts } from "@/data/products";

const API_URL = "https://fakestoreapi.com/products";
const REQUEST_TIMEOUT = 10000;

type ApiProduct = {
    id: number;
    title: string;
    category: string;
    price: number;
    image: string;
    rating?: {
        rate?: number;
        count?: number;
    };
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isApiProduct(value: unknown): value is ApiProduct {
    if (!isRecord(value)) return false;

    const rating = value.rating;

    return (
        typeof value.id === "number" &&
        typeof value.title === "string" &&
        typeof value.category === "string" &&
        typeof value.price === "number" &&
        Number.isFinite(value.price) &&
        typeof value.image === "string" &&
        (rating === undefined ||
            (isRecord(rating) &&
                (rating.rate === undefined ||
                    (typeof rating.rate === "number" &&
                        Number.isFinite(rating.rate))) &&
                (rating.count === undefined ||
                    (typeof rating.count === "number" &&
                        Number.isFinite(rating.count)))))
    );
}

function mapApiProduct(item: ApiProduct): Product {
    return {
        id: item.id,
        name: item.title,
        category: item.category,
        price: Math.round(item.price * 90),
        originalPrice: Math.round(item.price * 110),
        rating: item.rating?.rate ?? 0,
        reviews: item.rating?.count ?? 0,
        image: item.image,
    };
}

async function fetchApiData(url: string): Promise<unknown> {
    let response: Response;

    try {
        response = await fetch(url, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });
    } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
            throw new Error("The product service request timed out.");
        }

        throw new Error("Unable to connect to the product service.");
    }

    if (!response.ok) {
        throw new Error(
            `Product service error (${response.status}).`
        );
    }

    try {
        return await response.json();
    } catch {
        throw new Error("The product service returned invalid data.");
    }
}

export async function getProducts(): Promise<Product[]> {
    try {
        const data = await fetchApiData(API_URL);

        if (!Array.isArray(data) || !data.every(isApiProduct)) {
            throw new Error("Unexpected product data.");
        }

        return data.map(mapApiProduct);
    } catch (error) {
        console.error(
            "Fake Store API failed. Using local fallback products:",
            error
        );

        return fallbackProducts;
    }
}

export async function getProductById(
    id: string
): Promise<Product> {
    if (!/^\d+$/.test(id)) {
        throw new Error("Invalid product ID.");
    }

    try {
        const data = await fetchApiData(
            `${API_URL}/${encodeURIComponent(id)}`
        );

        if (!isApiProduct(data)) {
            throw new Error("Unexpected product data.");
        }

        return mapApiProduct(data);
    } catch (error) {
        console.error(
            `Could not load product ${id} from Fake Store API. Checking local products:`,
            error
        );

        const fallbackProduct = fallbackProducts.find(
            (product) => product.id === Number(id)
        );

        if (fallbackProduct) {
            return fallbackProduct;
        }

        throw new Error("Product not found.");
    }
}