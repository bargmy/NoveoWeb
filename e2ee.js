/**
 * E2EE Module for Noveo Messenger
 * Provides end-to-end encryption for private messages using RSA-OAEP + AES-GCM
 * Works without HTTPS (uses Web Crypto API)
 */

const E2EE = {
    keyPair: null,
    publicKeyCache: {},
    initialized: false,

    /**
     * Generate RSA-OAEP 2048-bit key pair
     */
    async generateKeyPair() {
        try {
            this.keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256"
                },
                true,
                ["encrypt", "decrypt"]
            );
            console.log("✓ E2EE: RSA key pair generated");
            return true;
        } catch (error) {
            console.error("E2EE: Key generation failed:", error);
            return false;
        }
    },

    /**
     * Export public key to JWK format
     */
    async exportPublicKey() {
        if (!this.keyPair) return null;
        try {
            return await window.crypto.subtle.exportKey("jwk", this.keyPair.publicKey);
        } catch (error) {
            console.error("E2EE: Public key export failed:", error);
            return null;
        }
    },

    /**
     * Derive encryption key from password using PBKDF2
     */
    async deriveKeyFromPassword(password) {
        const enc = new TextEncoder();
        const passwordBuffer = enc.encode(password);

        const baseKey = await window.crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        const salt = enc.encode("noveo_e2ee_salt_v1");

        return await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    },

    /**
     * Encrypt data with AES-GCM
     */
    async encryptWithAES(plaintext, key) {
        const enc = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            enc.encode(plaintext)
        );

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    },

    /**
     * Decrypt data with AES-GCM
     */
    async decryptWithAES(ciphertext, key) {
        const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    },

    /**
     * Save encrypted private key to localStorage
     */
    async exportAndSavePrivateKey(password) {
        if (!this.keyPair) return false;
        try {
            const privateKeyJWK = await window.crypto.subtle.exportKey("jwk", this.keyPair.privateKey);
            const passwordKey = await this.deriveKeyFromPassword(password);
            const encryptedPrivateKey = await this.encryptWithAES(JSON.stringify(privateKeyJWK), passwordKey);

            localStorage.setItem('e2ee_private_key', encryptedPrivateKey);
            console.log("✓ E2EE: Private key saved (encrypted)");
            return true;
        } catch (error) {
            console.error("E2EE: Private key save failed:", error);
            return false;
        }
    },

    /**
     * Load private key from localStorage
     */
    async loadPrivateKey(password) {
        try {
            const encryptedPrivateKey = localStorage.getItem('e2ee_private_key');
            if (!encryptedPrivateKey) return false;

            const passwordKey = await this.deriveKeyFromPassword(password);
            const privateKeyJSON = await this.decryptWithAES(encryptedPrivateKey, passwordKey);
            const privateKeyJWK = JSON.parse(privateKeyJSON);

            const privateKey = await window.crypto.subtle.importKey(
                "jwk",
                privateKeyJWK,
                { name: "RSA-OAEP", hash: "SHA-256" },
                true,
                ["decrypt"]
            );

            // Generate public key (in production, fetch from server)
            await this.generateKeyPair();
            this.keyPair = { ...this.keyPair, privateKey };

            console.log("✓ E2EE: Private key loaded");
            return true;
        } catch (error) {
            console.error("E2EE: Private key load failed:", error);
            return false;
        }
    },

    /**
     * Get public key of another user
     */
    async getPublicKey(userId) {
        if (this.publicKeyCache[userId]) {
            return this.publicKeyCache[userId];
        }

        return new Promise((resolve) => {
            window._e2eePublicKeyResolvers = window._e2eePublicKeyResolvers || {};
            window._e2eePublicKeyResolvers[userId] = (publicKey) => {
                if (publicKey) {
                    this.publicKeyCache[userId] = publicKey;
                }
                resolve(publicKey);
            };

            setTimeout(() => {
                if (window._e2eePublicKeyResolvers[userId]) {
                    delete window._e2eePublicKeyResolvers[userId];
                    resolve(null);
                }
            }, 5000);

            if (window.state && window.state.socket && window.state.socket.readyState === WebSocket.OPEN) {
                window.state.socket.send(JSON.stringify({
                    type: 'get_public_key',
                    userId: userId
                }));
            } else {
                resolve(null);
            }
        });
    },

    /**
     * Encrypt message for recipient
     */
    async encryptMessage(plaintext, recipientUserId) {
        try {
            const recipientPublicKeyJWK = await this.getPublicKey(recipientUserId);
            if (!recipientPublicKeyJWK) {
                console.warn("E2EE: Recipient has no public key");
                return { encrypted: false, text: plaintext };
            }

            const recipientPublicKey = await window.crypto.subtle.importKey(
                "jwk",
                recipientPublicKeyJWK,
                { name: "RSA-OAEP", hash: "SHA-256" },
                false,
                ["encrypt"]
            );

            const aesKey = await window.crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );

            const enc = new TextEncoder();
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encryptedMessage = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                aesKey,
                enc.encode(plaintext)
            );

            const aesKeyRaw = await window.crypto.subtle.exportKey("raw", aesKey);
            const encryptedAESKey = await window.crypto.subtle.encrypt(
                { name: "RSA-OAEP" },
                recipientPublicKey,
                aesKeyRaw
            );

            return {
                encrypted: true,
                iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
                key: btoa(String.fromCharCode(...new Uint8Array(encryptedAESKey))),
                data: btoa(String.fromCharCode(...new Uint8Array(encryptedMessage)))
            };
        } catch (error) {
            console.error("E2EE: Encryption failed:", error);
            return { encrypted: false, text: plaintext };
        }
    },

    /**
     * Decrypt received message
     */
    async decryptMessage(encryptedPayload) {
        try {
            if (!encryptedPayload.encrypted || !this.keyPair) {
                return encryptedPayload.text || JSON.stringify(encryptedPayload);
            }

            const iv = Uint8Array.from(atob(encryptedPayload.iv), c => c.charCodeAt(0));
            const encryptedKey = Uint8Array.from(atob(encryptedPayload.key), c => c.charCodeAt(0));
            const encryptedData = Uint8Array.from(atob(encryptedPayload.data), c => c.charCodeAt(0));

            const aesKeyRaw = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                this.keyPair.privateKey,
                encryptedKey
            );

            const aesKey = await window.crypto.subtle.importKey(
                "raw",
                aesKeyRaw,
                { name: "AES-GCM", length: 256 },
                false,
                ["decrypt"]
            );

            const decryptedData = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                aesKey,
                encryptedData
            );

            return new TextDecoder().decode(decryptedData);
        } catch (error) {
            console.error("E2EE: Decryption failed:", error);
            return "🔒 [Encrypted message - decryption failed]";
        }
    },

    /**
     * Initialize E2EE system
     */
    async initialize(password) {
        if (this.initialized) return true;

        const loaded = await this.loadPrivateKey(password);

        if (!loaded) {
            await this.generateKeyPair();
            await this.exportAndSavePrivateKey(password);

            const publicKeyJWK = await this.exportPublicKey();
            if (publicKeyJWK && window.state && window.state.socket && window.state.socket.readyState === WebSocket.OPEN) {
                window.state.socket.send(JSON.stringify({
                    type: 'upload_public_key',
                    publicKey: publicKeyJWK
                }));
            }
        }

        this.initialized = true;
        console.log("✅ E2EE initialized successfully");
        return true;
    },

    /**
     * Clear all E2EE data (for logout)
     */
    clear() {
        this.keyPair = null;
        this.publicKeyCache = {};
        this.initialized = false;
        // Note: We don't delete localStorage key so user can log back in
    }
};

// Make E2EE globally available
window.E2EE = E2EE;
