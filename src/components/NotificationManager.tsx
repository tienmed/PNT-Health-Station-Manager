"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/Button";
import { Bell, BellOff } from "lucide-react";

export function NotificationManager() {
    const { isSupported, subscription, subscribeToPush } = useNotifications();

    if (!isSupported) return null;

    if (subscription) {
        return null; // Already subscribed, hide button
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={subscribeToPush}
            className="flex items-center gap-2 text-slate-600 border-slate-300 hover:bg-sky-50"
            title="Bật thông báo"
        >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Bật thông báo</span>
        </Button>
    );
}
