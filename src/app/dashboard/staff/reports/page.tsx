"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ReportEntry = {
    date: string;
    medicationName: string;
    quantity: number;
    note: string;
};

type EmployeeReport = {
    email: string;
    totalItems: number;
    details: ReportEntry[];
};

export default function MonthlyReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [month, setMonth] = useState(
        new Date().toISOString().slice(0, 7) // Current YYYY-MM
    );
    const [reports, setReports] = useState<EmployeeReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/api/auth/signin");
            return;
        }

        if (session?.user && (session.user as any).role === "EMPLOYEE") {
            router.push("/dashboard");
        }
    }, [session, status, router]);

    useEffect(() => {
        if (!month) return;

        const fetchReports = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/reports/monthly?month=${month}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch reports");
                }
                const data = await res.json();
                setReports(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [month]);

    const toggleExpand = (email: string) => {
        setExpandedEmail(expandedEmail === email ? null : email);
    };

    if (status === "loading") {
        return <p className="p-8 text-center">Loading...</p>;
    }

    if (!session || (session.user as any).role === "EMPLOYEE") {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Báo cáo Cấp phát thuốc Hàng tháng</h1>

            <div className="mb-8 flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                <label className="font-semibold text-gray-700">Chọn tháng:</label>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {loading && <p className="text-center text-gray-500">Đang tạo báo cáo...</p>}
            {error && <p className="text-center text-red-500 bg-red-50 p-3 rounded">{error}</p>}

            {!loading && !error && reports.length === 0 && (
                <div className="text-center text-gray-500 bg-white p-8 rounded-lg border border-dashed border-gray-300">
                    Không tìm thấy yêu cầu nào được duyệt trong tháng này.
                </div>
            )}

            {!loading && !error && reports.length > 0 && (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report.email} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                            <div
                                onClick={() => toggleExpand(report.email)}
                                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">{report.email}</h3>
                                    <p className="text-sm text-gray-500">{report.details.length} giao dịch</p>
                                </div>
                                <div className="mt-2 md:mt-0 flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-600">Tổng số lượng</div>
                                        <div className="text-xl font-bold text-blue-600">{report.totalItems}</div>
                                    </div>
                                    <div className="text-gray-400">
                                        {expandedEmail === report.email ? "▼" : "▶"}
                                    </div>
                                </div>
                            </div>

                            {expandedEmail === report.email && (
                                <div className="bg-gray-50 border-t border-gray-100 p-4">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2">Ngày</th>
                                                <th className="px-4 py-2">Tên thuốc</th>
                                                <th className="px-4 py-2 text-center">Số lượng</th>
                                                <th className="px-4 py-2">Ghi chú</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.details.map((detail, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-600">{detail.date}</td>
                                                    <td className="px-4 py-2 font-medium text-gray-800">{detail.medicationName}</td>
                                                    <td className="px-4 py-2 text-center font-bold text-blue-600">{detail.quantity}</td>
                                                    <td className="px-4 py-2 text-gray-500 italic">{detail.note}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
