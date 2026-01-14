"use client";

import { useSession, signIn } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
            Health Station <span className="text-sky-500">Management</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Manage medication requests, dispensing, and stock levels efficiently.
            Designed for PNT University personnel.
          </p>
        </div>

        {!session ? (
          <div className="flex justify-center">
            <Card className="max-w-md w-full text-center py-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome Back</h2>
              <p className="text-slate-600 mb-8">
                Please sign in with your <span className="font-semibold">@pnt.edu.vn</span> account to continue.
              </p>
              <Button onClick={() => signIn("google")} className="w-full justify-center">
                Sign in with Google
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Request Medication</h3>
              <p className="text-slate-600 mb-4">Submit a new request for medication dispensing.</p>
              <Link href="/dashboard/request">
                <Button variant="outline" className="w-full justify-center">Create Request</Button>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-800 mb-2">My History</h3>
              <p className="text-slate-600 mb-4">View your past medication requests and status.</p>
              <Link href="/dashboard/history">
                <Button variant="outline" className="w-full justify-center">View History</Button>
              </Link>
            </Card>

            {/* TODO: Add Staff/Admin cards conditionally */}
          </div>
        )}
      </main>
    </div>
  );
}
