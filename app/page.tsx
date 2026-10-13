import ProductListing from "@/components/ProductListing";
import { products } from "@/data/products";

export default function Home() {
  return <ProductListing products={products} />;
}
