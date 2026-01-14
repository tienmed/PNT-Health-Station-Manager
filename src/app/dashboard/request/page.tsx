"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";

interface Medication {
    id: string;
    name: string;
    unit: string;
    stock: number;
}

export default function RequestPage() {
    const router = useRouter();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedMed, setSelectedMed] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");

    useEffect(() => {
        async function fetchMeds() {
            try {
                const res = await fetch("/api/medications");
                if (res.ok) {
                    const data = await res.json();
                    setMedications(data);
                    if (data.length > 0) setSelectedMed(data[0].id);
                }
            } catch (e) {
                console.error("Failed to load medications", e);
            } finally {
                setLoading(false);
            }
        }
        fetchMeds();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medicationId: selectedMed,
                    quantity,
                    note,
                }),
            });

            if (res.ok) {
                alert("Gửi yêu cầu thành công!");
                router.push("/dashboard/history");
            } else {
                alert("Gửi yêu cầu thất bại.");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">Yêu cầu cấp phát thuốc</h1>
                    <Button variant="outline" onClick={() => router.back()}>Hủy bỏ</Button>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Chọn loại thuốc
                            </label>
                            <select
                                value={selectedMed}
                                onChange={(e) => setSelectedMed(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 p-2 border"
                                required
                                aria-label="Chọn loại thuốc"
                            >
                                {medications.map((med) => (
                                    <option key={med.id} value={med.id}>
                                        {med.name} (Tồn kho: {med.stock} {med.unit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Số lượng
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 p-2 border"
                                required
                                placeholder="Nhập số lượng"
                                aria-label="Số lượng"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Lý do / Ghi chú
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 p-2 border h-24"
                                placeholder="Ví dụ: Đau đầu, Sốt..."
                                required
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}
