"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Request {
    requestId: string;
    email: string;
    requesterName: string;
    items?: { medicationName: string; quantity: number }[]; // Display history
    date: string;
    status: string;
    note: string;
    subjectGroup?: string;
    staffNote?: string;
    processedAt?: string;
}

interface Medication {
    id: string;
    name: string;
    unit: string;
    stock: number;
    stockTanNhut: number;
    stockHoaHung: number;
    minThreshold: number;
}

interface DispenseItem {
    medicationId: string;
    quantity: number;
}

export default function StaffRequestsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<Request | null>(null);
    const [dispensingItems, setDispensingItems] = useState<DispenseItem[]>([{ medicationId: "", quantity: 1 }]);
    const [staffNote, setStaffNote] = useState("");
    const [distributionArea, setDistributionArea] = useState<"TAN_NHUT" | "HOA_HUNG" | "">("");

    const isAdmin = (session?.user as any)?.role === "ADMIN";

    useEffect(() => {
        Promise.all([fetchRequests(), fetchMedications()]).finally(() => setLoading(false));
    }, []);

    async function fetchRequests() {
        try {
            const res = await fetch("/api/requests", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                // API already handles expiration logic and basic staff filtering (hiding expired)
                // Admin might want to see all? Currently API hides EXPIRED for both Staff/Admin.
                setRequests(data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchMedications() {
        try {
            const res = await fetch("/api/medications", { cache: "no-store" });
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
        // If editing existing processed request (Admin only), maybe pre-fill?
        // For simplicity, we restart dispense flow, but maybe should show existing note?
        // Let's pre-fill StaffNote if exists
        setStaffNote(req.staffNote || "");
        setDistributionArea(""); // Reset area

        // Reset meds
        setDispensingItems([{ medicationId: medications[0]?.id || "", quantity: 1 }]);
        setIsModalOpen(true);
    };

    const handleDispenseSubmit = async () => {
        if (!selectedReq) return;

        // Filter out valid items
        const validItems = dispensingItems.filter(item => item.medicationId && item.quantity > 0);

        // Logic: No meds = REJECTED, Has meds = APPROVED
        const status = validItems.length > 0 ? "APPROVED" : "REJECTED";

        if (!staffNote.trim()) {
            alert("Vui lòng nhập ghi chú xử lý (bắt buộc).");
            return;
        }

        if (status === "APPROVED" && !distributionArea) {
            alert("Vui lòng chọn Khu vực xuất thuốc.");
            return;
        }

        // --- NEW STOCK VALIDATION LOGIC ---
        if (status === "APPROVED" && distributionArea) {
            for (const item of validItems) {
                const med = medications.find(m => m.id === item.medicationId);
                if (!med) continue;

                const currentStock = distributionArea === "TAN_NHUT" ? med.stockTanNhut : med.stockHoaHung;
                const minThreshold = med.minThreshold || 0;

                // 1. Check if requesting more than available
                if (item.quantity > currentStock) {
                    alert(`Không đủ thuốc "${med.name}" tại kho ${distributionArea === "TAN_NHUT" ? "Tân Nhựt" : "Hòa Hưng"}.\nHiện có: ${currentStock}, Yêu cầu: ${item.quantity}`);
                    return;
                }

                // 2. Check if stock falls below threshold (before or after? Prompt says "số tồn < số lượng cảnh báo sẽ không cho cấp")
                // Interpreting "số tồn" as current stock available. 
                // If Current Stock < Min Threshold, cannot dispense (preserve emergency stock?)
                // OR if (Current - Qty) < Min? 
                // Prompt: "số tồn < số lượng cảnh báo sẽ không cho cấp" -> "If stock < warning level, do not allow dispensing".
                // Let's enforce: If CurrentStock < MinThreshold, BLOCK.
                if (currentStock < minThreshold) {
                    alert(`Thuốc "${med.name}" tại kho ${distributionArea === "TAN_NHUT" ? "Tân Nhựt" : "Hòa Hưng"} đang dưới mức cảnh báo (${currentStock} < ${minThreshold}).\nKhông thể cấp phát.`);
                    return;
                }

                // Also could block if resulting stock < min? 
                // Strict reading: "If existing stock < warning, don't allow".
            }
        }
        // ----------------------------------

        const confirmMsg = status === "APPROVED"
            ? "Xác nhận DUYỆT và CẤP THUỐC cho yêu cầu này?"
            : "Bạn không trọn thuốc nào. Xác nhận TỪ CHỐI yêu cầu này?";

        if (!confirm(confirmMsg)) return;

        setProcessing(selectedReq.requestId);
        await updateRequestStatus(selectedReq.requestId, status, validItems, staffNote, distributionArea);
        setIsModalOpen(false);
        setProcessing(null);
    };

    const updateRequestStatus = async (requestId: string, status: "APPROVED" | "REJECTED", items: DispenseItem[], note: string, area: string) => {
        try {
            const res = await fetch("/api/requests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId,
                    status,
                    items,
                    staffNote: note,
                    distributionArea: area
                }),
            });

            if (res.ok) {
                alert(status === "APPROVED" ? "Đã duyệt thành công!" : "Đã từ chối yêu cầu.");
                fetchRequests(); // Reload
            } else {
                const data = await res.json();
                alert(data.error || "Đã xảy ra lỗi khi cập nhật.");
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
        // Try parsing ISO
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
        <div className="min-h-screen bg-slate-50 relative">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Yêu cầu</h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Xin chào, <span className="font-semibold">{session?.user?.name}</span>
                            <span className="mx-2">|</span>
                            Role: <span className={`font-mono font-bold ${(session?.user as any)?.role === "ADMIN" ? "text-red-600" : "text-blue-600"}`}>
                                {(session?.user as any)?.role || "Unknown"}
                            </span>
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.back()}>Quay lại Bảng tin</Button>
                </div>

                {loading ? (
                    <div>Đang tải dữ liệu...</div>
                ) : requests.length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-slate-500">
                            Không có yêu cầu nào.
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                            (Vui lòng thử Refresh hoặc Đăng xuất/Đăng nhập lại nếu thấy sai sót)
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((req) => (
                            <Card key={req.requestId} className="flex flex-col gap-4 border-l-4 border-l-transparent hover:border-l-sky-500 transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getStatusBadge(req.status)}
                                            <span className="text-xs font-mono text-slate-400">#{req.requestId}</span>
                                            {req.subjectGroup && (
                                                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-100">
                                                    {req.subjectGroup === "STUDENT" ? "Sinh viên/Học viên" : "Cán bộ/Nhân viên"}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {req.requesterName || req.email.split('@')[0]}
                                            </h3>
                                            <p className="text-sm text-gray-500">{req.email}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(req.date).toLocaleString('vi-VN')}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-md text-sm border border-slate-100">
                                            <span className="font-semibold text-slate-700">Lý do/Triệu chứng:</span>
                                            <p className="text-slate-600 mt-1">{req.note}</p>
                                        </div>

                                        {/* Process Info */}
                                        {(req.status === "APPROVED" || req.status === "REJECTED") && (
                                            <div className="bg-orange-50 p-3 rounded-md text-sm border border-orange-100 mt-2">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-orange-800">Kết quả xử lý:</span>
                                                    <span className="text-xs text-orange-600">{formatTime(req.processedAt)}</span>
                                                </div>
                                                <p className="text-slate-700 mt-1"><span className="font-medium">Ghi chú NV:</span> {req.staffNote}</p>

                                                {req.items && req.items.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-orange-200">
                                                        <p className="font-medium text-orange-800 mb-1">Thuốc đã cấp:</p>
                                                        <ul className="list-disc list-inside text-slate-700 ml-1">
                                                            {req.items.map((it, idx) => (
                                                                <li key={idx}>{it.medicationName} (x{it.quantity})</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-[150px]">
                                        {req.status === "PENDING" && (
                                            (req.email === session?.user?.email && !isAdmin) ? (
                                                <div className="text-xs text-red-500 text-center border border-red-200 bg-red-50 p-2 rounded">
                                                    Không thể tự duyệt
                                                </div>
                                            ) : (
                                                <Button
                                                    className="bg-sky-600 hover:bg-sky-700 text-white w-full"
                                                    onClick={() => openDispenseModal(req)}
                                                    disabled={!!processing}
                                                >
                                                    Xử lý
                                                </Button>
                                            )
                                        )}

                                        {isAdmin && req.status !== "PENDING" && req.status !== "EXPIRED" && (
                                            <Button
                                                variant="outline"
                                                className="w-full border-dashed"
                                                onClick={() => openDispenseModal(req)}
                                                disabled={!!processing}
                                            >
                                                Chỉnh sửa (Admin)
                                            </Button>
                                        )}
                                    </div>
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
                            <h2 className="text-xl font-bold text-gray-900">
                                {selectedReq.status === "PENDING" ? "Xử lý Yêu cầu" : "Điều chỉnh Yêu cầu (Admin)"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {selectedReq.email} - {selectedReq.subjectGroup === "STUDENT" ? "Sinh viên" : "Nhân viên"}
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Staff Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ghi chú xử lý <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full border rounded-lg p-3 h-24 focus:ring-sky-500 focus:border-sky-500"
                                    placeholder="Nhập ghi chú của nhân viên y tế..."
                                    value={staffNote}
                                    onChange={(e) => setStaffNote(e.target.value)}
                                />
                            </div>

                            {/* Meds */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Danh sách thuốc cấp phát</label>
                                    <span className="text-xs text-gray-500 italic">Để trống nếu muốn TỪ CHỐI</span>
                                </div>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                    {dispensingItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor={`med-select-${idx}`}>Tên thuốc</label>
                                                <select
                                                    id={`med-select-${idx}`}
                                                    className="w-full border rounded p-2 text-sm"
                                                    value={item.medicationId}
                                                    onChange={(e) => updateItem(idx, "medicationId", e.target.value)}
                                                    aria-label="Chọn tên thuốc"
                                                    title="Chọn tên thuốc"
                                                >
                                                    <option value="">-- Chọn thuốc --</option>
                                                    {medications.map(med => {
                                                        // Calc display stock based on selection
                                                        let displayStock = med.stock; // Default total
                                                        let stockLabel = "Tổng";
                                                        if (distributionArea === "TAN_NHUT") {
                                                            displayStock = med.stockTanNhut;
                                                            stockLabel = "TN";
                                                        } else if (distributionArea === "HOA_HUNG") {
                                                            displayStock = med.stockHoaHung;
                                                            stockLabel = "HH";
                                                        }

                                                        return (
                                                            <option key={med.id} value={med.id}>
                                                                {med.name} ({stockLabel}: {displayStock})
                                                            </option>
                                                        );
                                                    })}
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
                                                    aria-label="Nhập số lượng"
                                                    title="Nhập số lượng"
                                                    placeholder="1"
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => removeItemRow(idx)}
                                                className="mb-[1px] text-red-500 border-red-200"
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    ))}

                                    <Button variant="outline" onClick={addItemRow} className="w-full border-dashed bg-white">
                                        + Thêm thuốc
                                    </Button>
                                </div>
                            </div>

                            {/* Distribution Area */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Khu vực xuất thuốc <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="area" value="TAN_NHUT"
                                            checked={distributionArea === "TAN_NHUT"}
                                            onChange={() => setDistributionArea("TAN_NHUT")}
                                            className="w-4 h-4 text-sky-600" />
                                        <span className="text-sm">Trạm Tân Nhựt</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="area" value="HOA_HUNG"
                                            checked={distributionArea === "HOA_HUNG"}
                                            onChange={() => setDistributionArea("HOA_HUNG")}
                                            className="w-4 h-4 text-sky-600" />
                                        <span className="text-sm">Trạm Hòa Hưng</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
                            <Button
                                className={dispensingItems.filter(i => i.medicationId && i.quantity > 0).length > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white"}
                                onClick={handleDispenseSubmit}
                            >
                                {dispensingItems.filter(i => i.medicationId && i.quantity > 0).length > 0
                                    ? "Xác nhận & Cấp thuốc"
                                    : "Xác nhận TỪ CHỐI"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
