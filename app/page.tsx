
import Image from "next/image";
import Link from "next/link";
import ProductListing from "@/components/ProductListing";
import { products } from "@/data/products";

const categories = [
  {
    name: "Electronics",
    description: "Phones, audio & gadgets",
    icon: "🎧",
    color: "bg-blue-50",
    category: "Electronics",
  },
  {
    name: "Fashion",
    description: "Everyday style & essentials",
    icon: "👕",
    color: "bg-pink-50",
    category: "Fashion",
  },
  {
    name: "Shoes",
    description: "Sneakers & everyday footwear",
    icon: "👟",
    color: "bg-orange-50",
    category: "Shoes",
  },
];

// Reuse product images from the existing product collection.
const heroProducts = [
  {
    label: "Electronics",
    category: "Electronics",
    product: products.find((product) =>
      product.name.toLowerCase().includes("headphone")
    ),
    card: "translate-y-2",
  },
  {
    label: "Shoes",
    category: "Shoes",
    product: products.find((product) =>
      product.name.toLowerCase().includes("running shoes")
    ),
    card: "-translate-y-2",
  },
  {
    label: "Fashion",
    category: "Fashion",
    product: products.find((product) =>
      product.name.toLowerCase().includes("backpack")
    ),
    card: "translate-y-2",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#f5f7fa]">
      {/* Compact hero banner */}
      <section className="px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1600px] overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#eff6ff] via-[#eaf3ff] to-[#dceaff] shadow-sm md:grid-cols-[1.1fr_0.9fr]">
          {/* Hero text */}
          <div className="flex flex-col items-start justify-center p-5 sm:p-7 lg:p-9">
            <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7d7d7d] sm:text-xs">
              Explore our collection
            </span>

            <h1 className="mt-3 max-w-xl text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Discover products
              <span className="block text-[#7d7d7d]">
                made for everyday life.
              </span>
            </h1>

            <p className="mt-2 max-w-md text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
              Shop electronics, fashion, shoes, and everyday essentials.
            </p>

            <Link
              href="#products"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              Shop products
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Real product image cards */}
          <div className="relative flex min-h-[135px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#e1edff] via-[#edf4ff] to-[#d7e7ff] px-4 py-4 sm:min-h-[165px] sm:px-6 md:min-h-0">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-40 w-40 rounded-full bg-white/70 blur-2xl sm:h-52 sm:w-52"
            />

            <div className="relative grid w-full max-w-[440px] grid-cols-3 items-center gap-2 sm:gap-4">
              {heroProducts.map((item) => (
                <Link
                  key={item.label}
                  href={`/?category=${encodeURIComponent(item.category)}#products`}
                  aria-label={`Browse ${item.label} products`}
                  className={`block min-w-0 overflow-hidden rounded-xl border border-white bg-white p-2.5 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-3 ${item.card}`}
                >
                  <div className="relative aspect-square w-full">
                    {item.product ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 639px) 28vw, 150px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">
                        🛍️
                      </div>
                    )}
                  </div>

                  <p className="mt-1 truncate text-center text-[10px] font-semibold text-slate-700 sm:text-xs">
                    {item.label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>




      {/* Product listing */}
      <section
        id="products"
        className="scroll-mt-24 border-t border-slate-200 bg-white py-7 sm:py-9"
      >
        <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-6 lg:px-8">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Explore our collection
            </p>

            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Explore all products
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Search, filter, sort, and discover products from our collection.
            </p>
          </div>

          <ProductListing products={products} />
        </div>
      </section>
    </main>
  );
}
