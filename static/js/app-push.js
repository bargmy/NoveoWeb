class PushNotificationManager {
    static translate(key, fallback, replacements = {}) {
        const translator = globalThis.__noveoTranslate;
        if (typeof translator === 'function') return translator(key, fallback, replacements);
        let value = String(fallback ?? '');
        Object.entries(replacements || {}).forEach(([token, replacement]) => {
            value = value.replaceAll(`{${token}}`, String(replacement ?? ''));
        });
        return value;
    }

    static getServerUrl(path = '') {
        const base = String(globalThis.__noveoServerUrl || 'https://noveo.ir:8443').replace(/\/+$/, '');
        if (!path) return base;
        return `${base}${path.startsWith('/') ? path : `/${path}`}`;
    }

    static getPermissionState() {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    }

    static supportsWebPush() {
        return Boolean(
            'serviceWorker' in navigator
            && 'Notification' in window
        );
    }

    static async ensureServiceWorker() {
        if (!this.supportsWebPush()) return null;
        if (!this._registrationPromise) {
            this._registrationPromise = navigator.serviceWorker.register('/service-worker.js?v=20260413_1', { scope: '/' })
                .then(() => navigator.serviceWorker.ready)
                .catch((error) => {
                    console.error('Service worker registration failed', error);
                    this._registrationPromise = null;
                    return null;
                });
        }
        return this._registrationPromise;
    }

    static async requestPermission(userId = '', token = '') {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'denied') return false;
        const permission = Notification.permission === 'granted'
            ? 'granted'
            : await Notification.requestPermission();
        if (permission !== 'granted') return false;
        void userId;
        void token;
        await this.ensureServiceWorker();
        return true;
    }

    static async syncSubscription(userId, token) {
        void userId;
        void token;
        if (this.getPermissionState() !== 'granted' || !this.supportsWebPush()) return false;
        await this.ensureServiceWorker();
        return true;
    }

    static async detachSubscription(userId, token, unsubscribeBrowser = false) {
        void userId;
        void token;
        void unsubscribeBrowser;
        return false;
    }

    static getNotificationIcon() {
        if (!this._iconPath) {
            this._iconPath = '/ic_launcher.png';
            const probe = new Image();
            probe.onerror = () => { this._iconPath = '/icon.png'; };
            probe.src = this._iconPath;
        }
        return this._iconPath;
    }

    static notifyNewMessage(senderName, rawContent) {
        if (Notification.permission !== 'granted') return;

        let bodyText = this.translate('push.newMessage', 'New message');
        try {
            const data = (typeof rawContent === 'string') ? JSON.parse(rawContent) : rawContent;
            if (data.text) bodyText = data.text;
            else if (data.file) bodyText = this.translate('push.sentAttachment', 'Sent an attachment');
        } catch (e) {
            bodyText = String(rawContent || '').replace(/<[^>]*>/g, ' ').trim();
        }

        try {
            const title = this.translate('push.newMessageTitle', 'New message from {name}', { name: senderName });
            const options = {
                body: bodyText.substring(0, 100),
                icon: PushNotificationManager.getNotificationIcon(),
                badge: PushNotificationManager.getNotificationIcon(),
                tag: 'msg-' + Date.now(),
                renotify: false
            };
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    action: 'notify',
                    payload: { title, ...options }
                });
                return;
            }
            navigator.serviceWorker?.ready?.then((registration) => {
                registration.showNotification(title, options).catch(() => {
                    const fallback = new Notification(title, options);
                    fallback.onclick = function () { window.focus(); fallback.close(); };
                });
            }).catch(() => {
                const fallback = new Notification(title, options);
                fallback.onclick = function () { window.focus(); fallback.close(); };
            });
        } catch (e) {
            console.error(e);
        }
    }
}

PushNotificationManager.getNotificationIcon();
PushNotificationManager.ensureServiceWorker().catch(() => {});
