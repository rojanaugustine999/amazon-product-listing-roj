# Amazon Product Listing App

A responsive e-commerce web application built with **Next.js, React, TypeScript, Tailwind CSS, and Supabase**. The application provides product browsing, search and filtering, cart and wishlist management, checkout, customer authentication, and order history.

## 🚀 Live Demo

**Website:** https://amazon-product-listing-roj.vercel.app/

**GitHub Repository:** https://github.com/rojanaugustine999/amazon-product-listing-roj

## 📸 Screenshots

### Home Page
![Home Page](screenshots/homepage.png)

### Shopping Cart
![Cart Page](screenshots/cart.png)

### Checkout Page
![Checkout Page](screenshots/checkout.png)

### Customer Account and Order History
![Account Page](screenshots/account.png)

## ✨ Features

### Product Listing
- Browse products and view product details.
- Search products by name.
- Filter products by category and price.
- Sort products by available sorting options.
- Navigate through product listings using pagination.
- Display loading states and fallback product data.

### Shopping Cart
- Add products to the cart.
- Increase or decrease product quantities.
- Remove products from the cart.
- View cart item count and subtotal.
- Validate product stock before adding or updating quantities.
- Persist cart data using browser local storage.

### Wishlist
- Add and remove products from the wishlist.
- Keep wishlist items available between visits using local storage.

### Customer Authentication
- Register a customer account.
- Log in and log out securely using Supabase Auth.
- Display customer profile information.
- Associate orders with the authenticated customer.

### Checkout and Orders
- Enter shipping information.
- Select a demo payment method.
- Validate checkout details.
- Display an order confirmation page.
- Save orders and order items in Supabase.
- View previous orders in the customer account.
- Refresh order history.
- Keep order history isolated between customer accounts.

### User Experience
- Responsive layouts for desktop, tablet, and mobile.
- Toast notifications for user actions.
- Loading and error states.
- Form validation and helpful error messages.
- Reusable components and shared React Context for application state.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Next.js | Application framework and routing |
| React | User interface and reusable components |
| TypeScript | Type safety |
| Tailwind CSS | Responsive styling |
| Ant Design | UI components, where used |
| Supabase Auth | Customer authentication |
| Supabase Database | Store customer orders and order items |
| `@supabase/ssr` | Supabase client integration |
| React Context API | Shared cart, wishlist, and toast state |
| Local Storage | Persist cart and wishlist data |
| Vercel | Application deployment |
| Git and GitHub | Version control and source code hosting |

## 📂 Project Structure

```text
amazon-product-listing-roj/
├── app/
│   ├── account/
│   ├── api-test/
│   ├── cart/
│   ├── checkout/
│   ├── login/
│   ├── order-success/
│   ├── products/
│   ├── register/
│   ├── wishlist/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── context/
│   ├── CartContext.tsx
│   ├── ToastContext.tsx
│   └── WishlistContext.tsx
├── data/
│   └── products.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── api.ts
│   └── stock.ts
├── public/
├── screenshots/
│   ├── homepage.png
│   ├── cart.png
│   ├── checkout.png
│   └── account.png
├── package.json
└── README.md
```

*Note: The structure above summarizes the main project areas. Individual files may differ as the project evolves.*

## ⚙️ Run the Project Locally

### Prerequisites

- Node.js and npm
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/rojanaugustine999/amazon-product-listing-roj.git
cd amazon-product-listing-roj
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the example values with the corresponding values from your Supabase project.

**Security:** Never commit `.env.local`, passwords, or secret/service-role API keys to GitHub. The publishable key is intended for client-side use; protect database data with appropriate Supabase Row Level Security (RLS) policies.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
```

### 6. Start the production server locally

```bash
npm run start
```

## 🗄️ Database

The application uses Supabase to manage customer authentication and persist order information.

### Orders

Stores information such as:
- Customer ID
- Order status
- Currency, subtotal, and total
- Shipping details
- Payment method and payment status
- Order creation date

### Order Items

Stores information such as:
- Associated order ID
- Product ID and name
- Product image
- Quantity
- Unit price and line total

Database access should be protected using suitable Row Level Security policies so customers can access only their own orders and related order items.

## 🧪 Testing Checklist

- [x] Browse products and view product details.
- [x] Search, filter, sort, and paginate products.
- [x] Add, update, and remove cart items.
- [x] Manage wishlist items.
- [x] Register, log in, and log out.
- [x] Place a test order and view it in My Orders.
- [x] Refresh order history.
- [x] Verify customer order isolation.
- [x] Check account and order cards on mobile.
- [x] Build the project successfully.

## 🚀 Deployment

The application is deployed using Vercel.

**Live URL:** https://amazon-product-listing-roj.vercel.app/

Production environment variables are configured in the Vercel project settings.

## 🔮 Future Improvements

- Integrate a real payment gateway.
- Add product reviews and ratings.
- Add an admin dashboard for managing products and orders.
- Improve automated testing.
- Add order tracking and email notifications.
- Improve accessibility and performance.

## 👨‍💻 Author

**Rojan Augustine**

- GitHub: [@rojanaugustine999](https://github.com/rojanaugustine999)

## 📄 License

This project is intended for learning and portfolio demonstration. Add a formal license if you plan to distribute or reuse the source code under specific terms.
