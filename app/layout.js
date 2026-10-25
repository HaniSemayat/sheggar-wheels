import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DemoDataInitializer from "../components/DemoDataInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sheggar Wheels | Rent a Car in Addis Ababa",
  description: "Discover and rent cars from local owners in Addis Ababa with Sheggar Wheels.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body><DemoDataInitializer />{children}</body>
    </html>
  );
}


