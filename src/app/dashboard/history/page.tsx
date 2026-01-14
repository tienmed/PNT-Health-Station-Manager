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
                    <h1 className="text-2xl font-bold text-slate-900">Request History</h1>
                    <Link href="/dashboard/request">
                        <Button>New Request</Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center p-8">Loading history...</div>
                ) : requests.length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-slate-500 mb-4">No requests found.</p>
                        <Link href="/dashboard/request">
                            <Button variant="outline">Create your first request</Button>
                        </Link>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Note</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
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
                                                    {req.status}
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
