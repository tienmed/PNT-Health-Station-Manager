"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Request {
    requestId: string;
    date: string;
    type: string;
    status: string;
    note: string;
    items?: { medicationName: string; quantity: number }[];
    staffNote?: string;
    processedAt?: string;
    subjectGroup?: string;
}

export default function HistoryPage() {
    const { data: session } = useSession();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRequests() {
            try {
                const res = await fetch("/api/requests", { cache: "no-store" });
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200">Chờ xử lý</span>;
            case "APPROVED":
                return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200">Đã cấp phát</span>;
            case "REJECTED":
                return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-red-200">Đã từ chối</span>;
            case "EXPIRED":
                return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-gray-200">Không tới trạm</span>;
            default:
                return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">{status}</span>;
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return "";
        try {
            return new Date(isoString).toLocaleString("vi-VN", {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lịch sử Yêu cầu</h1>
                        <p className="text-sm text-slate-500 mt-1">{session?.user?.email}</p>
                    </div>
                    <Link href="/dashboard/request">
                        <Button className="bg-sky-600 hover:bg-sky-700">Tạo yêu cầu mới</Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center p-8 text-slate-500">Đang tải dữ liệu...</div>
                ) : requests.length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-slate-500 mb-4">Bạn chưa gửi yêu cầu nào.</p>
                        <Link href="/dashboard/request">
                            <Button variant="outline">Gửi yêu cầu đầu tiên</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map((req) => (
                            <Card key={req.requestId} className="border-l-4 border-l-transparent hover:border-l-sky-500 transition-all">
                                <div className="flex flex-col gap-4">
                                    {/* Header: ID, Status, Time */}
                                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(req.status)}
                                            <span className="text-xs font-mono text-slate-400">#{req.requestId}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 text-right">
                                            <p>Gửi lúc: <span className="font-medium text-slate-700">{formatTime(req.date)}</span></p>
                                        </div>
                                    </div>

                                    {/* Body: Reason */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Lý do / Triệu chứng</p>
                                        <p className="text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                                            {req.note || "Không có ghi chú"}
                                        </p>
                                    </div>

                                    {/* Footer: Result & Details based on Status */}
                                    {(req.status === "APPROVED" || req.status === "REJECTED" || req.status === "EXPIRED") && (
                                        <div className={`p-3 rounded-md text-sm border mt-1 
                                            ${req.status === "APPROVED" ? "bg-green-50 border-green-100" :
                                                req.status === "REJECTED" ? "bg-red-50 border-red-100" :
                                                    "bg-gray-100 border-gray-200"}`}>

                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`font-bold ${req.status === "APPROVED" ? "text-green-800" :
                                                    req.status === "REJECTED" ? "text-red-800" : "text-gray-700"
                                                    }`}>
                                                    {req.status === "APPROVED" ? "KẾT QUẢ: ĐÃ CẤP THUỐC" :
                                                        req.status === "REJECTED" ? "KẾT QUẢ: TỪ CHỐI" : "KẾT QUẢ: HỦY YÊU CẦU"}
                                                </span>
                                                {req.processedAt && (
                                                    <span className="text-xs opacity-75">
                                                        Xử lý: {formatTime(req.processedAt)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Staff Note / Reason */}
                                            {req.staffNote && (
                                                <div className="mb-2">
                                                    <span className="font-semibold text-xs opacity-80 uppercase block">Lời dặn / Lý do:</span>
                                                    <p className="mt-1">{req.staffNote}</p>
                                                </div>
                                            )}

                                            {/* Logic for EXPIRED if no note */}
                                            {req.status === "EXPIRED" && !req.staffNote && (
                                                <div className="mb-2">
                                                    <span className="font-semibold text-xs opacity-80 uppercase block">Lý do:</span>
                                                    <p className="mt-1">Yêu cầu quá hạn 24 giờ và người yêu cầu không đến trạm y tế.</p>
                                                </div>
                                            )}

                                            {/* Dispensed Items (Only APPROVED) */}
                                            {req.status === "APPROVED" && req.items && req.items.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-black/5">
                                                    <span className="font-semibold text-xs opacity-80 uppercase block mb-1">Thuốc đã cấp:</span>
                                                    <ul className="list-disc list-inside ml-1 space-y-0.5">
                                                        {req.items.map((it, idx) => (
                                                            <li key={idx}>
                                                                <span className="font-medium">{it.medicationName}</span>
                                                                <span className="text-green-700 mx-1 font-bold">x {it.quantity}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
