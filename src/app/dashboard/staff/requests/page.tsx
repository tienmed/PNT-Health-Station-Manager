"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";

interface Request {
    requestId: string;
    email: string;
    items?: { medicationName: string; quantity: number }[]; // Display history
    date: string;
    status: string;
    note: string;
}

interface Medication {
    id: string;
    name: string;
    unit: string;
    stock: number;
}

interface DispenseItem {
    medicationId: string;
    quantity: number;
}

export default function StaffRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<Request | null>(null);
    const [dispensingItems, setDispensingItems] = useState<DispenseItem[]>([{ medicationId: "", quantity: 1 }]);

    useEffect(() => {
        Promise.all([fetchRequests(), fetchMedications()]).finally(() => setLoading(false));
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
        }
    }

    async function fetchMedications() {
        try {
            const res = await fetch("/api/medications");
            if (res.ok) {
                const data = await res.json();
                setMedications(data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    const openDispenseModal = (req: Request) => {
        setSelectedReq(req);
        // Default to first med if available
        setDispensingItems([{ medicationId: medications[0]?.id || "", quantity: 1 }]);
        setIsModalOpen(true);
    };

    const handleReject = async (req: Request) => {
        if (!confirm("Bạn có chắc chắn muốn TỪ CHỐI yêu cầu này không?")) return;
        setProcessing(req.requestId);
        await updateRequestStatus(req.requestId, "REJECTED", []);
        setProcessing(null);
    };

    const handleDispenseSubmit = async () => {
        if (!selectedReq) return;

        // Filter out invalid rows
        const validItems = dispensingItems.filter(item => item.medicationId && item.quantity > 0);

        if (validItems.length === 0) {
            alert("Vui lòng chọn ít nhất một loại thuốc để cấp phát.");
            return;
        }

        setProcessing(selectedReq.requestId);
        await updateRequestStatus(selectedReq.requestId, "APPROVED", validItems);
        setIsModalOpen(false);
        setProcessing(null);
    };

    const updateRequestStatus = async (requestId: string, status: "APPROVED" | "REJECTED", items: DispenseItem[]) => {
        try {
            const res = await fetch("/api/requests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId,
                    status,
                    items,
                }),
            });

            if (res.ok) {
                alert(status === "APPROVED" ? "Đã duyệt và cấp phát thuốc!" : "Đã từ chối yêu cầu.");
                fetchRequests(); // Reload
            } else {
                alert("Đã xảy ra lỗi khi cập nhật.");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối.");
        }
    };

    // Helper to manage dynamic rows in modal
    const updateItem = (index: number, field: keyof DispenseItem, value: string | number) => {
        const newItems = [...dispensingItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setDispensingItems(newItems);
    };

    const addItemRow = () => {
        setDispensingItems([...dispensingItems, { medicationId: medications[0]?.id || "", quantity: 1 }]);
    };

    const removeItemRow = (index: number) => {
        setDispensingItems(dispensingItems.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-slate-50 relative">
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
                                    <div className="mb-2">
                                        <p className="text-sm text-slate-500">Yêu cầu bởi <span className="font-semibold text-slate-900">{req.email}</span> • {req.date}</p>
                                    </div>
                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                        <p className="font-medium text-yellow-900">Triệu chứng/Ghi chú:</p>
                                        <p className="text-slate-800 italic">"{req.note}"</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => handleReject(req)}
                                        disabled={!!processing}
                                    >
                                        Từ chối
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => openDispenseModal(req)}
                                        disabled={!!processing}
                                    >
                                        {processing === req.requestId ? "Đang xử lý..." : "Duyệt & Cấp thuốc"}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Dispense Modal */}
            {isModalOpen && selectedReq && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Cấp phát thuốc</h2>
                            <p className="text-sm text-gray-500 mt-1">Cho yêu cầu của: {selectedReq.email}</p>
                            <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                                <span className="font-semibold">Triệu chứng:</span> {selectedReq.note}
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {dispensingItems.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor={`med-select-${idx}`}>Tên thuốc</label>
                                        <select
                                            id={`med-select-${idx}`}
                                            className="w-full border rounded p-2 text-sm"
                                            value={item.medicationId}
                                            onChange={(e) => updateItem(idx, "medicationId", e.target.value)}
                                            aria-label="Chọn thuốc"
                                        >
                                            <option value="">-- Chọn thuốc --</option>
                                            {medications.map(med => (
                                                <option key={med.id} value={med.id}>
                                                    {med.name} (Kho: {med.stock} {med.unit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor={`qty-input-${idx}`}>Số lượng</label>
                                        <input
                                            id={`qty-input-${idx}`}
                                            type="number"
                                            min="1"
                                            className="w-full border rounded p-2 text-sm"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value))}
                                            aria-label="Số lượng thuốc"
                                            title="Số lượng thuốc"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => removeItemRow(idx)}
                                        className="mb-[1px] text-red-500 border-red-200"
                                        disabled={dispensingItems.length === 1}
                                    >
                                        Xóa
                                    </Button>
                                </div>
                            ))}

                            <Button variant="outline" onClick={addItemRow} className="w-full border-dashed">
                                + Thêm loại thuốc khác
                            </Button>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
                            <Button className="bg-blue-600 text-white" onClick={handleDispenseSubmit}>Xác nhận cấp phát</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
