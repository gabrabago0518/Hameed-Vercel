import { Space_Grotesk, Inter } from "next/font/google";
import Header from "./components/Header.jsx";
import FloatingCart from "./components/FloatingCart.jsx";
import { getCartDetails } from "../lib/cart.js";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Hameed the Love Recipe",
  description: "Order your favorite meals for fast delivery.",
};

export default async function RootLayout({ children }) {
  const { items, total } = await getCartDetails();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        {children}
        <FloatingCart items={items} total={total} />
      </body>
    </html>
  );
}
