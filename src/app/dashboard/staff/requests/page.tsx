"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";

interface Request {
    requestId: string;
    email: string;
    medicationName: string;
    quantity: number;
    medicationId: string;
    date: string;
    status: string;
    note: string;
}

export default function StaffRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        try {
            const res = await fetch("/api/requests");
            if (res.ok) {
                const data = await res.json();
                const pending = data.filter((r: Request) => r.status === "PENDING");
                setRequests(pending);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (req: Request, status: "APPROVED" | "REJECTED") => {
        const action = status === "APPROVED" ? "DUYỆT" : "TỪ CHỐI";
        if (!confirm(`Bạn có chắc chắn muốn ${action} yêu cầu này không?`)) return;
        setProcessing(req.requestId);

        try {
            const res = await fetch("/api/requests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId: req.requestId,
                    status,
                    medicationId: req.medicationId,
                    quantity: req.quantity
                }),
            });

            if (res.ok) {
                alert(`Yêu cầu đã được: ${action}`);
                fetchRequests(); // Reload list
            } else {
                alert("Cập nhật yêu cầu thất bại");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Hàng đợi yêu cầu chờ xử lý</h1>
                    <Button variant="outline" onClick={() => router.back()}>Quay lại Bảng tin</Button>
                </div>

                {loading ? (
                    <div>Đang tải...</div>
                ) : requests.length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-slate-500">Không có yêu cầu nào đang chờ.</p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((req) => (
                            <Card key={req.requestId} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-900">{req.medicationName}</span>
                                        <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">x{req.quantity}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Yêu cầu bởi: <span className="font-semibold">{req.email}</span> lúc {req.date}
                                    </p>
                                    {req.note && <p className="text-sm text-slate-500 italic mt-1">Ghi chú: "{req.note}"</p>}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => handleStatusUpdate(req, "REJECTED")}
                                        disabled={!!processing}
                                    >
                                        Từ chối
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleStatusUpdate(req, "APPROVED")}
                                        disabled={!!processing}
                                    >
                                        {processing === req.requestId ? "Đang xử lý..." : "Duyệt & Cấp phát"}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
