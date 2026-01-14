"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "./Button";

export function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl text-slate-900 tracking-tight">
                    HealthStation<span className="text-sky-500">Manager</span>
                </Link>

                <div className="flex items-center gap-4">
                    {session ? (
                        <>
                            <span className="text-sm text-slate-600 hidden sm:block">
                                {session.user?.name}
                            </span>
                            <Button variant="outline" onClick={() => signOut()} className="text-sm">
                                Sign Out
                            </Button>
                        </>
                    ) : (
                        <Button variant="primary" onClick={() => signIn("google")} className="text-sm">
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}
