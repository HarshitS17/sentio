import type { Metadata } from "next";
import { Pacifico } from 'next/font/google';
import "./globals.css";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
});

export const metadata: Metadata = {
  title: "Sentio",
  description: "Premium Fintech Application",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${pacifico.variable}`}>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
