"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

export default function TestAuthPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runTest = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/test-auth");
            const data = await res.json();
            setResult(data);
        } catch (e: any) {
            setResult({ error: e.toString() });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Vercel Environment Debugger</h1>
            <p className="mb-4 text-gray-600">
                Click the button below to test the Server-Side Google Auth configuration.
            </p>

            <Button onClick={runTest} disabled={loading}>
                {loading ? "Testing..." : "Run Auth Test"}
            </Button>

            {result && (
                <div className="mt-6 p-4 bg-gray-100 rounded border overflow-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
