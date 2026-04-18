import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@/styles/globals.scss";
import { StoreProvider } from "./StoreProvider";
import { AuthHydrator } from "./AuthHydrator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Decent Debates",
  description: "A place for healthy debates.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <StoreProvider>
          <AuthHydrator>{children}</AuthHydrator>
        </StoreProvider>
      </body>
    </html>
  );
}
