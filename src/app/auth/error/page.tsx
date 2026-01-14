"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-6">
                    <svg
                        className="mx-auto h-16 w-16 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Truy cập bị từ chối
                </h1>

                <p className="text-gray-600 mb-8">
                    Bạn không phải là nhân viên/sinh viên trường (không sử dụng email <span className="font-mono font-bold text-gray-800">@pnt.edu.vn</span> để đăng nhập).
                    <br /><br />
                    Vui lòng sử dụng email của trường để tiếp tục.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/api/auth/signin"
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                        Đăng nhập lại
                    </Link>

                    <Link
                        href="/"
                        className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded transition-colors"
                    >
                        Về trang chủ
                    </Link>
                </div>

                {error && (
                    <div className="mt-8 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">Mã lỗi: {error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
