"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";

interface Medication {
    id: string;
    name: string;
    unit: string;
    stock: number;
}

export default function InventoryPage() {
    const router = useRouter();
    const [meds, setMeds] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStock, setEditStock] = useState<number>(0);

    // New Med State
    const [showAdd, setShowAdd] = useState(false);
    const [newMed, setNewMed] = useState({ name: "", unit: "pill", stock: 0 });

    useEffect(() => {
        fetchMeds();
    }, []);

    async function fetchMeds() {
        try {
            const res = await fetch("/api/medications");
            if (res.ok) setMeds(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const startEdit = (med: Medication) => {
        setEditingId(med.id);
        setEditStock(med.stock);
    };

    const saveStock = async (id: string) => {
        try {
            const res = await fetch("/api/medications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, stock: editStock }),
            });
            if (res.ok) {
                fetchMeds();
                setEditingId(null);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update stock");
        }
    };

    const addNewMed = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = `MED-${Date.now()}`; // Simple ID gen
        try {
            const res = await fetch("/api/medications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    name: newMed.name,
                    unit: newMed.unit,
                    stock: newMed.stock
                }),
            });
            if (res.ok) {
                fetchMeds();
                setShowAdd(false);
                setNewMed({ name: "", unit: "pill", stock: 0 });
            }
        } catch (e) {
            console.error(e);
            alert("Failed to add medication");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>Back</Button>
                        <Button onClick={() => setShowAdd(!showAdd)}>+ Add Medication</Button>
                    </div>
                </div>

                {showAdd && (
                    <Card className="mb-6 border-sky-100 bg-sky-50">
                        <h3 className="font-bold text-slate-800 mb-4">Add New Medication</h3>
                        <form onSubmit={addNewMed} className="flex gap-4 flex-wrap items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                                <input className="p-2 rounded border" placeholder="e.g. Paracetamol" required
                                    value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Unit</label>
                                <select className="p-2 rounded border w-32"
                                    value={newMed.unit} onChange={e => setNewMed({ ...newMed, unit: e.target.value })}>
                                    <option value="pill">Pill</option>
                                    <option value="bottle">Bottle</option>
                                    <option value="box">Box</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Initial Stock</label>
                                <input className="p-2 rounded border w-24" type="number" required
                                    value={newMed.stock} onChange={e => setNewMed({ ...newMed, stock: parseInt(e.target.value) })} />
                            </div>
                            <Button type="submit">Save</Button>
                        </form>
                    </Card>
                )}

                <Card>
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Medication</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock Level</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {meds.map((med) => (
                                <tr key={med.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{med.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{med.unit}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {editingId === med.id ? (
                                            <input
                                                type="number"
                                                className="w-20 p-1 border rounded"
                                                value={editStock}
                                                onChange={(e) => setEditStock(parseInt(e.target.value))}
                                            />
                                        ) : (
                                            <span className={med.stock < 10 ? "text-red-600 font-bold" : ""}>{med.stock}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingId === med.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => saveStock(med.id)} className="text-green-600 hover:text-green-900">Save</button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEdit(med)} className="text-sky-600 hover:text-sky-900">Update Stock</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </main>
        </div>
    );
}
