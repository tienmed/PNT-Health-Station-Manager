"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";

export function ProfileGuard() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        unit: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (session?.user) {
            checkProfile();
        } else {
            setIsLoading(false);
        }
    }, [session]);

    async function checkProfile() {
        try {
            const res = await fetch("/api/profile", { cache: "no-store" });
            if (res.ok) {
                const user = await res.json();
                // Check if missing fields
                if (!user.name || !user.phone || !user.unit) {
                    setFormData({
                        name: user.name || (session?.user?.name || ""),
                        phone: user.phone || "",
                        unit: user.unit || ""
                    });
                    setShowModal(true);
                }
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
                setShowModal(false);
                alert("Cập nhật thông tin thành công!");
                // Optionally reload to reflect changes globally if needed
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

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in relative">
                {/* Prevent closing */}
                <h2 className="text-xl font-bold text-slate-900 mb-2">Cập nhật thông tin bắt buộc</h2>
                <p className="text-sm text-slate-600 mb-6">
                    Vui lòng bổ sung đầy đủ thông tin cá nhân để tiếp tục sử dụng hệ thống.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Họ và Tên <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="w-full border rounded-lg p-3 focus:border-sky-500 focus:ring-sky-500"
                            placeholder="Nguyễn Văn A"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="w-full border rounded-lg p-3 focus:border-sky-500 focus:ring-sky-500"
                            placeholder="09xxx"
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>

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
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang lưu..." : "Lưu thông tin"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
