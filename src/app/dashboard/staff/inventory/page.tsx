"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, X } from "lucide-react";

interface Medication {
    id: string;
    name: string;
    unit: string;
    stock: number; // Total
    stockTanNhut: number;
    stockHoaHung: number;
    minThreshold: number;
}

export default function InventoryPage() {
    const router = useRouter();
    const [meds, setMeds] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State (Safe Update)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStocks, setEditStocks] = useState<{ tn: number; hh: number }>({ tn: 0, hh: 0 });

    // Transfer State
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferMed, setTransferMed] = useState<Medication | null>(null);
    const [transferValue, setTransferValue] = useState(0); // Value represents Qty in Tan Nhut

    // New Med State
    const [showAdd, setShowAdd] = useState(false);
    const [newMed, setNewMed] = useState({ name: "", unit: "pill", stockTanNhut: 0, stockHoaHung: 0, minThreshold: 10 });

    useEffect(() => {
        fetchMeds();
    }, []);

    async function fetchMeds() {
        try {
            const res = await fetch("/api/medications", { cache: "no-store" });
            if (res.ok) setMeds(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const startEdit = (med: Medication) => {
        setEditingId(med.id);
        setEditStocks({ tn: med.stockTanNhut, hh: med.stockHoaHung });
    };

    const saveStock = async (id: string, area: "TN" | "HH") => {
        try {
            const original = meds.find(m => m.id === id);
            if (!original) return;

            // Safe Stock Logic: Prevent Reduction
            const currentStock = area === "TN" ? original.stockTanNhut : original.stockHoaHung;
            const newStock = area === "TN" ? editStocks.tn : editStocks.hh;

            if (newStock < currentStock) {
                alert("KHÔNG ĐƯỢC PHÉP GIẢM KHO TỪ ĐÂY.\n\nHệ thống chỉ cho phép nhập thêm (tăng số lượng).\nĐể giảm kho, vui lòng dùng chức năng 'Điều chuyển' hoặc tạo Yêu cầu xuất kho.");
                return;
            }

            // Proceed
            const res = await fetch("/api/medications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    stock: newStock,
                    area: area === "TN" ? "TAN_NHUT" : "HOA_HUNG"
                }),
            });

            if (res.ok) {
                fetchMeds();
                setEditingId(null);
            } else {
                alert("Lỗi cập nhật");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update stock");
        }
    };

    const openTransferModal = (med: Medication) => {
        setTransferMed(med);
        setTransferValue(med.stockTanNhut); // Slider starts at current TN stock
        setTransferModalOpen(true);
    };

    const handleTransferSave = async () => {
        if (!transferMed) return;

        const currentTN = transferMed.stockTanNhut;
        // transferValue is the NEW target for TN.
        // Difference = Amount to move.
        // If transferValue > currentTN, we moved from HH to TN.
        // If transferValue < currentTN, we moved from TN to HH.

        const diff = transferValue - currentTN;

        if (diff === 0) {
            setTransferModalOpen(false);
            return;
        }

        const actionData = {
            id: transferMed.id,
            action: "TRANSFER",
            transferAmount: Math.abs(diff),
            from: diff < 0 ? "TAN_NHUT" : "HOA_HUNG",
            to: diff < 0 ? "HOA_HUNG" : "TAN_NHUT"
        };

        try {
            const res = await fetch("/api/medications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(actionData),
            });

            if (res.ok) {
                fetchMeds();
                setTransferModalOpen(false);
                alert("Điều chuyển thành công!");
            } else {
                const err = await res.json();
                alert(`Lỗi: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối");
        }
    };

    const addNewMed = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = `MED-${Date.now()}`;
        try {
            const res = await fetch("/api/medications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    name: newMed.name,
                    unit: newMed.unit,
                    stockTanNhut: newMed.stockTanNhut,
                    stockHoaHung: newMed.stockHoaHung,
                    minThreshold: newMed.minThreshold
                }),
            });
            if (res.ok) {
                fetchMeds();
                setShowAdd(false);
                setNewMed({ name: "", unit: "pill", stockTanNhut: 0, stockHoaHung: 0, minThreshold: 10 });
            }
        } catch (e) {
            console.error(e);
            alert("Failed to add medication");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Kho thuốc</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
                        <Button onClick={() => setShowAdd(!showAdd)}>+ Thêm thuốc</Button>
                    </div>
                </div>

                {showAdd && (
                    <Card className="mb-6 border-sky-100 bg-sky-50">
                        <h3 className="font-bold text-slate-800 mb-4">Thêm thuốc mới</h3>
                        <form onSubmit={addNewMed} className="flex gap-4 flex-wrap items-end">
                            <div className="w-1/4">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tên thuốc</label>
                                <input className="w-full p-2 rounded border" placeholder="Ví dụ: Paracetamol" required
                                    value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Đơn vị</label>
                                <select className="p-2 rounded border w-24"
                                    title="Chọn đơn vị"
                                    value={newMed.unit} onChange={e => setNewMed({ ...newMed, unit: e.target.value })}>
                                    <option value="pill">Viên</option>
                                    <option value="bottle">Chai</option>
                                    <option value="box">Hộp</option>
                                    <option value="tube">Tuýp</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-green-600 mb-1">Kho Tân Nhựt</label>
                                <input className="p-2 rounded border w-24" type="number" required placeholder="0"
                                    value={newMed.stockTanNhut} onChange={e => setNewMed({ ...newMed, stockTanNhut: parseInt(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-600 mb-1">Kho Hòa Hưng</label>
                                <input className="p-2 rounded border w-24" type="number" required placeholder="0"
                                    value={newMed.stockHoaHung} onChange={e => setNewMed({ ...newMed, stockHoaHung: parseInt(e.target.value) })} />
                            </div>
                            <Button type="submit">Lưu</Button>
                        </form>
                    </Card>
                )}

                <Card>
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tên thuốc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Đơn vị</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-green-700 uppercase bg-green-50">Kho Tân Nhựt</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-purple-700 uppercase bg-purple-50">Kho Hòa Hưng</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Tổng</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {meds.map((med) => (
                                <tr key={med.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{med.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{med.unit}</td>

                                    {/* Tân Nhựt */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-900 bg-green-50/30">
                                        {editingId === med.id ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <input type="number" className="w-16 p-1 border rounded text-center"
                                                    title="Sửa kho Tân Nhựt"
                                                    value={editStocks.tn} onChange={(e) => setEditStocks({ ...editStocks, tn: parseInt(e.target.value) })} />
                                                <button onClick={() => saveStock(med.id, "TN")} className="text-xs text-blue-600 hover:underline">Lưu</button>
                                            </div>
                                        ) : (
                                            <span className={med.stockTanNhut < med.minThreshold ? "text-red-600 font-bold" : ""}>{med.stockTanNhut}</span>
                                        )}
                                    </td>

                                    {/* Hòa Hưng */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-900 bg-purple-50/30">
                                        {editingId === med.id ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <input type="number" className="w-16 p-1 border rounded text-center"
                                                    title="Sửa kho Hòa Hưng"
                                                    value={editStocks.hh} onChange={(e) => setEditStocks({ ...editStocks, hh: parseInt(e.target.value) })} />
                                                <button onClick={() => saveStock(med.id, "HH")} className="text-xs text-blue-600 hover:underline">Lưu</button>
                                            </div>
                                        ) : (
                                            <span className={med.stockHoaHung < med.minThreshold ? "text-red-600 font-bold" : ""}>{med.stockHoaHung}</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-700">{med.stock}</td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => openTransferModal(med)}
                                                className="text-orange-600 hover:text-orange-800 flex items-center gap-1 text-xs border border-orange-200 px-2 py-1 rounded bg-orange-50"
                                                title="Điều chuyển kho"
                                            >
                                                <ArrowLeftRight className="w-3 h-3" /> Chuyển Kho
                                            </button>

                                            {editingId === med.id ? (
                                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 text-xs">Hủy Sửa</button>
                                            ) : (
                                                <button onClick={() => startEdit(med)} className="text-sky-600 hover:text-sky-900 text-xs">Cập nhật</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>

                {/* Transfer Modal */}
                {transferModalOpen && transferMed && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Điều chuyển: {transferMed.name}</h3>
                                <button onClick={() => setTransferModalOpen(false)} title="Đóng cửa sổ" aria-label="Đóng"><X className="w-5 h-5 text-slate-400" /></button>
                            </div>

                            <p className="text-sm text-slate-500 mb-6">
                                Kéo thanh trượt để điều chỉnh số lượng giữa hai kho. Tổng số lượng sẽ không đổi ({transferMed.stock} {transferMed.unit}).
                            </p>

                            <div className="flex justify-between items-center mb-2 px-2">
                                <div className="text-center">
                                    <span className="block font-bold text-green-600 text-xl">{transferValue}</span>
                                    <span className="text-xs text-slate-500">Tân Nhựt</span>
                                </div>
                                <div className="text-center">
                                    <span className="block font-bold text-purple-600 text-xl">{transferMed.stock - transferValue}</span>
                                    <span className="text-xs text-slate-500">Hòa Hưng</span>
                                </div>
                            </div>

                            <input
                                title="Thanh trượt điều chỉnh số lượng"
                                aria-label="Số lượng thuốc tại kho Tân Nhựt"
                                type="range"
                                min="0"
                                max={transferMed.stock}
                                value={transferValue}
                                onChange={(e) => setTransferValue(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-8"
                            />

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setTransferModalOpen(false)}>Hủy</Button>
                                <Button onClick={handleTransferSave}>Lưu Thay Đổi</Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
