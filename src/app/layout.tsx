// Copyright © 2026 TRINH TRUNG TIEN (bstien@pnt.edu.vn)

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
      <body className={`${roboto.variable} font-sans antialiased bg-slate-50 min-h-screen flex flex-col`}>
        <Providers>{children}</Providers>

        <footer className="py-6 text-center text-sm text-slate-500 border-t mt-auto bg-white">
          <p className="font-medium">Sáng kiến cải tiến năm 2026 của Trạm Y tế - Phòng khám đa khoa Trường Đại học Y khoa Phạm Ngọc Thạch</p>
          <p>Email: <a href="mailto:yte@pnt.edu.vn" className="hover:text-sky-600">yte@pnt.edu.vn</a></p>
        </footer>
      </body>
    </html>
  );
}
