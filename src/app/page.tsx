"use client";

import { useSession, signIn } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
            Hệ thống Quản lý <span className="text-sky-500">Trạm Y Tế</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Quản lý yêu cầu thuốc, cấp phát và tồn kho hiệu quả.
            Dành cho cán bộ nhân viên trường PNT.
          </p>
        </div>

        {!session ? (
          <div className="flex justify-center">
            <Card className="max-w-md w-full text-center py-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Chào mừng trở lại</h2>
              <p className="text-slate-600 mb-8">
                Vui lòng đăng nhập với tài khoản <span className="font-semibold">@pnt.edu.vn</span> để tiếp tục.
              </p>
              <Button onClick={() => signIn("google")} className="w-full justify-center">
                Đăng nhập bằng Google
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Yêu cầu thuốc</h3>
              <p className="text-slate-600 mb-4">Tạo yêu cầu cấp phát thuốc mới.</p>
              <Link href="/dashboard/request">
                <Button variant="outline" className="w-full justify-center">Tạo Yêu Cầu</Button>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Lịch sử của tôi</h3>
              <p className="text-slate-600 mb-4">Xem lại các yêu cầu thuốc đã tạo và trạng thái.</p>
              <Link href="/dashboard/history">
                <Button variant="outline" className="w-full justify-center">Xem Lịch Sử</Button>
              </Link>
            </Card>

            {/* TODO: Add Staff/Admin cards conditionally */}
          </div>
        )}
      </main>
    </div>
  );
}
