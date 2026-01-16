"use client";

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { FileDown, Calendar, Users, Pill, Search, Filter } from "lucide-react";

interface DispensedItem {
    id: string;
    requestId: string;
    medicationName: string;
    unit: string;
    quantity: number;
    requesterName: string;
    requesterEmail: string;
    area: string;
    date: string;
    timestamp: number;
}

export default function ReportsPage() {
    const router = useRouter();
    const now = new Date();
    // Export State
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [exportLoading, setExportLoading] = useState(false);

    // Table State
    const [dispensedItems, setDispensedItems] = useState<DispensedItem[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [areaFilter, setAreaFilter] = useState<"ALL" | "TAN_NHUT" | "HOA_HUNG">("ALL");
    const [timeGroup, setTimeGroup] = useState<"ALL" | "THIS_MONTH" | "THIS_WEEK">("ALL");

    useEffect(() => {
        fetchDispensedData();
    }, []);

    const fetchDispensedData = async () => {
        try {
            const res = await fetch("/api/reports/dispensed", { cache: "no-store" });
            if (res.ok) {
                setDispensedItems(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingData(false);
        }
    };

    // Filter Logic
    const filteredItems = useMemo(() => {
        return dispensedItems.filter(item => {
            // 1. Text Search (Med Name or User Name)
            const lowerTerm = searchTerm.toLowerCase();
            const matchesSearch = item.medicationName.toLowerCase().includes(lowerTerm) ||
                item.requesterName.toLowerCase().includes(lowerTerm);

            // 2. Area Filter
            const matchesArea = areaFilter === "ALL" || item.area === areaFilter;

            // 3. Time Group
            let matchesTime = true;
            const itemDate = new Date(item.date);
            const today = new Date();

            if (timeGroup === "THIS_MONTH") {
                matchesTime = itemDate.getMonth() === today.getMonth() &&
                    itemDate.getFullYear() === today.getFullYear();
            } else if (timeGroup === "THIS_WEEK") {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(today.getDate() - 7);
                matchesTime = itemDate >= oneWeekAgo;
            }

            return matchesSearch && matchesArea && matchesTime;
        });
    }, [dispensedItems, searchTerm, areaFilter, timeGroup]);

    const handleDownload = async (type: "MEDICATIONS" | "USERS") => {
        setExportLoading(true);
        try {
            const response = await fetch(`/api/reports/monthly?month=${month}&year=${year}&type=${type}`);

            if (!response.ok) {
                const err = await response.json();
                alert(`Lỗi: ${err.error}`);
                return;
            }

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
            setExportLoading(false);
        }
    };

    const formatArea = (area: string) => {
        if (area === "TAN_NHUT") return <span className="text-green-600 font-medium">Tân Nhựt</span>;
        if (area === "HOA_HUNG") return <span className="text-purple-600 font-medium">Hòa Hưng</span>;
        return <span className="text-gray-400">?</span>;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Báo cáo & Thống kê</h1>
                    <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
                </div>

                {/* Section 1: Detailed Dispensing Log */}
                <Card className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h3 className="font-bold text-slate-800 text-lg">Chi tiết Xuất kho</h3>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    placeholder="Tìm tên thuốc, người nhận..."
                                    className="pl-8 pr-4 py-2 border rounded-md text-sm w-full md:w-64"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Area Filter */}
                            <select
                                aria-label="Lọc theo kho"
                                className="border rounded-md px-3 py-2 text-sm"
                                value={areaFilter}
                                onChange={e => setAreaFilter(e.target.value as any)}
                            >
                                <option value="ALL">Tất cả kho</option>
                                <option value="TAN_NHUT">Kho Tân Nhựt</option>
                                <option value="HOA_HUNG">Kho Hòa Hưng</option>
                            </select>

                            {/* Time Group */}
                            <select
                                aria-label="Lọc theo thời gian"
                                className="border rounded-md px-3 py-2 text-sm"
                                value={timeGroup}
                                onChange={e => setTimeGroup(e.target.value as any)}
                            >
                                <option value="ALL">Tất cả thời gian</option>
                                <option value="THIS_WEEK">7 ngày qua</option>
                                <option value="THIS_MONTH">Tháng này</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tên thuốc</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SL</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kho xuất</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Người nhận</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {loadingData ? (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">Đang tải dữ liệu...</td></tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">Không tìm thấy dữ liệu phù hợp</td></tr>
                                ) : (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(item.date).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {item.medicationName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {item.quantity} {item.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {formatArea(item.area)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.requesterName}</span>
                                                    <span className="text-xs text-slate-400">{item.requesterEmail}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Section 2: Excel Export (Existing) */}
                <h3 className="font-bold text-slate-800 text-lg mb-4">Xuất Báo cáo Excel</h3>
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <Card className="md:col-span-1 border-t-4 border-t-slate-400">
                        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Chọn Thời gian
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Tháng</label>
                                <select
                                    aria-label="Chọn tháng"
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
                                    aria-label="Chọn năm"
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
                        <Card className="hover:border-blue-300 transition-colors border border-transparent border-t-4 border-t-blue-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <Pill className="text-blue-500" /> Báo cáo Sử dụng Thuốc
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Thống kê tổng số lượng từng loại thuốc đã được cấp phát.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => handleDownload("MEDICATIONS")}
                                    disabled={exportLoading}
                                    className="min-w-[140px]"
                                >
                                    {exportLoading ? "Đang tạo..." : <><FileDown className="w-4 h-4 mr-2" /> Tải Excel</>}
                                </Button>
                            </div>
                        </Card>

                        <Card className="hover:border-green-300 transition-colors border border-transparent border-t-4 border-t-green-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <Users className="text-green-500" /> Báo cáo Người nhận
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Danh sách chi tiết từng lượt cấp phát theo người nhận.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => handleDownload("USERS")}
                                    disabled={exportLoading}
                                    variant="outline"
                                    className="min-w-[140px] border-green-600 text-green-700 hover:bg-green-50"
                                >
                                    {exportLoading ? "Đang tạo..." : <><FileDown className="w-4 h-4 mr-2" /> Tải Excel</>}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
