
import { getProducts } from "@/lib/api";
import ProductListing from "@/components/ProductListing";


export default async function Home() {
  const products = await getProducts();

  return <ProductListing products={products} />;
}
