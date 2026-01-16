import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addSubscription } from "@/lib/sheets";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { subscription, userAgent } = await req.json();
        if (!subscription) {
            return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
        }

        await addSubscription(session.user.email, subscription, userAgent || "Unknown");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Subscribe error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
