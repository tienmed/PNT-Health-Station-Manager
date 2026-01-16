"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function useNotifications() {
    const { data: session } = useSession();
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');

            // Check existing sub
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                setSubscription(sub);
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    async function subscribeToPush() {
        if (!isSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidKey) {
                console.error("Missing VAPID Key");
                return;
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            setSubscription(sub);

            // Send to server
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub,
                    userAgent: navigator.userAgent
                })
            });

            alert("Đã bật thông báo thành công!");
        } catch (error: any) {
            console.error("Subscription failed:", error);

            let msg = "Không thể bật thông báo.";
            if (error.name === "NotAllowedError" || error.message.includes("Permission denied")) {
                msg += "\nLý do: Bạn đã CHẶN quyền thông báo. Vui lòng bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ -> Reset permission.";
            } else if (error.message.includes("VAPID")) {
                msg += "\nLý do: Lỗi VAPID Key (Server config).";
            } else {
                msg += `\nLỗi: ${error.message || error}`;
            }

            alert(msg);
        }
    }

    async function unsubscribeFromPush() {
        if (!isSupported || !subscription) return;

        try {
            await subscription.unsubscribe();
            setSubscription(null);
        } catch (error) {
            console.error("Error unsubscribing", error);
        }
    }

    return { isSupported, subscription, subscribeToPush, unsubscribeFromPush };
}
