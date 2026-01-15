import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Trạm Y Tế - PNT",
  description: "Hệ thống quản lý cấp phát thuốc và vật tư y tế trường PNT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${roboto.variable} font-sans antialiased bg-slate-50`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
