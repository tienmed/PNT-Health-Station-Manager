"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function DashboardPage() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/");
        },
    });

    if (status === "loading") {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
    }

    const userRole = (session?.user?.role as string)?.toUpperCase();
    const isStaff = userRole === "STAFF" || userRole === "ADMIN";

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Xin chào, {session?.user?.name}
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Vai trò: <span className="font-semibold text-sky-600">{session?.user?.role || "EMPLOYEE"}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Employee Actions */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-sky-500">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Yêu cầu thuốc</h3>
                        <p className="text-slate-600 mb-6 min-h-[48px]">
                            Gửi yêu cầu cấp phát thuốc mới từ trạm y tế.
                        </p>
                        <Link href="/dashboard/request">
                            <Button className="w-full justify-center">Tạo Yêu Cầu</Button>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-sky-500">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Lịch sử của tôi</h3>
                        <p className="text-slate-600 mb-6 min-h-[48px]">
                            Xem lại các yêu cầu thuốc đã tạo và trạng thái hiện tại.
                        </p>
                        <Link href="/dashboard/history">
                            <Button variant="outline" className="w-full justify-center">Xem Lịch Sử</Button>
                        </Link>
                    </Card>

                    {/* Staff Actions (Visible only to Staff) */}
                    {isStaff && (
                        <>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-green-500">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Quản lý Yêu cầu</h3>
                                <p className="text-slate-600 mb-6 min-h-[48px]">
                                    Xem xét và cấp phát các yêu cầu thuốc đang chờ xử lý.
                                </p>
                                <Link href="/dashboard/staff/requests">
                                    <Button variant="secondary" className="w-full justify-center bg-green-600 hover:bg-green-700">Đến hàng đợi</Button>
                                </Link>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-green-500">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Quản lý Kho</h3>
                                <p className="text-slate-600 mb-6 min-h-[48px]">
                                    Cập nhật số lượng tồn kho và thêm thuốc mới.
                                </p>
                                <Link href="/dashboard/staff/inventory">
                                    <Button variant="secondary" className="w-full justify-center bg-green-600 hover:bg-green-700">Kho thuốc</Button>
                                </Link>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-purple-500">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Báo cáo & Thống kê</h3>
                                <p className="text-slate-600 mb-6 min-h-[48px]">
                                    Xuất báo cáo Excel về tình hình sử dụng thuốc hàng tháng.
                                </p>
                                <Link href="/dashboard/staff/reports">
                                    <Button variant="secondary" className="w-full justify-center bg-purple-600 hover:bg-purple-700">Xem Báo cáo</Button>
                                </Link>
                            </Card>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
