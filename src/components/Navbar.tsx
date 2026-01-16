// Copyright © 2026 TRINH TRUNG TIEN (bstien@pnt.edu.vn)
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "./Button";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationManager } from "./NotificationManager";
import Image from "next/image";

export function Navbar() {
    const { data: session } = useSession();
    const { unsubscribeFromPush } = useNotifications();

    const handleLogout = async () => {
        // Unsubscribe from push to prevent this device receiving notifications for this user
        await unsubscribeFromPush();
        // Sign out and clear session/cookies
        await signOut({ callbackUrl: "/", redirect: true });
    };

    return (
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Logos */}
                    <div className="flex items-center gap-2">
                        <img
                            src="/logoPNTU.jpg"
                            alt="Logo PNTU"
                            className="h-10 w-auto object-contain"
                        />
                        <img
                            src="/logo_pk_pntu-removebg-preview.png"
                            alt="Logo PK PNTU"
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                    <Link href="/" className="font-bold text-xl text-slate-900 tracking-tight hidden sm:block">
                        HealthStation<span className="text-sky-500">Manager</span>
                    </Link>
                </div>

                <div className="flex items-center gap-6">
                    {session && (
                        <div className="hidden md:flex gap-6 mr-4">
                            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-sky-600">
                                Bảng tin
                            </Link>
                            {(session.user.role === "STAFF" || session.user.role === "ADMIN") && (
                                <>
                                    <Link href="/dashboard/staff/requests" className="text-sm font-medium text-slate-600 hover:text-sky-600">
                                        Q.lý Yêu cầu
                                    </Link>
                                    <Link href="/dashboard/staff/inventory" className="text-sm font-medium text-slate-600 hover:text-sky-600">
                                        Kho thuốc
                                    </Link>
                                    <Link href="/dashboard/staff/reports" className="text-sm font-medium text-slate-600 hover:text-sky-600">
                                        Báo cáo
                                    </Link>
                                </>
                            )}
                            <Link href="/dashboard/profile" className="text-sm font-medium text-slate-600 hover:text-sky-600">
                                Hồ sơ cá nhân
                            </Link>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {session ? (
                            <>
                                <span className="text-sm text-slate-600 hidden sm:block">
                                    {session.user?.name}
                                </span>
                                <Button variant="outline" onClick={handleLogout} className="text-sm">
                                    Đăng xuất
                                </Button>
                            </>
                        ) : (
                            <Button variant="primary" onClick={() => signIn("google")} className="text-sm">
                                Đăng nhập
                            </Button>
                        )}
                        <NotificationManager />
                    </div>
                </div>
            </div>
        </nav>
    );
}
