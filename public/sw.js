self.addEventListener('push', function (event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || 'Health Station';
        const options = {
            body: data.body || 'New notification',
            icon: '/icons/icon-192x192.png', // Ensure these exist or use default
            badge: '/icons/badge.png',        // Optional
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (e) {
        console.error('Push handling error:', e);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
