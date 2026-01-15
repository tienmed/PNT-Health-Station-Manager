import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, updateUser } from "@/lib/sheets";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, phone, unit } = body;

        // Validation: Require Name, Phone, Unit
        if (!name || !phone || !unit) {
            return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin: Họ tên, Số điện thoại, Đơn vị/Lớp." }, { status: 400 });
        }

        // Get current role to preserve it
        const currentUser = await getUserByEmail(session.user.email);
        const role = currentUser?.role || "EMPLOYEE";

        await updateUser(session.user.email, name, role, phone, unit);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
