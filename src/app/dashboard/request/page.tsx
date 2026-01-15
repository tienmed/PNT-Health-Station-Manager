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
    const [submitting, setSubmitting] = useState(false);
    const [note, setNote] = useState("");
    const [subjectGroup, setSubjectGroup] = useState("STUDENT"); // Default

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    note,
                    subjectGroup,
                }),
            });

            if (res.ok) {
                alert("Gửi yêu cầu thành công!");
                router.push("/dashboard/history");
            } else {
                const data = await res.json();
                alert(data.error || "Gửi yêu cầu thất bại.");
            }
        } catch (e) {
            console.error(e);
            alert("Đã xảy ra lỗi.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Báo cáo triệu chứng / Yêu cầu thuốc</h1>
                        <p className="text-slate-600">Mô tả tình trạng sức khỏe của bạn để nhân viên y tế cấp phát thuốc phù hợp.</p>
                    </div>
                    <Button variant="outline" onClick={() => router.back()}>Hủy bỏ</Button>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Subject Group Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Đối tượng <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 relative">
                                    <input
                                        type="radio"
                                        name="subjectGroup"
                                        value="STUDENT"
                                        checked={subjectGroup === "STUDENT"}
                                        onChange={(e) => setSubjectGroup(e.target.value)}
                                        className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Sinh viên / Học viên</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 relative">
                                    <input
                                        type="radio"
                                        name="subjectGroup"
                                        value="EMPLOYEE"
                                        checked={subjectGroup === "EMPLOYEE"}
                                        onChange={(e) => setSubjectGroup(e.target.value)}
                                        className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Cán bộ / Nhân viên</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Mô tả triệu chứng / Lý do <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 p-3 border h-32"
                                placeholder="Ví dụ: Tôi bị đau đầu và sốt nhẹ từ sáng nay..."
                                required
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                                {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}
