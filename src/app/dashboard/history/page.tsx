"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import Link from "next/link";
// Utility import removed

interface Request {
    requestId: string;
    date: string;
    type: string;
    status: string;
    note: string;
}

export default function HistoryPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRequests() {
            try {
                const res = await fetch("/api/requests");
                if (res.ok) {
                    setRequests(await res.json());
                }
            } catch (e) {
                console.error("Failed to load requests", e);
            } finally {
                setLoading(false);
            }
        }
        fetchRequests();
    }, []);

    const getStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case "APPROVED": return "ĐÃ DUYỆT";
            case "REJECTED": return "TỪ CHỐI";
            case "PENDING": return "CHỜ XỬ LÝ";
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case "APPROVED": return "bg-green-100 text-green-800";
            case "REJECTED": return "bg-red-100 text-red-800";
            default: return "bg-yellow-100 text-yellow-800";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">Lịch sử yêu cầu</h1>
                    <Link href="/dashboard/request">
                        <Button>Tạo yêu cầu mới</Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center p-8">Đang tải dữ liệu...</div>
                ) : requests.length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-slate-500 mb-4">Chưa có yêu cầu nào.</p>
                        <Link href="/dashboard/request">
                            <Button variant="outline">Tạo yêu cầu đầu tiên</Button>
                        </Link>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã phiếu</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ghi chú</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {requests.map((req) => (
                                        <tr key={req.requestId} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {req.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                                                {req.requestId}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                                {req.note}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                                                    {getStatusText(req.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
}
