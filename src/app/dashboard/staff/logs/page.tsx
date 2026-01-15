"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";

interface LogEntry {
    id: number;
    timestamp: string;
    email: string;
    action: string;
    details: string;
}

export default function LogsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        try {
            const res = await fetch("/api/logs", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const formatTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleString("vi-VN");
        } catch {
            return isoString;
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes("ADD")) return "text-green-600";
        if (action.includes("UPDATE")) return "text-blue-600";
        if (action.includes("APPROVE")) return "text-purple-600";
        return "text-gray-600";
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Nhật ký Hoạt động</h1>
                    <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
                </div>

                {loading ? (
                    <div>Đang tải dữ liệu...</div>
                ) : logs.length === 0 ? (
                    <Card className="p-8 text-center text-slate-500">
                        Chưa có hoạt động nào được ghi nhận.
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Thời gian</th>
                                        <th className="px-6 py-3">Người thực hiện</th>
                                        <th className="px-6 py-3">Hành động</th>
                                        <th className="px-6 py-3">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                {formatTime(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {log.email}
                                            </td>
                                            <td className={`px-6 py-4 font-semibold ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {log.details}
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
