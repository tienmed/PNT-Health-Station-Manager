"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { FileDown, Calendar, Users, Pill } from "lucide-react";

export default function ReportsPage() {
    const router = useRouter();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [loading, setLoading] = useState(false);

    const handleDownload = async (type: "MEDICATIONS" | "USERS") => {
        setLoading(true);
        try {
            const response = await fetch(`/api/reports/monthly?month=${month}&year=${year}&type=${type}`);

            if (!response.ok) {
                const err = await response.json();
                alert(`Lỗi: ${err.error}`);
                return;
            }

            // Create blob link to download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `BaoCao_${type === "MEDICATIONS" ? "Thuoc" : "NguoiDung"}_T${month}_${year}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            console.error(e);
            alert("Có lỗi xảy ra khi tải báo cáo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Báo cáo Thống kê</h1>
                    <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <Card className="md:col-span-1">
                        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Thời gian báo cáo
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Tháng</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={month}
                                    onChange={(e) => setMonth(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>Tháng {m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Năm</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                >
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                    <option value={2027}>2027</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <div className="md:col-span-2 space-y-4">
                        <Card className="hover:border-blue-300 transition-colors border border-transparent">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <Pill className="text-blue-500" /> Báo cáo Sử dụng Thuốc
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Thống kê tổng số lượng từng loại thuốc đã được cấp phát trong tháng.
                                        Dùng để kiểm kê kho và dự trù thuốc.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => handleDownload("MEDICATIONS")}
                                    disabled={loading}
                                    className="min-w-[140px]"
                                >
                                    {loading ? "Đang tạo..." : <><FileDown className="w-4 h-4 mr-2" /> Tải Excel</>}
                                </Button>
                            </div>
                        </Card>

                        <Card className="hover:border-green-300 transition-colors border border-transparent">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <Users className="text-green-500" /> Báo cáo Người nhận
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Danh sách chi tiết từng lượt cấp phát: Ai nhận, lúc nào, thuốc gì và ghi chú / lời dặn.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => handleDownload("USERS")}
                                    disabled={loading}
                                    variant="outline"
                                    className="min-w-[140px] border-green-600 text-green-700 hover:bg-green-50"
                                >
                                    {loading ? "Đang tạo..." : <><FileDown className="w-4 h-4 mr-2" /> Tải Excel</>}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
