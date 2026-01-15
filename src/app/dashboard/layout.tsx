import { ProfileGuard } from "@/components/ProfileGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ProfileGuard />
            {children}
        </>
    );
}
