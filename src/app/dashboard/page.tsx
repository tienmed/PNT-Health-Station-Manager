"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function DashboardPage() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/");
        },
    });

    if (status === "loading") {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
    }

    const isStaff = session?.user?.role === "STAFF" || session?.user?.role === "ADMIN";

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome, {session?.user?.name}
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Role: <span className="font-semibold text-sky-600">{session?.user?.role || "EMPLOYEE"}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Employee Actions */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-sky-500">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Request Medication</h3>
                        <p className="text-slate-600 mb-6 min-h-[48px]">
                            Submit a new request for medication from the health station.
                        </p>
                        <Link href="/dashboard/request">
                            <Button className="w-full justify-center">Create Request</Button>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-sky-500">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">My History</h3>
                        <p className="text-slate-600 mb-6 min-h-[48px]">
                            View your past medication requests and their status.
                        </p>
                        <Link href="/dashboard/history">
                            <Button variant="outline" className="w-full justify-center">View History</Button>
                        </Link>
                    </Card>

                    {/* Staff Actions (Visible only to Staff) */}
                    {isStaff && (
                        <>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-green-500">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Requests</h3>
                                <p className="text-slate-600 mb-6 min-h-[48px]">
                                    Review and dispense pending medication requests.
                                </p>
                                <Link href="/dashboard/staff/requests">
                                    <Button variant="secondary" className="w-full justify-center bg-green-600 hover:bg-green-700">Go to Queue</Button>
                                </Link>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-green-500">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Stock</h3>
                                <p className="text-slate-600 mb-6 min-h-[48px]">
                                    Update inventory levels and add new medications.
                                </p>
                                <Link href="/dashboard/staff/inventory">
                                    <Button variant="secondary" className="w-full justify-center bg-green-600 hover:bg-green-700">Inventory</Button>
                                </Link>
                            </Card>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
