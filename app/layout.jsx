import { Anton, Inter } from "next/font/google";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import CartPanel from "./components/CartPanel.jsx";
import ChromeGate from "./components/ChromeGate.jsx";
import { CartUIProvider } from "./components/CartUIContext.jsx";
import { ToastProvider } from "./components/ToastContext.jsx";
import { getCartDetails } from "../lib/cart.js";
import "./globals.css";

// Anton for headings, per brand request — a bold, condensed display face
// that reads well at hero-carousel size. Anton only ships one weight (400),
// which is already heavy enough to work as a "bold" heading font on its own.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
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
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          <CartUIProvider>
            <ChromeGate>
              <Header />
            </ChromeGate>
            {children}
            <ChromeGate>
              <CartPanel items={items} total={total} />
            </ChromeGate>
            <ChromeGate>
              <Footer />
            </ChromeGate>
          </CartUIProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
