"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        unit: ""
    });

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    async function fetchProfile() {
        try {
            const res = await fetch("/api/profile", { cache: "no-store" });
            if (res.ok) {
                const user = await res.json();
                setFormData({
                    name: user.name || (session?.user?.name || ""),
                    phone: user.phone || "",
                    unit: user.unit || ""
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await update({ ...formData });
                alert("Cập nhật thành công!");
                // router.refresh(); // No longer needed as session update handles it
            } else {
                const data = await res.json();
                alert(data.error || "Có lỗi xảy ra.");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Thông tin cá nhân</h1>
                    <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">
                                Email
                            </label>
                            <input
                                className="w-full border rounded-lg p-3 bg-slate-100 text-slate-500 cursor-not-allowed"
                                value={session?.user?.email || ""}
                                disabled
                                title="Email (Read-only)"
                            />
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Họ và Tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="w-full border rounded-lg p-3 focus:border-sky-500 focus:ring-sky-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                title="Họ và Tên"
                                placeholder="Nhập họ tên"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="w-full border rounded-lg p-3 focus:border-sky-500 focus:ring-sky-500"
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                required
                                title="Số điện thoại"
                                placeholder="Nhập SĐT"
                            />
                        </div>

                        {/* Unit/Class */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Lớp / Đơn vị <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="w-full border rounded-lg p-3 focus:border-sky-500 focus:ring-sky-500"
                                placeholder="VD: CNTT K16 hoặc Phòng CTSV"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                required
                                title="Đơn vị / Lớp"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.back()}>
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Đang lưu..." : "Cập nhật thay đổi"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}
