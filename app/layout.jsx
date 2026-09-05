import { Anton, Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import CartPanel from "./components/CartPanel.jsx";
import ChromeGate from "./components/ChromeGate.jsx";
import { CartUIProvider } from "./components/CartUIContext.jsx";
import { ToastProvider } from "./components/ToastContext.jsx";
import { getCartDetails } from "../lib/cart.js";
import { getCurrentUser } from "../lib/session.js";
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
  const [user, { items, total }] = await Promise.all([getCurrentUser(), getCartDetails()]);

  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Thin progress bar across the top of the screen on every page
            navigation — the app's pages are all dynamic (real DB queries on
            every request), and Neon/Vercel cold starts can make that first
            request after idle time feel slow with no feedback otherwise.
            Rendered unconditionally (not gated by ChromeGate) so it also
            covers /admin and /staff navigation. */}
        <NextTopLoader color="#dc2626" showSpinner={false} />
        <ToastProvider>
          <CartUIProvider>
            <ChromeGate>
              <Header user={user} cartCount={items.reduce((sum, item) => sum + item.quantity, 0)} />
            </ChromeGate>
            {children}
            {user && (
              <ChromeGate>
                <CartPanel items={items} total={total} />
              </ChromeGate>
            )}
            <ChromeGate>
              <Footer />
            </ChromeGate>
          </CartUIProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
