// test
// test 2
document.addEventListener('DOMContentLoaded', () => {
    // OLD: const SERVER_URL = "http://193.151.132.245:8443";
    
    // NEW: Point to the proxy we just set up (current domain + /api)
    const SERVER_URL = "https://noveo.ir:8443";
    globalThis.__noveoServerUrl = SERVER_URL;
    const ONBOARDING_STORAGE_KEY = 'messenger_onboarding_seen_v1';
    const EMOJI_MODE_STORAGE_KEY = 'messenger_emoji_mode';
    const EMOJI_PREFETCH_CACHE_KEY = 'messenger_ios_emoji_prefetch_v1';
    const IOS_EMOJI_MANIFEST_URL = '/static/emoji/emoji_pretty.json';
    const IOS_EMOJI_TEXTURE_BASE = '/static/emoji/emojis/';

    const resolveServerUrl = (path) => {
        if (!path || path.startsWith('http')) return path;
        // Ensure we don't double slash
        return `${SERVER_URL}${path.startsWith('/') ? path : '/' + path}`;
    };

        const state = {
            socket: null, currentUser: null, currentChat: null, allUsers: {}, allChats: {},
            typingUsers: {}, dom: {},
            isReconnecting: false, reconnectAttempts: 0, reconnectTimer: null, pendingRecipientId: null,
            messagePages: {}, chatHistoryState: {}, isLoadingMore: false, attachedFile: null, attachedFileChatId: null, replyingToMessage: null,
            composerUpload: { requestId: '', chatId: null, percent: 0 },
            chatScrollPositions: {},
            messageToForward: null,
            chatSelectionMode: false,
            selectedChatIds: new Set(),
            dataLoaded: { user: false, userList: false, chats: false, contacts: false },
            isFullyAuthenticated: false,
            justJoinedChannelId: null,
            // Voice Chat State
            activeVoiceChats: {}, // { chatId: { participants: [userId1, ...] } }
            currentVoiceChatId: null,
            connectingVoiceChatId: null,
            voiceConnectionState: 'idle',
            currentScreenShareOwnerId: null,
            availableScreenShareOwnerIds: [],
            isLocalScreenSharing: false,
            isVoiceMuted: false,
            isVoiceDeafened: false,
            isCallStageMinimized: false,
            preferredScreenShareQuality: '480p',
            incomingCallData: null, // { chatId, callerId, chatName, callerName, callerAvatar }
            speakingTimers: {},
            // MODIFIED: Added current app version
            currentAppVersion: '1.11.1',
            sessionToken: null,
            sessionExpiresAt: 0,
            e2eeSessions: {},
            reportActionTimestamps: [],
            activeUserInfoUserId: null,
            userProfiles: {},
            walletOverview: null,
            walletSummary: { balanceTenths: 0, giftCount: 0 },
            giftCatalogCache: {},
            pendingSeenReceipts: {},
            settingsProfileEditing: false,
            contactIds: new Set(),
            chatSettingsProfiles: {},
            historyLoadSuppressedUntil: 0,
            publicSearchResults: [],
            chatSearchResults: [],
            pendingMessageContextRequests: {},
            sidebarSearchMode: 'public',
            sidebarSearchChatId: null,
            isSidebarSearchActive: false,
            sidebarSearchQuery: '',
            walletSection: 'main',
            authResyncAttempts: 0,
            suppressScrollSaveUntil: 0,
            pendingSearchJump: null,
            activeThemePreset: '',
            currentEmojiMode: 'default',
            emojiRenderMap: new Map(),
            emojiRenderPattern: null,
            emojiManifestPromise: null,
            emojiPrefetchStarted: false,
            emojiPrefetchDone: 0,
            emojiPrefetchTotal: 0,
            emojiToastHideTimer: null,
            emojiObserver: null,
            emojiObserverBusy: false,
            currentLanguage: 'en',
            onboardingIndex: 0,
            onboardingAnimating: false,
            onboardingSwipeStartX: null,
            i18n: {},
            mutedUserIds: new Set(),
            mutedChatIds: new Set(),
            premiumReceiptFile: null,
            subscriptionModalTier: 'premium',
            subscriptionModalAction: '',
            subscriptionModalSource: '',
            premiumStarPickerSource: 'stickers',
            premiumStarPickerSelection: null,
            captchaPromise: null,
            emailViewerContext: null,
            emailComposeContext: null,
            avatarEditor: {
                file: null,
                image: null,
                objectUrl: '',
                rotation: 0,
                zoom: 1,
                offsetX: 0,
                offsetY: 0,
                baseScale: 1,
                referenceCropSize: 0,
                cropX: 0,
                cropY: 0,
                cropSize: 0,
                cropRotation: 0,
                minCropSize: 120,
                pointerId: null,
                activePointers: {},
                interactionMode: '',
                resizeHandle: '',
                pointerStartX: 0,
                pointerStartY: 0,
                startRotation: 0,
                gestureStartAngle: 0,
                startOffsetX: 0,
                startOffsetY: 0,
                startCropX: 0,
                startCropY: 0,
                startCropSize: 0,
                saving: false
            }
        };
        window.__noveoHasAttachedFile = (chatId = state.currentChat?.chatId || null) => (
            Boolean(state.attachedFile && state.attachedFileChatId && chatId === state.attachedFileChatId)
        );
        const MESSAGES_PER_PAGE = 50;
        const INITIAL_MESSAGE_BATCH = 20;
        const MAX_FILE_SIZE = 100 * 1024 * 1024;
        const REPORT_ACTION_LIMIT = 5;
        const REPORT_ACTION_WINDOW_MS = 60 * 1000;
        const PROFILE_BIO_MAX_LENGTH = 280;
        const TGS_VISIBILITY_ROOT_MARGIN = '200px 0px';
        const CHAT_SCROLL_BOTTOM_THRESHOLD = 32;
        const ACTIVE_CHAT_MESSAGE_LIMIT = 300;
        const INACTIVE_CHAT_MESSAGE_LIMIT = 60;
        const premiumPreviewState = {
            initialized: false,
            failed: false,
            renderer: null,
            scene: null,
            camera: null,
            mesh: null,
            material: null,
            frameHandle: 0,
            activeCanvas: null,
            dragging: false,
            pointerId: null,
            lastX: 0,
            lastY: 0,
            currentX: 0,
            currentY: 0,
            targetX: 0,
            targetY: 0,
            baseX: -0.22,
            baseY: 0.02,
            particlesCanvas: null,
            particlesCtx: null,
            particles: [],
            lastFrameTs: 0,
            lastRenderTs: 0,
            interactionBound: false
        };
        const CLIENT_CHANGELOG = [
            {
                version: '1.11.1',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v11101_1',
                    'changelog.v11101_2',
                    'changelog.v11101_3'
                ]
            },
            {
                version: '1.11.0',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v11100_1',
                    'changelog.v11100_2',
                    'changelog.v11100_3'
                ]
            },
            {
                version: '1.10.52',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1152_1',
                    'changelog.v1152_2',
                    'changelog.v1152_3'
                ]
            },
            {
                version: '1.10.51',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1151_1',
                    'changelog.v1151_2',
                    'changelog.v1151_3'
                ]
            },
            {
                version: '1.10.50',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1150_1',
                    'changelog.v1150_2',
                    'changelog.v1150_3'
                ]
            },
            {
                version: '1.10.49',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1149_1',
                    'changelog.v1149_2',
                    'changelog.v1149_3'
                ]
            },
            {
                version: '1.10.48',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1148_1',
                    'changelog.v1148_2',
                    'changelog.v1148_3'
                ]
            },
            {
                version: '1.10.47',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1147_1',
                    'changelog.v1147_2',
                    'changelog.v1147_3'
                ]
            },
            {
                version: '1.10.46',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1146_1',
                    'changelog.v1146_2',
                    'changelog.v1146_3'
                ]
            },
            {
                version: '1.10.45',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1145_1',
                    'changelog.v1145_2',
                    'changelog.v1145_3'
                ]
            },
            {
                version: '1.10.44',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1144_1',
                    'changelog.v1144_2',
                    'changelog.v1144_3'
                ]
            },
            {
                version: '1.10.43',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1143_1',
                    'changelog.v1143_2',
                    'changelog.v1143_3'
                ]
            },
            {
                version: '1.10.42',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1142_1',
                    'changelog.v1142_2',
                    'changelog.v1142_3'
                ]
            },
            {
                version: '1.10.41',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1141_1',
                    'changelog.v1141_2',
                    'changelog.v1141_3'
                ]
            },
            {
                version: '1.10.40',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1140_1',
                    'changelog.v1140_2',
                    'changelog.v1140_3'
                ]
            },
            {
                version: '1.10.39',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1139_1',
                    'changelog.v1139_2',
                    'changelog.v1139_3'
                ]
            },
            {
                version: '1.10.38',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1138_1',
                    'changelog.v1138_2',
                    'changelog.v1138_3'
                ]
            },
            {
                version: '1.10.37',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1137_1',
                    'changelog.v1137_2',
                    'changelog.v1137_3'
                ]
            },
            {
                version: '1.10.36',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1136_1',
                    'changelog.v1136_2',
                    'changelog.v1136_3'
                ]
            },
            {
                version: '1.10.35',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1135_1',
                    'changelog.v1135_2',
                    'changelog.v1135_3'
                ]
            },
            {
                version: '1.10.34',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1134_1',
                    'changelog.v1134_2',
                    'changelog.v1134_3'
                ]
            },
            {
                version: '1.10.33',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1133_1',
                    'changelog.v1133_2',
                    'changelog.v1133_3'
                ]
            },
            {
                version: '1.10.32',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1132_1',
                    'changelog.v1132_2',
                    'changelog.v1132_3'
                ]
            },
            {
                version: '1.10.31',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1131_1',
                    'changelog.v1131_2',
                    'changelog.v1131_3'
                ]
            },
            {
                version: '1.10.30',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1130_1',
                    'changelog.v1130_2',
                    'changelog.v1130_3'
                ]
            },
            {
                version: '1.10.29',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1129_1',
                    'changelog.v1129_2',
                    'changelog.v1129_3'
                ]
            },
            {
                version: '1.10.28',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1128_1',
                    'changelog.v1128_2',
                    'changelog.v1128_3'
                ]
            },
            {
                version: '1.10.27',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1127_1',
                    'changelog.v1127_2',
                    'changelog.v1127_3'
                ]
            },
            {
                version: '1.10.26',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1126_1',
                    'changelog.v1126_2',
                    'changelog.v1126_3'
                ]
            },
            {
                version: '1.10.25',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1125_1',
                    'changelog.v1125_2',
                    'changelog.v1125_3'
                ]
            },
            {
                version: '1.10.24',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1124_1',
                    'changelog.v1124_2',
                    'changelog.v1124_3'
                ]
            },
            {
                version: '1.10.23',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1123_1',
                    'changelog.v1123_2',
                    'changelog.v1123_3'
                ]
            },
            {
                version: '1.10.22',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1122_1',
                    'changelog.v1122_2',
                    'changelog.v1122_3'
                ]
            },
            {
                version: '1.10.21',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1121_1',
                    'changelog.v1121_2',
                    'changelog.v1121_3'
                ]
            },
            {
                version: '1.10.20',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1120_1',
                    'changelog.v1120_2',
                    'changelog.v1120_3'
                ]
            },
            {
                version: '1.10.19',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1119_1',
                    'changelog.v1119_2',
                    'changelog.v1119_3'
                ]
            },
            {
                version: '1.10.18',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1118_1',
                    'changelog.v1118_2',
                    'changelog.v1118_3'
                ]
            },
            {
                version: '1.10.17',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1117_1',
                    'changelog.v1117_2',
                    'changelog.v1117_3'
                ]
            },
            {
                version: '1.10.16',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1116_1',
                    'changelog.v1116_2',
                    'changelog.v1116_3'
                ]
            },
            {
                version: '1.10.15',
                dateKey: 'changelog.current',
                changeKeys: [
                    'changelog.v1115_1',
                    'changelog.v1115_2',
                    'changelog.v1115_3'
                ]
            },
            {
                version: '1.10.14',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1114_1',
                    'changelog.v1114_2',
                    'changelog.v1114_3'
                ]
            },
            {
                version: '1.10.13',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1113_1',
                    'changelog.v1113_2',
                    'changelog.v1113_3'
                ]
            },
            {
                version: '1.10.12',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1112_1',
                    'changelog.v1112_2',
                    'changelog.v1112_3'
                ]
            },
            {
                version: '1.10.11',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1111_1',
                    'changelog.v1111_2',
                    'changelog.v1111_3'
                ]
            },
            {
                version: '1.10.10',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1110_1',
                    'changelog.v1110_2',
                    'changelog.v1110_3'
                ]
            },
            {
                version: '1.10.9',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1109_1',
                    'changelog.v1109_2',
                    'changelog.v1109_3'
                ]
            },
            {
                version: '1.10.8',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1108_1',
                    'changelog.v1108_2',
                    'changelog.v1108_3'
                ]
            },
            {
                version: '1.10.7',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1107_1',
                    'changelog.v1107_2',
                    'changelog.v1107_3'
                ]
            },
            {
                version: '1.10.6',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1106_1',
                    'changelog.v1106_2',
                    'changelog.v1106_3'
                ]
            },
            {
                version: '1.10.5',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1105_1',
                    'changelog.v1105_2',
                    'changelog.v1105_3'
                ]
            },
            {
                version: '1.10.4',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1104_1',
                    'changelog.v1104_2',
                    'changelog.v1104_3'
                ]
            },
            {
                version: '1.10.2',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1102_1',
                    'changelog.v1102_2',
                    'changelog.v1102_3'
                ]
            },
            {
                version: '1.10.1',
                dateKey: 'changelog.recent',
                changeKeys: [
                    'changelog.v1101_1',
                    'changelog.v1101_2',
                    'changelog.v1101_3'
                ]
            },
            {
                version: '1.10.0',
                date: 'Recent',
                changes: [
                    'Added JSON-based language support with browser-language matching and a selector in Preferences.',
                    'Settings and auth shell now translate from locale files for English, Persian, Russian, and Chinese.',
                    'Language preference persists locally and updates the interface without changing unrelated chat behavior.'
                ]
            },
            {
                version: '1.9.10',
                date: 'Recent',
                changes: [
                    'Clicking the already open chat row no longer reloads the chat view and disturb the scroll position.',
                    'Initial chat load now keeps messages hidden until the first scroll target is applied after message rendering.',
                    'Fresh chat opens scroll after message load instead of briefly showing a wrong scrollbar position.'
                ]
            }
        ];
        const GIFT_LINK_RE = /\[gift\]\((https?:\/\/web\.noveo\.ir\/gift(?:\/([0-9]+)|\?id=([^)]+)))\)/ig;
        const SESSION_STORAGE_KEY = 'messenger_session';
        const SHARED_SESSION_STORAGE_KEY = 'messenger_shared_session';
        const THEME_PRESET_STORAGE_KEY = 'messenger_theme_preset';
        const LANGUAGE_STORAGE_KEY = 'messenger_language';
const LANGUAGE_VERSION_TAG = '20260412_2';
        const PASSWORD_MIN_LENGTH = 4;
        const LOCAL_STICKERS_STORAGE_KEY = 'noveo_local_stickers_v1';
        let errorToastTimer = null;
        const QUICK_REACTIONS = ['\u{1F64F}', '\u{1F44D}', '\u{1F62D}', '\u{1F60D}', '\u{1F970}', '\u{1F648}', '\u2764\uFE0F', '\u{1F914}', '\u{1F923}', '\u{1F618}', '\u{1F631}', '\u{1F4AF}', '\u{1F44E}', '\u{1F525}', '\u{1F4A9}', '\u{1F92F}', '\u{1F494}', '\u2603\uFE0F', '\u{1F601}', '\u{1F389}', '\u{1F937}', '\u{1F607}', '\u{1F383}', '\u{1F5FF}', '\u{1F974}', '\u{1F610}', '\u{1F44F}', '\u{1F92C}', '\u{1F622}', '\u{1F929}', '\u{1F92E}', '\u{1F44C}', '\u{1F54A}\uFE0F', '\u{1F921}', '\u{1F433}', '\u{1F498}', '\u{1F32D}', '\u26A1', '\u{1F34C}', '\u{1F3C6}', '\u{1F928}', '\u{1F353}', '\u{1F37E}', '\u{1F595}', '\u{1F608}', '\u{1F634}', '\u{1F913}', '\u{1F47B}', '\u{1F468}\u200D\u{1F4BB}', '\u{1F440}', '\u{1F649}', '\u{1F628}', '\u{1F91D}', '\u270D\uFE0F', '\u{1F917}', '\u{1FAE1}', '\u{1F385}', '\u{1F384}', '\u{1F485}', '\u{1F92A}', '\u{1F192}', '\u{1F984}', '\u{1F48A}', '\u{1F64A}', '\u{1F60E}', '\u{1F47E}'];
        const tgsAnimationCache = new Map();
        const getStorage = () => globalThis.__noveoStorage;
        const SUPPORTED_LANGUAGES = ['en', 'fa', 'ru', 'zh'];
        const LANGUAGE_FORMAT_LOCALES = {
            en: 'en-US',
            fa: 'fa-IR-u-ca-gregory',
            ru: 'ru-RU',
            zh: 'zh-CN'
        };
        const PROFILE_FONT_OPTIONS = [
            { value: '', preview: 'Default' },
            { value: '8514oem', preview: 'OEM' },
            { value: 'bradhitc', preview: 'Bradley' },
            { value: 'coure', preview: 'Courier' },
            { value: 'freescpt', preview: 'Script' },
            { value: 'f_majik', preview: 'مجیک' },
            { value: 'impact', preview: 'Impact' },
            { value: 'npidivani', preview: 'Divani' },
        ];

        const THEME_PRESETS = {};
        let tgsVisibilityObserver = null;
        let animatedMediaVisibilityObserver = null;

        function getTgsVisibilityObserver() {
            if (tgsVisibilityObserver) return tgsVisibilityObserver;
            tgsVisibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const player = entry.target;
                    if (!player?.isConnected) return;
                    if (!entry.isIntersecting) {
                        player.__tgsAnimation?.stop?.();
                        return;
                    }
                    if (player.__tgsAnimation) {
                        player.__tgsAnimation.play?.();
                        return;
                    }
                    if (player.__tgsLoading) return;
                    player.__tgsLoading = true;
                    fetchTgsAnimationData(player.dataset.tgsUrl)
                        .then((animationData) => {
                            if (!player.isConnected) return;
                            player.__tgsAnimation = window.lottie.loadAnimation({
                                container: player,
                                renderer: 'svg',
                                loop: true,
                                autoplay: true,
                                animationData
                            });
                        })
                        .catch((error) => {
                            console.error('Failed to initialize TGS player', error);
                            if (player.isConnected) {
                                player.innerHTML = `<div class="stars-wallet-gift-fallback"><i class="fas fa-sticky-note"></i></div>`;
                            }
                        })
                        .finally(() => {
                            player.__tgsLoading = false;
                        });
                });
            }, { root: null, rootMargin: TGS_VISIBILITY_ROOT_MARGIN, threshold: 0.01 });
            return tgsVisibilityObserver;
        }

        function getAnimatedMediaVisibilityObserver() {
            if (animatedMediaVisibilityObserver) return animatedMediaVisibilityObserver;
            animatedMediaVisibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const media = entry.target;
                    if (!(media instanceof HTMLVideoElement)) return;
                    if (entry.isIntersecting) {
                        media.play?.().catch(() => {});
                    } else {
                        media.pause?.();
                    }
                });
            }, { root: null, rootMargin: TGS_VISIBILITY_ROOT_MARGIN, threshold: 0.01 });
            return animatedMediaVisibilityObserver;
        }

        function initAnimatedMediaVisibility(root = document) {
            const scopedRoot = root || document;
            scopedRoot.querySelectorAll('video[autoplay][loop][muted]').forEach((video) => {
                if (video.dataset.visibilityManaged === '1') return;
                video.dataset.visibilityManaged = '1';
                getAnimatedMediaVisibilityObserver().observe(video);
            });
        }

        function cleanupAnimatedMedia(root = document) {
            const scopedRoot = root || document;
            scopedRoot.querySelectorAll?.('.tgs-player[data-tgs-url]').forEach((player) => {
                try {
                    getTgsVisibilityObserver().unobserve(player);
                } catch {}
                try {
                    player.__tgsAnimation?.destroy?.();
                } catch {}
                player.__tgsAnimation = null;
                player.__tgsLoading = false;
            });
            scopedRoot.querySelectorAll?.('video[autoplay][loop][muted]').forEach((video) => {
                try {
                    getAnimatedMediaVisibilityObserver().unobserve(video);
                } catch {}
                video.pause?.();
                delete video.dataset.visibilityManaged;
            });
        }

        function saveChatScrollPosition(chatId = state.currentChat?.chatId) {
            if (!chatId || state.currentChat?.chatId !== chatId || !state.dom.messagesContainer) return;
            if (Date.now() < Number(state.suppressScrollSaveUntil || 0)) return;
            const container = state.dom.messagesContainer;
            const distanceFromBottom = Math.max(0, container.scrollHeight - container.clientHeight - container.scrollTop);
            if (distanceFromBottom <= CHAT_SCROLL_BOTTOM_THRESHOLD) {
                delete state.chatScrollPositions[chatId];
                return;
            }
            const messageElements = Array.from(container.querySelectorAll('.message-wrapper[data-msg-id]'));
            const anchorEl = messageElements.find((el) => (el.offsetTop + el.offsetHeight) > container.scrollTop) || messageElements[0];
            if (!anchorEl?.dataset?.msgId) {
                state.chatScrollPositions[chatId] = { offsetFromBottom: distanceFromBottom };
                return;
            }
            state.chatScrollPositions[chatId] = {
                anchorMessageId: anchorEl.dataset.msgId,
                anchorOffset: Math.max(0, container.scrollTop - anchorEl.offsetTop),
                offsetFromBottom: distanceFromBottom
            };
        }

        function restoreChatScrollPosition(chatId) {
            const container = state.dom.messagesContainer;
            if (!chatId || !container) return;
            state.historyLoadSuppressedUntil = Date.now() + 450;
            const savedPosition = state.chatScrollPositions[chatId];
            if (!savedPosition) {
                container.scrollTop = container.scrollHeight;
                return;
            }
            const anchorMessageId = savedPosition.anchorMessageId;
            const anchorOffset = Number(savedPosition.anchorOffset || 0);
            let anchorEl = null;
            if (anchorMessageId && typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
                anchorEl = container.querySelector(`.message-wrapper[data-msg-id="${CSS.escape(anchorMessageId)}"]`);
            } else if (anchorMessageId) {
                anchorEl = Array.from(container.querySelectorAll('.message-wrapper[data-msg-id]')).find((el) => el.dataset.msgId === anchorMessageId) || null;
            }
            if (anchorEl) {
                container.scrollTop = Math.max(0, anchorEl.offsetTop + anchorOffset);
                return;
            }
            if (typeof savedPosition.offsetFromBottom === 'number') {
                container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight - savedPosition.offsetFromBottom);
                return;
            }
            container.scrollTop = container.scrollHeight;
        }

        function shouldStickChatToBottom(chatId = state.currentChat?.chatId) {
            return !chatId || !state.chatScrollPositions[chatId];
        }

        function showChatLoadingSpinner(isInitial = false) {
            const loader = state.dom.historyLoader;
            if (!loader) return;
            loader.classList.remove('hidden');
            if (isInitial) {
                loader.classList.add('flex', 'flex-1', 'items-center', 'justify-center');
            }
        }

        function hideChatLoadingSpinner() {
            const loader = state.dom.historyLoader;
            if (!loader) return;
            loader.classList.add('hidden');
            loader.classList.remove('flex', 'flex-1', 'items-center', 'justify-center');
        }

        function normalizeLanguageCode(rawValue = '') {
            const value = String(rawValue || '').trim().toLowerCase();
            if (!value) return 'en';
            if (value.startsWith('fa')) return 'fa';
            if (value.startsWith('ru')) return 'ru';
            if (value.startsWith('zh')) return 'zh';
            return 'en';
        }

        function normalizeEmojiMode(rawValue = '') {
            return String(rawValue || '').trim().toLowerCase() === 'ios' ? 'ios' : 'default';
        }

        function resolvePreferredLanguage() {
            const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (saved) return normalizeLanguageCode(saved);
            return normalizeLanguageCode(navigator.language || navigator.userLanguage || 'en');
        }

        function getTranslationValue(key, fallback = '') {
            if (!key) return fallback;
            const resolved = String(key).split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), state.i18n);
            return typeof resolved === 'string' ? resolved : fallback;
        }

        function localizeDigits(value) {
            const text = String(value ?? '');
            if (state.currentLanguage !== 'fa') return text;
            const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
            return text.replace(/\d/g, (digit) => persianDigits[Number(digit)] || digit);
        }

        function isolatePersianText(value) {
            const text = String(value ?? '');
            if (state.currentLanguage !== 'fa' || !text) return text;
            return `\u2067${text}\u2069`;
        }

        function getDynamicModalThemeClass() {
            const themeId = String(state.activeThemePreset || '').trim();
            if (!themeId) return '';
            return `theme-modal-${themeId.replace(/[^a-z0-9_-]/gi, '')}`;
        }

        function t(key, fallback = '') {
            return localizeDigits(getTranslationValue(key, fallback));
        }

        function tr(key, fallback = '', replacements = {}) {
            let value = t(key, fallback);
            Object.entries(replacements || {}).forEach(([token, replacement]) => {
                value = value.replaceAll(`{${token}}`, localizeDigits(replacement));
            });
            return isolatePersianText(localizeDigits(value));
        }

        globalThis.__noveoTranslate = (key, fallback = '', replacements = {}) => tr(key, fallback, replacements);

        function getActiveFormatLocale() {
            return LANGUAGE_FORMAT_LOCALES[state.currentLanguage] || LANGUAGE_FORMAT_LOCALES.en;
        }

        function formatLocalizedTime(date, options = {}) {
            const locale = getActiveFormatLocale();
            const baseOptions = state.currentLanguage === 'fa'
                ? { hour: 'numeric', minute: '2-digit', hour12: false }
                : { hour: 'numeric', minute: '2-digit' };
            return localizeDigits(new Intl.DateTimeFormat(locale, { ...baseOptions, ...options }).format(date));
        }

        function formatLocalizedDate(date, options = {}) {
            const locale = getActiveFormatLocale();
            const baseOptions = state.currentLanguage === 'fa'
                ? { year: 'numeric', month: 'numeric', day: 'numeric' }
                : {};
            return localizeDigits(new Intl.DateTimeFormat(locale, Object.keys(options).length ? options : baseOptions).format(date));
        }

        function formatLocalizedDateTime(date, options = {}) {
            const locale = getActiveFormatLocale();
            const baseOptions = state.currentLanguage === 'fa'
                ? { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false }
                : { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' };
            return localizeDigits(new Intl.DateTimeFormat(locale, { ...baseOptions, ...options }).format(date));
        }

        function applyStaticTranslations() {
            document.querySelectorAll('[data-i18n]').forEach((el) => {
                el.textContent = t(el.dataset.i18n, el.textContent);
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
                const fallback = el.getAttribute('placeholder') || '';
                const translated = getTranslationValue(el.dataset.i18nPlaceholder, fallback);
                const resolved = el instanceof HTMLInputElement && el.type === 'number'
                    ? translated
                    : localizeDigits(translated);
                el.setAttribute('placeholder', resolved);
            });
            document.querySelectorAll('[data-i18n-title]').forEach((el) => {
                const fallback = el.getAttribute('title') || '';
                el.setAttribute('title', t(el.dataset.i18nTitle, fallback));
            });
        }

        function applyLanguageToDocument() {
            document.documentElement.lang = state.currentLanguage || 'en';
            document.documentElement.dir = 'ltr';
        }

        function applyTranslations() {
            applyLanguageToDocument();
            applyStaticTranslations();
            document.title = t('brand.appName', 'Noveo');
            if (state.dom.settingsLanguageSelect) {
                state.dom.settingsLanguageSelect.value = state.currentLanguage;
            }
            if (state.dom.settingsEmojiSelect) {
                state.dom.settingsEmojiSelect.value = state.currentEmojiMode || 'default';
            }
            if (state.dom.settingsProfileStatus) {
                state.dom.settingsProfileStatus.textContent = t('settings.yourProfile', 'Your profile');
            }
            if (state.dom.settingsProfileTabMutualGroups) {
                state.dom.settingsProfileTabMutualGroups.textContent = t('settings.groups', 'Groups');
            }
            if (state.dom.settingsTitle && !state.dom.settingsModal?.classList.contains('hidden')) {
                if (!state.dom.settingsMenuView.classList.contains('hidden')) state.dom.settingsTitle.textContent = t('settings.settings', 'Settings');
                else if (!state.dom.settingsProfileSection.classList.contains('hidden')) state.dom.settingsTitle.textContent = t('settings.profile', 'Profile');
                else if (!state.dom.settingsAccountSection.classList.contains('hidden')) state.dom.settingsTitle.textContent = t('settings.account', 'Account');
                else if (!state.dom.settingsPreferencesSection.classList.contains('hidden')) state.dom.settingsTitle.textContent = t('settings.preferences', 'Preferences');
                else if (!state.dom.settingsChangelogSection.classList.contains('hidden')) state.dom.settingsTitle.textContent = t('settings.changelog', 'Changelog');
            }
            renderSidebarTitle();
            if (state.isFullyAuthenticated) {
                ui.renderContactList();
                if (state.currentChat) {
                    state.dom.chatStatus.textContent = getChatStatusText(state.currentChat);
                    ui.renderPinnedBar(state.currentChat);
                }
                if (state.dom.settingsModal && !state.dom.settingsModal.classList.contains('hidden') && state.currentUser) {
                    ui.populateSettingsProfile(state.allUsers[state.currentUser.userId]);
                    ui.renderSettingsChangelog();
                }
                if (state.dom.walletModal && !state.dom.walletModal.classList.contains('hidden')) {
                    renderWalletModal();
                }
            }
            syncNotificationPreferenceUi();
        }

        async function loadLanguage(languageCode, persist = true) {
            const normalized = normalizeLanguageCode(languageCode);
            try {
                const response = await fetch(`static/locales/${normalized}.json?v=${LANGUAGE_VERSION_TAG}`, { cache: 'no-store' });
                if (!response.ok) throw new Error(`Failed to load locale ${normalized}`);
                state.i18n = await response.json();
                state.currentLanguage = normalized;
                if (persist) getStorage().saveLanguage(normalized);
                applyTranslations();
            } catch (error) {
                console.error('Failed to load language', error);
                if (normalized !== 'en') {
                    await loadLanguage('en', persist);
                }
            }
        }

        function waitForRenderedChatMedia(chatId, timeoutMs = 1200) {
            const container = state.dom.messagesContainer;
            if (!container || state.currentChat?.chatId !== chatId) return Promise.resolve();
            const mediaElements = Array.from(container.querySelectorAll('img.message-visual-media, video.message-visual-media'));
            if (mediaElements.length === 0) return Promise.resolve();

            const waits = mediaElements.map((media) => new Promise((resolve) => {
                if (media instanceof HTMLImageElement) {
                    if (media.complete) {
                        resolve();
                        return;
                    }
                    media.addEventListener('load', resolve, { once: true });
                    media.addEventListener('error', resolve, { once: true });
                    return;
                }
                if (media instanceof HTMLVideoElement) {
                    if (media.readyState >= 1) {
                        resolve();
                        return;
                    }
                    media.addEventListener('loadedmetadata', resolve, { once: true });
                    media.addEventListener('error', resolve, { once: true });
                    return;
                }
                resolve();
            }));

            return Promise.race([
                Promise.all(waits),
                new Promise((resolve) => setTimeout(resolve, timeoutMs))
            ]);
        }

        function lockScrollToLatestMessage(chatId) {
            if (!chatId || !shouldStickChatToBottom(chatId)) return;
            requestAnimationFrame(() => {
                if (state.currentChat?.chatId !== chatId || !shouldStickChatToBottom(chatId)) return;
                state.dom.messagesContainer.scrollTop = state.dom.messagesContainer.scrollHeight;
                waitForRenderedChatMedia(chatId).finally(() => {
                    requestAnimationFrame(() => {
                        if (state.currentChat?.chatId !== chatId || !shouldStickChatToBottom(chatId)) return;
                        state.dom.messagesContainer.scrollTop = state.dom.messagesContainer.scrollHeight;
                        requestAnimationFrame(() => {
                            if (state.currentChat?.chatId !== chatId || !shouldStickChatToBottom(chatId)) return;
                            state.dom.messagesContainer.scrollTop = state.dom.messagesContainer.scrollHeight;
                        });
                    });
                });
            });
        }

        function forceScrollChatToBottom(chatId = state.currentChat?.chatId) {
            if (!chatId || state.currentChat?.chatId !== chatId || !state.dom.messagesContainer) return;
            delete state.chatScrollPositions[chatId];
            state.suppressScrollSaveUntil = Date.now() + 250;
            state.historyLoadSuppressedUntil = Date.now() + 450;
            state.dom.messagesContainer.scrollTop = state.dom.messagesContainer.scrollHeight;
            requestAnimationFrame(() => {
                if (state.currentChat?.chatId !== chatId) return;
                state.dom.messagesContainer.scrollTop = state.dom.messagesContainer.scrollHeight;
                requestAnimationFrame(() => {
                    if (state.currentChat?.chatId !== chatId) return;
                    state.dom.messagesContainer.scrollTop = state.dom.messagesContainer.scrollHeight;
                });
            });
        }

        function finalizeInitialChatScroll(chatId) {
            if (!chatId || state.currentChat?.chatId !== chatId) return;
            hideChatLoadingSpinner();
            state.dom.messagesContainer.classList.remove('chat-initial-loading');
            state.historyLoadSuppressedUntil = Date.now() + 350;
            const pendingJump = state.pendingSearchJump;
            if (pendingJump?.chatId === chatId && Date.now() < Number(pendingJump.until || 0)) {
                state.isLoadingMore = false;
                return;
            }
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (state.currentChat?.chatId !== chatId) return;
                    if (shouldStickChatToBottom(chatId)) {
                        forceScrollChatToBottom(chatId);
                        lockScrollToLatestMessage(chatId);
                    } else {
                        restoreChatScrollPosition(chatId);
                    }
                    state.isLoadingMore = false;
                });
            });
        }

        const DEFAULT_THEME_TOKENS = {
            '--app-bg': '#eef4ff',
            '--surface-1': '#ffffff',
            '--surface-2': '#f8fafc',
            '--surface-3': '#eff6ff',
            '--surface-4': '#e2e8f0',
            '--border-color': '#dbeafe',
            '--border-strong': '#bfdbfe',
            '--text-primary': '#0f172a',
            '--text-secondary': '#475569',
            '--text-muted': '#64748b',
            '--text-soft': '#94a3b8',
            '--accent': '#2563eb',
            '--accent-hover': '#1d4ed8',
            '--accent-contrast': '#ffffff',
            '--success': '#16a34a',
            '--success-hover': '#15803d',
            '--danger': '#dc2626',
            '--danger-hover': '#b91c1c',
            '--warning': '#d97706',
            '--warning-hover': '#b45309',
            '--warning-soft': '#fff7ed',
            '--input-bg': '#eff6ff',
            '--input-border': '#c7d2fe',
            '--chat-bg': '#eaf2ff',
            '--scrollbar-track': '#eaf1fb',
            '--scrollbar-thumb': '#bfdbfe',
            '--overlay-bg': 'rgba(15, 23, 42, 0.58)',
            '--chip-bg': '#f1f5f9',
            '--chip-text': '#475569',
            '--message-outgoing-bg': 'var(--accent)',
            '--message-outgoing-text': 'var(--accent-contrast)',
            '--message-incoming-bg': '#ffffff',
            '--message-incoming-text': '#0f172a',
            '--message-meta': '#64748b',
            '--message-meta-soft': '#94a3b8',
            '--message-action-bg': 'rgba(255, 255, 255, 0.92)',
            '--message-action-icon': '#64748b',
            '--surface-elevated': '#ffffff',
            '--surface-hero': 'linear-gradient(135deg, rgba(219, 234, 254, 0.86), rgba(255, 255, 255, 0.96))',
            '--shadow-color': 'rgba(15, 23, 42, 0.12)',
            '--selection-bg': '#dbeafe',
            '--selection-ring': 'var(--accent)',
            '--icon-muted': '#64748b',
            '--icon-soft': '#94a3b8',
            '--icon-active': 'var(--accent)',
            '--text-inverse': '#ffffff',
            '--status-online': '#16a34a',
            '--status-call': '#059669',
            '--badge-unread-bg': 'var(--accent)',
            '--badge-unread-text': '#ffffff',
            '--badge-selected-bg': '#dc2626',
            '--badge-selected-text': '#ffffff',
            '--alert-warning-bg': '#fff7ed',
            '--alert-warning-text': '#9a3412',
            '--alert-danger-bg': '#fef2f2',
            '--alert-danger-text': '#991b1b',
            '--interactive-hover': '#f8fafc',
            '--interactive-active': '#eff6ff'
        };

        function buildThemeCss(overrides = {}) {
            const tokens = { ...DEFAULT_THEME_TOKENS, ...overrides };
            const lines = Object.entries(tokens).map(([key, value]) => `    ${key}: ${value};`);
            return `:root {\n${lines.join('\n')}\n}`;
        }

        Object.assign(THEME_PRESETS, {
            light: { name: 'Light', css: buildThemeCss({}) },
            'light-sky': {
                name: 'Sky Light',
                css: buildThemeCss({
                    '--app-bg': '#e0f2fe',
                    '--surface-1': '#f8fcff',
                    '--surface-2': '#ecfeff',
                    '--surface-3': '#dbeafe',
                    '--surface-4': '#bae6fd',
                    '--border-color': '#bae6fd',
                    '--border-strong': '#7dd3fc',
                    '--text-primary': '#082f49',
                    '--text-secondary': '#0f4c68',
                    '--text-muted': '#0f766e',
                    '--text-soft': '#0891b2',
                    '--chat-bg': '#e0f2fe',
                    '--scrollbar-track': '#dff2fa',
                    '--scrollbar-thumb': '#7dd3fc',
                    '--selection-bg': '#dbeafe',
                    '--interactive-hover': '#ecfeff',
                    '--interactive-active': '#dbeafe'
                })
            },
            'sunset-light': {
                name: 'Sunset Light',
                css: buildThemeCss({
                    '--app-bg': '#fff7ed',
                    '--surface-1': '#fffaf5',
                    '--surface-2': '#ffedd5',
                    '--surface-3': '#fed7aa',
                    '--surface-4': '#fdba74',
                    '--border-color': '#fdba74',
                    '--border-strong': '#fb923c',
                    '--text-primary': '#431407',
                    '--text-secondary': '#7c2d12',
                    '--text-muted': '#9a3412',
                    '--text-soft': '#c2410c',
                    '--accent': '#ea580c',
                    '--accent-hover': '#c2410c',
                    '--chat-bg': '#fff2e8',
                    '--warning-soft': '#ffedd5',
                    '--scrollbar-track': '#ffedd5',
                    '--scrollbar-thumb': '#fb923c',
                    '--selection-bg': '#ffedd5',
                    '--interactive-hover': '#fff1e2',
                    '--interactive-active': '#ffddbf'
                })
            },
            dark: {
                name: 'Dark',
                css: buildThemeCss({
                    '--app-bg': '#020617',
                    '--surface-1': '#0f172a',
                    '--surface-2': '#111827',
                    '--surface-3': '#1e293b',
                    '--surface-4': '#334155',
                    '--border-color': '#1f2937',
                    '--border-strong': '#334155',
                    '--text-primary': '#f8fafc',
                    '--text-secondary': '#cbd5e1',
                    '--text-muted': '#94a3b8',
                    '--text-soft': '#64748b',
                    '--accent': '#3b82f6',
                    '--accent-hover': '#2563eb',
                    '--success': '#22c55e',
                    '--success-hover': '#16a34a',
                    '--danger': '#ef4444',
                    '--danger-hover': '#dc2626',
                    '--warning': '#f59e0b',
                    '--warning-hover': '#d97706',
                    '--warning-soft': '#1f2937',
                    '--input-bg': '#111827',
                    '--input-border': '#334155',
                    '--chat-bg': '#0b1220',
                    '--scrollbar-track': '#0f172a',
                    '--scrollbar-thumb': '#334155',
                    '--overlay-bg': 'rgba(2, 6, 23, 0.76)',
                    '--chip-bg': '#1e293b',
                    '--chip-text': '#cbd5e1',
                    '--message-incoming-bg': '#111827',
                    '--message-incoming-text': '#e2e8f0',
                    '--message-meta': '#94a3b8',
                    '--message-meta-soft': '#64748b',
                    '--message-action-bg': 'rgba(15, 23, 42, 0.92)',
                    '--message-action-icon': '#94a3b8',
                    '--surface-elevated': '#111827',
                    '--surface-hero': 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.96))',
                    '--shadow-color': 'rgba(2, 6, 23, 0.42)',
                    '--selection-bg': '#172554',
                    '--selection-ring': '#60a5fa',
                    '--alert-warning-bg': '#23180a',
                    '--alert-warning-text': '#fbbf24',
                    '--alert-danger-bg': '#2b1215',
                    '--alert-danger-text': '#fecaca',
                    '--interactive-hover': '#172033',
                    '--interactive-active': '#1e293b',
                    '--icon-muted': '#94a3b8',
                    '--icon-soft': '#64748b'
                })
            },
            'ocean-dark': {
                name: 'Ocean Dark',
                css: buildThemeCss({
                    '--app-bg': '#071423',
                    '--surface-1': '#081a2f',
                    '--surface-2': '#0c233d',
                    '--surface-3': '#0f2742',
                    '--surface-4': '#12324f',
                    '--border-color': '#12324f',
                    '--border-strong': '#1d4ed8',
                    '--text-primary': '#eff6ff',
                    '--text-secondary': '#dbeafe',
                    '--text-muted': '#93c5fd',
                    '--text-soft': '#7dd3fc',
                    '--accent': '#1d4ed8',
                    '--accent-hover': '#1e40af',
                    '--success': '#0f766e',
                    '--success-hover': '#0d5f58',
                    '--danger': '#ef4444',
                    '--danger-hover': '#dc2626',
                    '--warning': '#0ea5e9',
                    '--warning-hover': '#0284c7',
                    '--warning-soft': '#0f2742',
                    '--input-bg': '#0f2742',
                    '--input-border': '#1d4ed8',
                    '--chat-bg': '#081a2f',
                    '--scrollbar-track': '#08223c',
                    '--scrollbar-thumb': '#1d4ed8',
                    '--overlay-bg': 'rgba(7, 20, 35, 0.8)',
                    '--chip-bg': '#0f2742',
                    '--chip-text': '#bae6fd',
                    '--message-incoming-bg': '#0c233d',
                    '--message-incoming-text': '#dbeafe',
                    '--message-meta': '#93c5fd',
                    '--message-meta-soft': '#7dd3fc',
                    '--message-action-bg': 'rgba(8, 26, 47, 0.92)',
                    '--message-action-icon': '#93c5fd',
                    '--surface-elevated': '#0c233d',
                    '--surface-hero': 'linear-gradient(135deg, rgba(15, 39, 66, 0.92), rgba(8, 26, 47, 0.98))',
                    '--shadow-color': 'rgba(8, 26, 47, 0.46)',
                    '--selection-bg': '#16396c',
                    '--selection-ring': '#60a5fa',
                    '--alert-warning-bg': '#0a2233',
                    '--alert-warning-text': '#7dd3fc',
                    '--alert-danger-bg': '#2b1215',
                    '--alert-danger-text': '#fecaca',
                    '--interactive-hover': '#0f2742',
                    '--interactive-active': '#12324f',
                    '--icon-muted': '#93c5fd',
                    '--icon-soft': '#7dd3fc'
                })
            },
            'plum-dark': {
                name: 'Plum Dark',
                css: buildThemeCss({
                    '--app-bg': '#14051f',
                    '--surface-1': '#1b0f2a',
                    '--surface-2': '#2a1741',
                    '--surface-3': '#2e1065',
                    '--surface-4': '#4c1d95',
                    '--border-color': '#4c1d95',
                    '--border-strong': '#9333ea',
                    '--text-primary': '#faf5ff',
                    '--text-secondary': '#f3e8ff',
                    '--text-muted': '#d8b4fe',
                    '--text-soft': '#c084fc',
                    '--accent': '#a855f7',
                    '--accent-hover': '#9333ea',
                    '--success': '#22c55e',
                    '--success-hover': '#16a34a',
                    '--danger': '#fb7185',
                    '--danger-hover': '#f43f5e',
                    '--warning': '#c084fc',
                    '--warning-hover': '#a855f7',
                    '--warning-soft': '#2e1065',
                    '--input-bg': '#2e1065',
                    '--input-border': '#9333ea',
                    '--chat-bg': '#1b0f2a',
                    '--scrollbar-track': '#24123a',
                    '--scrollbar-thumb': '#9333ea',
                    '--overlay-bg': 'rgba(20, 5, 31, 0.82)',
                    '--chip-bg': '#2e1065',
                    '--chip-text': '#e9d5ff',
                    '--message-incoming-bg': '#2a1741',
                    '--message-incoming-text': '#f3e8ff',
                    '--message-meta': '#d8b4fe',
                    '--message-meta-soft': '#c084fc',
                    '--message-action-bg': 'rgba(27, 15, 42, 0.92)',
                    '--message-action-icon': '#d8b4fe',
                    '--surface-elevated': '#2a1741',
                    '--surface-hero': 'linear-gradient(135deg, rgba(46, 16, 101, 0.92), rgba(27, 15, 42, 0.98))',
                    '--shadow-color': 'rgba(20, 5, 31, 0.5)',
                    '--selection-bg': '#40206f',
                    '--selection-ring': '#c084fc',
                    '--alert-warning-bg': '#2f1747',
                    '--alert-warning-text': '#e9d5ff',
                    '--alert-danger-bg': '#341327',
                    '--alert-danger-text': '#fecdd3',
                    '--interactive-hover': '#2a1741',
                    '--interactive-active': '#2e1065',
                    '--icon-muted': '#d8b4fe',
                    '--icon-soft': '#c084fc'
                })
            },
            'oled-dark': {
                name: 'OLED Dark',
                css: buildThemeCss({
                    '--app-bg': '#000000',
                    '--surface-1': '#000000',
                    '--surface-2': '#050505',
                    '--surface-3': '#0b0b0b',
                    '--surface-4': '#121212',
                    '--border-color': '#101010',
                    '--border-strong': '#1f1f1f',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#e5e5e5',
                    '--text-muted': '#a3a3a3',
                    '--text-soft': '#737373',
                    '--accent': '#3b82f6',
                    '--accent-hover': '#2563eb',
                    '--success': '#22c55e',
                    '--success-hover': '#16a34a',
                    '--danger': '#ef4444',
                    '--danger-hover': '#dc2626',
                    '--warning': '#f59e0b',
                    '--warning-hover': '#d97706',
                    '--warning-soft': '#101010',
                    '--input-bg': '#050505',
                    '--input-border': '#171717',
                    '--chat-bg': '#000000',
                    '--scrollbar-track': '#050505',
                    '--scrollbar-thumb': '#202020',
                    '--overlay-bg': 'rgba(0, 0, 0, 0.9)',
                    '--chip-bg': '#0b0b0b',
                    '--chip-text': '#d4d4d4',
                    '--message-incoming-bg': '#050505',
                    '--message-incoming-text': '#f5f5f5',
                    '--message-meta': '#a3a3a3',
                    '--message-meta-soft': '#737373',
                    '--message-action-bg': 'rgba(0, 0, 0, 0.94)',
                    '--message-action-icon': '#a3a3a3',
                    '--surface-elevated': '#050505',
                    '--surface-hero': 'linear-gradient(135deg, rgba(10, 10, 10, 0.96), rgba(0, 0, 0, 1))',
                    '--shadow-color': 'rgba(0, 0, 0, 0.72)',
                    '--selection-bg': '#111827',
                    '--selection-ring': '#3b82f6',
                    '--alert-warning-bg': '#17120a',
                    '--alert-warning-text': '#fbbf24',
                    '--alert-danger-bg': '#1a0b0b',
                    '--alert-danger-text': '#fecaca',
                    '--interactive-hover': '#0a0a0a',
                    '--interactive-active': '#111111',
                    '--icon-muted': '#a3a3a3',
                    '--icon-soft': '#737373'
                })
            },
            'sunset-shimmer': {
                name: 'Sunset Shimmer',
                requiredTier: 'silver',
                css: buildThemeCss({
                    '--app-bg': '#180b07',
                    '--surface-1': '#21110b',
                    '--surface-2': '#2f170d',
                    '--surface-3': '#4a2311',
                    '--surface-4': '#6a3412',
                    '--border-color': '#7c2d12',
                    '--border-strong': '#fb923c',
                    '--text-primary': '#fff7ed',
                    '--text-secondary': '#fed7aa',
                    '--text-muted': '#fdba74',
                    '--text-soft': '#fb923c',
                    '--accent': '#f97316',
                    '--accent-hover': '#ea580c',
                    '--accent-contrast': '#fff7ed',
                    '--success': '#34d399',
                    '--success-hover': '#10b981',
                    '--danger': '#fb7185',
                    '--danger-hover': '#f43f5e',
                    '--warning': '#fbbf24',
                    '--warning-hover': '#f59e0b',
                    '--warning-soft': '#3a1b0e',
                    '--input-bg': 'rgba(58, 27, 14, 0.85)',
                    '--input-border': '#9a3412',
                    '--chat-bg': '#1b0e08',
                    '--scrollbar-track': '#2b140b',
                    '--scrollbar-thumb': '#ea580c',
                    '--overlay-bg': 'rgba(24, 11, 7, 0.82)',
                    '--chip-bg': '#4a2311',
                    '--chip-text': '#fed7aa',
                    '--message-incoming-bg': '#34180d',
                    '--message-incoming-text': '#fff7ed',
                    '--message-meta': '#fdba74',
                    '--message-meta-soft': '#fb923c',
                    '--message-action-bg': 'rgba(33, 17, 11, 0.94)',
                    '--message-action-icon': '#fed7aa',
                    '--surface-elevated': '#2a140c',
                    '--surface-hero': 'linear-gradient(135deg, rgba(124, 45, 18, 0.9), rgba(33, 17, 11, 0.98))',
                    '--shadow-color': 'rgba(124, 45, 18, 0.28)',
                    '--selection-bg': '#4a2311',
                    '--selection-ring': '#fdba74',
                    '--alert-warning-bg': '#3d220f',
                    '--alert-warning-text': '#fde68a',
                    '--alert-danger-bg': '#43161c',
                    '--alert-danger-text': '#fecdd3',
                    '--interactive-hover': '#3a1b0e',
                    '--interactive-active': '#4a2311',
                    '--icon-muted': '#fdba74',
                    '--icon-soft': '#fb923c'
                })
            },
            'cherry-red': {
                name: 'Cherry Red',
                requiredTier: 'silver',
                css: buildThemeCss({
                    '--app-bg': '#1a1a1a',
                    '--surface-1': '#2c2c2c',
                    '--surface-2': '#212121',
                    '--surface-3': '#333333',
                    '--surface-4': '#444444',
                    '--border-color': '#333333',
                    '--border-strong': '#666666',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#e0e0e0',
                    '--text-muted': '#b0b0b0',
                    '--text-soft': '#ff2c55',
                    '--accent': '#d2042d',
                    '--accent-hover': '#ff2c55',
                    '--accent-contrast': '#ffffff',
                    '--success': '#34d399',
                    '--success-hover': '#10b981',
                    '--danger': '#fb7185',
                    '--danger-hover': '#f43f5e',
                    '--warning': '#ff2c55',
                    '--warning-hover': '#d2042d',
                    '--warning-soft': '#330000',
                    '--input-bg': '#333333',
                    '--input-border': '#555555',
                    '--chat-bg': '#1a1a1a',
                    '--scrollbar-track': '#2c2c2c',
                    '--scrollbar-thumb': '#555555',
                    '--overlay-bg': 'rgba(26, 26, 26, 0.82)',
                    '--chip-bg': '#4d0000',
                    '--chip-text': '#ffffff',
                    '--message-incoming-bg': '#333333',
                    '--message-incoming-text': '#e0e0e0',
                    '--message-meta': '#b0b0b0',
                    '--message-meta-soft': '#ff2c55',
                    '--message-action-bg': 'rgba(51, 51, 51, 0.94)',
                    '--message-action-icon': '#d0d0d0',
                    '--surface-elevated': '#2c2c2c',
                    '--surface-hero': 'linear-gradient(135deg, rgba(77, 0, 0, 0.94), rgba(210, 4, 45, 0.9), rgba(51, 0, 0, 0.96), rgba(255, 44, 85, 0.9))',
                    '--shadow-color': 'rgba(210, 4, 45, 0.24)',
                    '--selection-bg': '#4d0000',
                    '--selection-ring': '#ff2c55',
                    '--alert-warning-bg': '#330000',
                    '--alert-warning-text': '#ffe4e6',
                    '--alert-danger-bg': '#4d0000',
                    '--alert-danger-text': '#ffffff',
                    '--interactive-hover': '#2a2a2a',
                    '--interactive-active': '#4d0000',
                    '--icon-muted': '#d0d0d0',
                    '--icon-soft': '#ff2c55'
                })
            },
            'snowy-daydream': {
                name: 'Snowy Daydream',
                premiumOnly: true,
                css: buildThemeCss({
                    '--app-bg': '#f1f7ff',
                    '--surface-1': 'rgba(255, 255, 255, 0.86)',
                    '--surface-2': 'rgba(240, 248, 255, 0.84)',
                    '--surface-3': 'rgba(221, 236, 255, 0.9)',
                    '--surface-4': 'rgba(191, 219, 254, 0.92)',
                    '--border-color': '#bfdbfe',
                    '--border-strong': '#7dd3fc',
                    '--text-primary': '#102041',
                    '--text-secondary': '#31538a',
                    '--text-muted': '#4c6a97',
                    '--text-soft': '#7b94b8',
                    '--accent': '#3b82f6',
                    '--accent-hover': '#2563eb',
                    '--accent-contrast': '#ffffff',
                    '--success': '#0f9d7a',
                    '--success-hover': '#0c7c61',
                    '--danger': '#dc2626',
                    '--danger-hover': '#b91c1c',
                    '--warning': '#d97706',
                    '--warning-hover': '#b45309',
                    '--warning-soft': '#fff7ed',
                    '--input-bg': 'rgba(255, 255, 255, 0.88)',
                    '--input-border': '#93c5fd',
                    '--chat-bg': '#edf6ff',
                    '--scrollbar-track': '#dbeafe',
                    '--scrollbar-thumb': '#93c5fd',
                    '--overlay-bg': 'rgba(113, 148, 189, 0.36)',
                    '--chip-bg': 'rgba(255, 255, 255, 0.82)',
                    '--chip-text': '#31538a',
                    '--message-incoming-bg': 'rgba(255, 255, 255, 0.95)',
                    '--message-incoming-text': '#102041',
                    '--message-meta': '#4c6a97',
                    '--message-meta-soft': '#7b94b8',
                    '--message-action-bg': 'rgba(255, 255, 255, 0.96)',
                    '--message-action-icon': '#31538a',
                    '--surface-elevated': 'rgba(255, 255, 255, 0.92)',
                    '--surface-hero': 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(219,234,254,0.92))',
                    '--shadow-color': 'rgba(96, 165, 250, 0.16)',
                    '--selection-bg': 'rgba(191, 219, 254, 0.9)',
                    '--selection-ring': '#60a5fa',
                    '--alert-warning-bg': '#fff7ed',
                    '--alert-warning-text': '#9a3412',
                    '--alert-danger-bg': '#fef2f2',
                    '--alert-danger-text': '#991b1b',
                    '--interactive-hover': 'rgba(219, 234, 254, 0.9)',
                    '--interactive-active': 'rgba(191, 219, 254, 0.95)',
                    '--icon-muted': '#4c6a97',
                    '--icon-soft': '#7b94b8'
                })
            },
            'rainbow-ragebait': {
                name: 'Rainbow Ragebait',
                premiumOnly: true,
                css: buildThemeCss({
                    '--app-bg': '#130a20',
                    '--surface-1': '#1d1130',
                    '--surface-2': '#25163d',
                    '--surface-3': '#331d52',
                    '--surface-4': '#4b2572',
                    '--border-color': '#5b2d83',
                    '--border-strong': '#c084fc',
                    '--text-primary': '#fff7ff',
                    '--text-secondary': '#f5d0fe',
                    '--text-muted': '#e9d5ff',
                    '--text-soft': '#d8b4fe',
                    '--accent': '#ff4fd8',
                    '--accent-hover': '#ff8a00',
                    '--accent-contrast': '#ffffff',
                    '--success': '#22c55e',
                    '--success-hover': '#16a34a',
                    '--danger': '#fb7185',
                    '--danger-hover': '#f43f5e',
                    '--warning': '#fbbf24',
                    '--warning-hover': '#f59e0b',
                    '--warning-soft': '#2f1747',
                    '--input-bg': '#24133b',
                    '--input-border': '#7c3aed',
                    '--chat-bg': '#1a0f2d',
                    '--scrollbar-track': '#24133b',
                    '--scrollbar-thumb': '#c084fc',
                    '--overlay-bg': 'rgba(19, 10, 32, 0.82)',
                    '--chip-bg': '#311a4d',
                    '--chip-text': '#f5d0fe',
                    '--message-incoming-bg': '#24133b',
                    '--message-incoming-text': '#fff7ff',
                    '--message-meta': '#e9d5ff',
                    '--message-meta-soft': '#d8b4fe',
                    '--message-action-bg': 'rgba(29, 17, 48, 0.92)',
                    '--message-action-icon': '#f5d0fe',
                    '--surface-elevated': '#24133b',
                    '--surface-hero': 'linear-gradient(135deg, rgba(124,58,237,0.78), rgba(29,17,48,0.98))',
                    '--shadow-color': 'rgba(131, 56, 236, 0.22)',
                    '--selection-bg': '#4b2572',
                    '--selection-ring': '#f9a8d4',
                    '--alert-warning-bg': '#3d1d4d',
                    '--alert-warning-text': '#fde68a',
                    '--alert-danger-bg': '#421833',
                    '--alert-danger-text': '#fecdd3',
                    '--interactive-hover': '#311a4d',
                    '--interactive-active': '#4b2572',
                    '--icon-muted': '#e9d5ff',
                    '--icon-soft': '#d8b4fe'
                })
            },
            'sanoki-meoa': {
                name: 'Sanoki Meoa',
                premiumOnly: true,
                css: buildThemeCss({
                    '--app-bg': '#12051e',
                    '--surface-1': '#1a0a2b',
                    '--surface-2': '#26103d',
                    '--surface-3': '#39145c',
                    '--surface-4': '#5b21b6',
                    '--border-color': '#6d28d9',
                    '--border-strong': '#c084fc',
                    '--text-primary': '#faf5ff',
                    '--text-secondary': '#f3e8ff',
                    '--text-muted': '#d8b4fe',
                    '--text-soft': '#c084fc',
                    '--accent': '#a855f7',
                    '--accent-hover': '#9333ea',
                    '--accent-contrast': '#ffffff',
                    '--success': '#34d399',
                    '--success-hover': '#10b981',
                    '--danger': '#fb7185',
                    '--danger-hover': '#f43f5e',
                    '--warning': '#fbbf24',
                    '--warning-hover': '#f59e0b',
                    '--warning-soft': '#2a1245',
                    '--input-bg': '#210c33',
                    '--input-border': '#7e22ce',
                    '--chat-bg': '#180827',
                    '--scrollbar-track': '#210c33',
                    '--scrollbar-thumb': '#9333ea',
                    '--overlay-bg': 'rgba(18, 5, 30, 0.84)',
                    '--chip-bg': '#2b1046',
                    '--chip-text': '#f3e8ff',
                    '--message-incoming-bg': '#241038',
                    '--message-incoming-text': '#faf5ff',
                    '--message-meta': '#d8b4fe',
                    '--message-meta-soft': '#c084fc',
                    '--message-action-bg': 'rgba(26, 10, 43, 0.94)',
                    '--message-action-icon': '#f3e8ff',
                    '--surface-elevated': '#210c33',
                    '--surface-hero': 'linear-gradient(135deg, rgba(91,33,182,0.82), rgba(18,5,30,0.98))',
                    '--shadow-color': 'rgba(76, 29, 149, 0.24)',
                    '--selection-bg': '#3b1760',
                    '--selection-ring': '#d8b4fe',
                    '--alert-warning-bg': '#34174d',
                    '--alert-warning-text': '#fde68a',
                    '--alert-danger-bg': '#421833',
                    '--alert-danger-text': '#fecdd3',
                    '--interactive-hover': '#2b1046',
                    '--interactive-active': '#3b1760',
                    '--icon-muted': '#d8b4fe',
                    '--icon-soft': '#c084fc'
                })
            }
        });

        function getMembershipTierRank(tier = '') {
            const normalized = String(tier || '').toLowerCase();
            if (normalized === 'premium') return 2;
            if (normalized === 'silver') return 1;
            return 0;
        }

        function resolveBestMembershipTier(...tiers) {
            return tiers
                .map((tier) => String(tier || '').trim().toLowerCase())
                .reduce((bestTier, tier) => (getMembershipTierRank(tier) > getMembershipTierRank(bestTier) ? tier : bestTier), '');
        }

        function getCurrentViewerMembershipTier() {
            const currentUserId = state.currentUser?.userId;
            const currentUserRecord = currentUserId ? state.allUsers[currentUserId] : null;
            return resolveBestMembershipTier(state.currentUser?.membershipTier, currentUserRecord?.membershipTier);
        }

        function hasPremiumAccess() {
            return getMembershipTierRank(getCurrentViewerMembershipTier()) >= 2;
        }

        function hasSilverAccess() {
            return getMembershipTierRank(getCurrentViewerMembershipTier()) >= 1;
        }

        function isPremiumThemePreset(presetId = '') {
            const preset = THEME_PRESETS[presetId] || {};
            return Boolean(preset.premiumOnly) || String(preset.requiredTier || '').toLowerCase() === 'premium';
        }

        function isSilverThemePreset(presetId = '') {
            return String(THEME_PRESETS[presetId]?.requiredTier || '').toLowerCase() === 'silver';
        }

        function getThemePresetRequiredTier(presetId = '') {
            const preset = THEME_PRESETS[presetId] || {};
            if (preset.premiumOnly) return 'premium';
            return String(preset.requiredTier || '').toLowerCase();
        }

        function canUseThemePreset(presetId = '') {
            const requiredTier = getThemePresetRequiredTier(presetId);
            if (!requiredTier) return true;
            if (!state.currentUser) return true;
            return getMembershipTierRank(state.currentUser?.membershipTier) >= getMembershipTierRank(requiredTier);
        }

        function isThemePresetAllowedForTier(presetId = '', tier = '') {
            const requiredTier = getThemePresetRequiredTier(presetId);
            if (!requiredTier) return true;
            return getMembershipTierRank(tier) >= getMembershipTierRank(requiredTier);
        }

        function getDynamicThemeStyleEl() {
            let styleEl = document.getElementById('dynamic-theme-style');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'dynamic-theme-style';
                document.head.appendChild(styleEl);
            }
            return styleEl;
        }

        function renderThemePresetSelection() {
            document.querySelectorAll('[data-theme-preset]').forEach((button) => {
                button.classList.toggle('is-active', button.dataset.themePreset === state.activeThemePreset);
                const presetId = button.dataset.themePreset || '';
                const locked = !canUseThemePreset(presetId);
                button.classList.toggle('is-locked', locked);
            });
            const themeSummary = state.dom?.themePresetSummary;
            if (themeSummary) {
                const activePreset = THEME_PRESETS[state.activeThemePreset];
                const currentCss = document.getElementById('dynamic-theme-style')?.textContent?.trim() || '';
                themeSummary.textContent = activePreset?.name || (currentCss ? t('settings.themeCustom', 'Custom theme') : t('settings.themeDefault', 'Default'));
            }
        }

        function getSidebarTitleText(baseTitle = '') {
            const resolvedTitle = baseTitle || t('brand.appName', 'Noveo');
            return state.isReconnecting ? t('loading.connecting', 'Connecting...') : resolvedTitle;
        }

        function renderSidebarTitle(baseTitle = '') {
            if (state.dom?.sidebarTitle) {
                const titleText = (!state.isReconnecting && !state.isFullyAuthenticated)
                    ? t('loading.updating', 'Updating...')
                    : getSidebarTitleText(baseTitle);
                state.dom.sidebarTitle.textContent = localizeDigits(titleText);
            }
            const versionEl = document.getElementById('sidebarVersion');
            if (versionEl) {
                versionEl.textContent = `v${localizeDigits(state.currentAppVersion)}`;
            }
        }

        function getUserDisplayName(user, fallback = '') {
            if (!user) return fallback || t('common.unknown', 'Unknown');
            return user.contactName || user.username || fallback || t('common.unknown', 'Unknown');
        }

        function getSidebarListAnimationSignature() {
            return Array.from(state.dom.contactsList?.children || []).map((row) => (
                row.dataset.sidebarKey
                || row.dataset.chatId
                || row.dataset.userId
                || String(row.textContent || '').trim()
            )).join('|');
        }

        function prepareSidebarListForEnter() {
            state.dom.contactsList?.classList.add('sidebar-list-prep-enter');
        }

        function applySidebarListEnterAnimation(force = false) {
            const list = state.dom.contactsList;
            const rows = Array.from(state.dom.contactsList?.children || []);
            const signature = getSidebarListAnimationSignature();
            if (!force && signature && signature === state.lastSidebarListAnimationSignature) {
                list?.classList.remove('sidebar-list-prep-enter');
                return;
            }
            state.lastSidebarListAnimationSignature = signature;
            list?.classList.remove('sidebar-list-prep-enter');
            rows.forEach((row, index) => {
                row.classList.remove('sidebar-list-enter', 'sidebar-list-exit');
                row.style.animation = 'none';
                row.style.animationDelay = '0ms';
                void row.offsetWidth;
                row.style.removeProperty('animation');
                row.classList.add('sidebar-list-enter');
                row.style.animationDelay = `${Math.min(index * 26, 180)}ms`;
            });
        }

        function animateSidebarListOut(onComplete) {
            const rows = Array.from(state.dom.contactsList?.children || []);
            if (!rows.length) {
                onComplete?.();
                return;
            }
            rows.forEach((row) => {
                row.classList.remove('sidebar-list-enter');
                row.classList.add('sidebar-list-exit');
                row.style.animationDelay = '0ms';
            });
            window.setTimeout(() => onComplete?.(), 160);
        }

        function restartElementAnimation(element, animationClass, classesToRemove = []) {
            if (!element) return;
            element.classList.remove(...classesToRemove);
            element.style.animation = 'none';
            void element.offsetWidth;
            element.style.removeProperty('animation');
            element.classList.add(animationClass);
        }

        function animateSidebarSearchToggleIcon(isSearchActive) {
            const button = state.dom.createChannelButton;
            if (!button) return;
            restartElementAnimation(button, 'sidebar-icon-swap-out', ['sidebar-icon-swap-in', 'sidebar-icon-swap-out']);
            window.setTimeout(() => {
                button.innerHTML = isSearchActive
                    ? '<span class="sidebar-search-toggle-icon"><i class="fas fa-times"></i></span>'
                    : '<span class="sidebar-search-toggle-icon"><i class="fas fa-search"></i></span>';
                button.title = isSearchActive ? t('common.closeSearch', 'Close search') : t('common.search', 'Search');
                restartElementAnimation(button, 'sidebar-icon-swap-in', ['sidebar-icon-swap-out', 'sidebar-icon-swap-in']);
            }, 120);
        }

        function setSidebarSearchActive(isActive, options = {}) {
            const nextActive = Boolean(isActive);
            const skipListRestore = Boolean(options.skipListRestore);
            const onDone = typeof options.onDone === 'function' ? options.onDone : null;
            const nextMode = options.mode || state.sidebarSearchMode || 'public';
            const nextChatId = Object.prototype.hasOwnProperty.call(options, 'chatId') ? options.chatId : state.sidebarSearchChatId;
            if (state.sidebarSearchTransitioning || (nextActive === state.isSidebarSearchActive && (!nextActive || (nextMode === state.sidebarSearchMode && nextChatId === state.sidebarSearchChatId)))) return;
            const titleEl = state.dom.sidebarTitle;
            const searchBar = state.dom.sidebarSearchBar;
            state.sidebarSearchTransitioning = true;
            state.sidebarSearchRequestId = Number(state.sidebarSearchRequestId || 0) + 1;
            if (state.sidebarSearchTimer) {
                clearTimeout(state.sidebarSearchTimer);
                state.sidebarSearchTimer = null;
            }
            animateSidebarSearchToggleIcon(nextActive);
            animateSidebarListOut(() => {
                state.isSidebarSearchActive = nextActive;
                if (!nextActive) {
                    state.sidebarSearchQuery = '';
                    state.publicSearchResults = [];
                    state.chatSearchResults = [];
                    state.sidebarSearchMode = 'public';
                    state.sidebarSearchChatId = null;
                    if (state.dom.sidebarSearchInput) state.dom.sidebarSearchInput.value = '';
                    if (!skipListRestore && state.isFullyAuthenticated) {
                        prepareSidebarListForEnter();
                        ui.renderContactList();
                        applySidebarListEnterAnimation();
                    }
                    if (onDone) window.setTimeout(onDone, skipListRestore ? 0 : 110);
                    return;
                }
                state.sidebarSearchMode = nextMode;
                state.sidebarSearchChatId = nextMode === 'chat' ? nextChatId : null;
                prepareSidebarListForEnter();
                renderSidebarSearchResults(
                    state.sidebarSearchQuery,
                    nextMode === 'chat' ? state.chatSearchResults : state.publicSearchResults,
                    nextMode
                );
                applySidebarListEnterAnimation();
                if (onDone) window.setTimeout(onDone, 110);
            });
            if (nextActive) {
                if (state.dom.sidebarSearchInput) {
                    state.dom.sidebarSearchInput.placeholder = nextMode === 'chat'
                        ? t('menu.searchMessages', 'Search messages')
                        : t('menu.searchPublic', 'Search public handles');
                }
                searchBar?.classList.remove('hidden', 'sidebar-header-hidden');
                titleEl?.classList.remove('hidden', 'sidebar-header-hidden');
                restartElementAnimation(searchBar, 'sidebar-header-swap-in', ['sidebar-header-swap-in', 'sidebar-header-swap-out']);
                restartElementAnimation(titleEl, 'sidebar-header-swap-out', ['sidebar-header-swap-in', 'sidebar-header-swap-out']);
                window.setTimeout(() => {
                    titleEl?.classList.add('sidebar-header-hidden');
                    titleEl?.classList.remove('sidebar-header-swap-out');
                }, 170);
                window.setTimeout(() => {
                    state.sidebarSearchTransitioning = false;
                }, 210);
                requestAnimationFrame(() => state.dom.sidebarSearchInput?.focus());
                return;
            }
            titleEl?.classList.remove('hidden', 'sidebar-header-hidden');
            restartElementAnimation(titleEl, 'sidebar-header-swap-in', ['sidebar-header-swap-in', 'sidebar-header-swap-out']);
            restartElementAnimation(searchBar, 'sidebar-header-swap-out', ['sidebar-header-swap-in', 'sidebar-header-swap-out']);
            window.setTimeout(() => {
                searchBar?.classList.add('sidebar-header-hidden');
                searchBar?.classList.remove('sidebar-header-swap-out');
            }, 170);
            window.setTimeout(() => {
                state.sidebarSearchTransitioning = false;
            }, 210);
        }

        function closeSidebarSearchForNavigation(onDone) {
            if (window.innerWidth < 768) {
                if (state.sidebarSearchTimer) {
                    clearTimeout(state.sidebarSearchTimer);
                    state.sidebarSearchTimer = null;
                }
                state.sidebarSearchTransitioning = false;
                state.sidebarSearchRequestId = Number(state.sidebarSearchRequestId || 0) + 1;
                state.isSidebarSearchActive = false;
                state.sidebarSearchQuery = '';
                state.publicSearchResults = [];
                state.chatSearchResults = [];
                state.sidebarSearchMode = 'public';
                state.sidebarSearchChatId = null;
                if (state.dom.sidebarSearchInput) {
                    state.dom.sidebarSearchInput.value = '';
                }
                state.dom.sidebarTitle?.classList.remove('hidden', 'sidebar-header-hidden', 'sidebar-header-swap-in', 'sidebar-header-swap-out');
                state.dom.sidebarSearchBar?.classList.add('hidden', 'sidebar-header-hidden');
                state.dom.sidebarSearchBar?.classList.remove('sidebar-header-swap-in', 'sidebar-header-swap-out');
                if (state.dom.createChannelButton) {
                    state.dom.createChannelButton.innerHTML = '<span class="sidebar-search-toggle-icon"><i class="fas fa-search"></i></span>';
                    state.dom.createChannelButton.title = t('common.search', 'Search');
                    state.dom.createChannelButton.classList.remove('sidebar-icon-swap-in', 'sidebar-icon-swap-out');
                }
                onDone?.();
                return;
            }
            setSidebarSearchActive(false, {
                skipListRestore: false,
                onDone
            });
        }

        function forceMobilePaneState(mode, options = {}) {
            if (window.innerWidth >= 768) return;
            const sidebarEl = state.dom.sidebar;
            const chatWindowEl = state.dom.chatWindow;
            if (!sidebarEl || !chatWindowEl) return;
            const immediate = Boolean(options.immediate);
            const applyState = () => {
                state.dom.mainApp?.classList.toggle('chat-view-active', mode === 'chat');
                if (mode === 'chat') {
                    sidebarEl.style.transform = 'translateX(-100%)';
                    chatWindowEl.style.transform = 'translateX(0)';
                } else {
                    sidebarEl.style.transform = '';
                    chatWindowEl.style.transform = '';
                }
            };
            if (!immediate) {
                applyState();
                return;
            }
            const prevSidebarTransition = sidebarEl.style.transition;
            const prevChatTransition = chatWindowEl.style.transition;
            sidebarEl.style.transition = 'none';
            chatWindowEl.style.transition = 'none';
            applyState();
            void sidebarEl.offsetWidth;
            void chatWindowEl.offsetWidth;
            sidebarEl.style.transition = prevSidebarTransition;
            chatWindowEl.style.transition = prevChatTransition;
        }

        function renderSidebarSearchResults(query = '', remoteResults = [], mode = state.sidebarSearchMode || 'public') {
            const list = state.dom.contactsList;
            if (!list) return;
            const normalized = String(query || '').trim().toLowerCase();
            if (mode === 'chat') {
                const chatResults = Array.isArray(remoteResults) ? remoteResults : [];
                list.innerHTML = '';
                if (!chatResults.length) {
                    const emptyRow = document.createElement('div');
                    emptyRow.className = 'p-6 text-center app-text-muted';
                    emptyRow.dataset.sidebarKey = normalized ? 'empty-chat-search' : 'empty-chat-search-idle';
                    emptyRow.textContent = normalized
                        ? t('common.noResults', 'No results found.')
                        : t('menu.searchMessages', 'Search messages');
                    list.appendChild(emptyRow);
                    return;
                }
                chatResults.forEach((message) => {
                    const targetChatId = state.sidebarSearchChatId;
                    const targetMessageId = message.messageId;
                    const sender = state.allUsers[message.senderId] || {};
                    const name = getUserDisplayName(sender, message.senderId || t('common.unknown', 'Unknown'));
                    const avatar = generateAvatar(name, message.senderId, sender.avatarUrl);
                    const snippet = String(message?.text || message?.file?.name || '').trim() || t('message.unknownMessage', 'Unknown message');
                    const row = document.createElement('button');
                    row.type = 'button';
                    row.className = 'app-list-row app-list-row-hover w-full border-b p-3 text-left flex items-center gap-3';
                    row.dataset.sidebarKey = `message:${message.messageId}`;
                    row.innerHTML = `
                        <div class="w-11 h-11 avatar-circle flex-shrink-0" style="background-image: url(${escapeAttr(avatar.url)}); background-color: ${avatar.color};">${avatar.initial}</div>
                        <div class="min-w-0 flex-1">
                            <div class="text-sm font-semibold truncate">${escapeHtml(name)}</div>
                            <div class="text-xs app-text-muted truncate mt-1">${escapeHtml(snippet)}</div>
                        </div>
                    `;
                    row.addEventListener('click', () => {
                        const openResult = async () => {
                            const targetChat = state.allChats[targetChatId];
                            if (!targetChat) return;
                            let requiresRenderWait = false;
                            if (window.innerWidth < 768) {
                                forceMobilePaneState('chat', { immediate: true });
                            }
                            if (state.currentChat?.chatId !== targetChat.chatId) {
                                state.pendingSearchJump = { chatId: targetChat.chatId, until: Date.now() + 2500 };
                                openChat(targetChat);
                                requiresRenderWait = true;
                            }
                            if (!targetChat.messages?.some((entry) => String(entry.messageId) === String(targetMessageId))) {
                                const contextPayload = await requestMessageContext(targetChat.chatId, targetMessageId);
                                if (contextPayload?.messages?.length) {
                                    targetChat.messages = normalizeMessages([
                                        ...(Array.isArray(targetChat.messages) ? targetChat.messages : []),
                                        ...contextPayload.messages
                                    ]);
                                    state.pendingSearchJump = { chatId: targetChat.chatId, until: Date.now() + 2500 };
                                    openChat(targetChat);
                                    requiresRenderWait = true;
                                }
                            }
                            if (requiresRenderWait) {
                                await waitForChatRenderCycle();
                            }
                            const didScroll = await scrollToMessage(targetMessageId, { suppressError: true });
                            state.pendingSearchJump = null;
                            if (!didScroll) {
                                showSuccessModal(
                                    t('chat.timelineNotLoadedTitle', 'Timeline Not Loaded'),
                                    t('chat.timelineNotLoadedBody', 'Scroll up to render this part of the timeline first.')
                                );
                            }
                        };
                        closeSidebarSearchForNavigation(openResult);
                    });
                    list.appendChild(row);
                });
                return;
            }
            const localResults = [];
            const seen = new Set();

            Object.values(state.allChats).forEach((chat) => {
                if (!chat || chat.previewOnly) return;
                const isSearchableChat = chat.chatType === 'group' || chat.chatType === 'channel';
                if (!isSearchableChat) return;
                const handle = String(chat.handle || '').toLowerCase();
                const name = String(chat.chatName || '').toLowerCase();
                if (!normalized || handle.includes(normalized) || name.includes(normalized)) {
                    seen.add(`chat:${chat.chatId}`);
                    localResults.push({ resultType: 'chat', ...chat });
                }
            });
            Object.values(state.allUsers).forEach((user) => {
                if (!user || user.userId === state.currentUser?.userId) return;
                const handle = String(user.handle || '').toLowerCase();
                const name = String(user.username || '').toLowerCase();
                if (!handle) return;
                if (!normalized || handle.includes(normalized) || name.includes(normalized)) {
                    const key = `user:${user.userId}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    localResults.push({ resultType: 'user', ...user });
                }
            });

            const mergedResults = [...localResults];
            remoteResults.forEach((entry) => {
                const key = entry.resultType === 'chat' ? `chat:${entry.chatId}` : `user:${entry.userId}`;
                if (seen.has(key)) return;
                seen.add(key);
                mergedResults.push(entry);
            });

            list.innerHTML = '';
            if (!mergedResults.length) {
                const emptyRow = document.createElement('div');
                emptyRow.className = 'p-6 text-center app-text-muted';
                emptyRow.dataset.sidebarKey = 'empty';
                emptyRow.textContent = t('common.noResults', 'No results found.');
                list.appendChild(emptyRow);
                return;
            }

            mergedResults.forEach((entry) => {
                const isUser = entry.resultType === 'user';
                const handle = entry.handle || '';
                const name = isUser ? getUserDisplayName(entry, t('common.unknown', 'Unknown')) : (entry.chatName || t('chat.chatFallback', 'Chat'));
                const avatar = isUser
                    ? generateAvatar(name, entry.userId, entry.avatarUrl)
                    : (entry.chatType === 'saved' ? generateSavedMessagesAvatar() : generateAvatar(name, entry.chatId, entry.avatarUrl, entry.chatType === 'channel'));
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'app-list-row app-list-row-hover w-full border-b p-3 text-left flex items-center gap-3';
                row.dataset.sidebarKey = isUser ? `user:${entry.userId}` : `chat:${entry.chatId}`;
                row.innerHTML = `
                    <div class="w-12 h-12 avatar-circle flex-shrink-0" style="background-image: url(${escapeAttr(avatar.url)}); background-color: ${avatar.color};">${avatar.initial}</div>
                    <div class="min-w-0 flex-1">
                        <div class="font-semibold truncate">${isUser ? renderDisplayName(name, Boolean(entry.isVerified), Boolean(entry.isBot), entry.membershipTier, entry.nicknameFont, entry.premiumStarIcon) : renderPlainDisplayName(name, Boolean(entry.isVerified))}</div>
                        <div class="text-xs app-text-muted truncate">${escapeHtml(handle || (isUser ? getPresenceLabel(entry) : (entry.chatType || 'chat')))}</div>
                    </div>
                `;
                row.addEventListener('click', () => {
                    const openResult = () => {
                        if (isUser) {
                            state.allUsers[entry.userId] = { ...(state.allUsers[entry.userId] || {}), ...entry };
                            openPrivateChatWithUser(entry.userId);
                            return;
                        }
                        if (handle) {
                            openChannelByHandle(handle);
                            return;
                        }
                        if (state.allChats[entry.chatId]) {
                            openChat(state.allChats[entry.chatId]);
                        }
                    };
                    closeSidebarSearchForNavigation(openResult);
                });
                list.appendChild(row);
            });
        }

        function applyThemeCss(cssText, persist = true, presetId = '') {
            const normalizedPresetId = presetId && THEME_PRESETS[presetId] ? presetId : '';
            if (normalizedPresetId && !canUseThemePreset(normalizedPresetId)) {
                resetThemeCss();
                openPremiumModal();
                return;
            }
            const css = normalizedPresetId
                ? String(THEME_PRESETS[normalizedPresetId].css || '')
                : String(cssText || '');
            const styleEl = getDynamicThemeStyleEl();
            styleEl.textContent = css;
            state.activeThemePreset = normalizedPresetId;
            if (document.body) {
                document.body.dataset.themePreset = normalizedPresetId;
            }
            if (persist) {
                getStorage().saveTheme(css);
                if (normalizedPresetId) getStorage().saveThemePreset(normalizedPresetId);
                else getStorage().clearThemePreset();
            }
            renderThemePresetSelection();
        }

        function applyThemePreset(presetId) {
            const preset = THEME_PRESETS[presetId];
            if (!preset?.css) return;
            applyThemeCss(preset.css, true, presetId);
        }

        function resetThemeCss() {
            const styleEl = document.getElementById('dynamic-theme-style');
            if (styleEl) styleEl.textContent = '';
            state.activeThemePreset = '';
            if (document.body) {
                document.body.dataset.themePreset = '';
            }
            getStorage().clearTheme();
            getStorage().clearThemePreset();
            renderThemePresetSelection();
        }

        function enforcePremiumEntitlements() {
            const currentUserId = state.currentUser?.userId;
            const currentUser = currentUserId ? state.allUsers[currentUserId] : null;
            const currentTier = getCurrentViewerMembershipTier();
            if (!isThemePresetAllowedForTier(state.activeThemePreset, currentTier)) {
                resetThemeCss();
            }
            if (!hasPremiumAccess()) {
                if (currentUser?.nicknameFont) {
                    currentUser.nicknameFont = '';
                }
                if (state.currentUser?.nicknameFont) {
                    state.currentUser.nicknameFont = '';
                }
                if (currentUser?.profileSkin) {
                    currentUser.profileSkin = null;
                }
                if (currentUser?.premiumStarIcon) {
                    currentUser.premiumStarIcon = null;
                }
                if (state.currentUser?.profileSkin) {
                    state.currentUser.profileSkin = null;
                }
                if (state.currentUser?.premiumStarIcon) {
                    state.currentUser.premiumStarIcon = null;
                }
            }
            if (currentUserId && currentUser && !state.dom.settingsModal?.classList.contains('hidden')) {
                ui.populateSettingsProfile(currentUser);
            }
            renderThemePresetSelection();
        }


        const storage = globalThis.__noveoStorage || (globalThis.__noveoStorage = {
            saveSession: (s) => {
                const raw = JSON.stringify(s);
                sessionStorage.setItem(SESSION_STORAGE_KEY, raw);
                localStorage.setItem(SHARED_SESSION_STORAGE_KEY, raw);
            },
            loadSession: () => {
                try {
                    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SHARED_SESSION_STORAGE_KEY);
                    if (raw && !sessionStorage.getItem(SESSION_STORAGE_KEY)) {
                        sessionStorage.setItem(SESSION_STORAGE_KEY, raw);
                    }
                    return raw ? JSON.parse(raw) : null;
                } catch (e) {
                    return null;
                }
            },
            clearSession: () => {
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
                localStorage.removeItem(SHARED_SESSION_STORAGE_KEY);
            },
            saveTheme: (css) => localStorage.setItem('messenger_theme_css', String(css || '')),
            loadTheme: () => localStorage.getItem('messenger_theme_css') || '',
            clearTheme: () => localStorage.removeItem('messenger_theme_css'),
            saveThemePreset: (presetId) => localStorage.setItem(THEME_PRESET_STORAGE_KEY, String(presetId || '')),
            loadThemePreset: () => localStorage.getItem(THEME_PRESET_STORAGE_KEY) || '',
            clearThemePreset: () => localStorage.removeItem(THEME_PRESET_STORAGE_KEY),
            saveLanguage: (languageCode) => localStorage.setItem(LANGUAGE_STORAGE_KEY, String(languageCode || 'en')),
            loadLanguage: () => localStorage.getItem(LANGUAGE_STORAGE_KEY) || '',
            saveEmojiMode: (emojiMode) => localStorage.setItem(EMOJI_MODE_STORAGE_KEY, normalizeEmojiMode(emojiMode)),
            loadEmojiMode: () => normalizeEmojiMode(localStorage.getItem(EMOJI_MODE_STORAGE_KEY) || 'default'),
            saveOnboardingSeen: () => localStorage.setItem(ONBOARDING_STORAGE_KEY, '1'),
            loadOnboardingSeen: () => localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1',
            saveMutedUsers: (userIds) => localStorage.setItem('messenger_muted_users', JSON.stringify(Array.from(userIds || []))),
            loadMutedUsers: () => {
                try {
                    const raw = localStorage.getItem('messenger_muted_users');
                    const parsed = raw ? JSON.parse(raw) : [];
                    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
                } catch (e) {
                    return [];
                }
            },
            saveMutedChats: (chatIds) => localStorage.setItem('messenger_muted_chats', JSON.stringify(Array.from(chatIds || []))),
            loadMutedChats: () => {
                try {
                    const raw = localStorage.getItem('messenger_muted_chats');
                    const parsed = raw ? JSON.parse(raw) : [];
                    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
                } catch (e) {
                    return [];
                }
            },
        });

        function normalizeSession(session) {
            if (!session || !session.userId || !session.token) return null;
            const expiresAt = Number(session.expiresAt || 0);
            return {
                userId: String(session.userId),
                token: String(session.token),
                sessionId: session.sessionId ? String(session.sessionId) : '',
                expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
            };
        }

        let appSoundContext = null;
        let incomingCallToneTimer = null;
        const ONBOARDING_SLIDES = [
            {
                icon: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="10" y="12" width="44" height="40" rx="14" fill="currentColor" opacity=".12"/><path d="M20 24h24M20 32h16M20 40h10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="44" cy="40" r="6" fill="currentColor"/></svg>`,
                descriptionKey: 'onboarding.slide1'
            },
            {
                icon: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="12" y="18" width="40" height="28" rx="8" fill="currentColor" opacity=".12"/><path d="M16 24l16 12 16-12" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 44h28" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="44" r="6" fill="currentColor"/></svg>`,
                descriptionKey: 'onboarding.slide2'
            },
            {
                icon: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="20" cy="24" r="8" fill="currentColor" opacity=".14"/><circle cx="43" cy="22" r="6" fill="currentColor" opacity=".1"/><path d="M12 46c2-8 9-12 17-12 9 0 15 4 18 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><rect x="39" y="36" width="13" height="13" rx="4" fill="currentColor"/><path d="M45.5 39v7M42 42.5h7" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
                descriptionKey: 'onboarding.slide3'
            },
            {
                icon: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="14" y="16" width="36" height="32" rx="10" stroke="currentColor" stroke-width="4"/><path d="M24 28h16M24 36h10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M48 22l6-4v28l-6-4" fill="currentColor" opacity=".22"/><path d="M50 25l4-2.5v19L50 39" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>`,
                descriptionKey: 'onboarding.slide4'
            }
        ];
        const APP_SOUND_VERSION = '20260408_1';
        const APP_SOUND_FILES = {
            'incoming-call': `static/audio/incoming-call.wav?v=${APP_SOUND_VERSION}`,
            'call-denied': `static/audio/call-denied.wav?v=${APP_SOUND_VERSION}`,
            'message-sent': `static/audio/message-sent.wav?v=${APP_SOUND_VERSION}`,
            'message-received': `static/audio/message-received.wav?v=${APP_SOUND_VERSION}`,
        };
        const appSoundCache = {};

        function isUserMutedLocally(userId) {
            return Boolean(userId && state.mutedUserIds.has(String(userId)));
        }

        function isChatMutedLocally(chatId) {
            return Boolean(chatId && state.mutedChatIds.has(String(chatId)));
        }

        function persistMutedUsers() {
            getStorage().saveMutedUsers(state.mutedUserIds);
        }

        function persistMutedChats() {
            getStorage().saveMutedChats(state.mutedChatIds);
        }

        function toggleLocalUserMute(userId) {
            const normalized = String(userId || '').trim();
            if (!normalized) return false;
            if (state.mutedUserIds.has(normalized)) state.mutedUserIds.delete(normalized);
            else state.mutedUserIds.add(normalized);
            persistMutedUsers();
            return state.mutedUserIds.has(normalized);
        }

        function toggleLocalChatMute(chatId) {
            const normalized = String(chatId || '').trim();
            if (!normalized) return false;
            if (state.mutedChatIds.has(normalized)) state.mutedChatIds.delete(normalized);
            else state.mutedChatIds.add(normalized);
            persistMutedChats();
            return state.mutedChatIds.has(normalized);
        }

        function getSoundContext() {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            if (!appSoundContext) appSoundContext = new AudioCtx();
            if (appSoundContext.state === 'suspended') {
                appSoundContext.resume().catch(() => {});
            }
            return appSoundContext;
        }

        function playUiAudioFile(kind, { loop = false } = {}) {
            const src = APP_SOUND_FILES[kind];
            if (!src) return null;
            try {
                if (!appSoundCache[kind]) {
                    appSoundCache[kind] = new Audio(resolveServerUrl(src));
                    appSoundCache[kind].preload = 'auto';
                }
                const player = loop ? appSoundCache[kind] : new Audio(resolveServerUrl(src));
                player.loop = Boolean(loop);
                player.currentTime = 0;
                player.play().catch(() => {});
                return player;
            } catch (_) {
                return null;
            }
        }

        function playUiTone(frequencies, durationMs = 120, options = {}) {
            const ctx = getSoundContext();
            if (!ctx) return;
            const start = ctx.currentTime;
            const gain = ctx.createGain();
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(options.volume || 0.03, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + (durationMs / 1000));
            (Array.isArray(frequencies) ? frequencies : [frequencies]).forEach((frequency) => {
                const osc = ctx.createOscillator();
                osc.type = options.type || 'sine';
                osc.frequency.setValueAtTime(frequency, start);
                osc.connect(gain);
                osc.start(start);
                osc.stop(start + (durationMs / 1000));
            });
        }

        function playUiSound(kind) {
            if (document.visibilityState === 'hidden' && kind !== 'incoming-call' && kind !== 'call-denied') return;
            if (playUiAudioFile(kind)) return;
            if (kind === 'message-sent') playUiTone([920, 1180], 70, { volume: 0.018, type: 'triangle' });
            else if (kind === 'message-received') playUiTone([640, 880], 110, { volume: 0.025, type: 'sine' });
            else if (kind === 'call-denied') playUiTone([360, 240], 220, { volume: 0.03, type: 'sawtooth' });
        }

        function stopIncomingCallSound() {
            if (incomingCallToneTimer) {
                clearInterval(incomingCallToneTimer);
                incomingCallToneTimer = null;
            }
            const player = appSoundCache['incoming-call'];
            if (player) {
                player.pause();
                player.currentTime = 0;
            }
        }

        function startIncomingCallSound() {
            stopIncomingCallSound();
            const filePlayer = playUiAudioFile('incoming-call', { loop: true });
            if (filePlayer) return;
            playUiTone([740, 988], 240, { volume: 0.035, type: 'sine' });
            incomingCallToneTimer = setInterval(() => {
                playUiTone([740, 988], 240, { volume: 0.035, type: 'sine' });
            }, 1400);
        }

        function syncNotificationPreferenceUi() {
            if (!state.dom.notificationsPermissionButton || !state.dom.notificationsPermissionStatus) return;
            const permission = typeof PushNotificationManager !== 'undefined'
                ? PushNotificationManager.getPermissionState()
                : (('Notification' in window) ? Notification.permission : 'unsupported');
            if (permission === 'unsupported') {
                state.dom.notificationsPermissionStatus.textContent = t('settings.notificationsUnavailable', 'Notifications are not available in this browser.');
                state.dom.notificationsPermissionButton.textContent = t('common.unavailable', 'Unavailable');
                state.dom.notificationsPermissionButton.disabled = true;
                return;
            }
            if (permission === 'granted') {
                state.dom.notificationsPermissionStatus.textContent = t('settings.notificationsEnabled', 'Notifications are enabled.');
                state.dom.notificationsPermissionButton.textContent = t('settings.notificationsAllowed', 'Allowed');
                state.dom.notificationsPermissionButton.disabled = true;
            } else if (permission === 'denied') {
                state.dom.notificationsPermissionStatus.textContent = t('settings.notificationsBlocked', 'Notifications are blocked in your browser settings.');
                state.dom.notificationsPermissionButton.textContent = t('settings.notificationsBlockedShort', 'Blocked');
                state.dom.notificationsPermissionButton.disabled = true;
            } else {
                state.dom.notificationsPermissionStatus.textContent = t('settings.notificationsDisabled', 'Notifications are off.');
                state.dom.notificationsPermissionButton.textContent = t('settings.allowNotifications', 'Allow');
                state.dom.notificationsPermissionButton.disabled = false;
            }
        }

        function isSessionExpired(session) {
            if (!session) return true;
            if (!session.expiresAt) return false;
            return Math.floor(Date.now() / 1000) >= Number(session.expiresAt);
        }

        function getValidSession() {
            const now = Math.floor(Date.now() / 1000);
            if (state.sessionToken && state.currentUser?.userId && (!state.sessionExpiresAt || state.sessionExpiresAt > now)) {
                return {
                    userId: state.currentUser.userId,
                    token: state.sessionToken,
                    expiresAt: state.sessionExpiresAt || 0,
                };
            }
            const session = normalizeSession(getStorage().loadSession());
            if (!session) return null;
            if (isSessionExpired(session)) {
                getStorage().clearSession();
                return null;
            }
            state.sessionToken = session.token;
            state.sessionExpiresAt = Number(session.expiresAt || 0);
            return session;
        }

        function getSessionToken() {
            return getValidSession()?.token || null;
        }

        function isCurrentUserBanned() {
            return Boolean(state.currentUser?.isBanned);
        }

        function getCurrentBanReason() {
            return String(state.currentUser?.banReason || 'Your account is banned.');
        }

        function getCurrentPardonRequest() {
            return state.currentUser?.pardonRequest || null;
        }

        function assertUserNotBanned(actionLabel = 'use chats') {
            if (!isCurrentUserBanned()) return true;
            showErrorModal('Account Banned', `${getCurrentBanReason()} You cannot ${actionLabel} right now. Open Settings -> Account to request a recheck.`);
            return false;
        }

        function escapeHtml(text) {
            if (text === null || text === undefined) return '';
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function escapeAttr(text) {
            return escapeHtml(text).replace(/`/g, '&#096;');
        }

        function sanitizeLinkUrl(rawUrl) {
            if (!rawUrl) return null;
            try {
                const parsed = new URL(rawUrl, window.location.origin);
                if (parsed.protocol === 'https:') return parsed.href;
                if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/static/')) {
                    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
                }
            } catch (e) {
                return null;
            }
            return null;
        }

        function sanitizeMediaUrl(rawUrl) {
            return sanitizeLinkUrl(rawUrl);
        }

        function escapeRegex(text) {
            return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function decodeEmojiCodeSequence(sequence) {
            const parts = String(sequence || '').split('-').map((part) => part.trim()).filter(Boolean);
            if (!parts.length) return '';
            try {
                return parts.map((part) => String.fromCodePoint(Number.parseInt(part, 16))).join('');
            } catch (error) {
                return '';
            }
        }

        function buildEmojiRenderMap(entries = []) {
            const renderMap = new Map();
            const sourceEntries = Array.isArray(entries)
                ? entries
                : Array.isArray(entries?.emojis)
                ? entries.emojis
                : Array.isArray(entries?.data)
                ? entries.data
                : [];
            sourceEntries.forEach((entry) => {
                const unified = String(entry?.unified || '').trim();
                if (!unified) return;
                const nonQualified = String(entry?.non_qualified || '').trim();
                const unifiedEmoji = decodeEmojiCodeSequence(unified);
                const nonQualifiedEmoji = decodeEmojiCodeSequence(nonQualified);
                const primaryName = nonQualified || unified;
                const fallbackName = primaryName === unified ? '' : unified;
                const payload = {
                    primarySrc: `${IOS_EMOJI_TEXTURE_BASE}${primaryName}.png`,
                    fallbackSrc: fallbackName ? `${IOS_EMOJI_TEXTURE_BASE}${fallbackName}.png` : '',
                };
                if (unifiedEmoji) renderMap.set(unifiedEmoji, payload);
                if (nonQualifiedEmoji) renderMap.set(nonQualifiedEmoji, payload);
            });
            const emojiKeys = Array.from(renderMap.keys()).sort((a, b) => b.length - a.length);
            state.emojiRenderMap = renderMap;
            state.emojiRenderPattern = emojiKeys.length ? new RegExp(emojiKeys.map(escapeRegex).join('|'), 'gu') : null;
        }

        function updateEmojiDownloadToast(doneCount = 0, totalCount = 0) {
            if (!state.dom.emojiDownloadToast || !state.dom.emojiDownloadProgressBar || !state.dom.emojiDownloadMessage) return;
            if (state.emojiToastHideTimer) {
                clearTimeout(state.emojiToastHideTimer);
                state.emojiToastHideTimer = null;
            }
            const safeTotal = Math.max(0, Number(totalCount || 0));
            const safeDone = Math.max(0, Number(doneCount || 0));
            const percent = safeTotal > 0 ? Math.min(100, Math.round((safeDone / safeTotal) * 100)) : 0;
            state.dom.emojiDownloadToast.classList.remove('hidden');
            state.dom.emojiDownloadProgressBar.style.width = `${percent}%`;
            state.dom.emojiDownloadMessage.textContent = safeTotal > 0
                ? tr('settings.emojiDownloadProgress', 'Cached {done} / {total} emoji textures', { done: safeDone, total: safeTotal })
                : t('settings.emojiDownloadPreparing', 'Preparing emoji cache...');
            if (safeTotal > 0 && safeDone >= safeTotal) {
                state.dom.emojiDownloadMessage.textContent = t('settings.emojiDownloadDone', 'iOS emoji cache is ready.');
                state.emojiToastHideTimer = window.setTimeout(() => {
                    state.dom.emojiDownloadToast?.classList.add('hidden');
                }, 1800);
            }
        }

        function preloadEmojiTextures() {
            if (state.emojiPrefetchStarted || state.currentEmojiMode !== 'ios' || !state.emojiRenderMap.size) return;
            const cacheSignature = `${IOS_EMOJI_MANIFEST_URL}:${state.emojiRenderMap.size}`;
            if (localStorage.getItem(EMOJI_PREFETCH_CACHE_KEY) === cacheSignature) {
                state.emojiPrefetchStarted = true;
                state.emojiPrefetchDone = state.emojiRenderMap.size;
                state.emojiPrefetchTotal = state.emojiRenderMap.size;
                return;
            }
            state.emojiPrefetchStarted = true;
            const queue = Array.from(new Set(Array.from(state.emojiRenderMap.values()).flatMap((entry) => [entry.primarySrc, entry.fallbackSrc]).filter(Boolean)));
            state.emojiPrefetchDone = 0;
            state.emojiPrefetchTotal = queue.length;
            updateEmojiDownloadToast(0, queue.length);
            const concurrency = 6;
            let index = 0;
            const loadNext = () => {
                if (index >= queue.length) return;
                const url = queue[index++];
                const img = new Image();
                const finalize = () => {
                    img.onload = null;
                    img.onerror = null;
                    state.emojiPrefetchDone += 1;
                    updateEmojiDownloadToast(state.emojiPrefetchDone, state.emojiPrefetchTotal);
                    if (state.emojiPrefetchDone >= state.emojiPrefetchTotal && state.emojiPrefetchTotal > 0) {
                        localStorage.setItem(EMOJI_PREFETCH_CACHE_KEY, cacheSignature);
                    }
                    window.setTimeout(loadNext, 30);
                };
                img.onload = finalize;
                img.onerror = finalize;
                img.src = url;
            };
            if (!queue.length) {
                updateEmojiDownloadToast(1, 1);
                return;
            }
            for (let i = 0; i < Math.min(concurrency, queue.length); i += 1) {
                loadNext();
            }
        }

        async function ensureEmojiAssetsLoaded() {
            if (state.currentEmojiMode !== 'ios') return;
            if (state.emojiRenderMap.size && state.emojiRenderPattern) {
                preloadEmojiTextures();
                return;
            }
            if (!state.emojiManifestPromise) {
                state.emojiManifestPromise = fetch(IOS_EMOJI_MANIFEST_URL, { cache: 'force-cache' })
                    .then((response) => {
                        if (!response.ok) throw new Error(`Failed to load emoji manifest (${response.status})`);
                        return response.json();
                    })
                    .then((manifest) => {
                        buildEmojiRenderMap(manifest);
                        preloadEmojiTextures();
                    })
                    .catch((error) => {
                        console.error('Failed to load iOS emoji assets', error);
                        state.emojiManifestPromise = null;
                        state.emojiRenderMap = new Map();
                        state.emojiRenderPattern = null;
                    });
            }
            await state.emojiManifestPromise;
        }

        function replaceEmojiTextNode(textNode) {
            const text = String(textNode?.nodeValue || '');
            const pattern = state.emojiRenderPattern;
            if (!pattern || !text) return null;
            pattern.lastIndex = 0;
            let match;
            let lastIndex = 0;
            let hasEmoji = false;
            const fragment = document.createDocumentFragment();
            while ((match = pattern.exec(text)) !== null) {
                hasEmoji = true;
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                const emojiValue = match[0];
                const emojiAsset = state.emojiRenderMap.get(emojiValue);
                if (emojiAsset?.primarySrc) {
                    const img = document.createElement('img');
                    img.className = 'noveo-emoji-image inline-block';
                    img.src = emojiAsset.primarySrc;
                    img.alt = emojiValue;
                    img.width = 20;
                    img.height = 20;
                    img.loading = 'lazy';
                    img.draggable = false;
                    if (emojiAsset.fallbackSrc) img.setAttribute('data-fallback-src', emojiAsset.fallbackSrc);
                    fragment.appendChild(img);
                } else {
                    fragment.appendChild(document.createTextNode(emojiValue));
                }
                lastIndex = match.index + emojiValue.length;
            }
            if (!hasEmoji) return null;
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
            return fragment;
        }

        function applyEmojiModeToElement(rootNode) {
            if (state.currentEmojiMode !== 'ios' || !state.emojiRenderPattern || !rootNode) return;
            const textNodes = [];
            if (rootNode.nodeType === Node.TEXT_NODE) {
                textNodes.push(rootNode);
            } else {
                const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
                while (walker.nextNode()) {
                    textNodes.push(walker.currentNode);
                }
            }
            textNodes.forEach((node) => {
                const parentTag = node.parentElement?.tagName || '';
                if (parentTag === 'CODE' || parentTag === 'PRE' || parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'TEXTAREA') return;
                if (node.parentElement?.closest('img.noveo-emoji-image')) return;
                const replacement = replaceEmojiTextNode(node);
                if (replacement && node.parentNode) {
                    node.parentNode.replaceChild(replacement, node);
                }
            });
        }

        function restoreEmojiImages(rootNode = document.body) {
            if (!rootNode) return;
            rootNode.querySelectorAll?.('img.noveo-emoji-image').forEach((img) => {
                const emojiText = img.getAttribute('alt') || '';
                img.replaceWith(document.createTextNode(emojiText));
            });
        }

        function ensureEmojiObserver() {
            if (state.emojiObserver || !document.body) return;
            state.emojiObserver = new MutationObserver((mutations) => {
                if (state.currentEmojiMode !== 'ios' || state.emojiObserverBusy) return;
                state.emojiObserverBusy = true;
                try {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'characterData') {
                            applyEmojiModeToElement(mutation.target);
                            return;
                        }
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                                applyEmojiModeToElement(node);
                            }
                        });
                    });
                } finally {
                    state.emojiObserverBusy = false;
                }
            });
            state.emojiObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
        }

        function applyEmojiModeToRenderedHtml(html) {
            if (state.currentEmojiMode !== 'ios' || !state.emojiRenderPattern || !html) return html;
            const container = document.createElement('div');
            container.innerHTML = html;
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
            const textNodes = [];
            while (walker.nextNode()) {
                const currentNode = walker.currentNode;
                const parentTag = currentNode.parentElement?.tagName || '';
                if (parentTag === 'CODE' || parentTag === 'PRE') continue;
                textNodes.push(currentNode);
            }
            textNodes.forEach((node) => {
                const replacement = replaceEmojiTextNode(node);
                if (replacement && node.parentNode) {
                    node.parentNode.replaceChild(replacement, node);
                }
            });
            return container.innerHTML;
        }

        function renderPlainTextWithEmoji(text) {
            return applyEmojiModeToRenderedHtml(escapeHtml(text || ''));
        }

        async function applyEmojiMode(nextMode, persist = true) {
            const normalized = normalizeEmojiMode(nextMode);
            state.currentEmojiMode = normalized;
            if (persist) getStorage().saveEmojiMode(normalized);
            if (normalized === 'ios') {
                await ensureEmojiAssetsLoaded();
                ensureEmojiObserver();
                applyEmojiModeToElement(document.body);
            } else {
                if (state.emojiObserver) {
                    state.emojiObserver.disconnect();
                    state.emojiObserver = null;
                }
                restoreEmojiImages(document.body);
                state.dom.emojiDownloadToast?.classList.add('hidden');
            }
            applyTranslations();
            if (state.isFullyAuthenticated) {
                if (state.currentChat) {
                    openChat(state.currentChat, true);
                } else {
                    ui.renderContactList();
                }
            }
        }

        function isDirectImageUrl(rawUrl) {
            const safeUrl = sanitizeMediaUrl(rawUrl);
            return Boolean(safeUrl && /\.(png|jpe?g|gif|webp|avif|bmp|svg)(?:[?#]|$)/i.test(safeUrl));
        }

        function isDirectVideoUrl(rawUrl) {
            const safeUrl = sanitizeMediaUrl(rawUrl);
            return Boolean(safeUrl && /\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i.test(safeUrl));
        }

        function extractAparatVideoId(rawUrl) {
            if (!rawUrl) return null;
            try {
                const parsed = new URL(rawUrl, window.location.origin);
                if (!/(\.|^)aparat\.com$/i.test(parsed.hostname)) return null;
                return parsed.pathname.match(/\/v\/([a-zA-Z0-9]+)/i)?.[1] || null;
            } catch (e) {
                return null;
            }
        }

        function sanitizeAvatarColor(rawColor) {
            const color = String(rawColor || '').trim();
            return /^#[0-9A-Fa-f]{3,8}$/.test(color) ? color : '#64748b';
        }

        function applyMessageAvatarStyles(rootEl) {
            if (!rootEl) return;
            rootEl.querySelectorAll('.message-avatar').forEach((avatarEl) => {
                const rawUrl = avatarEl.getAttribute('data-avatar-url') || '';
                const safeUrl = sanitizeMediaUrl(rawUrl);
                const safeColor = sanitizeAvatarColor(avatarEl.getAttribute('data-avatar-color'));
                avatarEl.style.backgroundColor = safeColor;
                avatarEl.style.backgroundImage = safeUrl ? `url("${safeUrl.replace(/"/g, '%22')}")` : '';
            });
        }

        function sanitizeRichHtml(html) {
            if (!window.DOMPurify) return html;
            const clean = window.DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'a', 'b', 'strong', 'i', 'em', 's', 'code', 'pre', 'br', 'p', 'div', 'span',
                    'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'video', 'audio',
                    'source', 'button', 'iframe', 'svg', 'path'
                ],
                ALLOWED_ATTR: [
                    'class', 'href', 'target', 'rel', 'title', 'id',
                    'data-handle', 'data-reply-to-id', 'data-type', 'data-url', 'data-urls',
                    'data-action', 'data-code-id', 'data-temp-id', 'data-audio-url', 'data-audio-name',
                    'data-avatar-url', 'data-avatar-color', 'data-fallback-src',
                    'src', 'alt', 'width', 'height', 'draggable', 'controls', 'preload', 'download', 'allowfullscreen',
                    'webkitallowfullscreen', 'mozallowfullscreen', 'frameborder', 'loading',
                    'allow', 'referrerpolicy', 'aria-label', 'aria-hidden', 'viewBox', 'viewbox',
                    'd', 'fill'
                ],
                FORBID_TAGS: ['style', 'script', 'object', 'embed', 'form', 'input', 'meta', 'link'],
                KEEP_CONTENT: true
            });

            const template = document.createElement('template');
            template.innerHTML = clean;

            template.content.querySelectorAll('[href]').forEach((el) => {
                const safe = sanitizeLinkUrl(el.getAttribute('href'));
                if (safe) el.setAttribute('href', safe);
                else el.removeAttribute('href');
            });
            template.content.querySelectorAll('[src]').forEach((el) => {
                const safe = sanitizeMediaUrl(el.getAttribute('src'));
                if (safe) el.setAttribute('src', safe);
                else el.removeAttribute('src');
            });
            template.content.querySelectorAll('[data-url]').forEach((el) => {
                const safe = sanitizeMediaUrl(el.getAttribute('data-url'));
                if (safe) el.setAttribute('data-url', safe);
                else el.removeAttribute('data-url');
            });
            template.content.querySelectorAll('[data-audio-url]').forEach((el) => {
                const safe = sanitizeMediaUrl(el.getAttribute('data-audio-url'));
                if (safe) el.setAttribute('data-audio-url', safe);
                else el.removeAttribute('data-audio-url');
            });
            template.content.querySelectorAll('[data-avatar-url]').forEach((el) => {
                const safe = sanitizeMediaUrl(el.getAttribute('data-avatar-url'));
                el.setAttribute('data-avatar-url', safe || '');
            });
            template.content.querySelectorAll('[data-avatar-color]').forEach((el) => {
                const safeColor = sanitizeAvatarColor(el.getAttribute('data-avatar-color'));
                el.setAttribute('data-avatar-color', safeColor);
            });
            template.content.querySelectorAll('a').forEach((el) => {
                el.setAttribute('rel', 'noopener noreferrer');
                el.setAttribute('target', '_blank');
            });

            return template.innerHTML;
        }
        
        function getVoiceChatModule() {
            return window.NoveoVoiceChat || null;
        }

        function syncVoiceChatModule() {
            const voiceChat = getVoiceChatModule();
            if (!voiceChat) return;
            voiceChat.init({
                serverUrl: SERVER_URL,
                getSocket: () => state.socket,
                getSessionToken: () => getValidSession()?.token || state.sessionToken || '',
                getCurrentUser: () => state.currentUser,
                getCurrentChat: () => state.currentChat,
                getPreferredScreenShareQuality: () => {
                    if (String(state.currentUser?.membershipTier || '').toLowerCase() !== 'premium') {
                        return '480p';
                    }
                    return state.preferredScreenShareQuality === '720p' ? '720p' : '480p';
                },
                getPublicChatId: () => state.PUBLIC_CHAT_ID,
                getUserById: (userId) => state.allUsers[userId],
                showError: showErrorModal,
                renderVoiceUi: (chatId) => {
                    if (chatId && state.currentChat?.chatId === chatId) {
                        ui.renderVoiceUI(chatId);
                    } else if (state.currentChat) {
                        ui.renderVoiceUI(state.currentChat.chatId);
                    }
                    ui.renderContactList();
                },
                showIncomingCallModal: (callData) => ui.showIncomingCallModal(callData),
                closeIncomingCallModal: () => ui.closeIncomingCallModal(),
                updateParticipants: (chatId, participants, options = {}) => {
                    if (!chatId) return;
                    const uniqueParticipants = Array.from(new Set((participants || []).filter(Boolean)));
                    if (options.clear || uniqueParticipants.length === 0) {
                        delete state.activeVoiceChats[chatId];
                    } else {
                        state.activeVoiceChats[chatId] = {
                            ...(state.activeVoiceChats[chatId] || {}),
                            participants: uniqueParticipants
                        };
                    }
                    ui.renderContactList();
                    if (state.currentChat?.chatId === chatId) {
                        ui.renderVoiceUI(chatId);
                    }
                },
                onCallStateChanged: (nextState) => {
                    if (Object.prototype.hasOwnProperty.call(nextState, 'currentVoiceChatId')) {
                        state.currentVoiceChatId = nextState.currentVoiceChatId;
                    }
                    if (Object.prototype.hasOwnProperty.call(nextState, 'connectingVoiceChatId')) {
                        state.connectingVoiceChatId = nextState.connectingVoiceChatId;
                    }
                    if (Object.prototype.hasOwnProperty.call(nextState, 'connectionState')) {
                        state.voiceConnectionState = nextState.connectionState;
                    }
                    if (Object.prototype.hasOwnProperty.call(nextState, 'currentScreenShareOwnerId')) {
                        state.currentScreenShareOwnerId = nextState.currentScreenShareOwnerId;
                    }
                    if (Object.prototype.hasOwnProperty.call(nextState, 'availableScreenShareOwnerIds')) {
                        state.availableScreenShareOwnerIds = Array.isArray(nextState.availableScreenShareOwnerIds)
                            ? nextState.availableScreenShareOwnerIds.filter(Boolean)
                            : [];
                    }
                    if (Object.prototype.hasOwnProperty.call(nextState, 'isLocalScreenSharing')) {
                        state.isLocalScreenSharing = nextState.isLocalScreenSharing;
                    }
                    if (Object.prototype.hasOwnProperty.call(nextState, 'isMuted')) {
                        state.isVoiceMuted = nextState.isMuted;
                    }
                    if (Object.prototype.hasOwnProperty.call(nextState, 'isDeafened')) {
                        state.isVoiceDeafened = nextState.isDeafened;
                    }
                    if (Object.prototype.hasOwnProperty.call(nextState, 'incomingCallData')) {
                        state.incomingCallData = nextState.incomingCallData;
                    }
                    if (state.currentChat) {
                        ui.renderVoiceUI(state.currentChat.chatId);
                    }
                    ui.renderContactList();
                }
            });
        }

        function syncCurrentBanStateUi() {
            if (state.chatSelectionMode) {
                exitChatSelectionMode(false);
            }
            if (state.isFullyAuthenticated) {
                ui.renderContactList();
            }
            if (state.currentChat) {
                openChat(state.currentChat, true);
            }
            if (state.dom.settingsModal && !state.dom.settingsModal.classList.contains('hidden')) {
                ui.updateBanRecheckControls();
            }
        }

        function getPrivateChatPeerId(chat = state.currentChat) {
            if (!chat || chat.chatType !== 'private' || !state.currentUser) return null;
            return (chat.members || []).find(id => id !== state.currentUser.userId) || null;
        }

        function getE2EEChatIdForPeer(peerId) {
            if (!peerId || !state.currentUser) return null;
            return [state.currentUser.userId, peerId].sort().join('_');
        }

        function ensurePrivateChatExists(chatId, peerId) {
            if (!chatId || !peerId || !state.currentUser) return null;
            if (!state.allChats[chatId]) {
                state.allChats[chatId] = {
                    chatId,
                    chatType: 'private',
                    members: [state.currentUser.userId, peerId],
                    messages: [],
                    unreadCount: 0,
                };
            } else if (!Array.isArray(state.allChats[chatId].messages)) {
                state.allChats[chatId].messages = [];
            }
            return state.allChats[chatId];
        }

        function canonicalizePrivateChat(chat = state.currentChat, peerId = getPrivateChatPeerId(chat)) {
            if (!chat || chat.chatType !== 'private' || !peerId) return chat;
            const canonicalChatId = getE2EEChatIdForPeer(peerId);
            if (!canonicalChatId || chat.chatId === canonicalChatId) {
                return ensurePrivateChatExists(chat.chatId, peerId) || chat;
            }
            const existingMessages = Array.isArray(chat.messages) ? chat.messages : [];
            const canonicalChat = ensurePrivateChatExists(canonicalChatId, peerId);
            canonicalChat.messages = [...(canonicalChat.messages || []), ...existingMessages];
            canonicalChat.members = [state.currentUser.userId, peerId];
            canonicalChat.chatType = 'private';
            if (state.allChats[chat.chatId] && chat.chatId.startsWith('temp_')) {
                delete state.allChats[chat.chatId];
            }
            if (state.currentChat?.chatId === chat.chatId) {
                state.currentChat = canonicalChat;
            }
            return canonicalChat;
        }

        function isChatSelectable(chat) {
            return Boolean(chat && chat.chatId && chat.chatId !== state.PUBLIC_CHAT_ID);
        }

        function getSelectedChats() {
            return Array.from(state.selectedChatIds)
                .map(chatId => state.allChats[chatId])
                .filter(Boolean);
        }

        function closeCurrentChatView() {
            state.currentChat = null;
            state.dom.chatArea.classList.add('hidden');
            state.dom.chatArea.classList.remove('flex');
            state.dom.welcomeScreen.classList.remove('hidden');
            state.dom.mainApp.classList.remove('chat-view-active');
            state.dom.chatSearchButton?.classList.add('hidden');
        }

        function removeChatLocally(chatId) {
            if (!chatId) return;
            delete state.allChats[chatId];
            delete state.typingUsers[chatId];
            delete state.messagePages[chatId];
            delete state.chatHistoryState[chatId];
            delete state.e2eeSessions[chatId];
            state.selectedChatIds.delete(chatId);
            if (state.currentChat?.chatId === chatId) {
                closeCurrentChatView();
            }
        }

        function exitChatSelectionMode(render = true) {
            state.chatSelectionMode = false;
            state.selectedChatIds.clear();
            if (render) ui.renderContactList();
            else ui.updateSidebarSelectionHeader();
        }

        function enterChatSelectionMode(chatId) {
            const chat = state.allChats[chatId];
            if (!isChatSelectable(chat)) return;
            state.chatSelectionMode = true;
            state.selectedChatIds.add(chatId);
            ui.renderContactList();
        }

        function toggleChatSelection(chatId) {
            if (!state.chatSelectionMode) return;
            const chat = state.allChats[chatId];
            if (!isChatSelectable(chat)) return;
            if (state.selectedChatIds.has(chatId)) state.selectedChatIds.delete(chatId);
            else state.selectedChatIds.add(chatId);
            if (state.selectedChatIds.size === 0) {
                exitChatSelectionMode();
                return;
            }
            ui.renderContactList();
        }

        function arrayBufferToBase64(buffer) {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            bytes.forEach(byte => { binary += String.fromCharCode(byte); });
            return btoa(binary);
        }

        function base64ToUint8Array(base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        }

        async function generateE2EEKeyPair() {
            return window.crypto.subtle.generateKey(
                { name: 'ECDH', namedCurve: 'P-256' },
                true,
                ['deriveKey']
            );
        }

        async function exportE2EEPublicKey(publicKey) {
            return window.crypto.subtle.exportKey('jwk', publicKey);
        }

        async function importE2EEPublicKey(jwk) {
            return window.crypto.subtle.importKey(
                'jwk',
                jwk,
                { name: 'ECDH', namedCurve: 'P-256' },
                true,
                []
            );
        }

        async function deriveE2EEAesKey(privateKey, publicKey) {
            return window.crypto.subtle.deriveKey(
                { name: 'ECDH', public: publicKey },
                privateKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        }

        async function encryptE2EEText(aesKey, plaintext) {
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const data = new TextEncoder().encode(String(plaintext || ''));
            const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, data);
            return {
                iv: arrayBufferToBase64(iv.buffer),
                data: arrayBufferToBase64(encrypted),
            };
        }

        async function decryptE2EEText(aesKey, encryptedPayload) {
            const iv = base64ToUint8Array(encryptedPayload.iv);
            const data = base64ToUint8Array(encryptedPayload.data);
            const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, data);
            return new TextDecoder().decode(decrypted);
        }

        function addLocalSystemMessage(chatId, text) {
            const chat = state.allChats[chatId];
            if (!chat) return;
            const message = {
                messageId: `system-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                chatId,
                senderId: 'system',
                text,
                content: text,
                timestamp: Math.floor(Date.now() / 1000),
                seenBy: [],
                ephemeral: true,
                e2ee: true,
            };
            chat.messages.push(message);
            if (state.currentChat?.chatId === chatId) {
                state.dom.emptyChatPlaceholder.classList.add('hidden');
                state.dom.emptyChatPlaceholder.classList.remove('flex');
                ui.renderMessage(message);
                if (shouldStickChatToBottom(chatId)) {
                    forceScrollChatToBottom(chatId);
                }
            }
            updateChatMetadata(chatId);
        }

        function getE2EESession(chat = state.currentChat) {
            return chat ? state.e2eeSessions[chat.chatId] || null : null;
        }

        function updateE2EEButton(chat = state.currentChat) {
            const button = state.dom.e2eeToggleButton;
            if (!button) return;
            const isPrivate = Boolean(chat && chat.chatType === 'private');
            button.classList.toggle('hidden', !isPrivate);
            if (!isPrivate) return;

            const session = getE2EESession(chat);
            const active = session?.status === 'active';
            const pending = session?.status === 'pending';
            button.title = active
                ? t('e2ee.disableTitle', 'Disable E2EE Chat')
                : (pending ? t('e2ee.connectingTitle', 'E2EE Chat is connecting') : t('chat.startE2ee', 'Start E2EE Chat'));
            button.classList.toggle('text-blue-600', active || pending);
            button.classList.toggle('text-gray-500', !active && !pending);
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = active ? 'fas fa-lock-open' : (pending ? 'fas fa-hourglass-half' : 'fas fa-lock');
            }
        }

        function isThemeFile(file) {
            return false;
        }

        function parseMessageContent(contentStr) {
            if (typeof contentStr === 'object' && contentStr !== null) {
                return {
                    text: contentStr.text || null,
                    file: contentStr.file || null,
                    theme: contentStr.theme || null,
                    poll: contentStr.poll || null,
                    inlineKeyboard: Array.isArray(contentStr.inlineKeyboard) ? contentStr.inlineKeyboard : null,
                    forwardedInfo: contentStr.forwardedInfo || null,
                    callLog: contentStr.callLog || null,
                    starGiveaway: contentStr.starGiveaway || null,
                    giftGiveaway: contentStr.giftGiveaway || null,
                    securityNotice: contentStr.securityNotice || null,
                    noticeActions: Array.isArray(contentStr.noticeActions) ? contentStr.noticeActions : null
                };
            }
            try {
                const data = JSON.parse(contentStr);
                return {
                    text: data.text || null,
                    file: data.file || null,
                    theme: data.theme || null,
                    poll: data.poll || null,
                    inlineKeyboard: Array.isArray(data.inlineKeyboard) ? data.inlineKeyboard : null,
                    forwardedInfo: data.forwardedInfo || null,
                    callLog: data.callLog || null,
                    starGiveaway: data.starGiveaway || null,
                    giftGiveaway: data.giftGiveaway || null,
                    securityNotice: data.securityNotice || null,
                    noticeActions: Array.isArray(data.noticeActions) ? data.noticeActions : null
                };
            } catch (e) {
                return { text: contentStr, file: null, theme: null, poll: null, inlineKeyboard: null, forwardedInfo: null, callLog: null, starGiveaway: null, giftGiveaway: null, securityNotice: null, noticeActions: null };
            }
        }

        function formatCallLogDuration(totalSeconds) {
            const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
        }

        function getCallLogPresentation(callLog, viewerId) {
            const payload = callLog && typeof callLog === 'object' ? callLog : {};
            const status = String(payload.status || '').toLowerCase();
            const startedByUserId = String(payload.startedByUserId || '');
            const isOutgoing = Boolean(viewerId && startedByUserId && viewerId === startedByUserId);
            if (status === 'missed') {
                return isOutgoing
                    ? {
                        title: t('voice.callLog.outgoingMissed', 'Outgoing call'),
                        preview: t('voice.callLog.outgoingMissed', 'Outgoing call'),
                        detail: t('voice.callLog.noAnswer', 'No answer'),
                        icon: 'fa-phone-slash',
                        iconClass: 'text-amber-500'
                    }
                    : {
                        title: t('voice.callLog.missed', 'Missed call'),
                        preview: t('voice.callLog.missed', 'Missed call'),
                        detail: t('voice.callLog.notAnswered', 'Not answered'),
                        icon: 'fa-phone-slash',
                        iconClass: 'text-red-500'
                    };
            }
            const durationSeconds = Math.max(0, Math.floor(Number(payload.durationSeconds) || 0));
            return {
                title: isOutgoing ? t('voice.callLog.outgoing', 'Outgoing call') : t('voice.callLog.incoming', 'Incoming call'),
                preview: isOutgoing ? t('voice.callLog.outgoing', 'Outgoing call') : t('voice.callLog.incoming', 'Incoming call'),
                detail: durationSeconds > 0 ? formatCallLogDuration(durationSeconds) : t('voice.callLog.connected', 'Connected'),
                icon: 'fa-phone',
                iconClass: 'text-emerald-500'
            };
        }

        function getMessageMatchSignature(message) {
            const parsed = parseMessageContent(message?.content);
            const file = parsed.file || message?.file || null;
            const theme = parsed.theme || message?.theme || null;
            return JSON.stringify({
                text: parsed.text ?? message?.text ?? null,
                fileName: file?.name ?? null,
                fileUrl: file?.url ?? null,
                fileType: file?.type ?? null,
                themeName: theme?.name ?? null,
                callLogId: parsed.callLog?.callId ?? null,
                callLogStatus: parsed.callLog?.status ?? null,
                starGiveawayId: parsed.starGiveaway?.giveawayId ?? null,
                giftGiveawayId: parsed.giftGiveaway?.giveawayId ?? null,
                replyToId: message?.replyToId ?? null,
                senderId: message?.senderId ?? null,
            });
        }

        async function triggerBotCallback(chatId, messageId, callbackData) {
            const token = getSessionToken();
            if (!token || !state.currentUser?.userId) {
                throw new Error(t('error.authRequired', 'Authentication required'));
            }
            const response = await fetch(`${SERVER_URL}/bot/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': state.currentUser.userId,
                    'X-Auth-Token': token,
                },
                body: JSON.stringify({ chatId, messageId, callbackData }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
                throw new Error(result.error || t('bot.callbackFailed', 'Could not send that bot action.'));
            }
            return result;
        }

        async function loadContacts(forceRefresh = false) {
            if (!forceRefresh && state.contactIds.size) return Array.from(state.contactIds);
            const token = getSessionToken();
            if (!token || !state.currentUser?.userId) return [];
            const response = await fetch(`${SERVER_URL}/user/contacts`, {
                headers: {
                    'X-User-ID': state.currentUser.userId,
                    'X-Auth-Token': token,
                },
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) throw new Error(result.error || 'Could not load contacts.');
            const contacts = Array.isArray(result.contacts) ? result.contacts : [];
            state.contactIds = new Set(contacts.map((user) => user.userId).filter(Boolean));
            contacts.forEach((user) => {
                const existingUser = state.allUsers[user.userId] || {};
                const originalUsername = existingUser.originalUsername || user.username;
                const contactName = String(user.contactName || '').trim();
                state.allUsers[user.userId] = {
                    ...existingUser,
                    ...user,
                    originalUsername,
                    username: contactName || user.username,
                    contactName,
                    isContact: true
                };
            });
            state.dataLoaded.contacts = true;
            return contacts;
        }

        async function updateContactMembership(targetUserId, action, extra = {}) {
            const token = getSessionToken();
            if (!token || !state.currentUser?.userId) throw new Error('Authentication required');
            const response = await fetch(`${SERVER_URL}/user/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': state.currentUser.userId,
                    'X-Auth-Token': token,
                },
                body: JSON.stringify({ userId: targetUserId, action, ...extra }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) throw new Error(result.error || 'Could not update contacts.');
            if (action === 'add') {
                state.contactIds.add(targetUserId);
                if (state.allUsers[targetUserId]) {
                    state.allUsers[targetUserId].isContact = true;
                    state.allUsers[targetUserId].originalUsername = state.allUsers[targetUserId].originalUsername || state.allUsers[targetUserId].username;
                    if (extra.saveAs) {
                        state.allUsers[targetUserId].contactName = extra.saveAs;
                        state.allUsers[targetUserId].username = extra.saveAs;
                    }
                }
            } else {
                state.contactIds.delete(targetUserId);
                if (state.allUsers[targetUserId]) {
                    state.allUsers[targetUserId].isContact = false;
                    delete state.allUsers[targetUserId].contactName;
                    if (state.allUsers[targetUserId].originalUsername) {
                        state.allUsers[targetUserId].username = state.allUsers[targetUserId].originalUsername;
                    }
                }
            }
            return true;
        }

        function promptSaveContactName(user) {
            return new Promise((resolve) => {
                const modal = state.dom.saveContactModal;
                const input = state.dom.saveContactNameInput;
                const title = state.dom.saveContactTitle;
                const confirmBtn = state.dom.confirmSaveContactButton;
                const cancelBtn = state.dom.cancelSaveContactButton;
                const closeBtn = state.dom.closeSaveContactModalButton;
                if (!modal || !input || !confirmBtn || !cancelBtn || !closeBtn) {
                    resolve((window.prompt(t('contacts.saveAs', 'Save as'), user?.username || '') || '').trim());
                    return;
                }
                title.textContent = t('contacts.addTitle', 'Add to Contacts');
                confirmBtn.textContent = t('contacts.addAction', 'Add to Contacts');
                input.value = String(user?.username || '').trim();
                const cleanup = (value) => {
                    confirmBtn.removeEventListener('click', onConfirm);
                    cancelBtn.removeEventListener('click', onCancel);
                    closeBtn.removeEventListener('click', onCancel);
                    modal.removeEventListener('click', onBackdrop);
                    ui.closeModal(modal);
                    resolve(value);
                };
                const onConfirm = () => cleanup(input.value.trim());
                const onCancel = () => cleanup('');
                const onBackdrop = (event) => {
                    if (event.target === modal) onCancel();
                };
                confirmBtn.addEventListener('click', onConfirm, { once: true });
                cancelBtn.addEventListener('click', onCancel, { once: true });
                closeBtn.addEventListener('click', onCancel, { once: true });
                modal.addEventListener('click', onBackdrop);
                ui.openModal(modal);
                requestAnimationFrame(() => {
                    input.focus();
                    input.select();
                });
            });
        }

        async function searchPublicDirectory(query) {
            const normalizedQuery = String(query || '').trim();
            if (!normalizedQuery) return [];
            const payload = await authenticatedFetch(`/user/public-search?q=${encodeURIComponent(normalizedQuery)}`);
            return Array.isArray(payload?.results) ? payload.results : [];
        }

        function requestChatMessageSearch(chatId, query, requestId) {
            if (!chatId || !query || state.socket?.readyState !== WebSocket.OPEN) return;
            state.socket.send(JSON.stringify({
                type: 'search_chat_messages',
                chatId,
                query,
                requestId
            }));
        }

        function requestMessageContext(chatId, messageId) {
            if (!chatId || !messageId || state.socket?.readyState !== WebSocket.OPEN) {
                return Promise.resolve(null);
            }
            const requestId = `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            return new Promise((resolve) => {
                state.pendingMessageContextRequests[requestId] = resolve;
                state.socket.send(JSON.stringify({
                    type: 'load_message_context',
                    chatId,
                    messageId,
                    requestId
                }));
                window.setTimeout(() => {
                    if (!state.pendingMessageContextRequests[requestId]) return;
                    const pendingResolve = state.pendingMessageContextRequests[requestId];
                    delete state.pendingMessageContextRequests[requestId];
                    pendingResolve(null);
                }, 5000);
            });
        }

        function searchMessagesInChat(chatId, query) {
            const normalizedQuery = String(query || '').trim().toLowerCase();
            if (!chatId || !normalizedQuery) return [];
            const chat = state.allChats[chatId];
            if (!chat || !Array.isArray(chat.messages)) return [];
            return chat.messages
                .map((message) => normalizeMessage(message))
                .filter((message) => {
                    const text = String(
                        message?.text
                        || message?.file?.name
                        || message?.content?.text
                        || message?.content
                        || ''
                    ).toLowerCase();
                    return text.includes(normalizedQuery);
                })
                .slice(-40)
                .reverse();
        }

        function renderInlineKeyboard(message) {
            const rows = Array.isArray(message?.inlineKeyboard) ? message.inlineKeyboard : [];
            if (!rows.length) return '';
            return `
                <div class="bot-inline-keyboard mt-3">
                    ${rows.map((row) => `
                        <div class="bot-inline-keyboard-row">
                            ${Array.isArray(row) ? row.map((button) => {
                                const text = escapeHtml(button?.text || '');
                                const url = String(button?.url || '').trim();
                                const callbackData = String(button?.callbackData || '').trim();
                                if (!text) return '';
                                if (url) {
                                    return `<a class="bot-inline-button" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                                }
                                if (callbackData) {
                                    return `<button type="button" class="bot-inline-button" data-action="bot-callback" data-message-id="${escapeAttr(message.messageId)}" data-callback-data="${escapeAttr(callbackData)}">${text}</button>`;
                                }
                                return '';
                            }).join('') : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        function findPendingMessageIndex(messages, incomingMessage) {
            const incomingSignature = getMessageMatchSignature(incomingMessage);
            const pendingIndexes = [];
            for (let i = 0; i < messages.length; i += 1) {
                if (messages[i]?.pending) pendingIndexes.push(i);
            }
            const exactIndex = pendingIndexes.find(index => getMessageMatchSignature(messages[index]) === incomingSignature);
            if (exactIndex !== undefined) return exactIndex;
            return pendingIndexes.length ? pendingIndexes[0] : -1;
        }

        function dedupeMessages(messages = []) {
            const ordered = Array.isArray(messages) ? messages : [];
            const bestBySignature = new Map();
            for (const message of ordered) {
                const signature = getMessageMatchSignature(message);
                const current = bestBySignature.get(signature);
                if (!current) {
                    bestBySignature.set(signature, message);
                    continue;
                }
                const currentScore = (current.pending ? 0 : 10) + (String(current.messageId || '').startsWith('temp-') ? 0 : 5);
                const nextScore = (message.pending ? 0 : 10) + (String(message.messageId || '').startsWith('temp-') ? 0 : 5);
                if (nextScore >= currentScore) {
                    bestBySignature.set(signature, message);
                }
            }
            const seenIds = new Set();
            return ordered.filter(message => {
                const signature = getMessageMatchSignature(message);
                const keep = bestBySignature.get(signature) === message;
                const msgId = message?.messageId;
                if (!keep || (msgId && seenIds.has(msgId))) return false;
                if (msgId) seenIds.add(msgId);
                return true;
            });
        }

        function normalizeMessage(message) {
            if (!message || typeof message !== 'object') return message;
            return applyPendingSeenReceipts({
                ...message,
                ...parseMessageContent(message.content),
                seenBy: message.seenBy || [],
                reactions: Array.isArray(message.reactions) ? message.reactions : []
            });
        }

        function normalizeMessages(messages = []) {
            return dedupeMessages((Array.isArray(messages) ? messages : []).map(normalizeMessage));
        }

        function trimChatMessages(chatId, limit = INACTIVE_CHAT_MESSAGE_LIMIT) {
            const chat = state.allChats[chatId];
            if (!chat || !Array.isArray(chat.messages)) return;
            const maxMessages = Math.max(20, Number(limit) || 0);
            if (chat.messages.length <= maxMessages) return;
            chat.messages = chat.messages.slice(-maxMessages);
        }

        function getOldestLoadedMessage(chatId) {
            const messages = state.allChats[chatId]?.messages || [];
            return messages.length ? messages[0] : null;
        }

        function ensureChatHistoryState(chatId, options = {}) {
            const current = state.chatHistoryState[chatId] || {};
            const next = {
                hasMore: typeof options.hasMore === 'boolean' ? options.hasMore : (typeof current.hasMore === 'boolean' ? current.hasMore : true),
                loading: Boolean(options.loading ?? current.loading),
                initialRendered: Boolean(options.initialRendered ?? current.initialRendered),
                lastRequestedBefore: Object.prototype.hasOwnProperty.call(options, 'lastRequestedBefore')
                    ? options.lastRequestedBefore
                    : (current.lastRequestedBefore ?? null)
            };
            state.chatHistoryState[chatId] = next;
            return next;
        }

        function normalizePinnedMessage(message) {
            if (!message || typeof message !== 'object') return null;
            return normalizeMessage(message);
        }

        function isLikelyVoiceAttachment(name, url) {
            const combined = `${name || ''} ${url || ''}`.toLowerCase();
            if (!combined) return false;
            const hasVoicePattern = /\bvoice[-_\s]?message\b/.test(combined);
            const hasVoiceExt = /\.(webm|ogg)(?:[?#]|$)/.test(combined);
            return hasVoicePattern && hasVoiceExt;
        }

        function getMessageReactionState(message) {
            const reactions = Array.isArray(message?.reactions) ? message.reactions : [];
            return reactions.map((entry) => {
                const userIds = Array.isArray(entry?.userIds) ? entry.userIds : [];
                return {
                    emoji: String(entry?.emoji || ''),
                    count: Number(entry?.count || userIds.length || 0),
                    userIds,
                    mine: Boolean(state.currentUser?.userId && userIds.includes(state.currentUser.userId))
                };
            }).filter((entry) => entry.emoji && entry.count > 0);
        }

        function renderMessageReactions(message) {
            const reactions = getMessageReactionState(message);
            if (!reactions.length) return '';
            return `
                <div class="message-reactions-row">
                    ${reactions.map((entry) => `
                        <button
                            type="button"
                            class="message-reaction-chip ${entry.mine ? 'is-active' : ''}"
                            data-action="toggle-reaction"
                            data-reaction="${escapeAttr(entry.emoji)}"
                            title="${escapeAttr(entry.emoji)}"
                        >
                            <span class="message-reaction-emoji">${escapeHtml(entry.emoji)}</span>
                            <span class="message-reaction-count">${escapeHtml(localizeDigits(entry.count))}</span>
                        </button>
                    `).join('')}
                </div>
            `;
        }

        function applyMessageReactionUpdate(chatId, messageId, reactions) {
            const chat = state.allChats[chatId];
            if (!chat) return;
            const target = chat.messages?.find((message) => String(message.messageId) === String(messageId));
            if (!target) return;
            target.reactions = Array.isArray(reactions) ? reactions : [];
            if (state.currentChat?.chatId === chatId) {
                ui.renderMessage(target);
            }
        }

        function toggleMessageReaction(messageId, reaction) {
            const message = findMessage(state.currentChat?.chatId, messageId);
            if (!message || !state.currentChat || !reaction || !state.socket || state.socket.readyState !== WebSocket.OPEN) return;
            state.socket.send(JSON.stringify({
                type: 'toggle_reaction',
                chatId: state.currentChat.chatId,
                messageId,
                reaction
            }));
        }

        function isVoiceRecorderFileName(name) {
            const raw = String(name || '').trim();
            return /^voice[-_\s]?message(?:\.(webm|ogg))?$/i.test(raw);
        }

        function extractUrls(text) {
            if (!text) return [];
            // First, remove markdown links to avoid double-processing
            let cleanText = text.replace(/\[([^\]]*)\]\(([^)]+)\)/g, '');
            // Then extract URLs - improved regex to handle trailing slashes and various URL formats
            const urlRegex = /(https?:\/\/[^\s<>\"]+)/gi;
            const urls = cleanText.match(urlRegex) || [];
            // Clean up URLs - remove trailing punctuation that might have been included
            return urls.map(url => {
                // Remove trailing punctuation except for valid URL characters
                url = url.replace(/[.,;:!?]+$/, '');
                return url.trim();
            }).filter(url => {
                // Validate it's actually a URL
                try {
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            }).filter((url, index, self) => self.indexOf(url) === index);
        }
	
		async function fetchUrlMetadata(url) {
			try {
				// Validate URL
				try {
					new URL(url);
				} catch (e) {
					return null;
				}
				
				// Use LOCAL CORS proxy (replace with your XAMPP server address)
				// If running on same server as the chat app, use relative path
				// If running on different server, use absolute URL
				const proxyUrl = `https://noveo.ir/cors-proxy.php?url=${encodeURIComponent(url)}`;
				
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
				
				const response = await fetch(proxyUrl, { 
					signal: controller.signal,
					headers: {
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
					}
				});
				
				clearTimeout(timeoutId);
				
				if (!response.ok) return null;
				
				const data = await response.json();
				
				if (!data.contents) return null;
				
				const html = data.contents;
				const parser = new DOMParser();
				const doc = parser.parseFromString(html, 'text/html');
				
				const getMetaContent = (property) => {
					const meta = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
					return meta ? meta.getAttribute('content') : null;
				};
				
				const title = getMetaContent('og:title') || doc.querySelector('title')?.textContent || new URL(url).hostname;
				
				// Only return metadata if we have at least a title
				if (!title) return null;
				
				let image = getMetaContent('og:image') || getMetaContent('twitter:image') || '';
				// Convert relative image URLs to absolute
				if (image && !image.startsWith('http')) {
					try {
						const baseUrl = new URL(url);
						image = new URL(image, baseUrl.origin).href;
					} catch (e) {
						image = '';
					}
				}
				
				return {
					title: title.trim(),
					description: (getMetaContent('og:description') || getMetaContent('description') || '').trim(),
					image: image,
					url: url,
					siteName: getMetaContent('og:site_name') || new URL(url).hostname.replace('www.', '')
				};
			} catch (error) {
				if (error.name !== 'AbortError') {
					console.error('Error fetching URL metadata:', error);
				}
				return null;
			}
		}


        const urlMetadataCache = {};
        
        async function getUrlMetadata(url) {
            if (urlMetadataCache[url]) {
                return urlMetadataCache[url];
            }
            
            const metadata = await fetchUrlMetadata(url);
            if (metadata) {
                urlMetadataCache[url] = metadata;
            }
            return metadata;
        }

		
		function parseMarkdown(text) {
			if (!text) return '';

			const codeBlockPlaceholders = [];
			const inlineCodePlaceholders = [];

			text = text.replace(/```([a-zA-Z0-9]*)\n?([\s\S]*?)```/g, (match, language, code) => {
				const placeholder = `{{CODEBLOCK_${codeBlockPlaceholders.length}}}`;
				const lang = (language || 'text').trim();
				const highlighted = window.CodeHighlighter ? window.CodeHighlighter.highlight(code.trim(), lang) : escapeHtml(code.trim());
				const blockId = 'code-' + Math.random().toString(36).slice(2, 11);
				codeBlockPlaceholders.push(
					`<div class="code-block-container">
						<div class="code-block-header">
							<span class="code-block-language">${escapeHtml(lang)}</span>
							<button class="code-block-copy" data-action="copy-code" data-code-id="${escapeAttr(blockId)}">
								<i class="fas fa-copy"></i> Copy
							</button>
						</div>
						<div class="code-block-content">
							<pre><code id="${escapeAttr(blockId)}">${highlighted}</code></pre>
						</div>
					</div>`
				);
				return placeholder;
			});

			text = text.replace(/`([^`]+)`/g, (match, code) => {
				const placeholder = `{{INLINECODE_${inlineCodePlaceholders.length}}}`;
				inlineCodePlaceholders.push(`<code>${escapeHtml(code)}</code>`);
				return placeholder;
			});

			let escapedText = escapeHtml(text);

			escapedText = escapedText.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<b>$1$2</b>');
			escapedText = escapedText.replace(/\*(.*?)\*|_(.*?)_/g, '<i>$1$2</i>');
			escapedText = escapedText.replace(/~(.*?)~/g, '<s>$1</s>');
			escapedText = escapedText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
			escapedText = escapedText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
			escapedText = escapedText.replace(/^# (.*$)/gim, '<h1>$1</h1>');

			const linkPlaceholders = [];
			escapedText = escapedText.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (match, linkText, url) => {
				const safeUrl = sanitizeLinkUrl(url);
				if (!safeUrl) return escapeHtml(linkText);
				const placeholder = `{{LINK_${linkPlaceholders.length}}}`;
				linkPlaceholders.push(`<a href="${escapeAttr(safeUrl)}" class="text-blue-300 hover:underline">${escapeHtml(linkText)}</a>`);
				return placeholder;
			});

			escapedText = escapedText.replace(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi, (match) => {
				if (match.includes('{{LINK_') || match.includes('{{CODEBLOCK_') || match.includes('{{INLINECODE_')) return match;
				const safeUrl = sanitizeLinkUrl(match);
				if (!safeUrl) return escapeHtml(match);
				return `<a href="${escapeAttr(safeUrl)}" class="text-blue-300 hover:underline">${escapeHtml(match)}</a>`;
			});

			linkPlaceholders.forEach((link, index) => {
				escapedText = escapedText.replace(`{{LINK_${index}}}`, link);
			});

			escapedText = escapedText.replace(/@([a-zA-Z0-9_]+)(?!:\/\/)/g, '<span class="channel-handle" data-handle="@$1">@$1</span>');

			codeBlockPlaceholders.forEach((code, index) => {
				escapedText = escapedText.replace(`{{CODEBLOCK_${index}}}`, code);
			});
			inlineCodePlaceholders.forEach((code, index) => {
				escapedText = escapedText.replace(`{{INLINECODE_${index}}}`, code);
			});

			escapedText = escapedText.replace(/\n/g, '<br>');
			return sanitizeRichHtml(applyEmojiModeToRenderedHtml(escapedText));
		}

        document.addEventListener('error', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLImageElement) || !target.classList.contains('noveo-emoji-image')) return;
            const fallbackSrc = target.getAttribute('data-fallback-src') || '';
            if (fallbackSrc && target.src !== new URL(fallbackSrc, window.location.origin).href) {
                target.src = fallbackSrc;
                target.removeAttribute('data-fallback-src');
            }
        }, true);

		function renderVoiceMessage(message) {
            const safeVoiceUrl = sanitizeMediaUrl(message.voiceUrl) || '';
			return `
				<div class="flex items-center gap-3 bg-gray-100 p-3 rounded-lg max-w-xs">
					<button class="play-voice-btn w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
							data-voice-url="${escapeAttr(safeVoiceUrl)}">
						<i class="fas fa-play"></i>
					</button>
					<div class="flex-1">
						<div class="h-8 flex items-center">
							<!-- Waveform visualization (optional) -->
							<div class="flex gap-0.5 items-center h-full">
								${Array(20).fill().map(() => `
									<div class="w-1 bg-blue-400 rounded" style="height: ${Math.random() * 100}%"></div>
								`).join('')}
							</div>
						</div>
						<p class="text-xs text-gray-600 mt-1">${formatDuration(message.duration)}</p>
					</div>
				</div>
			`;
		}

		// Play voice message
		document.addEventListener('click', (e) => {
			if (e.target.closest('.play-voice-btn')) {
				const btn = e.target.closest('.play-voice-btn');
				const voiceUrl = btn.dataset.voiceUrl;

				const audio = new Audio(voiceUrl);
				audio.play();

				// Change icon to pause
				btn.innerHTML = '<i class="fas fa-pause"></i>';

				audio.onended = () => {
					btn.innerHTML = '<i class="fas fa-play"></i>';
				};
			}
		});
		
		function renderUsernameWithTag(rawUsername) {
			return renderUsernameWithTagAndFont(rawUsername, '');
		}

        function normalizeNicknameFont(value = '') {
            const normalized = String(value || '').trim().toLowerCase().replace(/-/g, '_');
            return PROFILE_FONT_OPTIONS.some((entry) => entry.value === normalized) ? normalized : '';
        }

        function normalizeProfileSkin(value = null) {
            if (!value || typeof value !== 'object') return null;
            const mode = String(value.mode || '').trim().toLowerCase();
            if (mode === 'solid') {
                const color = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value.color || '').trim()) ? String(value.color).trim() : '';
                return color ? { mode: 'solid', color } : null;
            }
            if (mode === 'gradient') {
                const colors = Array.isArray(value.colors)
                    ? value.colors.map((entry) => String(entry || '').trim()).filter((entry) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(entry)).slice(0, 3)
                    : [];
                if (colors.length < 2) return null;
                const angle = Number.isFinite(Number(value.angle)) ? Math.max(0, Math.min(360, Number(value.angle))) : 135;
                return { mode: 'gradient', colors, angle };
            }
            return null;
        }

        function getProfileSkinBackground(value = null) {
            const skin = normalizeProfileSkin(value);
            if (!skin) return '';
            if (skin.mode === 'solid') return skin.color;
            return `linear-gradient(${skin.angle}deg, ${skin.colors.join(', ')})`;
        }

        function buildProfileSkinFromInputs() {
            const skinMode = String(state.dom.profileSkinModeSelect?.value || '').trim().toLowerCase();
            const primarySkinColor = String(state.dom.profileSkinColorPrimary?.value || '').trim();
            const secondarySkinColor = String(state.dom.profileSkinColorSecondary?.value || '').trim();
            const tertiarySkinColor = String(state.dom.profileSkinColorTertiary?.value || '').trim();
            const gradientStops = Number.parseInt(String(state.dom.profileSkinGradientStopsSelect?.value || '2'), 10) === 3 ? 3 : 2;
            if (skinMode === 'solid') return normalizeProfileSkin({ mode: 'solid', color: primarySkinColor });
            if (skinMode === 'gradient') {
                const colors = [primarySkinColor, secondarySkinColor];
                if (gradientStops === 3) colors.push(tertiarySkinColor);
                return normalizeProfileSkin({ mode: 'gradient', colors, angle: 135 });
            }
            return null;
        }

        function syncProfileSkinControls(skin = null) {
            const mode = String(state.dom.profileSkinModeSelect?.value || '').trim().toLowerCase();
            const isGradient = mode === 'gradient';
            const gradientStops = Number.parseInt(String(state.dom.profileSkinGradientStopsSelect?.value || '2'), 10) === 3 ? 3 : 2;
            state.dom.profileSkinGradientStopsWrap?.classList.toggle('hidden', !isGradient);
            state.dom.profileSkinColorSecondaryWrap?.classList.toggle('hidden', !isGradient);
            state.dom.profileSkinColorTertiaryWrap?.classList.toggle('hidden', !isGradient || gradientStops !== 3);
            applyProfileSkinToSurface(state.dom.settingsProfileSheet, skin ?? buildProfileSkinFromInputs());
        }

        function applyProfileSkinToSurface(surfaceEl, skin) {
            if (!surfaceEl) return;
            const background = getProfileSkinBackground(skin);
            surfaceEl.style.setProperty('--profile-skin-bg', background || 'none');
            surfaceEl.classList.toggle('profile-skin-active', Boolean(background));
        }

        function normalizePremiumStarIcon(value = null) {
            if (!value || typeof value !== 'object') return null;
            const url = sanitizeMediaUrl(value.url || '');
            const source = String(value.source || '').trim().toLowerCase();
            const type = String(value.type || '').trim().toLowerCase() === 'tgs' ? 'tgs' : 'image';
            if (!url || !['saved', 'template'].includes(source)) return null;
            return { url, type, source, templateId: String(value.templateId || '').trim() || '' };
        }

        function renderPremiumStarIconMedia(icon, className = 'membership-star-media') {
            const normalized = normalizePremiumStarIcon(icon);
            if (!normalized) return '<i class="fas fa-star"></i>';
            if (normalized.type === 'tgs') {
                return createTgsMarkup(normalized.url, 'Premium', className);
            }
            return `<img src="${escapeAttr(normalized.url)}" alt="${escapeAttr(t('premium.title', 'Premium'))}" class="${className}">`;
        }

        function getNicknameFontClass(nicknameFont = '') {
            const normalized = normalizeNicknameFont(nicknameFont);
            return normalized ? `nickname-font nickname-font-${normalized}` : 'nickname-font';
        }

		function renderUsernameWithTagAndFont(rawUsername, nicknameFont = '') {
			if (!rawUsername) return '';
			const usernameRegex = /^(.*?) \[\s*#([0-9a-fA-F]{3,6})\s*,\s*"([^"]+)"\s*\]$/;
			const match = rawUsername.match(usernameRegex);
            const nameClass = getNicknameFontClass(nicknameFont);

			if (match) {
				const displayName = match[1].trim();
				let color = `#${match[2]}`;
				const tagText = match[3];
				const isValidColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(color);
				if (!isValidColor) color = '#3b82f6';
				const safeDisplayName = escapeHtml(displayName);
				const safeTagText = escapeHtml(tagText);
				return `<span class="${nameClass}">${safeDisplayName}</span><span class="custom-user-tag" style="background-color: ${color};">${safeTagText}</span>`;
			}

			return `<span class="${nameClass}">${escapeHtml(rawUsername)}</span>`;
		}

        function renderVerifiedBadge(title = t('chat.verified', 'Verified')) {
            return ` <span class="verified-badge" title="${escapeAttr(title)}" aria-label="${escapeAttr(title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.3 2.9c.1.1.2.1.3.2.7.6 1.3 1.1 2 1.7.3.2.6.4.9.4.9.1 1.7.2 2.6.2.5 0 .6.1.7.7.1.9.1 1.8.2 2.6 0 .4.2.7.4 1 .6.7 1.1 1.3 1.7 2 .3.4.3.5 0 .8-.5.6-1.1 1.3-1.6 1.9-.3.3-.5.7-.5 1.2-.1.8-.2 1.7-.2 2.5 0 .4-.2.5-.6.6-.8 0-1.6.1-2.5.2-.5 0-1 .2-1.4.5-.6.5-1.3 1.1-1.9 1.6-.3.3-.5.3-.8 0-.7-.6-1.4-1.2-2-1.8-.3-.2-.6-.4-.9-.4-.9-.1-1.8-.2-2.7-.2-.4 0-.5-.2-.6-.5 0-.9-.1-1.7-.2-2.6 0-.4-.2-.8-.4-1.1-.6-.6-1.1-1.3-1.6-2-.4-.4-.3-.5 0-1 .6-.6 1.1-1.3 1.7-1.9.3-.3.4-.6.4-1 0-.8.1-1.6.2-2.5 0-.5.1-.6.6-.6.9-.1 1.7-.1 2.6-.2.4 0 .7-.2 1-.4.7-.6 1.4-1.2 2.1-1.7.1-.2.3-.3.5-.2z" fill="currentColor"></path><path d="M16.4 10.1l-.2.2-5.4 5.4c-.1.1-.2.2-.4 0l-2.6-2.6c-.2-.2-.1-.3 0-.4.2-.2.5-.6.7-.6.3 0 .5.4.7.6l1.1 1.1c.2.2.3.2.5 0l4.3-4.3c.2-.2.4-.3.6 0 .1.2.3.3.4.5.2 0 .3.1.3.1z" fill="#ffffff"></path></svg></span>`;
        }

        function renderBotBadge() {
            return ` <span class="custom-user-tag bot-user-tag">${escapeHtml(t('bot.tag', 'Bot'))}</span>`;
        }

        function shouldHideBuiltInBotTag(rawName = '') {
            const normalized = String(rawName || '').trim().toLowerCase();
            return normalized === 'mail' || normalized === 'noveo';
        }

        function renderMembershipTierBadge(membershipTier = '', premiumStarIcon = null, interactive = false) {
            const tier = String(membershipTier || '').toLowerCase();
            if (tier === 'silver') return ` <span class="membership-star-badge is-silver${interactive ? ' is-actionable' : ''}" ${interactive ? 'data-membership-badge="1" data-membership-tier="silver" role="button" tabindex="0"' : 'aria-hidden="true"'}><i class="fas fa-star"></i></span>`;
            if (tier === 'premium') return ` <span class="membership-star-badge is-premium${interactive ? ' is-actionable' : ''}" ${interactive ? 'data-membership-badge="1" data-membership-tier="premium" data-premium-badge="1" role="button" tabindex="0"' : 'aria-hidden="true"'}>${renderPremiumStarIconMedia(premiumStarIcon)}</span>`;
            return '';
        }

        function renderDisplayName(rawName, isVerified = false, isBot = false, membershipTier = '', nicknameFont = '', premiumStarIcon = null, interactivePremiumBadge = false) {
            return `${renderUsernameWithTagAndFont(rawName, nicknameFont)}${renderMembershipTierBadge(membershipTier, premiumStarIcon, interactivePremiumBadge)}${(isBot && !shouldHideBuiltInBotTag(rawName)) ? renderBotBadge() : ''}${isVerified ? renderVerifiedBadge() : ''}`;
        }

        function renderPlainDisplayName(rawName, isVerified = false, isBot = false, membershipTier = '', nicknameFont = '', premiumStarIcon = null, interactivePremiumBadge = false) {
            return `<span class="${getNicknameFontClass(nicknameFont)}">${escapeHtml(rawName || '')}</span>${renderMembershipTierBadge(membershipTier, premiumStarIcon, interactivePremiumBadge)}${(isBot && !shouldHideBuiltInBotTag(rawName)) ? renderBotBadge() : ''}${isVerified ? renderVerifiedBadge() : ''}`;
        }

        function applyNicknameFontPreview(fontValue = '') {
            const input = state.dom.editUsernameInput;
            if (!input) return;
            input.classList.remove('nickname-font', ...PROFILE_FONT_OPTIONS.filter((entry) => entry.value).map((entry) => `nickname-font-${entry.value}`));
            const normalized = normalizeNicknameFont(fontValue);
            if (normalized) {
                input.classList.add('nickname-font', `nickname-font-${normalized}`);
            }
        }

        function shouldAnonymizeChannelSender(chat = state.currentChat) {
            return Boolean(chat && chat.chatType === 'channel' && chat.ownerId !== state.currentUser?.userId);
        }

        function getMessageSenderName(message, chat = state.currentChat) {
            if (!message || message.senderId === 'system') return t('message.someone', 'Someone');
            if (shouldAnonymizeChannelSender(chat) && message.senderId !== state.currentUser?.userId) {
                return t('message.someone', 'Someone');
            }
            const sender = state.allUsers[message.senderId];
            if (sender) {
                return sender.userId === state.currentUser?.userId ? t('message.you', 'You') : sender.username;
            }
            return message.senderName || message.username || t('message.someone', 'Someone');
        }

        function getPrivateChatOtherUser(chat = state.currentChat) {
            if (!chat || chat.chatType !== 'private' || !Array.isArray(chat.members)) return null;
            const otherUserId = chat.members.find((id) => id !== state.currentUser?.userId);
            return otherUserId ? state.allUsers[otherUserId] || null : null;
        }

        function shouldShowBotStart(chat = state.currentChat) {
            const otherUser = getPrivateChatOtherUser(chat);
            if (!otherUser?.isBot || otherUser.userId === 'system') return false;
            const messages = Array.isArray(chat?.messages) ? chat.messages : [];
            return !messages.some((message) => String(message?.senderId || '') === String(state.currentUser?.userId || ''));
        }

        function renderEmptyChatPlaceholder(chat = state.currentChat) {
            if (!state.dom.emptyChatPlaceholder) return;
            const otherUser = getPrivateChatOtherUser(chat);
            if (shouldShowBotStart(chat) && otherUser) {
                state.dom.emptyChatPlaceholder.innerHTML = `
                    <div class="bot-start-card text-center shadow-lg">
                        <p class="font-semibold">${escapeHtml(tr('bot.startPrompt', 'Start chatting with {name}', { name: otherUser.username || t('bot.title', 'Bot') }))}</p>
                        <p class="text-sm opacity-90 mt-2">${escapeHtml(t('bot.startPromptSub', 'Press Start to send /start and activate the bot conversation.'))}</p>
                        <button type="button" class="mt-4 rounded-xl btn-success px-5 py-2 font-semibold interactive-pop" data-action="start-bot-chat">${escapeHtml(t('bot.start', 'Start'))}</button>
                    </div>
                `;
                state.dom.emptyChatPlaceholder.querySelector('[data-action="start-bot-chat"]')?.addEventListener('click', () => {
                    if (!state.currentChat) return;
                    sendMessage('/start');
                });
                return;
            }
            state.dom.emptyChatPlaceholder.innerHTML = `
                <div class="bg-gray-900 bg-opacity-20 text-white p-4 rounded-lg text-center shadow-lg">
                    <p class="font-semibold">${escapeHtml(t('chat.noMessages', 'No messages here yet.'))}</p>
                    <p class="text-sm opacity-90">${escapeHtml(t('chat.noMessagesSub', 'Send a message or say hi to start the conversation!'))}</p>
                </div>
            `;
        }

        function isMessageSenderVerified(message, chat = state.currentChat) {
            if (!message || shouldAnonymizeChannelSender(chat)) return false;
            return Boolean(state.allUsers[message.senderId]?.isVerified);
        }

        function truncateInlinePreview(value, maxLength = 140) {
            const text = String(value ?? '').replace(/\s+/g, ' ').trim();
            if (!text) return '';
            return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
        }

        function renderSecurityNoticeCard(msg) {
            const actions = Array.isArray(msg.noticeActions) ? msg.noticeActions : [];
            const buttonsHtml = actions.map((action) => {
                const actionId = String(action?.id || '').trim();
                if (!actionId) return '';
                const fallbackLabel = String(action?.fallbackLabel || actionId);
                const label = action?.labelKey ? t(action.labelKey, fallbackLabel) : fallbackLabel;
                const sessionId = action?.sessionId ? ` data-session-id="${escapeAttr(action.sessionId)}"` : '';
                const toneClass = actionId === 'logout_session'
                    ? 'security-notice-button security-notice-button-danger'
                    : 'security-notice-button security-notice-button-neutral';
                return `<button class="${toneClass}" data-action="${escapeAttr(actionId)}" data-message-id="${escapeAttr(msg.messageId || '')}"${sessionId}>${escapeHtml(label)}</button>`;
            }).join('');
            return `
                <div class="security-notice-card">
                    <div class="security-notice-icon"><i class="fas fa-shield-alt"></i></div>
                    <div class="security-notice-copy">${parseMarkdown(msg.text || '')}</div>
                    ${buttonsHtml ? `<div class="security-notice-actions">${buttonsHtml}</div>` : ''}
                </div>
            `;
        }


        function dismissErrorToast(immediate = false) {
            const toast = state.dom.errorToast;
            if (!toast) return;
            if (errorToastTimer) {
                clearTimeout(errorToastTimer);
                errorToastTimer = null;
            }
            toast.classList.remove('toast-enter', 'toast-exit');
            void toast.offsetWidth;
            toast.classList.add('toast-exit');
            window.setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('flex', 'toast-exit', 'toast-success');
            }, immediate ? 140 : 220);
        }

        function showToastModal(title, message, tone = 'error') {
            const toast = state.dom.errorToast;
            const toastTitle = state.dom.errorToastTitle;
            const toastMessage = state.dom.errorToastMessage;
            if (!toast || !toastTitle || !toastMessage) {
                alert(`${title}\n\n${message}`);
                return;
            }
            if (errorToastTimer) {
                clearTimeout(errorToastTimer);
                errorToastTimer = null;
            }
            toast.classList.remove('hidden', 'toast-enter', 'toast-exit', 'toast-success');
            toast.classList.add('flex');
            if (tone === 'success') {
                toast.classList.add('toast-success');
            }
            toastTitle.textContent = title;
            toastMessage.textContent = message;
            void toast.offsetWidth;
            toast.classList.add('toast-enter');
            errorToastTimer = window.setTimeout(() => {
                dismissErrorToast(false);
            }, 2800);
        }

        function showErrorModal(title, message) {
            showToastModal(title, message, 'error');
        }

        function showSuccessModal(title, message) {
            showToastModal(title, message, 'success');
        }

        function removeMessageFromChatState(chatId, messageId) {
            const chat = state.allChats[chatId];
            if (!chat) return;
            chat.messages = (chat.messages || []).filter(m => m.messageId !== messageId);
            if (chat.pinnedMessage?.messageId === messageId) {
                chat.pinnedMessage = null;
            }
            if (state.currentChat?.chatId === chatId) {
                const messageEl = document.querySelector(`.message-wrapper[data-msg-id="${messageId}"]`);
                if (messageEl) {
                    cleanupAnimatedMedia(messageEl);
                    messageEl.remove();
                }
                if ((chat.messages || []).length === 0) {
                    state.dom.emptyChatPlaceholder.classList.remove('hidden');
                    state.dom.emptyChatPlaceholder.classList.add('flex');
                } else {
                    state.dom.emptyChatPlaceholder.classList.add('hidden');
                    state.dom.emptyChatPlaceholder.classList.remove('flex');
                }
                ui.renderPinnedBar(chat);
            }
            updateChatMetadata(chatId);
        }

        function requestMessageDelete(messageId, scope = 'everyone') {
            if (!state.currentChat || !messageId || state.socket?.readyState !== WebSocket.OPEN) return;
            state.socket.send(JSON.stringify({
                type: 'delete_message',
                messageId,
                chatId: state.currentChat.chatId,
                scope
            }));
        }

        function canDeleteMessage(message, chat = state.currentChat) {
            if (isCurrentUserBanned()) return false;
            if (!chat || !message || message.pending || message.e2ee) return false;
            if (chat.chatType === 'private') return true;
            if (message.senderId === 'system') return false;
            if (message.senderId === state.currentUser?.userId) return true;
            return chat.chatType === 'channel' && chat.ownerId === state.currentUser?.userId;
        }

        function canForwardMessage(message) {
            if (isCurrentUserBanned()) return false;
            return Boolean(message && !message.pending && !message.e2ee && message.senderId !== 'system');
        }

        function canReplyMessage(message) {
            if (isCurrentUserBanned()) return false;
            return Boolean(
                message &&
                !message.pending &&
                message.senderId !== 'system' &&
                !String(message.messageId || '').startsWith('temp-')
            );
        }

        function chatSupportsSeenReceipts(chat = state.currentChat) {
            if (!chat) return false;
            if (chat.chatType === 'private') return true;
            if (chat.chatType === 'channel') return true;
            return chat.seenReceiptsEnabled !== false;
        }

        function canViewSeenBy(message) {
            const messageChat = message?.chatId ? state.allChats[message.chatId] || state.currentChat : state.currentChat;
            return Boolean(
                message &&
                messageChat?.chatType !== 'channel' &&
                message.senderId === state.currentUser?.userId &&
                !message.pending &&
                message.senderId !== 'system' &&
                !String(message.messageId || '').startsWith('temp-') &&
                chatSupportsSeenReceipts(messageChat)
            );
        }

        function canReportMessage(message) {
            if (isCurrentUserBanned()) return false;
            return Boolean(
                message &&
                !message.pending &&
                !message.e2ee &&
                message.senderId !== 'system' &&
                message.senderId !== state.currentUser?.userId &&
                !String(message.messageId || '').startsWith('temp-')
            );
        }

        function canOpenMessageActionSheet(message) {
            return canReplyMessage(message) || canViewSeenBy(message) || canForwardMessage(message) || canDeleteMessage(message) || canReportMessage(message);
        }

        function pruneReportActionTimestamps() {
            const now = Date.now();
            state.reportActionTimestamps = state.reportActionTimestamps.filter(ts => (now - ts) < REPORT_ACTION_WINDOW_MS);
            return state.reportActionTimestamps;
        }

        function noteReportActionAttempt() {
            pruneReportActionTimestamps();
            state.reportActionTimestamps.push(Date.now());
        }

        function getMessageModerationSummary(message) {
            if (!message) return t('message.unknownMessage', 'Unknown message');
            if (message.theme) return tr('message.themeSummary', 'Theme: {name}', { name: message.theme.name || t('message.themeFallback', 'Theme') });
            if (message.poll) return tr('polls.summary', 'Poll: {question}', { question: message.poll.question || t('polls.title', 'Poll') });
            if (message.file) return tr('message.fileSummary', 'File: {name}', { name: message.file.name || t('message.attachment', 'Attachment') });
            return String(message.text || '').trim() || t('message.noText', '[No text]');
        }

        function promptDmMessageDeleteScope() {
            return new Promise((resolve) => {
                const existing = document.getElementById('dmMessageDeleteModal');
                if (existing) existing.remove();
                const modal = document.createElement('div');
                modal.id = 'dmMessageDeleteModal';
                modal.className = 'fixed inset-0 modal-bg items-center justify-center z-[80] p-4 flex';
                modal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl w-full max-w-sm modal-content">
                        <div class="p-5 border-b border-gray-200">
                            <h3 class="font-bold text-lg">${escapeHtml(t('chat.deleteMessageTitle', 'Delete Message'))}</h3>
                            <p class="text-sm text-gray-500 mt-2">${escapeHtml(t('chat.deleteDmScopePrompt', 'Choose whether to remove this DM only for you or for both participants.'))}</p>
                        </div>
                        <div class="p-4 flex flex-col gap-3">
                            <button data-scope="me" class="w-full bg-gray-800 hover:bg-black text-white font-semibold py-2 px-4 rounded-lg">${escapeHtml(t('chat.deleteForMe', 'Delete For Me'))}</button>
                            <button data-scope="everyone" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">${escapeHtml(t('chat.deleteForEveryone', 'Delete For Everyone'))}</button>
                            <button data-scope="cancel" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">${escapeHtml(t('common.cancel', 'Cancel'))}</button>
                        </div>
                    </div>
                `;
                const finish = (result) => {
                    modal.remove();
                    resolve(result);
                };
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) finish(null);
                });
                modal.querySelectorAll('button[data-scope]').forEach((button) => {
                    button.addEventListener('click', () => {
                        const scope = button.dataset.scope;
                        finish(scope === 'cancel' ? null : scope);
                    });
                });
                document.body.appendChild(modal);
            });
        }

        function promptBanRecheckConsent() {
            return new Promise((resolve) => {
                const existing = document.getElementById('banRecheckConsentModal');
                if (existing) existing.remove();
                const modal = document.createElement('div');
                modal.id = 'banRecheckConsentModal';
                modal.className = 'fixed inset-0 modal-bg items-center justify-center z-[85] p-4 flex';
                const themeClass = getDynamicModalThemeClass();
                modal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl w-full max-w-md modal-content dynamic-theme-modal ${themeClass}">
                        <div class="p-5 border-b border-gray-200">
                            <h3 class="font-bold text-lg text-gray-900">Request Recheck / Unban</h3>
                            <p class="text-sm text-gray-500 mt-2">Admin review will be allowed to read your sent messages, including edited ones, only if you agree below.</p>
                        </div>
                        <div class="p-4 flex flex-col gap-4">
                            <label class="flex items-start gap-3 text-sm text-gray-700">
                                <input id="banRecheckConsentCheckbox" type="checkbox" class="mt-1 h-4 w-4 rounded border-gray-300">
                                <span>I agree that an admin may review my sent messages, including edited messages, to reconsider this ban.</span>
                            </label>
                            <label class="text-sm font-medium text-gray-700">
                                Note to admin
                                <textarea id="banRecheckNote" maxlength="1000" class="mt-1 w-full border rounded-lg p-2 text-gray-800 bg-white" placeholder="Optional explanation"></textarea>
                            </label>
                        </div>
                        <div class="p-4 bg-gray-50 border-t flex justify-end items-center gap-3">
                            <button data-action="cancel" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                            <button data-action="submit" class="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg">Send Request</button>
                        </div>
                    </div>
                `;
                const close = (result = null) => {
                    modal.remove();
                    resolve(result);
                };
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) close(null);
                });
                modal.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
                modal.querySelector('[data-action="submit"]').addEventListener('click', () => {
                    const consent = modal.querySelector('#banRecheckConsentCheckbox').checked;
                    if (!consent) {
                        showErrorModal('Consent Required', 'You must agree before sending the request.');
                        return;
                    }
                    close({
                        consentToMessageReview: true,
                        requestNote: modal.querySelector('#banRecheckNote').value.trim(),
                    });
                });
                document.body.appendChild(modal);
            });
        }

        async function requestBanRecheck() {
            if (!isCurrentUserBanned()) return;
            const existingRequest = getCurrentPardonRequest();
            if (existingRequest?.status === 'open') {
                showErrorModal('Request Pending', 'A recheck request is already pending.');
                return;
            }
            const session = getValidSession();
            if (!session?.token) {
                handleLogoutSequence(false);
                return;
            }
            const payload = await promptBanRecheckConsent();
            if (!payload) return;
            try {
                const res = await fetch(resolveServerUrl('/ban/pardon-request'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': state.currentUser.userId,
                        'X-Auth-Token': session.token,
                    },
                    body: JSON.stringify(payload),
                });
                const result = await res.json().catch(() => ({}));
                if (!res.ok || !result.success) {
                    showErrorModal('Request Failed', result.error || 'Could not send the request.');
                    return;
                }
                state.currentUser.pardonRequest = result.request;
                ui.updateBanRecheckControls();
                showSuccessModal('Request Sent', 'Your recheck request was sent to the admin queue.');
            } catch (error) {
                showErrorModal('Network Error', error.message || 'Request failed');
            }
        }

        function promptMessageReportReason(message) {
            return new Promise((resolve) => {
                const existing = document.getElementById('messageReportModal');
                if (existing) existing.remove();
                const modal = document.createElement('div');
                modal.id = 'messageReportModal';
                modal.className = 'fixed inset-0 modal-bg items-center justify-center z-[85] p-4 flex';
                const themeClass = getDynamicModalThemeClass();
                modal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl w-full max-w-md modal-content dynamic-theme-modal ${themeClass}">
                        <div class="p-5 border-b border-gray-200">
                            <h3 class="font-bold text-lg text-gray-900">${escapeHtml(t('report.title', 'Report Message'))}</h3>
                            <p class="text-sm text-gray-500 mt-2">${escapeHtml(t('report.subtitle', 'Choose a reason. Use a custom reason if none of the listed options fit.'))}</p>
                        </div>
                        <div class="p-4 flex flex-col gap-3">
                            <div class="text-sm text-gray-600 bg-gray-100 rounded-lg p-3">${escapeHtml(getMessageModerationSummary(message).slice(0, 240))}</div>
                            <label class="text-sm font-medium text-gray-700">
                                ${escapeHtml(t('report.reason', 'Reason'))}
                                <select id="messageReportReasonSelect" class="mt-1 w-full border rounded-lg p-2 text-gray-800 bg-white">
                                    <option value="spam">${escapeHtml(t('report.reasons.spam', 'Spam'))}</option>
                                    <option value="harassment">${escapeHtml(t('report.reasons.harassment', 'Harassment'))}</option>
                                    <option value="hate">${escapeHtml(t('report.reasons.hate', 'Hate'))}</option>
                                    <option value="violence">${escapeHtml(t('report.reasons.violence', 'Violence'))}</option>
                                    <option value="illegal">${escapeHtml(t('report.reasons.illegal', 'Illegal Content'))}</option>
                                    <option value="impersonation">${escapeHtml(t('report.reasons.impersonation', 'Impersonation'))}</option>
                                    <option value="scam">${escapeHtml(t('report.reasons.scam', 'Scam'))}</option>
                                    <option value="nsfw">${escapeHtml(t('report.reasons.nsfw', 'NSFW'))}</option>
                                    <option value="other">${escapeHtml(t('report.reasons.other', 'Other'))}</option>
                                </select>
                            </label>
                            <label id="messageReportCustomWrap" class="hidden text-sm font-medium text-gray-700">
                                ${escapeHtml(t('report.customReason', 'Custom Reason'))}
                                <textarea id="messageReportCustomReason" maxlength="500" class="mt-1 w-full border rounded-lg p-2 text-gray-800 bg-white" placeholder="${escapeAttr(t('report.customPlaceholder', 'Describe the problem'))}"></textarea>
                            </label>
                        </div>
                        <div class="p-4 bg-gray-50 border-t flex justify-end items-center gap-3">
                            <button data-action="cancel" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">${escapeHtml(t('common.cancel', 'Cancel'))}</button>
                            <button data-action="submit" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">${escapeHtml(t('report.submit', 'Send Report'))}</button>
                        </div>
                    </div>
                `;
                const close = (result = null) => {
                    modal.remove();
                    resolve(result);
                };
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) close(null);
                });
                const reasonSelect = modal.querySelector('#messageReportReasonSelect');
                const customWrap = modal.querySelector('#messageReportCustomWrap');
                const customReasonInput = modal.querySelector('#messageReportCustomReason');
                const syncCustomVisibility = () => {
                    const isOther = reasonSelect.value === 'other';
                    customWrap.classList.toggle('hidden', !isOther);
                    if (!isOther) customReasonInput.value = '';
                };
                reasonSelect.addEventListener('change', syncCustomVisibility);
                syncCustomVisibility();
                modal.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
                modal.querySelector('[data-action="submit"]').addEventListener('click', () => {
                    const reason = reasonSelect.value;
                    const customReason = customReasonInput.value.trim();
                    if (reason === 'other' && !customReason) {
                        showErrorModal(t('report.reasonTitle', 'Report Reason'), t('report.enterCustomReason', 'Please enter a custom reason.'));
                        return;
                    }
                    close({ reason, customReason });
                });
                document.body.appendChild(modal);
            });
        }

        async function submitMessageReport(messageId) {
            const message = findMessage(state.currentChat?.chatId, messageId);
            if (!message || !state.currentChat || !canReportMessage(message)) return;
            pruneReportActionTimestamps();
            if (state.reportActionTimestamps.length >= REPORT_ACTION_LIMIT) {
                showErrorModal(t('report.tooManyTitle', 'Too Many Reports'), t('report.tooManyBody', 'Please wait a minute before sending more reports.'));
                return;
            }
            const reportData = await promptMessageReportReason(message);
            if (!reportData) return;
            const session = getValidSession();
            if (!session?.token) {
                handleLogoutSequence(false);
                return;
            }
            noteReportActionAttempt();
            try {
                const res = await fetch(resolveServerUrl('/report/message'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': state.currentUser.userId,
                        'X-Auth-Token': session.token,
                    },
                    body: JSON.stringify({
                        messageId: String(messageId ?? ''),
                        chatId: String(state.currentChat.chatId ?? ''),
                        reason: String(reportData.reason || ''),
                        customReason: String(reportData.customReason || ''),
                    }),
                });
                const result = await res.json().catch(() => ({}));
                if (!res.ok || !result.success) {
                    showErrorModal(t('report.failedTitle', 'Report Failed'), result.error || t('report.failedBody', 'Could not submit the report.'));
                    return;
                }
                showSuccessModal(t('report.submittedTitle', 'Report Submitted'), t('report.submittedBody', 'The report was sent to the admin queue.'));
            } catch (error) {
                showErrorModal('Network Error', error.message || 'Request failed');
            }
        }

        function openSeenByModal(message) {
            if (!message || !state.currentChat) return;
            const existing = document.getElementById('messageSeenByModal');
            if (existing) existing.remove();
            const modal = document.createElement('div');
            modal.id = 'messageSeenByModal';
            modal.className = 'fixed inset-0 modal-bg items-center justify-center z-[82] p-4 flex';

            const seenIds = Array.isArray(message.seenBy) ? message.seenBy.filter((id) => id && id !== '__seen_without_user__') : [];
            const anonymousSeen = hasAnonymousSeenReceipt(message);
            const reactionByUserId = new Map();
            getMessageReactionState(message).forEach((entry) => {
                entry.userIds.forEach((userId) => {
                    if (userId && !reactionByUserId.has(userId)) reactionByUserId.set(userId, entry.emoji);
                });
            });
            const rows = seenIds.map((userId) => {
                const user = state.allUsers[userId];
                const username = user?.username || userId;
                const avatar = generateAvatar(username, userId, user?.avatarUrl, false);
                const reaction = reactionByUserId.get(userId);
                return `
                    <div class="seen-by-card">
                        <div class="w-10 h-10 avatar-circle flex-shrink-0" style="background-image: url('${escapeAttr(avatar.url)}'); background-color: ${avatar.color};">${avatar.initial}</div>
                        <div class="seen-by-meta">
                            <div class="seen-by-name">${renderDisplayName(username, Boolean(user?.isVerified), Boolean(user?.isBot), user?.membershipTier, user?.nicknameFont, user?.premiumStarIcon)}</div>
                            <div class="seen-by-note">${escapeHtml(t('seenBy.note', 'Seen this message'))}</div>
                            <div class="seen-by-note">${reaction ? escapeHtml(tr('seenBy.reactedWith', 'Reacted with {emoji}', { emoji: reaction })) : escapeHtml(t('seenBy.noReaction', 'No reaction'))}</div>
                        </div>
                    </div>
                `;
            });
            if (anonymousSeen) {
                rows.push(`
                    <div class="seen-by-card">
                        <div class="seen-by-meta">
                            <div class="seen-by-name">${escapeHtml(t('seenBy.someone', 'Seen by someone'))}</div>
                            <div class="seen-by-note">${escapeHtml(t('seenBy.someoneNote', 'The server confirmed a seen receipt but did not include which user saw it.'))}</div>
                        </div>
                    </div>
                `);
            }
            const emptyState = rows.length ? rows.join('') : `<div class="seen-by-empty">${escapeHtml(t('seenBy.empty', 'No one has seen this message yet.'))}</div>`;
            modal.innerHTML = `
                <div class="seen-by-panel modal-content">
                    <div class="seen-by-header">
                        <div>
                            <h3 class="text-lg font-bold">${escapeHtml(t('seenBy.title', 'Seen By'))}</h3>
                            <div class="text-xs app-text-muted mt-1">${escapeHtml(formatMessageTimestamp(message.timestamp || 0))}</div>
                        </div>
                        <button data-action="close" class="seen-by-close" title="${escapeAttr(t('common.close', 'Close'))}">&times;</button>
                    </div>
                    <div class="seen-by-body seen-by-scroll custom-scrollbar">
                        <div class="seen-by-list">${emptyState}</div>
                    </div>
                </div>
            `;
            const close = () => modal.remove();
            modal.addEventListener('click', (event) => {
                if (event.target === modal || event.target.closest('[data-action="close"]')) close();
            });
            document.body.appendChild(modal);
        }

        function openReactionsModal(message) {
            if (!message || !state.currentChat) return;
            const existing = document.getElementById('messageReactionsModal');
            if (existing) existing.remove();
            const modal = document.createElement('div');
            modal.id = 'messageReactionsModal';
            modal.className = 'fixed inset-0 modal-bg items-center justify-center z-[82] p-4 flex';
            const rows = getMessageReactionState(message).flatMap((entry) => {
                return entry.userIds.map((userId) => {
                    const user = state.allUsers[userId];
                    const username = user?.username || userId;
                    const avatar = generateAvatar(username, userId, user?.avatarUrl, false);
                    return `
                        <div class="seen-by-card">
                            <div class="w-10 h-10 avatar-circle flex-shrink-0" style="background-image: url('${escapeAttr(avatar.url)}'); background-color: ${avatar.color};">${avatar.initial}</div>
                            <div class="seen-by-meta">
                                <div class="seen-by-name">${renderDisplayName(username, Boolean(user?.isVerified), Boolean(user?.isBot), user?.membershipTier, user?.nicknameFont, user?.premiumStarIcon)}</div>
                                <div class="seen-by-note">${escapeHtml(tr('reactions.reactedWith', 'Reacted with {emoji}', { emoji: entry.emoji }))}</div>
                            </div>
                        </div>
                    `;
                });
            });
            const body = rows.length ? rows.join('') : `<div class="seen-by-empty">${escapeHtml(t('reactions.empty', 'No reactions yet.'))}</div>`;
            modal.innerHTML = `
                <div class="seen-by-panel modal-content">
                    <div class="seen-by-header">
                        <div>
                            <h3 class="text-lg font-bold">${escapeHtml(t('reactions.title', 'Reactions'))}</h3>
                            <div class="text-xs app-text-muted mt-1">${escapeHtml(formatMessageTimestamp(message.timestamp || 0))}</div>
                        </div>
                        <button data-action="close" class="seen-by-close" title="${escapeAttr(t('common.close', 'Close'))}">&times;</button>
                    </div>
                    <div class="seen-by-body seen-by-scroll custom-scrollbar">
                        <div class="seen-by-list">${body}</div>
                    </div>
                </div>
            `;
            const close = () => modal.remove();
            modal.addEventListener('click', (event) => {
                if (event.target === modal || event.target.closest('[data-action="close"]')) close();
            });
            document.body.appendChild(modal);
        }

        function openMessageActionSheet(messageId) {
            const message = findMessage(state.currentChat?.chatId, messageId);
            if (!message || !canOpenMessageActionSheet(message)) return;
            const existing = document.getElementById('messageActionsModal');
            if (existing) existing.remove();
            const actions = [];
            if (canReplyMessage(message)) {
                actions.push({ action: 'reply', icon: 'reply', iconClass: 'app-accent-text', label: t('messageActions.reply', 'Reply') });
            }
            if (canViewSeenBy(message)) {
                actions.push({ action: 'seen-by', icon: 'eye', iconClass: 'app-success-text', label: t('seenBy.action', 'Seen by') });
            }
            if (getMessageReactionState(message).length) {
                actions.push({ action: 'reactions', icon: 'face-smile', iconClass: 'app-warning-text', label: t('reactions.action', 'Reactions') });
            }
            if (String(message.text || '').trim()) {
                actions.push({ action: 'copy', icon: 'copy', iconClass: 'app-text-muted', label: t('messageActions.copy', 'Copy') });
            }
            if (canForwardMessage(message)) {
                actions.push({ action: 'forward', icon: 'share', iconClass: 'app-accent-text', label: t('messageActions.forward', 'Forward') });
            }
            if (canSaveMessageAsSticker(message)) {
                actions.push({ action: 'save-sticker', icon: 'bookmark', iconClass: 'app-accent-text', label: t('messageActions.saveAsSticker', 'Save as Sticker') });
            }
            if (canReportMessage(message)) {
                actions.push({ action: 'report', icon: 'flag', iconClass: 'app-warning-text', label: t('messageActions.report', 'Report') });
            }
            if (canDeleteMessage(message)) {
                actions.push({ action: 'delete', icon: 'trash', iconClass: 'app-danger-text', label: t('messageActions.delete', 'Delete') });
            }
            if (!actions.length) return;
            const modal = document.createElement('div');
            modal.id = 'messageActionsModal';
            modal.className = 'fixed inset-0 modal-bg items-end justify-center z-[80] p-4 flex';
            modal.style.alignItems = window.innerWidth >= 768 ? 'center' : 'flex-end';
            modal.innerHTML = `
                <div class="message-sheet-panel modal-content">
                    <div class="message-sheet-scroll custom-scrollbar">
                    <div class="message-reaction-picker">
                        ${QUICK_REACTIONS.map((reaction) => `
                            <button type="button" class="message-reaction-picker-chip" data-action="react" data-reaction="${escapeAttr(reaction)}">${escapeHtml(reaction)}</button>
                        `).join('')}
                    </div>
                    ${actions.map(({ action, icon, iconClass, label }) => `
                        <button data-action="${escapeAttr(action)}" class="message-sheet-button">
                            <i class="fas fa-${escapeAttr(icon)} ${escapeAttr(iconClass)}"></i><span>${escapeHtml(label)}</span>
                        </button>
                    `).join('')}
                    <button data-action="cancel" class="message-sheet-button message-sheet-cancel">
                        <i class="fas fa-times app-text-muted"></i><span>Cancel</span>
                    </button>
                    </div>
                </div>
            `;
            const close = () => modal.remove();
            modal.addEventListener('click', async (event) => {
                if (event.target === modal) {
                    close();
                    return;
                }
                const action = event.target.closest('[data-action]')?.dataset.action;
                if (!action) return;
                close();
                if (action === 'forward') {
                    ui.openForwardModal(messageId);
                    return;
                }
                if (action === 'reply') {
                    enterReplyMode(message);
                    return;
                }
                if (action === 'react') {
                    const reaction = event.target.closest('[data-reaction]')?.dataset.reaction;
                    if (reaction) toggleMessageReaction(messageId, reaction);
                    return;
                }
                if (action === 'seen-by') {
                    openSeenByModal(message);
                    return;
                }
                if (action === 'reactions') {
                    openReactionsModal(message);
                    return;
                }
                if (action === 'copy') {
                    const text = String(message.text || '').trim();
                    if (!text) return;
                    try {
                        if (navigator.clipboard?.writeText) {
                            await navigator.clipboard.writeText(text);
                        } else {
                            const area = document.createElement('textarea');
                            area.value = text;
                            area.setAttribute('readonly', 'readonly');
                            area.style.position = 'fixed';
                            area.style.opacity = '0';
                            document.body.appendChild(area);
                            area.select();
                            document.execCommand('copy');
                            area.remove();
                        }
                    } catch (error) {
                        showErrorModal('Copy Failed', 'Could not copy that message.');
                    }
                    return;
                }
                if (action === 'save-sticker') {
                    saveMessageAsSticker(message);
                    return;
                }
                if (action === 'delete') {
                    ui.confirmDelete(messageId);
                    return;
                }
                if (action === 'report') {
                    await submitMessageReport(messageId);
                }
            });
            document.body.appendChild(modal);
        }

        function openDmMessageActionSheet(messageId) {
            openMessageActionSheet(messageId);
        }

        function formatPollRemainingTime(expiresAt) {
            const remaining = Math.max(0, Number(expiresAt || 0) - Math.floor(Date.now() / 1000));
            if (!remaining) return t('polls.closed', 'Closed');
            if (remaining >= 86400) return tr('polls.timeDays', '{count}d left', { count: Math.ceil(remaining / 86400) });
            if (remaining >= 3600) return tr('polls.timeHours', '{count}h left', { count: Math.ceil(remaining / 3600) });
            if (remaining >= 60) return tr('polls.timeMinutes', '{count}m left', { count: Math.ceil(remaining / 60) });
            return tr('polls.timeSeconds', '{count}s left', { count: remaining });
        }

        function renderPollCard(msg) {
            const poll = msg.poll || {};
            const pollQuestion = renderPlainTextWithEmoji(poll.question || t('polls.title', 'Poll'));
            const pollOptions = Array.isArray(poll.options) ? poll.options : [];
            const metaBadges = [];
            if (poll.anonymous) metaBadges.push(`<span class="px-2 py-1 rounded-full bg-slate-100 text-slate-700">${escapeHtml(t('polls.anonymous', 'Anonymous Mode'))}</span>`);
            if (poll.examMode) metaBadges.push(`<span class="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">${escapeHtml(t('polls.examMode', 'Exam Mode'))}</span>`);
            if (poll.resultsAfterVote) metaBadges.push(`<span class="px-2 py-1 rounded-full bg-violet-100 text-violet-700">${escapeHtml(t('polls.resultsAfterVote', 'Hide Results Until Vote'))}</span>`);
            if (poll.expiresAt) {
                const badgeText = poll.isExpired ? t('polls.closed', 'Closed') : formatPollRemainingTime(poll.expiresAt);
                metaBadges.push(`<span class="px-2 py-1 rounded-full bg-amber-100 text-amber-700">${escapeHtml(badgeText)}</span>`);
            }
            const optionsHtml = pollOptions.map((option, index) => {
                const isSelected = option.id && option.id === poll.viewerChoiceId;
                const canVote = Boolean(poll.canVote && !msg.pending);
                const countText = poll.canSeeResults
                    ? tr('polls.voteCount', '{count} votes', { count: Number(option.voteCount || 0) })
                    : t('polls.voteToSeeResults', 'Vote to see results');
                const percentText = poll.canSeeResults ? `${Number(option.percentage || 0)}%` : '';
                const correctnessBadge = option.isCorrect ? `<span class="text-xs font-semibold text-emerald-700">${escapeHtml(t('polls.correctAnswerBadge', 'Correct'))}</span>` : '';
                return `
                    <button type="button" class="w-full text-left rounded-2xl border px-3 py-3 transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'bg-white/80 hover:bg-white'} ${canVote ? '' : 'cursor-default'}" data-action="vote-poll" data-message-id="${escapeAttr(msg.messageId)}" data-option-id="${escapeAttr(option.id || '')}" ${canVote ? '' : 'disabled'}>
                        <div class="flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <div class="font-semibold app-text-primary break-words">${renderPlainTextWithEmoji(option.text || tr('polls.optionNumber', 'Option {number}', { number: index + 1 }))}</div>
                                <div class="text-xs app-text-muted mt-1">${escapeHtml(countText)}</div>
                            </div>
                            <div class="text-right flex-shrink-0">
                                ${percentText ? `<div class="text-sm font-bold app-text-primary">${escapeHtml(percentText)}</div>` : ''}
                                ${correctnessBadge}
                            </div>
                        </div>
                    </button>
                `;
            }).join('');
            const footerBits = [];
            if (poll.canSeeResults) {
                footerBits.push(`<span>${escapeHtml(tr('polls.totalVotes', '{count} total votes', { count: Number(poll.totalVotes || 0) }))}</span>`);
            }
            if (poll.viewerChoiceId) footerBits.push(`<span>${escapeHtml(t('polls.youVoted', 'You voted'))}</span>`);
            if (poll.examMode && poll.viewerChoiceId && !poll.canViewVotes) footerBits.push(`<span>${escapeHtml(t('polls.examHiddenAnswers', 'Answers are hidden in exam mode'))}</span>`);
            const votesButton = poll.canViewVotes
                ? `<button type="button" class="w-full rounded-xl btn-neutral py-2.5 interactive-pop font-semibold mt-3" data-action="view-poll-votes" data-message-id="${escapeAttr(msg.messageId)}">${escapeHtml(t('polls.votes', 'Votes'))}</button>`
                : '';
            return `
                <div class="theme-card p-4 rounded-2xl border max-w-sm">
                    <div class="font-bold text-base mb-3 flex items-center gap-2"><i class="fas fa-square-poll-vertical app-warning-text"></i>${pollQuestion}</div>
                    ${metaBadges.length ? `<div class="flex flex-wrap gap-2 text-xs mb-3">${metaBadges.join('')}</div>` : ''}
                    <div class="space-y-2">${optionsHtml}</div>
                    <div class="mt-3 text-xs app-text-muted flex flex-wrap gap-3">${footerBits.join('')}</div>
                    ${votesButton}
                </div>
            `;
        }

        async function voteOnPoll(messageId, optionId) {
            if (!messageId || !optionId || !state.socket || state.socket.readyState !== WebSocket.OPEN || !state.currentChat?.chatId) return;
            state.socket.send(JSON.stringify({
                type: 'vote_poll',
                chatId: state.currentChat.chatId,
                messageId,
                optionId,
            }));
        }

        function openPollVotesModal(message) {
            const poll = message?.poll;
            if (!poll?.canViewVotes || !Array.isArray(poll.options)) return;
            state.dom.pollVotesTitle.textContent = t('polls.votes', 'Votes');
            const html = poll.options.map((option) => {
                const voterIds = Array.isArray(option.voterIds) ? option.voterIds : [];
                const voterHtml = voterIds.length
                    ? voterIds.map((userId) => {
                        const user = state.allUsers[userId];
                        const name = user?.username || t('common.unknown', 'Unknown');
                        return `<div class="rounded-xl border px-3 py-2 bg-gray-50 text-sm">${renderDisplayName(name, Boolean(user?.isVerified), Boolean(user?.isBot), user?.membershipTier, user?.nicknameFont, user?.premiumStarIcon)}</div>`;
                    }).join('')
                    : `<div class="text-sm app-text-muted">${escapeHtml(t('polls.noVotesYet', 'No votes yet.'))}</div>`;
                return `
                    <div class="space-y-2">
                        <div class="flex items-center justify-between gap-3">
                            <div class="font-semibold app-text-primary">${renderPlainTextWithEmoji(option.text || '')}</div>
                            ${option.isCorrect ? `<span class="text-xs font-semibold text-emerald-700">${escapeHtml(t('polls.correctAnswerBadge', 'Correct'))}</span>` : ''}
                        </div>
                        <div class="space-y-2">${voterHtml}</div>
                    </div>
                `;
            }).join('<div class="border-t app-border"></div>');
            state.dom.pollVotesContent.innerHTML = sanitizeRichHtml(html);
            ui.openModal(state.dom.pollVotesModal);
        }

        const ui = {
            initDOM() {
                const ids = ["loadingOverlay","loadingStatus","authScreen","onboardingScreen","onboardingCard","onboardingIcon","onboardingDescription","onboardingDots","onboardingSkipButton","onboardingNextButton","authLoginSubtitle","mainApp","sidebar","settingsButton","contactsList","chatWindow","welcomeScreen","chatArea","backToContacts","chatAvatar","chatName","chatStatus","messagesContainer","fileInput","fileUploadButton","stickersButton","stickersModal","closeStickersButton","stickersGrid","attachMenuPanel","closeAttachMenuButton","attachMenuFileButton","attachMenuPollButton","pollComposerModal","closePollComposerButton","pollQuestionInput","pollOptionsContainer","addPollOptionButton","sendPollButton","pollAnonymousToggle","pollExamModeToggle","pollCorrectOptionRow","pollCorrectOptionSelect","pollResultsAfterVoteToggle","pollTimerSelect","pollVotesModal","closePollVotesButton","pollVotesTitle","pollVotesContent","messageInput","sendButton","settingsModal","closeSettingsButton","settingsAvatar","settingsUsername","settingsUserid","editUsernameInput","editUsernameFontSelect","editHandleInput","editBioInput","editBioCounter","logoutButton", "saveSettingsButton","sidebarTitle","sidebarSearchBar","sidebarSearchInput","closeSidebarSearchButton","historyLoader","uploadProgressContainer","uploadProgressBar","confirmDeleteModal","cancelDeleteButton","confirmDeleteButton","avatarInput","avatarEditorModal","closeAvatarEditorButton","avatarEditorViewport","avatarEditorImage","avatarEditorCropBox","avatarEditorReset","avatarEditorZoom","avatarEditorUploadProgressContainer","avatarEditorUploadProgressBar","avatarEditorUploadProgressText","cancelAvatarEditorButton","saveAvatarEditorButton","filePreviewContainer","removeFilePreview","imagePreview","fileIconPreview","fileNamePreview","fileSizePreview","replyPreviewContainer","removeReplyPreview","replyPreviewUsername","replyPreviewText", "chatHeaderInfo", "chatSearchButton", "userInfoModal", "closeUserInfoModal", "userInfoMuteButton", "userInfoAvatar", "userInfoUsername", "userInfoStatus", "userInfoBio", "userInfoUserid", "userInfoMessageButton", "userInfoContactButton", "userInfoCreatedAt", "userInfoHandle", "userInfoGiftsSection", "userInfoGiftsList", "userInfoNoGifts", "userInfoMutualGroupsList", "userInfoTabBio", "userInfoTabGifts", "userInfoTabMutualGroups", "userInfoPanelBio", "userInfoPanelGifts", "userInfoPanelMutualGroups", "mediaViewerModal", "closeMediaViewer", "mediaViewerImage", "mediaViewerVideo", "emptyChatPlaceholder", "forwardMessageModal", "closeForwardModalButton", "forwardContactsList", "cancelForwardButton", "confirmForwardButton", "createChannelButton","createOptionsModal","closeCreateOptionsModalButton","createOptionCreateChannel","createOptionCreateGroup", "createChannelModal","createGroupModal","closeGroupModalButton","createGroupForm","groupNameInput","groupMembersList","submitCreateGroup", "closeChannelModalButton", "createChannelForm", "submitCreateChannel", "channelAvatarInput", "channelAvatarPreview", "channelNameInput", "channelHandleInput", "messageInputContainer", "joinChannelBar", "joinChannelButton", "loginForm", "registerForm", "loginUsernameInput", "loginPasswordInput", "loginButton", "registerUsernameInput", "registerPasswordInput", "registerButton", "showRegister", "showLogin", "authError", "pinnedMessageBar", "pinnedMessageContent", "unpinButton", "loadingSpinner", "logoutFromLoadingButton", "leaveGroupButton", "e2eeToggleButton", "voiceCallButton", "activeCallBar", "voiceParticipantsContainer", "leaveCallButton", "toggleScreenShareButton", "toggleScreenShareQualityButton", "toggleMuteButton", "toggleDeafenButton", "toggleCallStageButton", "callStatusLabel", "callStatusMeta", "callScreenStage", "incomingCallModal", "incomingCallAvatar", "incomingCallName", "incomingCallChatName", "declineCallButton", "acceptCallButton", "resetThemeButton", "errorModal", "errorModalTitle", "errorModalMessage", "closeErrorModalButton", "errorToast", "errorToastTitle", "errorToastMessage", "emojiDownloadToast", "emojiDownloadTitle", "emojiDownloadMessage", "emojiDownloadProgressContainer", "emojiDownloadProgressBar", "captchaModal", "captchaFrame",
                "mainMenuOverlay", "menuSettingsBtn", "menuContactsBtn", "menuNewChatBtn", "menuStarsBtn", "menuStarsSummary", "menuCloseBtn", "contactsModal", "closeContactsModal", "allContactsList", "contactSearchInput", "saveContactModal", "saveContactTitle", "saveContactNameInput", "closeSaveContactModalButton", "cancelSaveContactButton", "confirmSaveContactButton",
                // MODIFIED: Added updater elements 
                // MODIFIED: Added updater elements
                "updaterSection", "updaterStatus", "updaterProgressContainer", "updaterProgressBar", "checkUpdateButton", "downloadUpdateButton", "restartAndUpdateButton",
                "changePasswordOld", "changePasswordNew", "changePasswordButton", "deleteAccountPassword", "deleteAccountButton", "requestBanRecheckButton", "requestBanRecheckStatus",
                "changePasswordModal", "closeChangePasswordButton", "cancelChangePasswordButton", "openChangePasswordBtn",
                "deleteAccountModal", "closeDeleteAccountButton", "cancelDeleteAccountButton", "openDeleteAccountBtn", "deleteAccountConfirmCheck", "openDevicesButton", "devicesModal", "closeDevicesButton", "devicesList",
                "chatSettingsModal", "chatSettingsTitle", "chatSettingsCloseBtn", "chatSettingsMembersList", "chatSettingsChatName", "chatSettingsEditHandleBtn", "chatSettingsDeleteBtn",
                "editHandleModal", "editHandleTitle", "editHandleCloseBtn", "editHandleInput", "editHandleError", "editHandleDeleteBtn", "editHandleSaveBtn",
                "emailComposerModal", "emailComposerTitle", "closeEmailComposerButton", "emailComposeTargetInput", "emailComposeSubjectInput", "emailComposeBodyInput", "cancelEmailComposerButton", "sendEmailComposerButton",
                "emailAddressModal", "emailAddressModalTitle", "closeEmailAddressButton", "emailAddressLocalPartInput", "emailAddressDomainText", "cancelEmailAddressButton", "createEmailAddressButton",
                "emailViewerModal", "emailViewerTitle", "emailViewerMeta", "emailViewerDeleteButton", "emailViewerReplyButton", "emailViewerBlockButton", "closeEmailViewerButton", "emailViewerFrame", "emailViewerTextWrap", "emailViewerTextContent",
                "settingsMenuView", "settingsProfileSection", "settingsAccountSection", "settingsPreferencesSection", "settingsChangelogSection", "themePresetsGrid", "themesModal", "closeThemesButton", "openThemesButton", "themePresetSummary", "settingsLanguageSelect", "settingsEmojiSelect", "notificationsPermissionStatus", "notificationsPermissionButton",
                "settingsPremiumOption", "premiumModal", "closePremiumModalButton", "premiumParticlesCanvas", "premiumStarCanvas", "premiumStarFallback", "premiumHeroTitle", "premiumBenefitLine1", "premiumBenefitLine2", "premiumBenefitLine3", "premiumBenefitLine4", "premiumBenefitLine5", "premiumBenefitLine6", "premiumBenefitLine7", "premiumBuyButton", "premiumBuyButtonLabel", "premiumSilverUpsellButton", "premiumCancelButton", "premiumViewProfileButton", "premiumPaymentModal", "closePremiumPaymentModalButton", "premiumPaymentKicker", "premiumPaymentAmount", "premiumPaymentHelp", "premiumPaymentCardNumber", "premiumPaymentCardholderName", "premiumReceiptInput", "premiumReceiptPreview", "submitPremiumPaymentButton", "submitPremiumPaymentLabel",
                "settingsProfileOption", "settingsAccountOption", "settingsPreferencesOption", "settingsChangelogOption", "settingsBackBtn", "settingsTitle", "settingsChangelogVersion", "settingsChangelogList",
                "blockGroupInvitesCheckbox", "openWalletButton",
                "settingsProfileEditButton", "settingsProfileCancelEdit", "settingsProfileStatus", "settingsProfileCreatedAt", "settingsProfileBio", "settingsProfileTabBio", "settingsProfileTabGifts", "settingsProfileTabMutualGroups", "settingsProfilePanelBio", "settingsProfilePanelGifts", "settingsProfilePanelMutualGroups", "settingsProfileViewMode", "settingsProfileEditMode", "settingsProfileGiftsSection", "settingsProfileGiftsList", "settingsProfileNoGifts", "settingsProfileMutualGroupsList",
                "settingsProfileSheet", "settingsProfileHeader", "profileSkinModeSelect", "profileSkinGradientStopsWrap", "profileSkinGradientStopsSelect", "profileSkinColorPrimary", "profileSkinColorSecondary", "profileSkinColorSecondaryWrap", "profileSkinColorTertiary", "profileSkinColorTertiaryWrap",
                "userInfoProfileSheet",
                "walletModal", "closeWalletModal", "walletBalanceValue", "walletTransactionCount", "walletGiveawayChat", "walletGiveawayAmount", "walletGiveawaySubmit", "walletTransactionsList", "walletMainSection", "walletSendSection", "walletTransactionsSection", "walletOpenSendSection", "walletOpenTransactionsSection", "walletBackToMain", "walletTransactionsBackToMain",
                "premiumStarPickerModal", "closePremiumStarPickerButton", "premiumStarSourceStickers", "premiumStarSourceTemplates", "premiumStarResetButton", "premiumStarPickerStatus", "premiumStarPickerGrid", "cancelPremiumStarPickerButton", "savePremiumStarPickerButton",
                "giftDetailModal", "closeGiftDetailModal", "giftDetailIcon", "giftDetailName", "giftDetailPrice", "giftDetailIssued", "giftDetailStatus", "giftDetailBuyButton",
                "giftActionModal", "closeGiftActionModal", "giftActionOwnButton", "giftActionGiftButton", "giftActionChatField", "giftActionChatSelect", "giftActionConfirmButton", "giftActionStatus"];
                ids.forEach(id => state.dom[id] = document.getElementById(id));
                renderSidebarTitle();
            },
            showLoading(msg, options = {}) {
                const {
                    blocking = true,
                    showLogout = false,
                } = options || {};
                state.dom.loadingStatus.textContent = msg;
                state.dom.loadingSpinner.classList.toggle('hidden', !blocking);
                state.dom.logoutFromLoadingButton.classList.toggle('hidden', !showLogout);
                if (blocking) {
                    state.dom.loadingOverlay.classList.remove('hidden');
                    state.dom.loadingOverlay.classList.add('flex');
                } else {
                    this.hideLoading();
                }
            },
            hideLoading() { state.dom.loadingOverlay.classList.add('hidden'); state.dom.loadingOverlay.classList.remove('flex'); },
            showOnboardingScreen() { this.hideLoading(); this.setReconnectingState(false); state.dom.onboardingScreen?.classList.remove('hidden'); state.dom.onboardingScreen?.classList.add('flex'); state.dom.authScreen?.classList.add('hidden'); state.dom.authScreen?.classList.remove('flex'); state.dom.mainApp.classList.add('hidden'); state.dom.mainApp.classList.remove('md:flex'); },
            showAuthScreen() { this.hideLoading(); this.setReconnectingState(false); state.dom.onboardingScreen?.classList.add('hidden'); state.dom.onboardingScreen?.classList.remove('flex'); state.dom.authScreen.classList.remove('hidden'); state.dom.authScreen.classList.add('flex'); state.dom.mainApp.classList.add('hidden'); state.dom.mainApp.classList.remove('md:flex'); },
            showApp() { this.hideLoading(); state.dom.onboardingScreen?.classList.add('hidden'); state.dom.onboardingScreen?.classList.remove('flex'); state.dom.mainApp.classList.remove('hidden'); state.dom.mainApp.classList.add('md:flex'); state.dom.authScreen.classList.add('hidden'); state.dom.authScreen.classList.remove('flex'); },
            updateUiForAuthState(isAuthenticated) {
                const elementsToToggle = [state.dom.createChannelButton, state.dom.messageInputContainer, state.dom.fileUploadButton, state.dom.sendButton, state.dom.messageInput, state.dom.voiceCallButton];
                if (isAuthenticated) {
                    elementsToToggle.forEach(el => el?.classList.remove('disabled-interaction'));
                    state.dom.settingsButton?.classList.remove('disabled-interaction');
                } else {
                    elementsToToggle.forEach(el => el?.classList.add('disabled-interaction'));
                    state.dom.settingsButton?.classList.remove('disabled-interaction');
                }
            },
            updateSidebarSelectionHeader() {
                const count = state.selectedChatIds.size;
                if (state.chatSelectionMode && count > 0) {
                    renderSidebarTitle(tr('chat.selectedCount', '{count} selected', { count }));
                    state.dom.settingsButton.title = t('common.cancelSelection', 'Cancel selection');
                    state.dom.settingsButton.innerHTML = '<i class="fas fa-times"></i>';
                    state.dom.settingsButton.classList.remove('app-icon-button');
                    state.dom.settingsButton.classList.add('app-icon-button-danger', 'is-active');
                    state.dom.createChannelButton.title = t('chat.deleteSelectedChatsAction', 'Delete selected chats');
                    state.dom.createChannelButton.innerHTML = '<i class="fas fa-trash"></i>';
                    state.dom.createChannelButton.classList.remove('app-icon-button');
                    state.dom.createChannelButton.classList.add('app-icon-button-danger', 'is-active');
                    return;
                }
                renderSidebarTitle();
                state.dom.settingsButton.title = t('settings.settings', 'Settings');
                state.dom.settingsButton.innerHTML = '<i class="fas fa-bars"></i>';
                state.dom.settingsButton.classList.remove('app-icon-button-danger', 'is-active');
                state.dom.settingsButton.classList.add('app-icon-button');
                state.dom.createChannelButton.title = state.isSidebarSearchActive ? t('common.closeSearch', 'Close search') : t('common.search', 'Search');
                state.dom.createChannelButton.innerHTML = state.isSidebarSearchActive ? '<i class="fas fa-times"></i>' : '<i class="fas fa-search"></i>';
                state.dom.createChannelButton.classList.remove('app-icon-button-danger', 'is-active');
                state.dom.createChannelButton.classList.add('app-icon-button');
            },
            renderContactList() {
                if (!state.isFullyAuthenticated || !state.currentUser || Object.keys(state.allUsers).length === 0) return;
                if (state.isSidebarSearchActive) {
                    renderSidebarSearchResults(state.sidebarSearchQuery, state.publicSearchResults);
                    return;
                }
                
                const getSortTs = c => state.allChats[c.chatId]?.lastMessageTimestamp || c.created_at || 0;
                
                // NEW LOGIC: Only show chats that actually exist in state.allChats
                const allItems = Object.values(state.allChats)
                    .filter(c => c && !c.previewOnly && (c.chatType === 'private' || c.chatType === 'group' || c.chatType === 'channel' || c.chatType === 'saved'))
                    .map(chat => {
                        if (chat.chatType === 'private') {
                            const otherUserId = chat.members.find(id => id !== state.currentUser.userId);
                            const user = state.allUsers[otherUserId];
                            if (user) {
                                return { ...chat, isUserEntry: true, userData: user };
                            }
                        }
                        return chat;
                    })
                    .filter(Boolean);

                allItems.sort((a, b) => getSortTs(b) - getSortTs(a));
                
                const publicChatIdx = allItems.findIndex(c => c.chatId === state.PUBLIC_CHAT_ID);
                if (publicChatIdx > -1) allItems.unshift(allItems.splice(publicChatIdx, 1)[0]);
                
                state.dom.contactsList.innerHTML = '';
                allItems.forEach((itemData) => {
                    const listItem = this.createListItem(itemData);
                    state.dom.contactsList.appendChild(listItem);
                });
                initTgsPlayers(state.dom.contactsList).catch(() => {});
                this.updateSidebarSelectionHeader();
            },
            createListItem(itemData) {
                const item = document.createElement('div');
                const chat = state.allChats[itemData.chatId] || itemData;
                const isUser = itemData.isUserEntry;
                const user = isUser ? itemData.userData : null;
                const isChannel = chat.chatType === 'channel';
                const isSelected = state.selectedChatIds.has(chat.chatId);
                const isActive = state.currentChat?.chatId === chat.chatId;
                const isBannedLocked = Boolean(state.currentUser?.isBanned);
                item.className = `app-list-row app-chat-row p-3 border-b flex items-center transition ${isBannedLocked ? 'app-list-row-disabled opacity-60 grayscale cursor-not-allowed' : `cursor-pointer ${isSelected ? 'app-list-row-selected' : (isActive ? 'app-list-row-active' : 'app-list-row-hover')}`}`;
                item.dataset.chatId = chat.chatId;

                let name, avatar;
                if(isChannel) { name = chat.chatName; avatar = generateAvatar(name, chat.chatId, chat.avatarUrl, true); } 
                else if (chat.chatType === 'saved') { name = chat.chatName || 'Saved Messages'; avatar = generateSavedMessagesAvatar(); }
                else if (isUser) { name = user.username; avatar = generateAvatar(name, user.userId, user.avatarUrl); } 
                else { name = chat.chatName; avatar = generateAvatar(name, chat.chatId, chat.avatarUrl); }
                const isVerified = isUser ? Boolean(user?.isVerified) : Boolean(chat?.isVerified);

                let holdTimer = null;
                let holdTriggered = false;
                const clearHold = () => {
                    item.classList.remove('is-pressed');
                    if (holdTimer) {
                        clearTimeout(holdTimer);
                        holdTimer = null;
                    }
                };
                const startHold = (event) => {
                    if (isBannedLocked || state.chatSelectionMode || !isChatSelectable(chat) || event.target.closest('button')) return;
                    clearHold();
                    item.classList.add('is-pressed');
                    holdTriggered = false;
                    holdTimer = setTimeout(() => {
                        holdTriggered = true;
                        enterChatSelectionMode(chat.chatId);
                    }, 450);
                };

                item.addEventListener('mousedown', startHold);
                item.addEventListener('touchstart', startHold, { passive: true });
                item.addEventListener('mouseup', clearHold);
                item.addEventListener('mouseleave', clearHold);
                item.addEventListener('touchend', clearHold);
                item.addEventListener('touchcancel', clearHold);
                item.addEventListener('contextmenu', (e) => {
                    if (isBannedLocked || !isChatSelectable(chat)) return;
                    e.preventDefault();
                    enterChatSelectionMode(chat.chatId);
                });
                item.addEventListener('click', () => {
                    if (holdTriggered) {
                        holdTriggered = false;
                        return;
                    }
                    if (isBannedLocked) return;
                    if (state.chatSelectionMode) {
                        toggleChatSelection(chat.chatId);
                        return;
                    }
                    if (!isUser && state.currentChat?.chatId === chat.chatId) {
                        return;
                    }
                    isUser ? openPrivateChatWithUser(user.userId) : openChat(chat);
                });
                
				// FIX: Add HTML escape function for last message preview
				const escapeHtml = (text) => {
					if (!text) return '';
					return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
				};

				                let lastMessageText = t('chat.noMessagesYet', 'No messages yet');
								if (state.activeVoiceChats[chat.chatId]) {
									lastMessageText = `<span class="app-status-call font-semibold"><i class="fas fa-phone-volume fa-fw"></i> ${escapeHtml(t('voice.activeInline', 'Voice chat active'))}</span>`;
												} else if(chat.lastMessage) {
													const senderName = getMessageSenderName(chat.lastMessage, chat).split(' ')[0];
													
								                    let content = chat.lastMessage;
								                    if (typeof chat.lastMessage.content === 'string') {
								                        content = parseMessageContent(chat.lastMessage.content);
								                    }
								
									// Ensure content.text is properly extracted
									let displayText = content.text;
									if (typeof displayText === 'string') {
										const trimmed = displayText.trim();
										if ((trimmed.startsWith('{') && trimmed.includes('"text"')) || trimmed.startsWith('[')) {
											try {
												const parsed = JSON.parse(trimmed);
												if (parsed.text) {
													displayText = parsed.text;
												}
											} catch (e) {
												// Keep original text if not valid JSON
											}
										}
									}

                                                    if (content.callLog) {
                                                        const preview = getCallLogPresentation(content.callLog, state.currentUser?.userId);
                                                        lastMessageText = `<span class="font-medium"><i class="fas ${escapeHtml(preview.icon)} mr-1 ${escapeHtml(preview.iconClass)}"></i> ${escapeHtml(preview.preview)}</span>`;
                                                    }
                                                    else if (content.starGiveaway) lastMessageText = `${escapeHtml(senderName)}: ${escapeHtml(t('wallet.giveawayPosted', 'Giveaway posted'))}`;
                                                    else if (content.giftGiveaway) lastMessageText = `${escapeHtml(senderName)}: <i class="fas fa-gift mr-1"></i> ${escapeHtml(content.giftGiveaway.gift?.name || t('gift.giftGiveaway', 'Gift Giveaway'))}`;
                                                    else if (content.theme) lastMessageText = `${escapeHtml(senderName)}: <i class="fas fa-palette mr-1"></i> ${escapeHtml(content.theme.name || t('message.themeFallback', 'Theme'))}`;
                                                    else if (content.poll) lastMessageText = `${escapeHtml(senderName)}: <i class="fas fa-square-poll-vertical mr-1"></i> ${escapeHtml(content.poll.question || t('polls.title', 'Poll'))}`;
                                                    else if (content.file) lastMessageText = `${escapeHtml(senderName)}: <i class="fas fa-paperclip mr-1"></i> ${escapeHtml(content.text || content.file.name)}`;
                                                    else if (displayText) lastMessageText = `${isChannel ? '' : escapeHtml(senderName) + ': '}${escapeHtml(displayText)}`;
												} else if (user && !state.isReconnecting) {
									lastMessageText = user.online ? `<span class="app-status-online">${escapeHtml(t('presence.online', 'Online'))}</span>` : escapeHtml(getPresenceLabel(user, t('presence.online', 'Online')));
								}                
                const nameHtml = renderDisplayName(name, isVerified, Boolean(user?.isBot), user?.membershipTier, user?.nicknameFont, user?.premiumStarIcon);
                const avatarMarkup = isUser
                    ? `<button type="button" class="relative mr-4 w-12 h-12 flex-shrink-0 user-profile-trigger border-0 bg-transparent p-0" data-user-id="${escapeAttr(user.userId)}" title="${escapeAttr(t('profile.viewProfile', 'View Profile'))}"><div class="w-12 h-12 avatar-circle" style="background-image: url(${escapeAttr(avatar.url)}); background-color: ${avatar.color};">${avatar.initial}</div>${isSelected ? '<div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"><i class="fas fa-check"></i></div>' : ''}</button>`
                    : `<div class="relative mr-4 w-12 h-12 flex-shrink-0"><div class="w-12 h-12 avatar-circle" style="background-image: url(${escapeAttr(avatar.url)}); background-color: ${avatar.color};">${avatar.initial}</div>${isSelected ? '<div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"><i class="fas fa-check"></i></div>' : ''}</div>`;
                item.innerHTML = `${avatarMarkup}<div class="flex-1 overflow-hidden"><div class="flex justify-between items-center"><h3 class="font-semibold truncate flex items-center">${nameHtml}</h3>${chat.unreadCount > 0 ? `<div class="app-badge-unread text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">${chat.unreadCount}</div>` : ''}</div><p class="text-sm app-text-muted truncate">${lastMessageText}</p></div>`;
                item.querySelector('.user-profile-trigger')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (user) this.openUserInfoModal(user);
                });

                // If current user is owner of this chat (channel/group), add a settings button
                try {
                    const header = item.querySelector('.flex.justify-between.items-center');
                    if (!isBannedLocked && !state.chatSelectionMode && chat.chatType !== 'saved' && chat.ownerId && state.currentUser && chat.ownerId === state.currentUser.userId) {
                        const settingsBtn = document.createElement('button');
                        settingsBtn.className = 'ml-2 p-1 app-icon-button';
                        settingsBtn.title = t('chat.chatSettings', 'Chat Settings');
                        settingsBtn.innerHTML = '<i class="fas fa-cog"></i>';
                        settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); openChatSettings(chat.chatId); });
                        if (header) header.appendChild(settingsBtn);
                    }
                } catch (e) { console.error('Could not add settings button', e); }

                return item;
            },
            renderMessage(msg, prepend = false) {
                const existing = document.querySelector(`.message-wrapper[data-msg-id="${msg.messageId}"]`);
                if (existing) {
                    existing.innerHTML = sanitizeRichHtml(this.createMessageInnerHtml(msg));
                    applyMessageAvatarStyles(existing);
                    this.addMessageEventListeners(existing);
                    return;
                }
                const wrapper = document.createElement('div');
                const isCallLog = Boolean(msg.callLog);
                const isSender = isCallLog
                    ? String(msg.callLog?.startedByUserId || '') === String(state.currentUser?.userId || '')
                    : msg.senderId === state.currentUser.userId;
                const isSystem = msg.senderId === 'system' && !isCallLog;
                wrapper.className = `message-wrapper flex mb-4 items-end gap-2 ${isSystem ? 'justify-center' : (isSender ? 'justify-end' : 'justify-start')}`;
                wrapper.setAttribute('data-msg-id', msg.messageId);
                wrapper.innerHTML = sanitizeRichHtml(this.createMessageInnerHtml(msg));
                applyMessageAvatarStyles(wrapper);
                if (!prepend) { wrapper.classList.add('message-bubble-animate-in'); wrapper.style.setProperty('--slide-direction', isSender ? '20px' : '-20px'); }
                const container = state.dom.messagesContainer;
                if (prepend) { container.insertBefore(wrapper, container.querySelector('#historyLoader').nextSibling); } 
                else {
                    const placeholder = container.querySelector('#emptyChatPlaceholder');
                    hideEmptyChatPlaceholder();
                    container.insertBefore(wrapper, placeholder);
                    if (msg.senderId === state.currentUser?.userId || shouldStickChatToBottom(state.currentChat?.chatId)) {
                        container.scrollTop = container.scrollHeight;
                    }
                }
                this.addMessageEventListeners(wrapper);
            },
            createMessageInnerHtml(msg) {
                // Handle system messages
                if (msg.senderId === 'system' && !msg.callLog) {
                    return `<div class="flex justify-center py-2"><div class="message-system-badge px-3 py-1 rounded-full">${msg.text || msg.content}</div></div>`;
                }
                const isCallLog = Boolean(msg.callLog);
                const isSender = isCallLog
                    ? String(msg.callLog?.startedByUserId || '') === String(state.currentUser?.userId || '')
                    : msg.senderId === state.currentUser.userId;
                const sender = state.allUsers[msg.senderId], chat = state.currentChat;
                const isChannel = chat.chatType === 'channel', isChannelOwner = isChannel && chat.ownerId === state.currentUser.userId, isPrivateChat = chat.chatType === 'private';
                const showAvatar = (!isSender && state.currentChat.chatType === 'group' && sender) && !isChannel;
                const avatar = showAvatar ? generateAvatar(sender.username, sender.userId, sender.avatarUrl) : null;
                const avatarEl = avatar ? `<button type="button" class="w-8 h-8 avatar-circle message-avatar self-start flex-shrink-0 mr-2 border-0 bg-transparent p-0" data-user-id="${escapeAttr(sender.userId)}" data-avatar-url="${escapeAttr(avatar.url)}" data-avatar-color="${escapeAttr(avatar.color)}" title="${escapeAttr(tr('profile.viewProfileName', 'View {name}', { name: sender.username }))}">${avatar.initial}</button>` : (isChannel ? '<div class="w-8 flex-shrink-0 mr-2"></div>' : '');
                let replyQuoteHtml = '';
                if (msg.replyToId) {
                    const originalMsg = findMessage(state.currentChat.chatId, msg.replyToId);
                    if (originalMsg) {
                        const originalSenderName = getMessageSenderName(originalMsg, chat);
                        
                        let originalTextPreview;
                        if (originalMsg.callLog) {
                            const originalCallPreview = getCallLogPresentation(originalMsg.callLog, state.currentUser?.userId);
                            originalTextPreview = `<i class="fas ${escapeAttr(originalCallPreview.icon)}"></i> ${escapeHtml(originalCallPreview.preview)}`;
                        } else if (originalMsg.starGiveaway) {
                            originalTextPreview = `<i class="fas fa-star"></i> ${escapeHtml(originalMsg.starGiveaway.amountLabel || `${formatStarsAmount(originalMsg.starGiveaway.amountTenths || 0)} Stars`)}`;
                        } else if (originalMsg.giftGiveaway) {
                            originalTextPreview = `<i class="fas fa-gift"></i> ${escapeHtml(originalMsg.giftGiveaway.gift?.name || t('gift.giftGiveaway', 'Gift Giveaway'))}`;
                        } else if (originalMsg.theme) {
                            originalTextPreview = `<i class="fas fa-palette"></i> ${escapeHtml(tr('message.themeSummary', 'Theme: {name}', { name: originalMsg.theme.name || t('message.themeFallback', 'Theme') }))}`;
                        } else if (originalMsg.poll) {
                            originalTextPreview = `<i class="fas fa-square-poll-vertical"></i> ${escapeHtml(originalMsg.poll.question || t('polls.title', 'Poll'))}`;
                        } else if (originalMsg.file) {
                            originalTextPreview = `<i class="fas fa-paperclip"></i> ${originalMsg.file.name || 'File'}`;
                        } else {
                            originalTextPreview = escapeHtml(originalMsg.text || '');
                        }

                        replyQuoteHtml = `<div class="reply-quote message-reply-quote ${isSender ? 'message-reply-quote-outgoing' : 'message-reply-quote-incoming'} pl-2 mb-2 text-xs opacity-80" data-reply-to-id="${msg.replyToId}"><div class="font-bold">${renderUsernameWithTag(originalSenderName)}</div><div class="truncate">${originalTextPreview}</div></div>`;
                    }
                }
                let forwardedHeader = '';
                if(msg.forwardedInfo) forwardedHeader = `<div class="text-xs message-forwarded-label ${isSender ? 'message-forwarded-label-outgoing' : 'message-forwarded-label-incoming'} italic mb-1 opacity-80"><i class="fas fa-share-square mr-1"></i> Forwarded message</div>`;
                const e2eeHeader = msg.e2ee ? `<div class="text-[11px] message-e2ee-label ${isSender ? 'message-e2ee-label-outgoing' : 'message-e2ee-label-incoming'} font-semibold mb-1 uppercase tracking-wide"><i class="fas fa-lock mr-1"></i>${escapeHtml(t('e2ee.chatLabel', 'E2EE Chat'))}</div>` : '';
                let messageBody = '';
                let hasVisualMedia = false;
                let hasVideoMedia = false;
                if (msg.callLog) {
                    const callView = getCallLogPresentation(msg.callLog, state.currentUser?.userId);
                    messageBody = `
                        <div class="theme-card rounded-2xl px-4 py-3 min-w-[15rem] max-w-sm text-center shadow-md">
                            <div class="flex items-center justify-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                                    <i class="fas ${escapeAttr(callView.icon)} text-lg ${escapeAttr(callView.iconClass)}"></i>
                                </div>
                                <div class="min-w-0 text-left">
                                    <div class="text-sm font-semibold">${escapeHtml(callView.title)}</div>
                                    <div class="text-xs app-text-muted">${escapeHtml(callView.detail)}</div>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (msg.securityNotice) {
                    messageBody = renderSecurityNoticeCard(msg);
                } else if (msg.starGiveaway) {
                    const giveaway = msg.starGiveaway;
                    const canClaim = giveaway.status === 'open' && giveaway.giverUserId !== state.currentUser.userId;
                    messageBody = `
                        <div class="theme-card giveaway-card giveaway-card-stars p-4">
                            <div class="text-xs font-semibold uppercase tracking-wide">${escapeHtml(t('wallet.starsGiveaway', 'Stars Giveaway'))}</div>
                            <div class="mt-2 text-2xl font-bold break-words">${escapeHtml(giveaway.amountLabel || formatStarsAmount(giveaway.amountTenths || 0))} ${escapeHtml(t('wallet.stars', 'Stars'))}</div>
                            <div class="mt-1 text-xs">${escapeHtml(giveaway.status === 'claimed' ? t('gift.alreadyClaimed', 'Already claimed') : t('gift.firstClaimWins', 'First claim wins'))}</div>
                            ${canClaim ? `<button class="mt-3 w-full rounded-lg btn-warning px-4 py-2 text-sm font-semibold interactive-pop" data-action="claim-stars-giveaway" data-giveaway-id="${escapeAttr(giveaway.giveawayId)}">${escapeHtml(t('gift.claim', 'Claim'))}</button>` : ''}
                        </div>
                    `;
                } else if (msg.giftGiveaway) {
                    const giveaway = msg.giftGiveaway;
                    const gift = giveaway.gift || {};
                    const canClaim = giveaway.status === 'open' && giveaway.giverUserId !== state.currentUser.userId;
                    messageBody = `
                        <div class="theme-card giveaway-card giveaway-card-gift p-4">
                            <div class="flex items-center gap-3">
                                ${renderGiftMediaHtml(gift.imageUrl || '', gift.name || t('gift.giftFallback', 'Gift'), 'h-14 w-14 rounded-xl object-cover app-border', 'fas fa-gift text-xl')}
                                <div class="min-w-0">
                                    <div class="text-xs font-semibold uppercase tracking-wide">${escapeHtml(t('gift.giftGiveaway', 'Gift Giveaway'))}</div>
                                    <div class="truncate text-lg font-bold">${escapeHtml(gift.name || t('gift.giftFallback', 'Gift'))}</div>
                                    <div class="text-xs">${escapeHtml(giveaway.status === 'claimed' ? t('gift.alreadyClaimed', 'Already claimed') : t('gift.firstClaimWins', 'First claim wins'))}</div>
                                </div>
                            </div>
                            ${canClaim ? `<button class="mt-3 w-full rounded-lg btn-accent px-4 py-2 text-sm font-semibold interactive-pop" data-action="claim-gift-giveaway" data-giveaway-id="${escapeAttr(giveaway.giveawayId)}">${escapeHtml(t('gift.claim', 'Claim'))}</button>` : ''}
                        </div>
                    `;
                } else if (msg.theme) {
                    const themeName = escapeHtml(msg.theme.name || t('message.themeFallback', 'Theme'));
                    const themeDescription = escapeHtml(msg.theme.description || '');
                    messageBody = `<div class="theme-card p-3 rounded-lg border max-w-sm">
                        <div class="font-bold text-lg mb-2 flex items-center"><i class="fas fa-palette mr-2 app-accent-text"></i>${escapeHtml(tr('message.themeSummary', 'Theme: {name}', { name: msg.theme.name || t('message.themeFallback', 'Theme') }))}</div>
                        <p class="text-sm mb-4">${themeDescription}</p>
                        <button class="w-full btn-accent font-bold py-2 px-4 rounded-lg interactive-pop btn-apply-theme" data-action="apply-theme">Apply Theme</button>
                    </div>`;
                } else if (msg.poll) {
                    messageBody = renderPollCard(msg);
                } else if(msg.file) {
                    if (typeof msg.file === 'object' && msg.file !== null && msg.file.url) {
                        const url = msg.file.url, name = msg.file.name || 'download', type = msg.file.type || '';
                        const caption = msg.text ? `<p class="mt-2 text-sm">${parseMarkdown(msg.text)}</p>` : '';
                        const resolvedFileUrl = sanitizeMediaUrl(resolveServerUrl(url));
                        if (!resolvedFileUrl) {
                            messageBody = `<div class="text-sm text-red-200">Blocked unsafe file URL.</div>`;
                        } else {
						const likelyVoice = isLikelyVoiceAttachment(name, resolvedFileUrl || url);
						let fileType = String(type || '').toLowerCase();
						if ((fileType === 'video/webm' || fileType === 'video/ogg') && likelyVoice) {
							fileType = fileType.replace('video/', 'audio/');
						}
						if (!fileType && name) {
							// Detect from file extension if type is missing
							const ext = name.toLowerCase().split('.').pop();
							if (ext === 'tgs') {
								fileType = 'application/x-tgsticker';
							} else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
								fileType = 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
							} else if (['mp3', 'wav', 'm4a', 'flac', 'aac'].includes(ext) || (['webm', 'ogg'].includes(ext) && likelyVoice)) {
								fileType = ext === 'mp3' ? 'audio/mpeg' : 'audio/' + ext;
							} else if (['mp4', 'webm', 'ogg'].includes(ext)) {
								fileType = 'video/' + ext;
							}
						}

						// Render media based on type
						let mediaHtml;

						if (isTgsMedia(resolvedFileUrl, name, fileType)) {
                            hasVisualMedia = true;
							mediaHtml = `
								<div
									class="message-visual-media message-tgs-sticker media-item"
									data-type="tgs"
									data-url="${escapeAttr(resolvedFileUrl)}"
								>${createTgsMarkup(resolvedFileUrl, name, 'message-tgs-sticker')}</div>
							`;
						} else if (fileType.startsWith('image/')) {
                            hasVisualMedia = true;
							mediaHtml = `
								<img
									src="${escapeAttr(resolvedFileUrl)}"
									alt="${escapeAttr(name)}"
									class="message-visual-media h-auto rounded-lg cursor-pointer media-item object-contain"
									style="width: 8rem; height: 8rem; display: block;"
									data-type="image"
									data-url="${escapeAttr(resolvedFileUrl)}"
								>
							`;
						} else if (fileType.startsWith('video/')) {
                            hasVisualMedia = true;
                            hasVideoMedia = true;
							mediaHtml = `
								<video
									src="${escapeAttr(resolvedFileUrl)}"
									controls
									preload="none"
									class="message-visual-media message-visual-media-video rounded-lg media-item object-contain"
									style="display: block;"
									data-type="video"
									data-url="${escapeAttr(resolvedFileUrl)}"
								></video>
							`;
						} else if (fileType.startsWith('audio/')) {
							// Inline audio player - plays in message
							mediaHtml = `<div class="inline-audio-player">
								<button class="play-btn btn-accent w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0" data-action="toggle-inline-audio" data-audio-url="${escapeAttr(resolvedFileUrl)}" data-audio-name="${escapeAttr(name)}">
									<i class="fas fa-play"></i>
								</button>
								<div class="flex-1 min-w-0">
									<div class="font-semibold text-sm truncate">${escapeHtml(name)}</div>
									<div class="text-xs app-text-muted">Audio file</div>
								</div>
								<i class="fas fa-music app-text-soft text-xl"></i>
							</div>`;
						} else {
							// Other file types - download link
							mediaHtml = `<a href="${escapeAttr(resolvedFileUrl)}" download="${escapeAttr(name)}" target="_blank" class="theme-file-link flex items-center p-3 rounded-lg">
								<i class="fas fa-file-download text-2xl mr-3"></i>
								<div>
									<div class="font-bold">${escapeHtml(name)}</div>
									<div class="text-xs">Click to download</div>
								</div>
							</a>`;
						}


                        messageBody = `<div>${mediaHtml}${caption}</div>`;
                        }
                    }
                } else if (msg.text) {
                    // Ensure msg.text is actually a string (not a JSON object stringified)
                    let displayText = msg.text;
                    // If displayText looks like JSON, try to extract the actual text
                    if (typeof displayText === 'string') {
                        const trimmed = displayText.trim();
                        if ((trimmed.startsWith('{') && trimmed.includes('"text"')) || trimmed.startsWith('[')) {
                            try {
                                const parsed = JSON.parse(trimmed);
                                // If it's the content object with text property, extract it
                                if (parsed.text) {
                                    displayText = parsed.text;
                                }
                            } catch (e) {
                                // If not valid JSON, keep original text
                            }
                        }
                    }
                    const giftLinkIds = extractGiftLinkIds(displayText);
                    const textWithoutGiftLinks = displayText.replace(/\[gift\]\((https?:\/\/web\.noveo\.ir\/gift(?:\/([0-9]+)|\?id=([^)]+)))\)/ig, '').trim();
                    messageBody = textWithoutGiftLinks ? `<p class="message-text">${parseMarkdown(textWithoutGiftLinks)}</p>` : '';
                    // Add URL embed container
                    const urls = extractUrls(textWithoutGiftLinks);
                    if (urls.length > 0) {
                        // Store URLs in data attribute - escape quotes properly
                        const urlsJson = JSON.stringify(urls).replace(/"/g, '&quot;');
                        messageBody += `<div class="url-embeds-container" data-urls="${urlsJson}"></div>`;
                    }
                    if (giftLinkIds.length > 0) {
                        messageBody += giftLinkIds.map((giftId) => `
                            <div class="gift-link-embed theme-card mt-3 rounded-xl p-4" data-gift-id="${escapeAttr(giftId)}">
                                <div class="text-sm font-semibold">Loading giftï¿½</div>
                            </div>
                        `).join('');
                    }
                }
                const timestamp = formatMessageTimestamp(msg.timestamp), editedSpan = msg.editedAt ? '<span class="text-xs message-meta-soft italic ml-2">(edited)</span>' : '';
                let actionsContainer = '';
                if (!msg.e2ee) {
                    let actionsHtml = '';
                    if (!isCallLog) {
                        actionsHtml += `<button class="action-forward message-action-button p-2 rounded-full" title="${escapeAttr(t('messageActions.forward', 'Forward'))}"><i class="fas fa-share"></i></button>`;
                        if (canReplyMessage(msg)) actionsHtml += `<button class="action-reply message-action-button p-2 rounded-full" title="${escapeAttr(t('messageActions.reply', 'Reply'))}"><i class="fas fa-reply"></i></button>`;
                        if (canViewSeenBy(msg)) actionsHtml += `<button class="action-seen-by message-action-button p-2 rounded-full" title="${escapeAttr(t('seenBy.title', 'Seen By'))}"><i class="fas fa-eye"></i></button>`;
                        if (isPrivateChat || isChannelOwner) actionsHtml += `<button class="action-pin message-action-button p-2 rounded-full" title="${escapeAttr(t('messageActions.pin', 'Pin Message'))}"><i class="fas fa-thumbtack"></i></button>`;
                        if (isSender || isChannelOwner) {
                             if(isSender) actionsHtml += `<button class="action-edit message-action-button p-2 rounded-full ${(msg.file || msg.theme || msg.poll || msg.starGiveaway || msg.giftGiveaway || msg.callLog) ? 'hidden' : ''}" title="${escapeAttr(t('messageActions.edit', 'Edit'))}"><i class="fas fa-pen"></i></button>`;
                            actionsHtml += `<button class="action-delete message-action-button message-action-button-danger p-2 rounded-full" title="${escapeAttr(t('messageActions.delete', 'Delete'))}"><i class="fas fa-trash"></i></button>`;
                        }
                    } else if (canDeleteMessage(msg)) {
                        actionsHtml += `<button class="action-delete message-action-button message-action-button-danger p-2 rounded-full" title="${escapeAttr(t('messageActions.delete', 'Delete'))}"><i class="fas fa-trash"></i></button>`;
                    }
                    if (actionsHtml) {
                    actionsContainer = `<div class="message-actions self-center ${isSender ? 'mr-2' : 'ml-2'} flex items-center rounded-full shadow-sm">${actionsHtml}</div>`;
                    }
                }
                const showSenderName = (!isSender && !isCallLog && state.currentChat.chatType === 'group' && sender) && !isChannel;
                const senderNameHtml = showSenderName ? `<button type="button" class="message-sender-trigger border-0 bg-transparent p-0 text-xs font-bold app-accent-text mb-1 flex items-center text-left hover:underline" data-user-id="${escapeAttr(sender.userId)}">${renderDisplayName(sender.username, Boolean(sender.isVerified), Boolean(sender.isBot), sender.membershipTier, sender.nicknameFont, sender.premiumStarIcon)}</button>` : '';
                const messageContentClass = isCallLog
                    ? 'message-content max-w-md lg:max-w-lg min-w-0'
                    : hasVisualMedia
                    ? `message-content message-content-media ${hasVideoMedia ? 'message-content-media-video' : ''} min-w-0`
                    : 'message-content max-w-md lg:max-w-lg min-w-0';
                const messageBodyClass = isCallLog
                    ? `message-body ${isSender ? 'message-body-outgoing' : 'message-body-incoming'} rounded-lg p-3 shadow-md`
                    : hasVisualMedia
                    ? `message-body message-body-media ${isSender ? 'message-body-outgoing' : 'message-body-incoming'} rounded-lg shadow-md`
                    : `message-body ${isSender ? 'message-body-outgoing' : 'message-body-incoming'} rounded-lg p-3 shadow-md`;
                const reactionsHtml = renderMessageReactions(msg);
                const inlineKeyboardHtml = renderInlineKeyboard(msg);
                const channelViewCount = chat.chatType === 'channel' ? new Set((msg.seenBy || []).filter(Boolean)).size : 0;
                const viewsMeta = chat.chatType === 'channel'
                    ? `<span class="ml-2 inline-flex items-center gap-1"><i class="fas fa-eye"></i>${escapeHtml(localizeDigits(String(channelViewCount)))}</span>`
                    : '';
                const messageContent = `<div class="${messageContentClass}">${senderNameHtml}<div class="${messageBodyClass}">${e2eeHeader}${forwardedHeader}${replyQuoteHtml}${messageBody}${inlineKeyboardHtml}</div>${reactionsHtml}<div class="text-xs px-2 mt-1 message-meta message-ticks flex items-center">${timestamp}${editedSpan}${viewsMeta}${this.renderTicks(msg)}</div></div>`;
                return isSender ? `${actionsContainer} ${messageContent}` : `${avatarEl} ${messageContent} ${actionsContainer}`;
            },
            async loadUrlEmbeds(messageEl) {
                const embedContainer = messageEl.querySelector('.url-embeds-container');
                if (!embedContainer) return;
                
                try {
                    // Get URLs from data attribute and unescape HTML entities
                    const urlsJson = (embedContainer.dataset.urls || '[]').replace(/&quot;/g, '"');
                    let urls;
                    try {
                        urls = JSON.parse(urlsJson);
                    } catch (e) {
                        console.error('Failed to parse URLs JSON:', urlsJson, e);
                        embedContainer.remove();
                        return;
                    }
                    
                    if (!Array.isArray(urls) || urls.length === 0) return;
                    
                    const url = urls[0];
                    const isSender = messageEl.classList.contains('justify-end');
                    if (isDirectImageUrl(url) || isDirectVideoUrl(url)) {
                        embedContainer.innerHTML = sanitizeRichHtml(this.createUrlEmbedHtml({ url }, isSender));
                        return;
                    }

                    embedContainer.textContent = 'Loading preview...';
                    const metadata = await getUrlMetadata(url);
                    
                    if (metadata) {
                        const embedHtml = this.createUrlEmbedHtml(metadata, isSender);
                        embedContainer.innerHTML = sanitizeRichHtml(embedHtml);
                    } else {
                        // If no metadata, show a simple link card as fallback
                        embedContainer.innerHTML = sanitizeRichHtml(this.createUrlEmbedHtml({
                            title: new URL(url).hostname,
                            description: '',
                            image: '',
                            url: url,
                            siteName: new URL(url).hostname.replace('www.', '')
                        }, isSender));
                    }
                } catch (error) {
                    console.error('Error loading URL embed:', error);
                    // On error, remove the container
                    embedContainer.remove();
                }
            },
            async loadGiftEmbeds(messageEl) {
                const embedNodes = Array.from(messageEl.querySelectorAll('.gift-link-embed[data-gift-id]'));
                if (!embedNodes.length) return;
                for (const embedNode of embedNodes) {
                    const giftId = embedNode.dataset.giftId;
                    if (!giftId) continue;
                    const gift = await getGiftCatalogItem(giftId);
                    if (!gift) {
                        embedNode.innerHTML = `<div class="text-sm app-text-muted">${escapeHtml(t('gift.unavailable', 'Gift unavailable.'))}</div>`;
                        continue;
                    }
                    const isAvailable = Boolean(gift.isActive) && Number(gift.stockRemaining || 0) > 0;
                    embedNode.innerHTML = `
                        <div class="flex items-center gap-3">
                            ${renderGiftMediaHtml(gift.imageUrl || '', gift.name || 'Gift', 'h-16 w-16 rounded-xl object-cover border border-fuchsia-200', 'fas fa-gift text-2xl')}
                            <div class="min-w-0 flex-1">
                                <div class="text-xs font-semibold uppercase tracking-wide">Gift</div>
                                <div class="truncate text-lg font-bold">${escapeHtml(gift.name || 'Gift')}</div>
                            <div class="text-sm">${escapeHtml(gift.priceLabel || `${formatStarsAmount(gift.priceTenths || 0)} ${t('wallet.stars', 'Stars')}`)}</div>
                                <div class="text-xs app-text-muted">${escapeHtml(gift.stockRemaining)} left</div>
                            </div>
                        </div>
                        <button class="mt-3 w-full rounded-lg btn-accent px-4 py-2 text-sm font-semibold interactive-pop" data-action="buy-gift" data-gift-id="${escapeAttr(gift.giftId)}">${escapeHtml(t('common.view', 'View'))}</button>
                    `;
                    embedNode.querySelector('[data-action="buy-gift"]')?.addEventListener('click', async (event) => {
                        event.preventDefault();
                        const buyGiftId = event.currentTarget.dataset.giftId;
                        if (!buyGiftId) return;
                        openGiftDetailModal(buyGiftId);
                    });
                    initTgsPlayers(embedNode).catch(() => {});
                }
            },
            createUrlEmbedHtml(metadata, isSender) {
                const safeUrl = sanitizeLinkUrl(metadata.url);
                if (!safeUrl) return '';
                const senderClass = isSender ? 'url-embed-outgoing' : 'url-embed-incoming';
                if (isDirectVideoUrl(safeUrl)) {
                    return `<div class="url-embed ${senderClass} url-embed-media my-2 max-w-2xl">
                        <div class="url-embed-media-frame">
                            <video class="url-embed-video" controls preload="metadata" playsinline src="${escapeAttr(safeUrl)}"></video>
                        </div>
                        <a href="${escapeAttr(safeUrl)}" class="url-embed-site-text block px-3 pb-3 pt-2" target="_blank" rel="noopener noreferrer">${escapeHtml(new URL(safeUrl).hostname)}</a>
                    </div>`;
                }
                if (isDirectImageUrl(safeUrl)) {
                    return `<a href="${escapeAttr(safeUrl)}" class="url-embed ${senderClass} url-embed-media block my-2 max-w-2xl" target="_blank" rel="noopener noreferrer">
                        <div class="url-embed-media-frame">
                            <img src="${escapeAttr(safeUrl)}" alt="${escapeAttr(metadata.title || 'Image')}" class="url-embed-image url-embed-image-full" loading="lazy">
                        </div>
                        <div class="px-3 pb-3 pt-2 text-xs url-embed-site-text">${escapeHtml(new URL(safeUrl).hostname)}</div>
                    </a>`;
                }
                const aparatVideoId = extractAparatVideoId(safeUrl);
                if (aparatVideoId) {
                    const embedUrl = `https://www.aparat.com/video/video/embed/videohash/${encodeURIComponent(aparatVideoId)}/vt/frame?titleShow=true`;
                    return `<div class="url-embed aparat-embed my-2 w-full max-w-2xl">
                        <div class="aparat-embed-frame">
                            <div class="aparat-embed-ratio"></div>
                            <iframe
                                src="${escapeAttr(embedUrl)}"
                                title="${escapeAttr(metadata.title || 'Aparat video')}"
                                allowfullscreen="true"
                                webkitallowfullscreen="true"
                                mozallowfullscreen="true"
                                frameborder="0"
                                loading="lazy"
                                referrerpolicy="strict-origin-when-cross-origin"
                            ></iframe>
                        </div>
                    </div>`;
                }

                const safeImage = sanitizeMediaUrl(metadata.image);
				const imageHtml = safeImage ? `<img src="${escapeAttr(safeImage)}" alt="${escapeAttr(metadata.title || 'Link')}" class="w-full h-32 object-cover">` : '';
				return `<a href="${escapeAttr(safeUrl)}" class="url-embed ${senderClass} block my-2 rounded-lg overflow-hidden shadow-md transition max-w-md">
					${imageHtml}
					<div class="p-3">
						<div class="font-semibold text-sm url-embed-title-text">${escapeHtml(metadata.title || 'Link')}</div>
						${metadata.description ? `<div class="text-xs url-embed-description-text mt-1 line-clamp-2">${escapeHtml(metadata.description)}</div>` : ''}
						<div class="text-xs url-embed-site-text mt-2">${escapeHtml(metadata.siteName || new URL(safeUrl).hostname)}</div>
					</div>
				</a>`;
            },
            addMessageEventListeners(el) {
                const message = findMessage(state.currentChat?.chatId, el.dataset.msgId);
                el.querySelector('.message-avatar')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    const user = state.allUsers[e.currentTarget.dataset.userId];
                    if (user) this.openUserInfoModal(user);
                });
                el.querySelector('.message-sender-trigger')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    const user = state.allUsers[e.currentTarget.dataset.userId];
                    if (user) this.openUserInfoModal(user);
                });
                el.querySelector('.action-edit')?.addEventListener('click', (e) => { e.preventDefault(); this.enterEditMode(el); });
                el.querySelector('.action-delete')?.addEventListener('click', (e) => { e.preventDefault(); this.confirmDelete(el.dataset.msgId); });
                el.querySelector('.action-reply')?.addEventListener('click', (e) => { e.preventDefault(); enterReplyMode(findMessage(state.currentChat.chatId, el.dataset.msgId)); });
                el.querySelector('.action-seen-by')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetMessage = findMessage(state.currentChat.chatId, el.dataset.msgId);
                    if (targetMessage) openSeenByModal(targetMessage);
                });
                el.querySelector('.action-forward')?.addEventListener('click', (e) => { e.preventDefault(); this.openForwardModal(el.dataset.msgId); });
                el.querySelector('.action-pin')?.addEventListener('click', (e) => { e.preventDefault(); pinMessage(el.dataset.msgId); });
                el.querySelectorAll('.channel-handle').forEach(handleEl => handleEl.addEventListener('click', (e) => { e.preventDefault(); openChannelByHandle(e.target.dataset.handle); }));
                el.querySelector('.media-item')?.addEventListener('click', (e) => { const target = e.currentTarget; if (target.dataset.type === 'image') ui.openMediaViewer('image', target.dataset.url); });
                el.querySelectorAll('.code-block-copy[data-action="copy-code"]').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const codeId = e.currentTarget.dataset.codeId;
                        if (codeId && typeof window.copyCodeBlock === 'function') window.copyCodeBlock(codeId);
                    });
                });
                el.querySelectorAll('.play-btn[data-action="toggle-inline-audio"]').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const targetBtn = e.currentTarget;
                        const audioUrl = sanitizeMediaUrl(targetBtn.dataset.audioUrl);
                        const audioName = targetBtn.dataset.audioName || 'Audio';
                        if (!audioUrl) return;
                        if (typeof window.toggleInlineAudio === 'function') window.toggleInlineAudio(targetBtn, audioUrl, audioName);
                    });
                });
                el.querySelectorAll('button[data-action="bot-callback"]').forEach((btn) => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const targetBtn = e.currentTarget;
                        targetBtn.disabled = true;
                        try {
                            if (isEmailBotCallback(targetBtn.dataset.callbackData) && await handleEmailBotAction(targetBtn.dataset.callbackData, targetBtn.dataset.messageId)) {
                                return;
                            }
                            await triggerBotCallback(state.currentChat?.chatId, targetBtn.dataset.messageId, targetBtn.dataset.callbackData);
                        } catch (error) {
                            showErrorModal(t('bot.title', 'Bots'), error.message || t('bot.callbackFailed', 'Could not send that bot action.'));
                        } finally {
                            targetBtn.disabled = false;
                        }
                    });
                });
                el.querySelector('.btn-apply-theme[data-action="apply-theme"]')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    const msg = findMessage(state.currentChat.chatId, el.dataset.msgId);
                    if (msg?.theme?.css) {
                        applyThemeCss(msg.theme.css, true);
                    }
                });
                el.querySelectorAll('[data-action="vote-poll"]').forEach((btn) => {
                    btn.addEventListener('click', async (event) => {
                        event.preventDefault();
                        const targetBtn = event.currentTarget;
                        const targetMessage = findMessage(state.currentChat?.chatId, targetBtn.dataset.messageId || el.dataset.msgId);
                        if (!targetMessage?.poll?.canVote) return;
                        targetBtn.disabled = true;
                        try {
                            await voteOnPoll(targetBtn.dataset.messageId || el.dataset.msgId, targetBtn.dataset.optionId);
                        } finally {
                            window.setTimeout(() => { targetBtn.disabled = false; }, 400);
                        }
                    });
                });
                el.querySelectorAll('[data-action="view-poll-votes"]').forEach((btn) => {
                    btn.addEventListener('click', (event) => {
                        event.preventDefault();
                        const targetMessage = findMessage(state.currentChat?.chatId, event.currentTarget.dataset.messageId || el.dataset.msgId);
                        if (targetMessage) openPollVotesModal(targetMessage);
                    });
                });
                el.querySelector('.action-cancel-pending[data-action="cancel-pending"]')?.addEventListener('click', (e) => {
                    const tempId = e.currentTarget.dataset.tempId;
                    if (tempId) this.cancelMessage(tempId, e);
                });
                el.querySelectorAll('[data-action="claim-stars-giveaway"]').forEach((btn) => {
                    btn.addEventListener('click', async (event) => {
                        event.preventDefault();
                        const giveawayId = event.currentTarget.dataset.giveawayId;
                        if (!giveawayId) return;
                        try {
                            await claimStarsGiveaway(giveawayId);
                            await loadWalletOverview(true);
                        } catch (error) {
                            showErrorModal(t('gift.claimFailedTitle', 'Claim Failed'), error.message || t('error.couldNotClaimStarsGiveaway', 'Could not claim the Stars giveaway.'));
                        }
                    });
                });
                el.querySelectorAll('[data-action="claim-gift-giveaway"]').forEach((btn) => {
                    btn.addEventListener('click', async (event) => {
                        event.preventDefault();
                        const giveawayId = event.currentTarget.dataset.giveawayId;
                        if (!giveawayId) return;
                        try {
                            await claimGiftGiveaway(giveawayId);
                            await loadWalletOverview(true);
                        } catch (error) {
                            showErrorModal(t('gift.claimFailedTitle', 'Claim Failed'), error.message || t('error.couldNotClaimGiftGiveaway', 'Could not claim the gift giveaway.'));
                        }
                    });
                });
                el.querySelectorAll('[data-action="toggle-reaction"]').forEach((btn) => {
                    btn.addEventListener('click', (event) => {
                        event.preventDefault();
                        const reaction = event.currentTarget.dataset.reaction;
                        if (reaction) toggleMessageReaction(el.dataset.msgId, reaction);
                    });
                });
                el.querySelectorAll('[data-action="acknowledge_login"]').forEach((btn) => {
                    btn.addEventListener('click', (event) => {
                        event.preventDefault();
                        if (!msg?.messageId || !socket || socket.readyState !== WebSocket.OPEN) return;
                        event.currentTarget.disabled = true;
                        socket.send(JSON.stringify({ type: 'acknowledge_security_notice', messageId: msg.messageId }));
                    });
                });
                el.querySelectorAll('[data-action="logout_session"]').forEach((btn) => {
                    btn.addEventListener('click', async (event) => {
                        event.preventDefault();
                        const targetButton = event.currentTarget;
                        const sessionId = targetButton.dataset.sessionId || '';
                        if (!sessionId) return;
                        targetButton.disabled = true;
                        try {
                            const current = normalizeSession(getStorage().loadSession());
                            await authenticatedFetch('/user/sessions/revoke', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sessionId }),
                            });
                            if (current?.sessionId && current.sessionId === sessionId) {
                                handleLogoutSequence(false);
                                return;
                            }
                            targetButton.textContent = t('securityNotice.loggedOut', 'Logged out');
                        } catch (error) {
                            targetButton.disabled = false;
                            showErrorModal(t('auth.logout', 'Logout'), error.message || t('error.couldNotLogoutDevice', 'Could not log out that device.'));
                        }
                    });
                });
                let holdTimer = null;
                const clearHold = () => {
                    if (holdTimer) {
                        clearTimeout(holdTimer);
                        holdTimer = null;
                    }
                };
                const startHold = (event) => {
                    if (event.target.closest('button, a, input, textarea, video, audio')) return;
                    const targetMessage = findMessage(state.currentChat?.chatId, el.dataset.msgId);
                    if (!targetMessage || !canOpenMessageActionSheet(targetMessage)) return;
                    clearHold();
                    holdTimer = setTimeout(() => {
                        holdTimer = null;
                        openMessageActionSheet(el.dataset.msgId);
                    }, 450);
                };
                el.addEventListener('touchstart', startHold, { passive: true });
                el.addEventListener('touchend', clearHold);
                el.addEventListener('touchcancel', clearHold);
                el.addEventListener('touchmove', clearHold);
                el.addEventListener('contextmenu', (event) => {
                    const targetMessage = findMessage(state.currentChat?.chatId, el.dataset.msgId);
                    event.preventDefault();
                    if (!targetMessage || !canOpenMessageActionSheet(targetMessage)) return;
                    openMessageActionSheet(el.dataset.msgId);
                });
                // Load URL embeds asynchronously
                this.loadUrlEmbeds(el);
                this.loadGiftEmbeds(el);
                initTgsPlayers(el);
                initAnimatedMediaVisibility(el);
            },
            enterEditMode(msgEl) {
                const msgId = msgEl.dataset.msgId, message = findMessage(state.currentChat.chatId, msgId); if (!message || !message.text) return;
                const body = msgEl.querySelector('.message-body'), originalHtml = body.innerHTML;
                body.innerHTML = `<textarea class="w-full p-2 border rounded-md theme-edit-textarea">${escapeHtml(message.text)}</textarea><div class="text-right mt-2"><button class="text-xs py-1 px-2 rounded btn-neutral btn-cancel-edit">Cancel</button><button class="text-xs py-1 px-2 rounded btn-success ml-2 btn-save-edit">Save</button></div>`;
                msgEl.querySelector('.btn-cancel-edit').addEventListener('click', () => { body.innerHTML = originalHtml; });
                msgEl.querySelector('.btn-save-edit').addEventListener('click', () => { const newContent = body.querySelector('textarea').value.trim(); if (newContent && newContent !== message.text) state.socket.send(JSON.stringify({ type: 'edit_message', messageId: msgId, chatId: state.currentChat.chatId, newContent })); else body.innerHTML = originalHtml; });
            },
            async confirmDelete(msgId) {
                if (state.currentChat?.chatType === 'private') {
                    const scope = await promptDmMessageDeleteScope();
                    if (scope) requestMessageDelete(msgId, scope);
                    return;
                }
                this.openModal(state.dom.confirmDeleteModal);
                state.dom.confirmDeleteButton.dataset.mode = 'delete';
                state.dom.confirmDeleteButton.dataset.msgId = msgId;
            },
            renderTicks(msg) { 
                if (msg.pending) {
                    return `<button class="action-cancel-pending message-meta-soft ml-1 cursor-pointer" title="Click to cancel (if stuck)" data-action="cancel-pending" data-temp-id="${escapeAttr(msg.messageId)}"><i class="fas fa-clock"></i></button>`;
                }
                if (msg.senderId !== state.currentUser.userId) return ''; 
                if (!chatSupportsSeenReceipts(state.currentChat)) return '<i class="fas fa-check tick-sent ml-1"></i>';
                const realSeenCount = getRealSeenCount(msg);
                if(realSeenCount >= state.currentChat.members.length - 1) return '<i class="fas fa-check-double tick-complete ml-1"></i>'; 
                if (realSeenCount > 0 || hasAnonymousSeenReceipt(msg)) return '<i class="fas fa-check-double tick-partial ml-1"></i>'; 
                return '<i class="fas fa-check tick-sent ml-1"></i>'; 
            },
            cancelMessage(tempId, event) {
                if(event) event.stopPropagation();
                if (state.currentChat) {
                    const idx = state.currentChat.messages.findIndex(m => m.messageId === tempId);
                    if (idx > -1) state.currentChat.messages.splice(idx, 1);
                }
                const el = document.querySelector(`.message-wrapper[data-msg-id="${tempId}"]`);
                if (el) el.remove();
            },
            openModal(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); },
            closeModal(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); },
            updateBioCounter() {
                if (!state.dom.editBioInput || !state.dom.editBioCounter) return;
                const value = String(state.dom.editBioInput.value || '');
                state.dom.editBioCounter.textContent = `${localizeDigits(value.length)} / ${localizeDigits(PROFILE_BIO_MAX_LENGTH)}`;
            },
            populateSettingsProfile(user) {
                if (!user) return;
                const avatar = generateAvatar(user.username, user.userId, user.avatarUrl);
                state.dom.settingsAvatar.style.backgroundImage = `url(${avatar.url})`;
                state.dom.settingsAvatar.style.backgroundColor = avatar.color;
                state.dom.settingsAvatar.innerHTML = avatar.url ? '' : avatar.initial;
                state.dom.settingsUsername.innerHTML = renderDisplayName(user.username, Boolean(user.isVerified), Boolean(user.isBot), user.membershipTier, user.nicknameFont, user.premiumStarIcon, true);
                state.dom.settingsProfileStatus.textContent = t('settings.yourProfile', 'Your profile');
                state.dom.settingsProfileBio.textContent = (user.bio || '').trim() || t('settings.noBioYet', 'No bio yet.');
                state.dom.editUsernameInput.value = user.username || '';
                if (state.dom.editUsernameFontSelect) state.dom.editUsernameFontSelect.value = normalizeNicknameFont(user.nicknameFont);
                applyNicknameFontPreview(user.nicknameFont);
                if (state.dom.profileSkinModeSelect) state.dom.profileSkinModeSelect.value = user.profileSkin?.mode || '';
                if (state.dom.profileSkinColorPrimary) state.dom.profileSkinColorPrimary.value = user.profileSkin?.mode === 'solid' ? (user.profileSkin.color || '#7c3aed') : (user.profileSkin?.colors?.[0] || '#7c3aed');
                if (state.dom.profileSkinColorSecondary) state.dom.profileSkinColorSecondary.value = user.profileSkin?.colors?.[1] || '#ec4899';
                if (state.dom.profileSkinColorTertiary) state.dom.profileSkinColorTertiary.value = user.profileSkin?.colors?.[2] || '#22d3ee';
                if (state.dom.profileSkinGradientStopsSelect) state.dom.profileSkinGradientStopsSelect.value = (user.profileSkin?.mode === 'gradient' && (user.profileSkin?.colors?.length || 0) >= 3) ? '3' : '2';
                syncProfileSkinControls(user.profileSkin);
                if (state.dom.editHandleInput) state.dom.editHandleInput.value = String(user.handle || '').replace(/^@/, '');
                state.dom.editBioInput.value = user.bio || '';
                state.dom.settingsProfileCreatedAt.textContent = tr('profile.joinedDate', 'Joined {date}', { date: formatFullDate(user.createdAt) });
                initTgsPlayers(state.dom.settingsUsername).catch(() => {});
                state.dom.blockGroupInvitesCheckbox.checked = user.blockGroupInvites || false;
                const gifts = Array.isArray(user.gifts) ? user.gifts : [];
                const groups = getSharedGroupChatsForUser(user.userId);
                state.dom.settingsProfileGiftsSection.classList.toggle('hidden', gifts.length === 0);
                state.dom.settingsProfileNoGifts.classList.toggle('hidden', gifts.length > 0);
                state.dom.settingsProfileGiftsList.innerHTML = gifts.map((gift) => renderGiftBadge(gift, 'owned')).join('');
                initTgsPlayers(state.dom.settingsProfileGiftsList).catch(() => {});
                initAnimatedMediaVisibility(state.dom.settingsProfileGiftsList);
                state.dom.settingsProfileMutualGroupsList.innerHTML = renderProfileGroupList(groups, t('settings.noGroupsYet', 'No groups yet.'));
                if (state.dom.settingsProfileTabMutualGroups) {
                    state.dom.settingsProfileTabMutualGroups.textContent = t('settings.groups', 'Groups');
                }
                setProfileTab('settingsProfile', 'bio');
                setSettingsProfileEditing(false);
                this.updateBioCounter();
            },
            openSettings() {
                if (!state.isFullyAuthenticated || !state.currentUser || !state.allUsers[state.currentUser.userId]) return;
                this.populateSettingsProfile(state.allUsers[state.currentUser.userId]);
                this.updateBanRecheckControls();
                this.showSettingsMenu();
                this.openModal(state.dom.settingsModal);
                loadUserProfile(state.currentUser.userId, true).then((profile) => {
                    if (!profile || state.dom.settingsModal.classList.contains('hidden') || state.settingsProfileEditing) return;
                    state.allUsers[state.currentUser.userId] = { ...(state.allUsers[state.currentUser.userId] || {}), ...profile };
                    this.populateSettingsProfile(state.allUsers[state.currentUser.userId]);
                }).catch((error) => console.error('Failed to refresh settings profile', error));
            },
            updateBanRecheckControls() {
                const button = state.dom.requestBanRecheckButton;
                const status = state.dom.requestBanRecheckStatus;
                if (!button || !status) return;
                const isBanned = isCurrentUserBanned();
                const pardonRequest = getCurrentPardonRequest();
                button.classList.toggle('hidden', !isBanned);
                status.classList.toggle('hidden', !isBanned);
                if (!isBanned) {
                    button.disabled = false;
                    button.classList.remove('opacity-60', 'cursor-not-allowed');
                    status.textContent = '';
                    return;
                }
                if (pardonRequest?.status === 'open') {
                    button.disabled = true;
                    button.classList.add('opacity-60', 'cursor-not-allowed');
                    button.querySelector('span').textContent = 'Recheck Request Pending';
                    status.textContent = `Pending since ${formatMessageTimestamp(pardonRequest.createdAt)}. Admin review can include your sent messages and edited messages because you consented.`;
                } else {
                    button.disabled = false;
                    button.classList.remove('opacity-60', 'cursor-not-allowed');
                    button.querySelector('span').textContent = 'Request Recheck / Unban';
                    status.textContent = `${getCurrentBanReason()} You can request a recheck and allow admin review of your sent messages.`;
                }
            },
            showSettingsMenu() {
                state.dom.settingsMenuView.classList.remove('hidden');
                state.dom.settingsProfileSection.classList.add('hidden');
                state.dom.settingsAccountSection.classList.add('hidden');
                state.dom.settingsPreferencesSection.classList.add('hidden');
                state.dom.settingsChangelogSection.classList.add('hidden');
                state.dom.settingsBackBtn.classList.add('invisible', 'pointer-events-none');
                state.dom.settingsTitle.textContent = t('settings.settings', 'Settings');
            },
            showSettingsSection(name) {
                state.dom.settingsMenuView.classList.add('hidden');
                state.dom.settingsProfileSection.classList.add('hidden');
                state.dom.settingsAccountSection.classList.add('hidden');
                state.dom.settingsPreferencesSection.classList.add('hidden');
                state.dom.settingsChangelogSection.classList.add('hidden');
                if (name === 'profile') { state.dom.settingsProfileSection.classList.remove('hidden'); state.dom.settingsTitle.textContent = t('settings.profile', 'Profile'); }
                else if (name === 'account') { state.dom.settingsAccountSection.classList.remove('hidden'); state.dom.settingsTitle.textContent = t('settings.account', 'Account'); }
                else if (name === 'preferences') { state.dom.settingsPreferencesSection.classList.remove('hidden'); state.dom.settingsTitle.textContent = t('settings.preferences', 'Preferences'); syncNotificationPreferenceUi(); }
                else if (name === 'changelog') { this.renderSettingsChangelog(); state.dom.settingsChangelogSection.classList.remove('hidden'); state.dom.settingsTitle.textContent = t('settings.changelog', 'Changelog'); }
                state.dom.settingsBackBtn.classList.remove('invisible', 'pointer-events-none');
            },
            renderSettingsChangelog() {
                if (state.dom.settingsChangelogVersion) {
                    state.dom.settingsChangelogVersion.textContent = `v${localizeDigits(state.currentAppVersion)}`;
                }
                if (!state.dom.settingsChangelogList) return;
                state.dom.settingsChangelogList.innerHTML = CLIENT_CHANGELOG.map((entry, index) => `
                    <section class="app-card rounded-2xl p-4">
                        <div class="flex items-center justify-between gap-3 mb-3">
                            <div class="font-bold text-base">v${escapeHtml(localizeDigits(entry.version))}</div>
                            <div class="text-xs app-text-muted">${escapeHtml(t(index === 0 ? 'changelog.current' : 'changelog.recent', entry.date || ''))}</div>
                        </div>
                        <div class="space-y-2">
                            ${(entry.changeKeys || entry.changes || []).map((change) => `
                                <div class="flex items-start gap-3">
                                    <span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style="background: var(--accent);"></span>
                                    <p class="text-sm app-text-secondary">${escapeHtml(entry.changeKeys ? t(change, change) : change)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                `).join('');
            },
            closeUserInfoModal() {
                state.activeUserInfoUserId = null;
                if (state.dom.userInfoMessageButton) state.dom.userInfoMessageButton.dataset.userId = '';
                this.closeModal(state.dom.userInfoModal);
            },
            async openUserInfoModal(user) {
                if (!user) return;
                state.activeUserInfoUserId = user.userId;
                const applyProfileData = (profileData) => {
                    const mergedUser = { ...user, ...(profileData || {}) };
                    const displayName = getUserDisplayName(mergedUser, mergedUser.username || mergedUser.userId);
                    const isSelf = mergedUser.userId === state.currentUser?.userId;
                    const avatar = generateAvatar(displayName, mergedUser.userId, mergedUser.avatarUrl);
                    state.dom.userInfoAvatar.style.backgroundImage = `url(${avatar.url})`; state.dom.userInfoAvatar.style.backgroundColor = avatar.color;
                    state.dom.userInfoAvatar.innerHTML = avatar.url ? '' : avatar.initial;
                    state.dom.userInfoUsername.innerHTML = renderDisplayName(displayName, Boolean(mergedUser.isVerified), Boolean(mergedUser.isBot), mergedUser.membershipTier, mergedUser.nicknameFont, mergedUser.premiumStarIcon, true);
                    state.dom.userInfoStatus.textContent = getPresenceLabel(mergedUser, t('presence.onlineNow', 'Online now'));
                    state.dom.userInfoStatus.className = mergedUser.online ? 'profile-sheet-status text-green-600' : 'profile-sheet-status text-gray-400';
                    state.dom.userInfoBio.textContent = (mergedUser.bio || mergedUser.botAbout || '').trim() || t('settings.noBioYet', 'No bio yet.');
                    state.dom.userInfoCreatedAt.textContent = tr('profile.joinedDate', 'Joined {date}', { date: formatFullDate(mergedUser.createdAt) });
                    if (state.dom.userInfoHandle) {
                        const handle = String(mergedUser.handle || '').trim();
                        state.dom.userInfoHandle.textContent = handle || t('chat.noHandle', 'No handle');
                        state.dom.userInfoHandle.classList.toggle('hidden', !handle);
                    }
                    if (state.dom.userInfoContactButton) {
                        const isSelf = mergedUser.userId === state.currentUser?.userId;
                        const canManageContact = !isSelf && !mergedUser.isBot;
                        state.dom.userInfoContactButton.classList.toggle('hidden', !canManageContact);
                        state.dom.userInfoContactButton.textContent = mergedUser.isContact
                            ? t('contacts.removeAction', 'Remove From Contacts')
                            : t('contacts.addAction', 'Add to Contacts');
                        state.dom.userInfoContactButton.onclick = async () => {
                            if (!canManageContact) return;
                            try {
                                const extra = {};
                                if (!mergedUser.isContact) {
                                    const saveAs = await promptSaveContactName(mergedUser);
                                    if (!saveAs) return;
                                    extra.saveAs = saveAs;
                                }
                                await updateContactMembership(mergedUser.userId, mergedUser.isContact ? 'remove' : 'add', extra);
                                mergedUser.isContact = !mergedUser.isContact;
                                if (state.allUsers[mergedUser.userId]) {
                                    state.allUsers[mergedUser.userId].isContact = mergedUser.isContact;
                                    if (extra.saveAs) state.allUsers[mergedUser.userId].contactName = extra.saveAs;
                                    if (!mergedUser.isContact) delete state.allUsers[mergedUser.userId].contactName;
                                }
                                applyProfileData(mergedUser);
                            } catch (error) {
                                showErrorModal(t('contacts.title', 'Contacts'), error.message || t('contacts.updateFailed', 'Could not update contacts.'));
                            }
                        };
                    }
                    if (state.dom.userInfoMuteButton) {
                        const isSelf = mergedUser.userId === state.currentUser?.userId;
                        const isMuted = isUserMutedLocally(mergedUser.userId);
                        state.dom.userInfoMuteButton.classList.toggle('hidden', isSelf);
                        state.dom.userInfoMuteButton.title = isMuted
                            ? t('profile.unmuteNotifications', 'Unmute notifications')
                            : t('profile.muteNotifications', 'Mute notifications');
                        state.dom.userInfoMuteButton.setAttribute('aria-label', state.dom.userInfoMuteButton.title);
                        state.dom.userInfoMuteButton.innerHTML = `<i class="fas ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i>`;
                        state.dom.userInfoMuteButton.onclick = () => {
                            const nowMuted = toggleLocalUserMute(mergedUser.userId);
                            if (state.allUsers[mergedUser.userId]) state.allUsers[mergedUser.userId].isLocallyMuted = nowMuted;
                            applyProfileData({ ...mergedUser, isLocallyMuted: nowMuted });
                        };
                    }
                    const gifts = Array.isArray(mergedUser.gifts) ? mergedUser.gifts : [];
                    state.dom.userInfoGiftsSection.classList.toggle('hidden', gifts.length === 0);
                    state.dom.userInfoNoGifts.classList.toggle('hidden', gifts.length > 0);
                    state.dom.userInfoGiftsList.innerHTML = gifts.map((gift) => renderGiftBadge(gift, isSelf ? 'owned' : 'catalog')).join('');
                    initTgsPlayers(state.dom.userInfoGiftsList).catch(() => {});
                    initAnimatedMediaVisibility(state.dom.userInfoGiftsList);
                    const sharedGroups = getSharedGroupChatsForUser(mergedUser.userId);
                    if (state.dom.userInfoTabMutualGroups) {
                        state.dom.userInfoTabMutualGroups.textContent = isSelf ? t('settings.groups', 'Groups') : t('profile.mutualGroups', 'Mutual Groups');
                    }
                    state.dom.userInfoMutualGroupsList.innerHTML = renderProfileGroupList(sharedGroups, isSelf ? t('settings.noGroupsYet', 'No groups yet.') : t('profile.noMutualGroups', 'No mutual groups.'));
                    state.dom.userInfoMessageButton.classList.toggle('hidden', isSelf);
                    state.dom.userInfoMessageButton.dataset.userId = isSelf ? '' : (mergedUser.userId || '');
                    applyProfileSkinToSurface(state.dom.userInfoProfileSheet, mergedUser.profileSkin);
                    initTgsPlayers(state.dom.userInfoUsername).catch(() => {});
                };
                applyProfileData(state.userProfiles[user.userId] || {});
                setProfileTab('userInfo', 'bio');
                this.openModal(state.dom.userInfoModal);
                try {
                    const fullProfile = await loadUserProfile(user.userId, true);
                    if (!fullProfile || state.activeUserInfoUserId !== user.userId || state.dom.userInfoModal.classList.contains('hidden')) return;
                    state.allUsers[user.userId] = { ...(state.allUsers[user.userId] || user), ...fullProfile };
                    applyProfileData(fullProfile);
                } catch (error) {
                    console.error('Failed to load user profile', error);
                }
            },
            openMediaViewer(type, url) {
                if (type === 'image') { state.dom.mediaViewerImage.src = url; state.dom.mediaViewerImage.classList.remove('hidden'); state.dom.mediaViewerVideo.classList.add('hidden'); } 
                else if (type === 'video') { state.dom.mediaViewerVideo.src = url; state.dom.mediaViewerVideo.classList.remove('hidden'); state.dom.mediaViewerImage.classList.add('hidden'); }
                this.openModal(state.dom.mediaViewerModal);
            },
            openForwardModal(messageId) {
                const message = findMessage(state.currentChat.chatId, messageId); if (!message) return;
                state.messageToForward = message; const listEl = state.dom.forwardContactsList; listEl.innerHTML = '';
                Object.values(state.allChats).forEach(chat => {
                    let name, avatar, isChannel = chat.chatType === 'channel', otherUser = null;
                    if(chat.chatType === 'group' || isChannel) { name = chat.chatName || t('chat.publicLobby', 'Public Lobby'); avatar = generateAvatar(name, chat.chatId, chat.avatarUrl, isChannel); } 
                else { const otherUserId = chat.members.find(id => id !== state.currentUser.userId), foundUser = state.allUsers[otherUserId]; if(!foundUser) return; otherUser = foundUser; name = otherUser.username; avatar = generateAvatar(name, otherUser.userId, otherUser.avatarUrl); }
                    const targetVerified = isChannel ? Boolean(chat.isVerified) : Boolean(otherUser?.isVerified);
                    listEl.insertAdjacentHTML('beforeend', `<label for="fwd_${escapeAttr(chat.chatId)}" class="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer"><input type="checkbox" id="fwd_${escapeAttr(chat.chatId)}" data-chat-id="${escapeAttr(chat.chatId)}" class="mr-4 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"><div class="w-10 h-10 avatar-circle mr-3" style="background-image: url(${escapeAttr(avatar.url)}); background-color: ${avatar.color};">${avatar.initial}</div><span class="font-semibold">${isChannel ? renderPlainDisplayName(name, targetVerified) : renderDisplayName(name, targetVerified, Boolean(otherUser?.isBot), otherUser?.membershipTier, otherUser?.nicknameFont, otherUser?.premiumStarIcon)}</span></label>`);
                });
                this.openModal(state.dom.forwardMessageModal);
            },
            setReconnectingState(isConnecting) {
                state.isReconnecting = isConnecting;
                if (!state.chatSelectionMode) {
                    renderSidebarTitle();
                }
                if(state.currentChat) openChat(state.currentChat, true); this.renderContactList();
            },
            syncFilePreviewVisibility() {
                const currentChatId = state.currentChat?.chatId || null;
                const hasCurrentChatAttachment = Boolean(
                    state.attachedFile &&
                    state.attachedFileChatId &&
                    currentChatId === state.attachedFileChatId
                );
                state.dom.filePreviewContainer.classList.toggle('hidden', !hasCurrentChatAttachment);
                if (state.dom.sendButton) {
                    state.dom.sendButton.dataset.hasAttachment = hasCurrentChatAttachment ? '1' : '0';
                }
                if (window.voiceRecorder) window.voiceRecorder.updateButtonIcon();
            },
            showFilePreview(file) {
                if (!file || !state.currentChat?.chatId) return;
                const previewName = isVoiceRecorderFileName(file?.name) ? t('voice.message', 'Voice Message') : file.name;
                state.attachedFile = file;
                state.attachedFileChatId = state.currentChat.chatId;
                state.dom.fileNamePreview.textContent = previewName;
                state.dom.fileSizePreview.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                state.dom.imagePreview.classList.add('hidden'); state.dom.fileIconPreview.classList.remove('hidden');
                state.dom.fileIconPreview.className = 'fas fa-file-alt text-4xl text-gray-400';
                if (isTgsMedia('', file?.name || '', file?.type || '')) {
                    state.dom.fileIconPreview.className = 'fas fa-sticky-note text-4xl text-purple-400';
                }
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => { state.dom.imagePreview.src = e.target.result; };
                    reader.readAsDataURL(file);
                    state.dom.imagePreview.classList.remove('hidden');
                    state.dom.fileIconPreview.classList.add('hidden');
                }
                this.syncFilePreviewVisibility();
            },
            hideFilePreview() {
                state.attachedFile = null;
                state.attachedFileChatId = null;
                state.dom.fileInput.value = '';
                state.dom.filePreviewContainer.classList.add('hidden');
                if (state.dom.sendButton) state.dom.sendButton.dataset.hasAttachment = '0';
                if (state.dom.imagePreview.src.startsWith('blob:')) URL.revokeObjectURL(state.dom.imagePreview.src);
				if (window.voiceRecorder) window.voiceRecorder.updateButtonIcon();
            },
            renderPinnedBar(chat) {
                if (chat && chat.pinnedMessage) {
                    const msg = normalizePinnedMessage(chat.pinnedMessage);
                    if (!msg) {
                        state.dom.pinnedMessageBar.classList.add('hidden');
                        state.dom.pinnedMessageBar.classList.remove('flex');
                        return;
                    }
                    const sender = state.allUsers[msg.senderId];
                    const parsed = parseMessageContent(msg.content || msg);
                    let previewText = parsed.callLog
                        ? (() => {
                            const callPreview = getCallLogPresentation(parsed.callLog, state.currentUser?.userId);
                            return `<i class="fas ${escapeAttr(callPreview.icon)}"></i> ${escapeHtml(callPreview.preview)}`;
                        })()
                        : parsed.starGiveaway
                        ? `<i class="fas fa-star"></i> ${escapeHtml(parsed.starGiveaway.amountLabel || `${formatStarsAmount(parsed.starGiveaway.amountTenths || 0)} Stars`)}`
                        : parsed.giftGiveaway
                        ? `<i class="fas fa-gift"></i> ${escapeHtml(parsed.giftGiveaway.gift?.name || t('gift.giftGiveaway', 'Gift Giveaway'))}`
                        : parsed.theme
                        ? `<i class="fas fa-palette"></i> ${escapeHtml(parsed.theme.name || t('message.themeFallback', 'Theme'))}`
                        : parsed.securityNotice
                        ? `<i class="fas fa-shield-alt"></i> ${escapeHtml(t('securityNotice.title', 'Security notice'))}`
                        : (parsed.file ? `<i class="fas fa-paperclip"></i> ${escapeHtml(truncateInlinePreview(parsed.file.name || t('message.fileFallback', 'File'), 80))}` : escapeHtml(truncateInlinePreview(parsed.text || '', 140)));
                    const pinnedSenderName = getMessageSenderName(msg, chat);
                    const pinnedSenderVerified = isMessageSenderVerified(msg, chat);
                    state.dom.pinnedMessageContent.innerHTML = `<b>${renderDisplayName(pinnedSenderName, pinnedSenderVerified, Boolean(sender?.isBot), sender?.membershipTier, sender?.nicknameFont, sender?.premiumStarIcon)}:</b> ${previewText}`;
                    state.dom.pinnedMessageBar.classList.remove('hidden'); state.dom.pinnedMessageBar.classList.add('flex');
                } else { state.dom.pinnedMessageBar.classList.add('hidden'); state.dom.pinnedMessageBar.classList.remove('flex'); }
            },
            renderVoiceUI(chatId) {
                const voiceChat = state.activeVoiceChats[chatId];
                const isCallActive = !!voiceChat;
                const isUserInCall = state.currentVoiceChatId === chatId;
                const isConnectingToChat = state.voiceConnectionState === 'connecting' && state.connectingVoiceChatId === chatId;
                const isCurrentChatCall = isUserInCall || isConnectingToChat;
                const availableScreenShareOwnerIds = Array.isArray(state.availableScreenShareOwnerIds)
                    ? state.availableScreenShareOwnerIds.filter(Boolean)
                    : [];
                const screenShareOwnerId = state.currentScreenShareOwnerId;
                const screenShareOwner = screenShareOwnerId ? state.allUsers[screenShareOwnerId] : null;
                const isScreenShareVisible = Boolean(isCurrentChatCall && screenShareOwnerId);
                const hasMultipleScreenShares = availableScreenShareOwnerIds.length > 1;
                const voiceChatModule = getVoiceChatModule();
                const activeSpeakers = new Set(voiceChatModule?.getState?.().activeSpeakers || []);
                
                const callButton = state.dom.voiceCallButton;
                if (isCallActive || isConnectingToChat) {
                    callButton.classList.remove('app-icon-button');
                    callButton.classList.add('app-icon-button-success', 'is-active');
                    callButton.title = isConnectingToChat
                        ? t('voice.connecting', 'Connecting...')
                        : (isUserInCall ? t('voice.youAreInCall', 'You are in this call') : t('voice.joinCall', 'Join Voice Chat'));
                } else {
                    callButton.classList.remove('app-icon-button-success', 'is-active');
                    callButton.classList.add('app-icon-button');
                    callButton.title = t('chat.startVoice', 'Start Voice Chat');
                }

                if (!state.dom.callStatusLabel || !state.dom.callStatusMeta || !state.dom.callScreenStage || !state.dom.toggleScreenShareButton || !state.dom.toggleScreenShareQualityButton || !state.dom.toggleMuteButton || !state.dom.toggleDeafenButton || !state.dom.toggleCallStageButton) return;

                state.dom.callStatusLabel.textContent = isConnectingToChat
                    ? t('voice.connecting', 'Connecting...')
                    : (isUserInCall ? t('voice.active', 'Voice Chat Active') : t('voice.waiting', 'Voice Call'));
                state.dom.callStatusMeta.textContent = isConnectingToChat
                    ? t('voice.connectingMeta', 'Joining the room...')
                    : (isCallActive && Array.isArray(voiceChat?.participants)
                        ? tr('voice.participantCount', '{count} participant(s)', { count: voiceChat.participants.length })
                        : t('voice.waitingForPeople', 'Waiting for participants'));

                state.dom.toggleScreenShareButton.classList.toggle('hidden', !isUserInCall);
                state.dom.toggleScreenShareButton.classList.toggle('is-active', Boolean(state.isLocalScreenSharing));
                state.dom.toggleScreenShareButton.title = state.isLocalScreenSharing
                    ? t('voice.stopScreenShare', 'Stop sharing')
                    : t('voice.startScreenShare', 'Share screen');
                const isPremium = String(state.currentUser?.membershipTier || '').toLowerCase() === 'premium';
                state.dom.toggleScreenShareQualityButton.classList.toggle('hidden', !isUserInCall || !isPremium);
                state.dom.toggleScreenShareQualityButton.textContent = state.preferredScreenShareQuality === '720p' ? '720p' : '480p';
                state.dom.toggleScreenShareQualityButton.title = tr('voice.screenShareQuality', 'Screen share quality: {quality}', {
                    quality: state.preferredScreenShareQuality === '720p' ? '720p' : '480p'
                });
                state.dom.toggleMuteButton.classList.toggle('hidden', !isUserInCall);
                state.dom.toggleMuteButton.classList.toggle('is-active', Boolean(state.isVoiceMuted));
                state.dom.toggleMuteButton.title = state.isVoiceMuted
                    ? t('voice.unmute', 'Unmute microphone')
                    : t('voice.mute', 'Mute microphone');
                state.dom.toggleDeafenButton.classList.toggle('hidden', !isUserInCall);
                state.dom.toggleDeafenButton.classList.toggle('is-active', Boolean(state.isVoiceDeafened));
                state.dom.toggleDeafenButton.title = state.isVoiceDeafened
                    ? t('voice.undeafen', 'Undeafen')
                    : t('voice.deafen', 'Deafen');
                if (!isScreenShareVisible) {
                    state.isCallStageMinimized = false;
                }
                state.dom.toggleCallStageButton.classList.toggle('hidden', !isScreenShareVisible);
                state.dom.toggleCallStageButton.classList.toggle('is-active', Boolean(!state.isCallStageMinimized && isScreenShareVisible));
                state.dom.toggleCallStageButton.title = state.isCallStageMinimized
                    ? t('voice.maximizeStream', 'Maximize stream')
                    : t('voice.minimizeStream', 'Minimize stream');
                const stageIcon = state.dom.toggleCallStageButton.querySelector('i');
                if (stageIcon) {
                    stageIcon.className = `fas ${state.isCallStageMinimized ? 'fa-expand' : 'fa-minimize'}`;
                }

                if (isConnectingToChat) {
                    state.dom.activeCallBar.classList.remove('hidden');
                    state.dom.activeCallBar.classList.add('flex');
                    state.dom.callScreenStage.classList.add('hidden');
                    state.dom.callScreenStage.innerHTML = '';
                    state.dom.voiceParticipantsContainer.innerHTML = '';
                } else if (isUserInCall && isCallActive && Array.isArray(voiceChat.participants)) {
                    state.dom.activeCallBar.classList.remove('hidden');
                    state.dom.activeCallBar.classList.add('flex');
                    const participantsContainer = state.dom.voiceParticipantsContainer;
                    participantsContainer.innerHTML = '';
                    voiceChat.participants.forEach(userId => {
                        const user = state.allUsers[userId];
                        if (user) {
                            const avatar = generateAvatar(user.username, user.userId, user.avatarUrl);
                            const isSharingScreen = availableScreenShareOwnerIds.includes(userId);
                            const isSelectedScreen = screenShareOwnerId === userId;
                            const avatarEl = document.createElement('div');
                            avatarEl.className = `voice-call-participant-pill ${activeSpeakers.has(userId) ? 'is-speaking' : ''} ${isSharingScreen ? 'is-screen-sharing' : ''} ${isSelectedScreen ? 'is-screen-selected' : ''}`;
                            const avatarNode = document.createElement('div');
                            avatarNode.className = 'avatar-circle voice-participant-avatar ring-2 ring-white transition-shadow duration-300';
                            avatarNode.style.backgroundImage = `url(${avatar.url})`;
                            avatarNode.style.backgroundColor = avatar.color;
                            avatarNode.innerHTML = avatar.initial || '';
                            avatarNode.title = user.username;
                            avatarNode.dataset.userId = userId;
                            const labelNode = document.createElement('div');
                            labelNode.className = 'voice-call-participant-pill-name';
                            labelNode.innerHTML = userId === state.currentUser?.userId
                                ? escapeHtml(t('voice.you', 'You'))
                                : renderDisplayName(user.username, Boolean(user.isVerified), Boolean(user.isBot), user.membershipTier, user.nicknameFont, user.premiumStarIcon);
                            avatarEl.appendChild(avatarNode);
                            avatarEl.appendChild(labelNode);
                            if (isSharingScreen) {
                                const badgeNode = document.createElement('div');
                                badgeNode.className = 'voice-call-participant-badge';
                                badgeNode.innerHTML = `<i class="fas fa-display"></i>`;
                                avatarEl.appendChild(badgeNode);
                            }
                            if (hasMultipleScreenShares && isSharingScreen && voiceChatModule?.setScreenShareOwner) {
                                avatarEl.classList.add('is-clickable');
                                avatarEl.title = user.username;
                                avatarEl.addEventListener('click', () => {
                                    voiceChatModule.setScreenShareOwner(userId);
                                    state.isCallStageMinimized = false;
                                    ui.renderVoiceUI(chatId);
                                });
                            }
                            participantsContainer.appendChild(avatarEl);
                        }
                    });
                    if (isScreenShareVisible && !state.isCallStageMinimized) {
                        const sharerName = screenShareOwnerId === state.currentUser?.userId
                            ? t('voice.yourScreen', 'Your screen')
                            : tr('voice.screenSharedBy', '{name} is sharing', { name: screenShareOwner?.username || t('message.someone', 'Someone') });
                        state.dom.callScreenStage.classList.remove('hidden');
                        state.dom.callScreenStage.innerHTML = `<div class="voice-call-stage-placeholder hidden"></div>`;
                        if (voiceChatModule?.mountScreenShareStage) {
                            voiceChatModule.mountScreenShareStage(state.dom.callScreenStage);
                        }
                        state.dom.callStatusMeta.textContent = sharerName;
                    } else {
                        state.dom.callScreenStage.classList.add('hidden');
                        state.dom.callScreenStage.innerHTML = '';
                        if (isScreenShareVisible) {
                            state.dom.callStatusMeta.textContent = screenShareOwnerId === state.currentUser?.userId
                                ? t('voice.yourScreen', 'Your screen')
                                : tr('voice.screenSharedBy', '{name} is sharing', { name: screenShareOwner?.username || t('message.someone', 'Someone') });
                        }
                    }
                } else {
                    state.dom.activeCallBar.classList.add('hidden');
                    state.dom.activeCallBar.classList.remove('flex');
                    state.dom.callScreenStage.classList.add('hidden');
                    state.dom.callScreenStage.innerHTML = '';
                    state.dom.voiceParticipantsContainer.innerHTML = '';
                    state.isCallStageMinimized = false;
                }
            },
            showIncomingCallModal(callData) {
                state.incomingCallData = callData;
                const callerAvatar = generateAvatar(callData.callerName, callData.callerId, callData.callerAvatar);
                state.dom.incomingCallAvatar.style.backgroundImage = `url(${callerAvatar.url})`;
                state.dom.incomingCallAvatar.style.backgroundColor = callerAvatar.color;
                state.dom.incomingCallAvatar.textContent = callerAvatar.initial;
                state.dom.incomingCallName.textContent = callData.callerName;
                state.dom.incomingCallChatName.textContent = tr('voice.inChat', 'in {chat}', { chat: callData.chatName });
                if (!isUserMutedLocally(callData.callerId) && !isChatMutedLocally(callData.chatId)) startIncomingCallSound();
                this.openModal(state.dom.incomingCallModal);
            },
            closeIncomingCallModal() {
                state.incomingCallData = null;
                 stopIncomingCallSound();
                this.closeModal(state.dom.incomingCallModal);
            },
            
            // --- NEW MENU & CONTACTS LOGIC ---
            openMainMenu() {
                state.dom.mainMenuOverlay.classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('mainMenuContent').classList.remove('-translate-x-full');
                }, 10);
            },
            closeMainMenu() {
                document.getElementById('mainMenuContent').classList.add('-translate-x-full');
                setTimeout(() => {
                    state.dom.mainMenuOverlay.classList.add('hidden');
                }, 300);
            },
            openContactsModal() {
                if (!assertUserNotBanned('open chats')) return;
                this.closeMainMenu();
                loadContacts(true).then(() => this.renderAllContacts()).catch((error) => {
                    showErrorModal('Contacts', error.message || 'Could not load contacts.');
                    this.renderAllContacts();
                });
                this.openModal(state.dom.contactsModal);
                state.dom.contactSearchInput.value = '';
                state.dom.contactSearchInput.focus();
            },
            renderAllContacts(filterText = '') {
                const list = state.dom.allContactsList;
                list.innerHTML = '';
                
                const sortedUsers = Object.values(state.allUsers)
                    .filter(u => u.username !== 'Deleted Account' && u.userId !== state.currentUser.userId && state.contactIds.has(u.userId))
                    .sort((a,b) => getUserDisplayName(a).localeCompare(getUserDisplayName(b)));
                
                const filtered = filterText 
                    ? sortedUsers.filter(u => getUserDisplayName(u).toLowerCase().includes(filterText.toLowerCase()))
                    : sortedUsers;

                if(filtered.length === 0) {
                     list.innerHTML = `<div class="text-center text-gray-500 p-8">${escapeHtml(t('menu.noUsersFound', 'No users found.'))}</div>`;
                     return;
                }

                filtered.forEach(user => {
                    const displayName = getUserDisplayName(user, user.userId);
                    const avatar = generateAvatar(displayName, user.userId, user.avatarUrl);
                    const nameHtml = renderDisplayName(displayName, Boolean(user.isVerified), Boolean(user.isBot), user.membershipTier, user.nicknameFont, user.premiumStarIcon);
                    
                    const el = document.createElement('div');
                    el.className = 'flex items-center p-3 rounded-lg transition border-b border-gray-100 gap-3 hover:bg-blue-50';
                    
                    el.innerHTML = `
                        <button type="button" class="contact-profile-trigger w-12 h-12 avatar-circle shadow-sm flex-shrink-0 border-0 bg-transparent p-0" data-user-id="${escapeAttr(user.userId)}" style="background-image: url(${avatar.url}); background-color: ${avatar.color};">${avatar.initial}</button>
                        <button type="button" class="contact-profile-trigger flex-1 min-w-0 border-0 bg-transparent p-0 text-left" data-user-id="${escapeAttr(user.userId)}">
                            <div class="font-bold text-gray-800 flex items-center">${nameHtml}</div>
                            <div class="text-xs text-gray-500 flex items-center mt-0.5">
                                <span class="inline-block w-2 h-2 rounded-full mr-1 ${user.online ? 'bg-green-500' : 'bg-gray-300'}"></span>
                                ${getPresenceLabel(user)}
                            </div>
                        </button>
                        <button type="button" class="contact-message-trigger border-0 bg-transparent p-2 text-blue-500 hover:text-blue-600 transition-colors" data-user-id="${escapeAttr(user.userId)}" title="${escapeAttr(t('common.message', 'Message'))}">
                            <i class="fas fa-comment-dots text-xl"></i>
                        </button>
                    `;
                    el.querySelectorAll('.contact-profile-trigger').forEach((trigger) => {
                        trigger.addEventListener('click', (event) => {
                            event.preventDefault();
                            this.openUserInfoModal(user);
                        });
                    });
                    el.querySelector('.contact-message-trigger')?.addEventListener('click', (event) => {
                        event.preventDefault();
                        if (!assertUserNotBanned('open chats')) return;
                        this.closeModal(state.dom.contactsModal);
                        openPrivateChatWithUser(user.userId);
                    });
                    list.appendChild(el);
                });
            }
        };

        function formatMessageTimestamp(timestamp) {
            const messageDate = new Date(timestamp * 1000), now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const timeString = formatLocalizedTime(messageDate, { hour: '2-digit', minute: '2-digit' });
            if (messageDate >= startOfToday) return timeString;
            else if (messageDate >= startOfYesterday) return tr('time.yesterdayAt', 'Yesterday {time}', { time: timeString });
            else return tr('time.dateAtTime', '{date} {time}', { date: formatLocalizedDate(messageDate), time: timeString });
        }

        function formatFullDate(timestamp) {
            if (!timestamp) return t('common.unknown', 'Unknown');
            const date = new Date(Number(timestamp) * 1000);
            return Number.isNaN(date.getTime()) ? t('common.unknown', 'Unknown') : formatLocalizedDateTime(date);
        }

        function formatLastSeenLabel(timestamp) {
            if (!timestamp) return '';
            const date = new Date(Number(timestamp) * 1000);
            if (Number.isNaN(date.getTime())) return '';
            const now = new Date();
            const isToday = date.getFullYear() === now.getFullYear()
                && date.getMonth() === now.getMonth()
                && date.getDate() === now.getDate();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const isYesterday = date.getFullYear() === yesterday.getFullYear()
                && date.getMonth() === yesterday.getMonth()
                && date.getDate() === yesterday.getDate();
            if (isToday) {
                return tr('presence.lastSeenAtTime', 'Last seen at {time}', {
                    time: formatLocalizedTime(date)
                });
            }
            if (isYesterday) {
                return tr('presence.lastSeenYesterdayAtTime', 'Last seen yesterday at {time}', {
                    time: formatLocalizedTime(date)
                });
            }
            return tr('presence.lastSeenAtDate', 'Last seen at {date}', {
                date: formatLocalizedDate(date)
            });
        }

        function getPresenceLabel(user, onlineLabel = null) {
            if (!user) return '';
            const localizedOnlineLabel = onlineLabel || t('presence.online', 'Online');
            if (user.isBot) {
                return user.online ? localizedOnlineLabel : t('presence.offline', 'Offline');
            }
            if (user.online) return localizedOnlineLabel;
            return formatLastSeenLabel(user.lastSeen);
        }

        function formatStarsAmount(amountTenths) {
            const value = Number(amountTenths || 0) / 100;
            return new Intl.NumberFormat(getActiveFormatLocale(), {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        }

        function getAuthHeaders(extraHeaders = {}) {
            const session = getValidSession();
            if (!session?.token || !state.currentUser?.userId) return null;
            return {
                ...extraHeaders,
                'X-User-ID': state.currentUser.userId,
                'X-Auth-Token': session.token,
            };
        }

        async function authenticatedFetch(path, options = {}) {
            const headers = getAuthHeaders(options.headers || {});
            if (!headers) throw new Error('Authentication required.');
            const response = await fetch(resolveServerUrl(path), { ...options, headers });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || payload?.error) {
                throw new Error(payload?.error || `Request failed (${response.status})`);
            }
            return payload;
        }

        async function unauthenticatedJsonFetch(path, body = {}) {
            const response = await fetch(resolveServerUrl(path), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || payload?.error) {
                throw new Error(payload?.error || `Request failed (${response.status})`);
            }
            return payload;
        }

        function resolveCaptchaProxyUrl(targetPath) {
            return `/puzzle.php?proxy=1&target=${encodeURIComponent(String(targetPath || ''))}`;
        }

        async function captchaProxyJsonFetch(targetPath, body = {}, headers = {}) {
            const response = await fetch(resolveCaptchaProxyUrl(targetPath), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(body)
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || payload?.error) {
                throw new Error(payload?.error || `Request failed (${response.status})`);
            }
            return payload;
        }

        function resolveCaptchaFrameUrl(path, sessionId) {
            void path;
            return `/puzzle.php?captchaSessionId=${encodeURIComponent(sessionId || '')}`;
        }

        async function runCaptchaGate(action, extra = {}) {
            if (state.captchaPromise) return state.captchaPromise;
            const needsAuth = !['login', 'register'].includes(String(action || '').trim().toLowerCase());
            const starter = needsAuth
                ? () => captchaProxyJsonFetch('/captcha/start', { action, ...extra }, getAuthHeaders({}) || {})
                : () => captchaProxyJsonFetch('/captcha/start', { action, ...extra });

            state.captchaPromise = (async () => {
                try {
                    const started = await starter();
                    const modal = state.dom.captchaModal;
                    const frame = state.dom.captchaFrame;
                    if (!modal || !frame) throw new Error('Captcha modal is unavailable.');
                    ui.openModal(modal);
                    frame.src = resolveCaptchaFrameUrl(started.captchaUrl, started.sessionId);

                    return await new Promise((resolve, reject) => {
                        let settled = false;
                        const authHeaders = needsAuth ? (getAuthHeaders({}) || {}) : {};
                        const cleanup = () => {
                            window.removeEventListener('message', onMessage);
                            frame.src = 'about:blank';
                            ui.closeModal(modal);
                            state.captchaPromise = null;
                        };
                        const finishResolve = (token) => {
                            if (settled) return;
                            settled = true;
                            cleanup();
                            resolve(token);
                        };
                        const finishReject = (error) => {
                            if (settled) return;
                            settled = true;
                            cleanup();
                            reject(error);
                        };
                        const timeout = window.setTimeout(() => {
                            finishReject(new Error('Captcha timed out.'));
                        }, 10 * 60 * 1000);
                        const onMessage = (event) => {
                            if (event.origin !== window.location.origin) return;
                            const data = event.data || {};
                            if (data.type === 'captcha-frame-ready' && data.sessionId === started.sessionId) {
                                frame.contentWindow?.postMessage({
                                    type: 'captcha-parent-auth',
                                    headers: authHeaders
                                }, window.location.origin);
                                return;
                            }
                            if (data.type === 'captcha-solved' && data.sessionId === started.sessionId && data.solveToken) {
                                window.clearTimeout(timeout);
                                finishResolve(String(data.solveToken));
                                return;
                            }
                            if (data.type === 'captcha-cancelled' && data.sessionId === started.sessionId) {
                                window.clearTimeout(timeout);
                                finishReject(new Error('Captcha cancelled.'));
                                return;
                            }
                            if (data.type === 'captcha-failed' && data.sessionId === started.sessionId) {
                                window.clearTimeout(timeout);
                                finishReject(new Error('Captcha failed.'));
                            }
                        };
                        window.addEventListener('message', onMessage);
                    });
                } catch (error) {
                    state.captchaPromise = null;
                    throw error;
                }
            })();

            return state.captchaPromise;
        }

        function getEmailBotUserId() {
            return Object.values(state.allUsers).find((user) => String(user?.username || '').toLowerCase() === 'email' && user?.isBot)?.userId || '';
        }

        function getEmailBotPeerId(chat = state.currentChat) {
            if (!chat || chat.chatType !== 'private') return '';
            const peerId = getPrivateChatPeerId(chat);
            const emailBotUserId = getEmailBotUserId();
            return peerId && emailBotUserId && peerId === emailBotUserId ? peerId : '';
        }

        function isEmailBotChat(chat = state.currentChat) {
            return Boolean(getEmailBotPeerId(chat));
        }

        function isEmailBotCallback(callbackData = '') {
            return String(callbackData || '').startsWith('email:');
        }

        async function fetchEmailMail(mailId) {
            return authenticatedFetch(`/email-service/mail?mailId=${encodeURIComponent(mailId || '')}`);
        }

        function buildEmailMailViewUrl(mailId, download = false) {
            const session = getValidSession();
            if (!session?.token || !state.currentUser?.userId) return 'about:blank';
            const path = download ? '/email-service/mail/download-html' : '/email-service/mail/view';
            const query = `mailId=${encodeURIComponent(mailId || '')}&userId=${encodeURIComponent(state.currentUser.userId)}&authToken=${encodeURIComponent(session.token)}`;
            return resolveServerUrl(`${path}?${query}`);
        }

        function closeEmailViewerModal() {
            state.emailViewerContext = null;
            if (state.dom.emailViewerFrame) state.dom.emailViewerFrame.src = 'about:blank';
            state.dom.emailViewerTextWrap?.classList.add('hidden');
            state.dom.emailViewerFrame?.classList.add('hidden');
            ui.closeModal(state.dom.emailViewerModal);
        }

        function closeEmailComposerModal() {
            state.emailComposeContext = null;
            ui.closeModal(state.dom.emailComposerModal);
        }

        function closeEmailAddressModal() {
            ui.closeModal(state.dom.emailAddressModal);
        }

        function openEmailComposerModal(prefill = {}) {
            state.emailComposeContext = { ...prefill };
            state.dom.emailComposeTargetInput.value = String(prefill.toAddress || '');
            state.dom.emailComposeSubjectInput.value = String(prefill.subject || '');
            state.dom.emailComposeBodyInput.value = String(prefill.body || '');
            ui.openModal(state.dom.emailComposerModal);
            window.setTimeout(() => state.dom.emailComposeTargetInput?.focus(), 20);
        }

        function openEmailAddressModal() {
            if (state.dom.emailAddressDomainText) {
                state.dom.emailAddressDomainText.textContent = `@${String(window.EMAIL_SERVICE_DOMAIN || 'mail.bargmy.ir')}`;
            }
            if (state.dom.emailAddressLocalPartInput) {
                state.dom.emailAddressLocalPartInput.value = '';
            }
            ui.openModal(state.dom.emailAddressModal);
            window.setTimeout(() => state.dom.emailAddressLocalPartInput?.focus(), 20);
        }

        async function submitEmailAddressCreate() {
            const localPart = String(state.dom.emailAddressLocalPartInput?.value || '').trim().toLowerCase();
            if (!localPart) {
                showErrorModal(t('emailBot.title', 'Email'), t('emailBot.localPartRequired', 'Enter the email name you want.'));
                return;
            }
            const button = state.dom.createEmailAddressButton;
            if (button) button.disabled = true;
            try {
                await authenticatedFetch('/email-service/address/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ localPart }),
                });
                closeEmailAddressModal();
            } catch (error) {
                showErrorModal(t('emailBot.title', 'Email'), error.message || t('emailBot.createFailed', 'Could not create that email address.'));
            } finally {
                if (button) button.disabled = false;
            }
        }

        async function submitEmailComposer() {
            const toAddress = state.dom.emailComposeTargetInput?.value?.trim() || '';
            const subject = state.dom.emailComposeSubjectInput?.value?.trim() || '';
            const body = state.dom.emailComposeBodyInput?.value || '';
            if (!toAddress || !body.trim()) {
                showErrorModal(t('emailBot.title', 'Email'), t('emailBot.composeRequired', 'Enter a target email address and a body.'));
                return;
            }
            const button = state.dom.sendEmailComposerButton;
            if (button) button.disabled = true;
            try {
                await authenticatedFetch('/email-service/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ toAddress, subject, body }),
                });
                closeEmailComposerModal();
            } catch (error) {
                showErrorModal(t('emailBot.title', 'Email'), error.message || t('emailBot.sendFailed', 'Could not send the email.'));
            } finally {
                if (button) button.disabled = false;
            }
        }

        async function openEmailViewerModal(mailId, sourceMessageId) {
            const payload = await fetchEmailMail(mailId);
            const mail = payload?.mail;
            if (!mail) throw new Error(t('emailBot.mailMissing', 'Could not load that email.'));
            state.emailViewerContext = {
                mailId,
                sourceMessageId: sourceMessageId || '',
                replyCallbackData: `email:reply:${mailId}`,
                deleteCallbackData: `email:mail:delete:${mailId}`,
                blockCallbackData: `email:mail:block:${mailId}`,
                fromAddress: mail.fromAddress || '',
                subject: mail.subject || '',
            };
            state.dom.emailViewerTitle.textContent = mail.subject || t('emailBot.viewerTitle', 'Email');
            state.dom.emailViewerMeta.textContent = `${mail.fromAddress || ''} • ${formatFullDate(mail.receivedAt || 0)}`;
            if (mail.isHtml) {
                state.dom.emailViewerTextWrap?.classList.add('hidden');
                state.dom.emailViewerFrame?.classList.remove('hidden');
                state.dom.emailViewerFrame.src = buildEmailMailViewUrl(mailId, false);
            } else {
                state.dom.emailViewerFrame?.classList.add('hidden');
                state.dom.emailViewerTextWrap?.classList.remove('hidden');
                state.dom.emailViewerTextContent.textContent = mail.textBody || '';
            }
            ui.openModal(state.dom.emailViewerModal);
        }

        async function handleEmailBotAction(callbackData, messageId) {
            const action = String(callbackData || '');
            if (action === 'email:menu:create') {
                openEmailAddressModal();
                return true;
            }
            if (action === 'email:compose') {
                openEmailComposerModal();
                return true;
            }
            if (action.startsWith('email:reply:')) {
                const mailId = action.split(':').pop();
                const payload = await fetchEmailMail(mailId);
                const mail = payload?.mail || {};
                const subject = String(mail.subject || '').trim();
                openEmailComposerModal({
                    toAddress: mail.fromAddress || '',
                    subject: subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject || ''}`.trim(),
                });
                return true;
            }
            if (action.startsWith('email:view:')) {
                await openEmailViewerModal(action.split(':').pop(), messageId);
                return true;
            }
            if (action.startsWith('email:save_html:')) {
                window.open(buildEmailMailViewUrl(action.split(':').pop(), true), '_blank', 'noopener');
                return true;
            }
            return false;
        }

        function getPendingDmCaptchaRecipientId() {
            if (state.currentChat?.chatId?.startsWith('temp_')) {
                const recipientId = state.currentChat.members?.find((id) => id !== state.currentUser?.userId);
                if (recipientId && !state.allUsers[recipientId]?.isBot) return recipientId;
            }
            if (state.pendingRecipientId && !state.allUsers[state.pendingRecipientId]?.isBot) {
                return state.pendingRecipientId;
            }
            return '';
        }

        async function handleDmCaptchaRequiredError(serverMessage) {
            if (!/captcha required before starting a new dm/i.test(String(serverMessage || ''))) return false;
            const recipientId = getPendingDmCaptchaRecipientId();
            if (!recipientId) return false;
            ui.hideLoading();
            try {
                await runCaptchaGate('dm_start', { targetUserId: recipientId });
            } catch (_) {}
            return true;
        }

        function renderOnboarding() {
            const slide = ONBOARDING_SLIDES[state.onboardingIndex] || ONBOARDING_SLIDES[0];
            if (state.dom.onboardingIcon) state.dom.onboardingIcon.innerHTML = slide.icon;
            if (state.dom.onboardingDescription) state.dom.onboardingDescription.textContent = t(slide.descriptionKey, '');
            if (state.dom.onboardingDots) {
                state.dom.onboardingDots.textContent = ONBOARDING_SLIDES.map((_, index) => (index === state.onboardingIndex ? '●' : '○')).join(' ');
            }
        }

        function animateOnboardingTo(nextIndex, direction = 1) {
            if (state.onboardingAnimating) return;
            const boundedIndex = Math.max(0, Math.min(ONBOARDING_SLIDES.length - 1, nextIndex));
            if (boundedIndex === state.onboardingIndex) return;
            const iconEl = state.dom.onboardingIcon;
            const descEl = state.dom.onboardingDescription;
            const dotsEl = state.dom.onboardingDots;
            if (!iconEl || !descEl || !dotsEl || !iconEl.animate || !descEl.animate) {
                state.onboardingIndex = boundedIndex;
                renderOnboarding();
                return;
            }
            state.onboardingAnimating = true;
            const travel = direction >= 0 ? -28 : 28;
            iconEl.animate([
                { opacity: 1, transform: 'translateX(0) scale(1) rotate(0deg)' },
                { opacity: 0.18, transform: `translateX(${travel}px) scale(0.78) rotate(${direction >= 0 ? -24 : 24}deg)` }
            ], { duration: 170, easing: 'ease-in', fill: 'forwards' });
            descEl.animate([
                { opacity: 1, transform: 'translateX(0)' },
                { opacity: 0, transform: `translateX(${travel * 1.4}px)` }
            ], { duration: 170, easing: 'ease-in', fill: 'forwards' });
            dotsEl.animate([{ opacity: 1 }, { opacity: 0.35 }], { duration: 170, easing: 'ease-in', fill: 'forwards' });
            window.setTimeout(() => {
                state.onboardingIndex = boundedIndex;
                renderOnboarding();
                iconEl.animate([
                    { opacity: 0.2, transform: `translateX(${-travel}px) scale(0.8) rotate(${direction >= 0 ? 24 : -24}deg)` },
                    { opacity: 1, transform: 'translateX(0) scale(1) rotate(0deg)' }
                ], { duration: 260, easing: 'ease-out', fill: 'forwards' });
                descEl.animate([
                    { opacity: 0, transform: `translateX(${-travel * 1.4}px)` },
                    { opacity: 1, transform: 'translateX(0)' }
                ], { duration: 260, easing: 'ease-out', fill: 'forwards' });
                dotsEl.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
                window.setTimeout(() => {
                    state.onboardingAnimating = false;
                }, 270);
            }, 175);
        }

        function moveOnboarding(direction = 1) {
            if (state.onboardingAnimating) return;
            const nextIndex = state.onboardingIndex + direction;
            if (nextIndex < 0) return;
            if (nextIndex >= ONBOARDING_SLIDES.length) {
                finishOnboarding();
                return;
            }
            animateOnboardingTo(nextIndex, direction);
        }

        function finishOnboarding() {
            getStorage().saveOnboardingSeen();
            ui.showAuthScreen();
        }

        function isCurrentChatActivelyVisible() {
            if (!state.currentChat || document.visibilityState !== 'visible') return false;
            const chatArea = state.dom.chatArea;
            const messagesContainer = state.dom.messagesContainer;
            if (!chatArea || !messagesContainer) return false;
            if (chatArea.classList.contains('hidden')) return false;
            if (messagesContainer.offsetParent === null) return false;
            if (window.innerWidth < 768 && !state.dom.mainApp?.classList.contains('chat-view-active')) return false;
            return true;
        }

        function flushSeenForCurrentChat() {
            if (!state.currentChat || state.socket?.readyState !== WebSocket.OPEN || !chatSupportsSeenReceipts(state.currentChat) || !isCurrentChatActivelyVisible()) return;
            const unseen = (state.currentChat.messages || []).filter((message) =>
                message?.senderId !== state.currentUser?.userId &&
                !message?.seenBy?.includes(state.currentUser?.userId)
            );
            unseen.forEach((message) => {
                state.socket.send(JSON.stringify({ type: 'message_seen', messageId: message.messageId, chatId: state.currentChat.chatId }));
            });
        }

        function getSeenReceiptKey(chatId, messageId) {
            return `${chatId || ''}:${messageId || ''}`;
        }

        function applyPendingSeenReceipts(message) {
            if (!message?.chatId || !message?.messageId) return message;
            const receiptKey = getSeenReceiptKey(message.chatId, message.messageId);
            const pendingUsers = state.pendingSeenReceipts[receiptKey];
            if (!pendingUsers?.length) return message;
            const seenBy = Array.isArray(message.seenBy) ? [...message.seenBy] : [];
            pendingUsers.forEach((userId) => {
                if (userId && !seenBy.includes(userId)) seenBy.push(userId);
            });
            delete state.pendingSeenReceipts[receiptKey];
            return { ...message, seenBy };
        }

        function queuePendingSeenReceipt(chatId, messageId, userId) {
            const receiptKey = getSeenReceiptKey(chatId, messageId);
            if (!receiptKey || !userId) return;
            if (!Array.isArray(state.pendingSeenReceipts[receiptKey])) {
                state.pendingSeenReceipts[receiptKey] = [];
            }
            if (!state.pendingSeenReceipts[receiptKey].includes(userId)) {
                state.pendingSeenReceipts[receiptKey].push(userId);
            }
        }

        function normalizeSeenReceiptUserId(data) {
            if (data?.userId) return String(data.userId);
            if (data?.readerUserId) return String(data.readerUserId);
            if (data?.seenUserId) return String(data.seenUserId);
            if (data?.senderId) return String(data.senderId);
            return '__seen_without_user__';
        }

        function hasAnonymousSeenReceipt(msg) {
            return Array.isArray(msg?.seenBy) && msg.seenBy.includes('__seen_without_user__');
        }

        function getRealSeenCount(msg) {
            if (!Array.isArray(msg?.seenBy)) return 0;
            return msg.seenBy.filter((id) => id && id !== '__seen_without_user__').length;
        }

        function handleMessageSeenEvent(data) {
            const receiptKey = getSeenReceiptKey(data.chatId, data.messageId);
            const seenUserId = normalizeSeenReceiptUserId(data);
            let resolvedChatId = data.chatId;
            let m = findMessage(resolvedChatId, data.messageId);
            if (!m) {
                const fallback = findMessageInAnyChat(data.messageId);
                if (fallback?.message) {
                    m = fallback.message;
                    resolvedChatId = fallback.chat.chatId;
                }
            }
            if (m) {
                if (!m.seenBy) m.seenBy = [];
                if (!m.seenBy.includes(seenUserId)) m.seenBy.push(seenUserId);
                if (receiptKey && state.pendingSeenReceipts[receiptKey]) delete state.pendingSeenReceipts[receiptKey];
                if (
                    state.currentChat?.chatId === resolvedChatId &&
                    document.querySelector(`.message-wrapper[data-msg-id="${CSS.escape(String(data.messageId || ''))}"]`)
                ) {
                    ui.renderMessage(m);
                }
            } else {
                queuePendingSeenReceipt(data.chatId, data.messageId, seenUserId);
            }
            if (state.allChats[resolvedChatId]) {
                updateChatMetadata(resolvedChatId);
            }
        }

        function isTgsMedia(url, name = '', mimeType = '') {
            const urlValue = String(url || '').toLowerCase();
            const nameValue = String(name || '').toLowerCase();
            const mimeValue = String(mimeType || '').toLowerCase();
            return /\.tgs(?:[?#]|$)/.test(urlValue)
                || /\.tgs(?:[?#]|$)/.test(nameValue)
                || /\bapplication\/x-tgsticker\b/.test(mimeValue);
        }

        function getStickerFileMeta(stickerInput) {
            const stickerUrl = typeof stickerInput === 'string' ? stickerInput : stickerInput?.url;
            const rawTypeHint = typeof stickerInput === 'object' && stickerInput ? String(stickerInput.type || '').toLowerCase() : '';
            const stickerTypeHint = rawTypeHint === 'tgs' || rawTypeHint === 'image' ? rawTypeHint : '';
            const mimeTypeHint = typeof stickerInput === 'object' && stickerInput
                ? String(stickerInput.mimeType || stickerInput.contentType || (rawTypeHint.includes('/') ? rawTypeHint : '') || '').toLowerCase()
                : '';
            const fileNameHint = typeof stickerInput === 'object' && stickerInput ? String(stickerInput.name || '').toLowerCase() : '';
            const safeUrl = sanitizeMediaUrl(resolveServerUrl(stickerUrl || ''));
            const lowerUrl = String(safeUrl || '').toLowerCase();
            if (stickerTypeHint === 'tgs' || isTgsMedia(lowerUrl, fileNameHint, mimeTypeHint)) {
                return { url: safeUrl, name: 'sticker.tgs', type: 'application/x-tgsticker', stickerType: 'tgs' };
            }
            if (mimeTypeHint === 'image/gif' || /\.gif(?:[?#]|$)/.test(lowerUrl) || /\.gif(?:[?#]|$)/.test(fileNameHint)) {
                return { url: safeUrl, name: 'sticker.gif', type: 'image/gif', stickerType: 'image' };
            }
            if (mimeTypeHint === 'image/webp' || /\.webp(?:[?#]|$)/.test(lowerUrl) || /\.webp(?:[?#]|$)/.test(fileNameHint)) {
                return { url: safeUrl, name: 'sticker.webp', type: 'image/webp', stickerType: 'image' };
            }
            if (mimeTypeHint === 'image/png' || /\.png(?:[?#]|$)/.test(fileNameHint)) {
                return { url: safeUrl, name: 'sticker.png', type: 'image/png', stickerType: 'image' };
            }
            return { url: safeUrl, name: 'sticker.png', type: 'image/png', stickerType: 'image' };
        }

        async function fetchTgsAnimationData(url) {
            const mediaUrl = sanitizeMediaUrl(resolveServerUrl(url || ''));
            if (!mediaUrl) throw new Error('Blocked unsafe TGS URL.');
            if (tgsAnimationCache.has(mediaUrl)) return tgsAnimationCache.get(mediaUrl);
            if (!window.pako || !window.lottie) throw new Error('TGS runtime unavailable.');
            const response = await fetch(mediaUrl);
            if (!response.ok) throw new Error(`Could not load TGS (${response.status}).`);
            const buffer = await response.arrayBuffer();
            const inflated = window.pako.ungzip(new Uint8Array(buffer), { to: 'string' });
            const animationData = JSON.parse(inflated);
            tgsAnimationCache.set(mediaUrl, animationData);
            return animationData;
        }

        function createTgsMarkup(url, name, className, fallbackIconClass = 'fas fa-sticky-note') {
            const mediaUrl = sanitizeMediaUrl(resolveServerUrl(url || ''));
            if (!mediaUrl) {
                return `<div class="${className} stars-wallet-gift-fallback"><i class="${fallbackIconClass}"></i></div>`;
            }
            return `<div class="${className} tgs-player" data-tgs-url="${escapeAttr(mediaUrl)}" data-tgs-name="${escapeAttr(name || 'Sticker')}"></div>`;
        }

        function upgradeLegacyTgsMarkup(root = document) {
            const tgsImages = Array.from(root.querySelectorAll('img[src*=".tgs"]')).filter((el) => !el.closest('.tgs-player'));
            tgsImages.forEach((img) => {
                const src = sanitizeMediaUrl(img.getAttribute('src') || '');
                if (!src || !isTgsMedia(src, img.getAttribute('alt') || '')) return;
                const replacement = document.createElement('div');
                replacement.className = `${img.className || ''} tgs-player`.trim();
                replacement.setAttribute('data-tgs-url', src);
                replacement.setAttribute('data-tgs-name', img.getAttribute('alt') || 'Sticker');
                if (img.getAttribute('style')) replacement.setAttribute('style', img.getAttribute('style'));
                img.replaceWith(replacement);
            });

            const tgsLinks = Array.from(root.querySelectorAll('a[href*=".tgs"][download]'));
            tgsLinks.forEach((link) => {
                const href = sanitizeMediaUrl(link.getAttribute('href') || '');
                if (!href || !isTgsMedia(href, link.getAttribute('download') || link.textContent || '')) return;
                const wrapper = document.createElement('div');
                wrapper.className = 'message-visual-media message-tgs-sticker media-item';
                wrapper.dataset.type = 'tgs';
                wrapper.dataset.url = href;
                wrapper.innerHTML = createTgsMarkup(href, link.getAttribute('download') || 'Sticker', 'message-tgs-sticker');
                link.replaceWith(wrapper);
            });
        }

        async function initTgsPlayers(root = document) {
            upgradeLegacyTgsMarkup(root);
            const players = Array.from(root.querySelectorAll('.tgs-player[data-tgs-url]')).filter((el) => !el.dataset.tgsReady);
            for (const player of players) {
                player.dataset.tgsReady = '1';
                getTgsVisibilityObserver().observe(player);
            }
            initAnimatedMediaVisibility(root);
        }

        function isWebmGiftMedia(url) {
            return /\.webm(?:[?#]|$)/i.test(String(url || ''));
        }

        function renderGiftMediaHtml(url, name, className, fallbackIconClass = 'fas fa-gift') {
            const mediaUrl = sanitizeMediaUrl(resolveServerUrl(url || ''));
            if (!mediaUrl) {
                return `<div class="${className} stars-wallet-gift-fallback"><i class="${fallbackIconClass}"></i></div>`;
            }
            if (isTgsMedia(mediaUrl, name)) {
                return createTgsMarkup(mediaUrl, name, className, fallbackIconClass);
            }
            if (isWebmGiftMedia(mediaUrl)) {
                return `<video src="${escapeAttr(mediaUrl)}" aria-label="${escapeAttr(name || 'Gift')}" class="${className}" muted autoplay loop playsinline preload="metadata"></video>`;
            }
            return `<img src="${escapeAttr(mediaUrl)}" alt="${escapeAttr(name || 'Gift')}" class="${className}">`;
        }

        function renderGiftBadge(gift, mode = 'catalog') {
            const image = renderGiftMediaHtml(gift?.imageUrl || '', gift?.name || t('gift.giftFallback', 'Gift'), 'stars-wallet-gift-thumb');
            return `
                <button type="button" class="stars-wallet-gift-card profile-gift-button" data-action="open-gift-detail" data-gift-id="${escapeAttr(gift?.giftId || '')}" data-gift-mode="${escapeAttr(mode)}">
                    ${image}
                    <div class="min-w-0">
                        <div class="stars-wallet-gift-name truncate">${escapeHtml(gift?.name || t('gift.giftFallback', 'Gift'))}</div>
                        <div class="stars-wallet-gift-meta">${escapeHtml(tr('gift.ownedCount', '{count} owned', { count: gift?.quantity || 1 }))}</div>
                    </div>
                </button>
            `;
        }

        function getWalletTransferTargets() {
            return Object.values(state.allUsers)
                .filter((user) => user.userId !== state.currentUser?.userId && user.username !== 'Deleted Account')
                .sort((left, right) => String(left.username || '').localeCompare(String(right.username || '')));
        }

        function getWalletGiveawayChats() {
            return Object.values(state.allChats)
                .filter((chat) => {
                    if (!chat?.chatId || !Array.isArray(chat.members) || !chat.members.includes(state.currentUser?.userId)) return false;
                    if (chat.chatType === 'channel' && chat.ownerId !== state.currentUser?.userId) return false;
                    return true;
                })
                .sort((left, right) => {
                    const leftTs = Number(left?.lastMessage?.timestamp || 0);
                    const rightTs = Number(right?.lastMessage?.timestamp || 0);
                    return rightTs - leftTs;
                });
        }

        function getChatDisplayName(chat) {
            if (!chat) return t('chat.unknownChat', 'Unknown chat');
            if (chat.chatType === 'private') {
                const otherUserId = (chat.members || []).find((id) => id !== state.currentUser?.userId);
                return getUserDisplayName(state.allUsers[otherUserId], t('chat.directMessage', 'Direct Message'));
            }
            return chat.chatName || t('chat.unnamedChat', 'Unnamed Chat');
        }

        function getSharedGroupChatsForUser(userId) {
            if (!userId || !state.currentUser?.userId) return [];
            return Object.values(state.allChats)
                .filter((chat) => {
                    if (chat?.chatType !== 'group' || !Array.isArray(chat.members)) return false;
                    if (!chat.members.includes(state.currentUser.userId)) return false;
                    if (userId === state.currentUser.userId) return true;
                    return chat.members.includes(userId);
                })
                .sort((left, right) => String(left.chatName || '').localeCompare(String(right.chatName || '')));
        }

        function renderProfileGroupList(chats, emptyLabel) {
            if (!Array.isArray(chats) || chats.length === 0) {
                return `<div class="profile-sheet-empty">${escapeHtml(emptyLabel)}</div>`;
            }
            return chats.map((chat) => {
                const memberCount = Number(chat?.members?.length || 0);
                return `
                    <div class="profile-sheet-group-card">
                        <div class="profile-sheet-group-name">${escapeHtml(chat.chatName || t('chat.unnamedGroup', 'Unnamed Group'))}</div>
                        <div class="profile-sheet-group-meta">${escapeHtml(tr('chat.memberCount', '{count} members', { count: memberCount }))}</div>
                    </div>
                `;
            }).join('');
        }

        function setProfileTab(prefix, tabName) {
            ['bio', 'gifts', 'mutual-groups'].forEach((name) => {
                const safeName = name === 'mutual-groups' ? 'MutualGroups' : `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
                const button = state.dom[`${prefix}Tab${safeName}`];
                const panel = state.dom[`${prefix}Panel${safeName}`];
                if (button) button.classList.toggle('active', name === tabName);
                if (panel) panel.classList.toggle('hidden', name !== tabName);
            });
        }

        function setSettingsProfileEditing(isEditing) {
            state.settingsProfileEditing = Boolean(isEditing);
            if (state.settingsProfileEditing) {
                setProfileTab('settingsProfile', 'bio');
            }
            state.dom.settingsProfileViewMode?.classList.toggle('hidden', state.settingsProfileEditing);
            state.dom.settingsProfileEditMode?.classList.toggle('hidden', !state.settingsProfileEditing);
            state.dom.settingsProfileEditButton?.classList.toggle('hidden', state.settingsProfileEditing);
            state.dom.settingsAvatar?.classList.toggle('profile-sheet-avatar-editable', state.settingsProfileEditing);
            if (state.settingsProfileEditing) {
                state.dom.editUsernameInput?.focus();
            }
        }

        function showWalletSection(sectionName = 'main') {
            const nextSection = ['main', 'send', 'transactions'].includes(sectionName) ? sectionName : 'main';
            state.walletSection = nextSection;
            state.dom.walletMainSection?.classList.toggle('hidden', nextSection !== 'main');
            state.dom.walletMainSection?.classList.toggle('is-active', nextSection === 'main');
            state.dom.walletSendSection?.classList.toggle('hidden', nextSection !== 'send');
            state.dom.walletSendSection?.classList.toggle('is-active', nextSection === 'send');
            state.dom.walletTransactionsSection?.classList.toggle('hidden', nextSection !== 'transactions');
            state.dom.walletTransactionsSection?.classList.toggle('is-active', nextSection === 'transactions');
        }

        function updateWalletSummary(balanceTenths = 0, giftCount = 0) {
            state.walletSummary = { balanceTenths: Number(balanceTenths || 0), giftCount: Number(giftCount || 0) };
            if (state.dom.menuStarsSummary) state.dom.menuStarsSummary.textContent = `${formatStarsAmount(balanceTenths)} ${t('wallet.stars', 'Stars')}`;
        }

        function renderWalletModal() {
            const wallet = state.walletOverview || { balanceTenths: state.walletSummary.balanceTenths || 0, gifts: [], transactions: [] };
            const visibleTransactions = (wallet.transactions || []).filter((tx) => {
                const description = String(tx?.description || '').trim();
                const txType = String(tx?.type || '').trim();
                return !(description === 'Sent a message.' || txType === 'message_reward');
            });
            const transactionsCount = visibleTransactions.length;
            updateWalletSummary(wallet.balanceTenths || 0, 0);
            state.dom.walletBalanceValue.textContent = `${formatStarsAmount(wallet.balanceTenths || 0)} ${t('wallet.stars', 'Stars')}`;
            if (state.dom.walletTransactionCount) {
                state.dom.walletTransactionCount.textContent = tr('wallet.transactionCount', '{count} transactions', { count: transactionsCount });
            }

            const giveawayChats = getWalletGiveawayChats();
            state.dom.walletGiveawayChat.innerHTML = giveawayChats.length
                ? giveawayChats.map((chat) => `<option value="${escapeAttr(chat.chatId)}">${escapeHtml(getChatDisplayName(chat))}</option>`).join('')
                : `<option value="">${escapeHtml(t('wallet.noChatsAvailable', 'No chats available'))}</option>`;

            state.dom.walletTransactionsList.innerHTML = visibleTransactions.length
                ? visibleTransactions.map((tx) => {
                    const positive = Number(tx.amountTenths || 0) >= 0;
                    const amountText = `${positive ? '+' : ''}${formatStarsAmount(tx.amountTenths || 0)} ${t('wallet.stars', 'Stars')}`;
                    return `
                        <div class="stars-wallet-transaction-card">
                            <div class="stars-wallet-transaction-icon ${positive ? 'positive' : 'negative'}">${positive ? '+' : '-'}</div>
                            <div class="min-w-0">
                                <div class="stars-wallet-transaction-title truncate">${escapeHtml(tx.description || tx.type || t('wallet.walletUpdate', 'Wallet update'))}</div>
                                <div class="stars-wallet-transaction-date">${escapeHtml(formatFullDate(tx.createdAt))}</div>
                            </div>
                            <div class="stars-wallet-transaction-amount ${positive ? 'positive' : 'negative'}">${escapeHtml(amountText)}</div>
                        </div>
                    `;
                }).join('')
                : `<div class="stars-wallet-empty">${escapeHtml(t('wallet.noTransactionsYet', 'No transactions yet.'))}</div>`;
        }

        async function loadWalletOverview(force = false) {
            if (!force && state.walletOverview) {
                renderWalletModal();
                return state.walletOverview;
            }
            const payload = await authenticatedFetch('/stars/overview');
            state.walletOverview = payload.wallet || { balanceTenths: 0, gifts: [], transactions: [] };
            renderWalletModal();
            return state.walletOverview;
        }

        async function openWalletModal() {
            await loadWalletOverview(true);
            showWalletSection('main');
            ui.openModal(state.dom.walletModal);
        }

        async function loadDeviceSessions() {
            const payload = await authenticatedFetch('/user/sessions');
            return Array.isArray(payload.sessions) ? payload.sessions : [];
        }

        function renderDeviceSessions(sessions = []) {
            if (!state.dom.devicesList) return;
            if (!sessions.length) {
                state.dom.devicesList.innerHTML = `<div class="app-card-muted rounded-xl p-4 text-sm app-text-muted">${escapeHtml(t('account.noActiveDevices', 'No active devices.'))}</div>`;
                return;
            }
            state.dom.devicesList.innerHTML = sessions.map((session) => `
                <div class="app-card rounded-xl border p-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <div class="font-semibold text-gray-900">${escapeHtml(session.osName || 'Unknown')}</div>
                            <div class="mt-1 text-xs text-gray-500 break-words">${escapeHtml(session.deviceLabel || 'Device')}</div>
                            <div class="mt-2 text-xs text-gray-400">${escapeHtml(tr('account.lastActiveDate', 'Last active {date}', { date: formatFullDate(session.lastSeenAt) }))}</div>
                        </div>
                        ${session.isCurrent ? `<span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">${escapeHtml(t('account.currentSession', 'Current'))}</span>` : ''}
                    </div>
                    <button class="mt-3 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 interactive-pop" data-action="revoke-session" data-session-id="${escapeAttr(session.sessionId || '')}">
                        ${escapeHtml(session.isCurrent ? t('account.logOutThisDevice', 'Log Out This Device') : t('auth.logout', 'Logout'))}
                    </button>
                </div>
            `).join('');
        }

        async function openDevicesModal() {
            const sessions = await loadDeviceSessions();
            renderDeviceSessions(sessions);
            ui.openModal(state.dom.devicesModal);
        }

        async function loadUserProfile(userId, force = false) {
            if (!userId) return null;
            if (!force && state.userProfiles[userId]) return state.userProfiles[userId];
            const payload = await authenticatedFetch(`/user/profile?userId=${encodeURIComponent(userId)}`);
            state.userProfiles[userId] = payload.profile || null;
            return state.userProfiles[userId];
        }

        let premiumProfileAssetsCache = null;

        async function loadPremiumProfileAssets(force = false) {
            if (!force && premiumProfileAssetsCache) return premiumProfileAssetsCache;
            const payload = await authenticatedFetch('/user/premium/profile-assets');
            premiumProfileAssetsCache = {
                stickers: Array.isArray(payload?.stickers) ? payload.stickers.map((entry) => normalizePremiumStarIcon({ ...entry, source: 'saved' })).filter(Boolean) : [],
                templates: Array.isArray(payload?.templates) ? payload.templates.map((entry) => normalizePremiumStarIcon({ ...entry, source: 'template', templateId: entry?.id || '' })).filter(Boolean) : []
            };
            return premiumProfileAssetsCache;
        }

        function renderPremiumStarPickerGrid() {
            const grid = state.dom.premiumStarPickerGrid;
            const status = state.dom.premiumStarPickerStatus;
            if (!grid || !status) return;
            const sourceKey = state.premiumStarPickerSource === 'templates' ? 'templates' : 'stickers';
            const items = premiumProfileAssetsCache?.[sourceKey] || [];
            state.dom.premiumStarSourceStickers?.classList.toggle('btn-accent', sourceKey === 'stickers');
            state.dom.premiumStarSourceTemplates?.classList.toggle('btn-accent', sourceKey === 'templates');
            state.dom.premiumStarSourceStickers?.classList.toggle('profile-sheet-secondary-button', sourceKey !== 'stickers');
            state.dom.premiumStarSourceTemplates?.classList.toggle('profile-sheet-secondary-button', sourceKey !== 'templates');
            status.textContent = items.length
                ? t('profile.premiumStarPickerHint', 'Pick one item for your premium badge.')
                : (sourceKey === 'templates' ? t('profile.noPremiumStarTemplates', 'No templates found.') : t('profile.noSavedStickers', 'No saved stickers found.'));
            grid.innerHTML = items.length ? items.map((item, index) => {
                const isSelected = (state.premiumStarPickerSelection?.url || '') === item.url && (state.premiumStarPickerSelection?.source || '') === item.source;
                return `
                    <button type="button" class="premium-star-picker-item ${isSelected ? 'is-selected' : ''}" data-premium-star-index="${index}">
                        <span class="premium-star-picker-preview">${item.type === 'tgs' ? createTgsMarkup(item.url, 'Premium', 'premium-star-picker-media') : `<img src="${escapeAttr(item.url)}" alt="${escapeAttr(t('premium.title', 'Premium'))}" class="premium-star-picker-media">`}</span>
                    </button>
                `;
            }).join('') : `<div class="profile-sheet-empty">${escapeHtml(status.textContent)}</div>`;
            grid.querySelectorAll('[data-premium-star-index]').forEach((button) => {
                button.addEventListener('click', () => {
                    const nextItem = items[Number(button.dataset.premiumStarIndex)];
                    state.premiumStarPickerSelection = nextItem ? { ...nextItem } : null;
                    commitPremiumStarPickerSelection();
                });
            });
            initTgsPlayers(grid).catch(() => {});
        }

        async function openPremiumStarPickerModal() {
            const currentUser = state.allUsers[state.currentUser?.userId];
            if (!currentUser) return;
            if (String(currentUser.membershipTier || '').toLowerCase() !== 'premium') {
                openPremiumModal();
                return;
            }
            state.premiumStarPickerSelection = normalizePremiumStarIcon(currentUser.premiumStarIcon);
            state.premiumStarPickerSource = state.premiumStarPickerSelection?.source === 'template' ? 'templates' : 'stickers';
            ui.openModal(state.dom.premiumStarPickerModal);
            if (state.dom.premiumStarPickerStatus) state.dom.premiumStarPickerStatus.textContent = t('loading.updating', 'Updating...');
            if (state.dom.premiumStarPickerGrid) state.dom.premiumStarPickerGrid.innerHTML = '';
            state.dom.savePremiumStarPickerButton?.classList.add('hidden');
            try {
                await loadPremiumProfileAssets(!premiumProfileAssetsCache);
                renderPremiumStarPickerGrid();
            } catch (error) {
                if (state.dom.premiumStarPickerStatus) state.dom.premiumStarPickerStatus.textContent = error.message || t('profile.premiumStarLoadFailed', 'Could not load premium star assets.');
                if (state.dom.premiumStarPickerGrid) state.dom.premiumStarPickerGrid.innerHTML = `<div class="profile-sheet-empty">${escapeHtml(state.dom.premiumStarPickerStatus.textContent)}</div>`;
            }
        }

        function closePremiumStarPickerModal() {
            ui.closeModal(state.dom.premiumStarPickerModal);
        }

        function commitPremiumStarPickerSelection() {
            const currentUser = state.allUsers[state.currentUser?.userId];
            if (!currentUser || state.socket?.readyState !== WebSocket.OPEN) return;
            state.socket.send(JSON.stringify({ type: 'update_profile', premiumStarIcon: state.premiumStarPickerSelection || null }));
            const nextIcon = state.premiumStarPickerSelection ? { ...state.premiumStarPickerSelection } : null;
            state.allUsers[state.currentUser.userId] = { ...currentUser, premiumStarIcon: nextIcon };
            state.currentUser = { ...state.currentUser, premiumStarIcon: nextIcon };
            ui.populateSettingsProfile(state.allUsers[state.currentUser.userId]);
            ui.renderContactList();
            closePremiumStarPickerModal();
        }

        function extractGiftLinkIds(text) {
            if (!text) return [];
            const matches = [];
            let match;
            const re = new RegExp(GIFT_LINK_RE);
            while ((match = re.exec(text)) !== null) {
                if (match[2]) matches.push(match[2]);
                else if (match[3]) matches.push(match[3]);
            }
            return [...new Set(matches)];
        }

        async function getGiftCatalogItem(giftId) {
            if (!giftId) return null;
            if (state.giftCatalogCache[giftId]) return state.giftCatalogCache[giftId];
            const payload = await fetch(resolveServerUrl(`/gifts/catalog?giftId=${encodeURIComponent(giftId)}`));
            const result = await payload.json().catch(() => ({}));
            if (!payload.ok || result?.error || !result?.gift) return null;
            state.giftCatalogCache[giftId] = result.gift;
            return result.gift;
        }

        function setGiftDetailStatus(message = '', tone = '') {
            if (!state.dom.giftDetailStatus) return;
            state.dom.giftDetailStatus.textContent = message || '';
            state.dom.giftDetailStatus.className = `gift-detail-status${tone ? ` is-${tone}` : ''}`;
        }

        function setGiftActionStatus(message = '', tone = '') {
            if (!state.dom.giftActionStatus) return;
            state.dom.giftActionStatus.textContent = message || '';
            state.dom.giftActionStatus.className = `gift-detail-status${tone ? ` is-${tone}` : ''}`;
        }

        function resetGiftActionState() {
            state.dom.giftActionChatField?.classList.add('hidden');
            if (state.dom.giftActionChatSelect) {
                state.dom.giftActionChatSelect.innerHTML = '';
            }
            if (state.dom.giftActionConfirmButton) {
                state.dom.giftActionConfirmButton.textContent = t('gift.sendToChat', 'Send to chat');
            }
            if (state.dom.giftActionOwnButton) {
                state.dom.giftActionOwnButton.textContent = t('gift.ownIt', 'Own it');
            }
            if (state.dom.giftActionGiftButton) {
                state.dom.giftActionGiftButton.textContent = t('gift.giveAway', 'Give away');
            }
            const actionTitle = state.dom.giftActionModal?.querySelector('.gift-action-title');
            if (actionTitle) {
                actionTitle.textContent = t('gift.chooseUse', 'Choose how to use this gift');
            }
            setGiftActionStatus('');
        }

        function fillGiftActionChatOptions() {
            const chats = getWalletGiveawayChats();
            state.dom.giftActionChatSelect.innerHTML = chats.length
                ? chats.map((chat) => `<option value="${escapeAttr(chat.chatId)}">${escapeHtml(getChatDisplayName(chat))}</option>`).join('')
                : `<option value="">${escapeHtml(t('wallet.noChatsAvailable', 'No chats available'))}</option>`;
            return chats;
        }

        function renderGiftDetailIcon(gift) {
            if (!state.dom.giftDetailIcon) return;
            if (gift?.imageUrl) {
                state.dom.giftDetailIcon.innerHTML = renderGiftMediaHtml(gift.imageUrl, gift?.name || 'Gift', 'gift-detail-media');
                initTgsPlayers(state.dom.giftDetailIcon).catch(() => {});
                initAnimatedMediaVisibility(state.dom.giftDetailIcon);
                return;
            }
            state.dom.giftDetailIcon.textContent = '??';
        }

        function applyGiftDetailModal(gift) {
            if (!gift || !state.dom.giftDetailModal) return;
            const initialStock = Number(gift.initialStock ?? gift.stockRemaining ?? 0);
            const issuedCount = Number(gift.issuedCount ?? Math.max(0, initialStock - Number(gift.stockRemaining || 0)));
            const isAvailable = Boolean(gift.isActive) && Number(gift.stockRemaining || 0) > 0;
            const balanceTenths = Number(state.walletOverview?.balanceTenths ?? state.walletSummary?.balanceTenths ?? 0);
            const hasEnoughStars = balanceTenths >= Number(gift.priceTenths || 0);
            const mode = state.dom.giftDetailBuyButton.dataset.mode || 'catalog';
            state.dom.giftDetailName.textContent = gift.name || t('gift.giftFallback', 'Gift');
            state.dom.giftDetailPrice.textContent = gift.priceLabel || `${formatStarsAmount(gift.priceTenths || 0)} ${t('wallet.stars', 'Stars')}`;
            state.dom.giftDetailIssued.textContent = `${localizeDigits(issuedCount)} / ${localizeDigits(initialStock)}`;
            renderGiftDetailIcon(gift);
            state.dom.giftDetailBuyButton.dataset.giftId = gift.giftId || '';
            resetGiftActionState();
            if (mode === 'owned') {
                state.dom.giftDetailBuyButton.disabled = false;
                state.dom.giftDetailBuyButton.textContent = t('gift.useGift', 'Use Gift');
                setGiftDetailStatus(t('gift.shareOrSellHint', 'Share this gift to a chat or sell it for a full refund.'), '');
            } else if (!gift.isActive) {
                state.dom.giftDetailBuyButton.disabled = true;
                state.dom.giftDetailBuyButton.textContent = t('gift.notAvailable', 'Not Available');
                setGiftDetailStatus(t('gift.unavailable', 'Unavailable'), 'error');
            } else if (Number(gift.stockRemaining || 0) <= 0) {
                state.dom.giftDetailBuyButton.disabled = true;
                state.dom.giftDetailBuyButton.textContent = t('gift.soldOutBang', 'Sold out!');
                setGiftDetailStatus(t('gift.soldOut', 'Sold out'), 'error');
            } else if (!hasEnoughStars) {
                state.dom.giftDetailBuyButton.disabled = true;
                state.dom.giftDetailBuyButton.textContent = t('gift.notEnoughStars', 'Not Enough Stars');
                setGiftDetailStatus(tr('gift.leftCount', '{count} left', { count: Number(gift.stockRemaining || 0) }), 'error');
            } else {
                state.dom.giftDetailBuyButton.disabled = false;
                state.dom.giftDetailBuyButton.textContent = t('gift.buy', 'Buy');
                setGiftDetailStatus(tr('gift.leftCount', '{count} left', { count: Number(gift.stockRemaining || 0) }));
            }
        }

        async function openGiftDetailModal(giftId, mode = 'catalog') {
            if (!giftId) return;
            setGiftDetailStatus(t('gift.loadingGift', 'Loading gift...'));
            state.dom.giftDetailBuyButton.disabled = true;
            state.dom.giftDetailBuyButton.dataset.giftId = giftId;
            state.dom.giftDetailBuyButton.dataset.mode = mode;
            resetGiftActionState();
            ui.openModal(state.dom.giftDetailModal);
            const gift = await getGiftCatalogItem(giftId);
            if (!gift) {
                state.dom.giftDetailName.textContent = t('gift.giftFallback', 'Gift');
                state.dom.giftDetailPrice.textContent = t('common.unknown', 'Unknown');
                state.dom.giftDetailIssued.textContent = 'ï¿½';
                renderGiftDetailIcon(null);
                setGiftDetailStatus(t('gift.detailsUnavailable', 'Gift details are unavailable.'), 'error');
                return;
            }
            applyGiftDetailModal(gift);
        }

        async function claimStarsGiveaway(giveawayId) {
            await authenticatedFetch('/stars/giveaway/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ giveawayId }),
            });
        }

        async function claimGiftGiveaway(giveawayId) {
            await authenticatedFetch('/gifts/giveaway/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ giveawayId }),
            });
        }

        function generateAvatar(name, id, url = null, isChannel = false) {
            if (url && url.endsWith('/default.png')) {
                url = null;
            }

            const resolvedUrl = url ? sanitizeMediaUrl(resolveServerUrl(url)) : '';
            if (resolvedUrl) return { url: resolvedUrl, color: 'transparent', initial: '' };
            if (name === 'Deleted Account') return { url: '', color: '#9ca3af', initial: '<i class="fas fa-ghost text-white"></i>' };
            const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899"];
            let hash = 0; if(id){ for(let i=0;i<id.length;i++){hash = id.charCodeAt(i) + ((hash << 5) - hash); hash |= 0;}}
            const initial = isChannel ? '<i class="fas fa-hashtag text-white"></i>' : (name || '?').charAt(0).toUpperCase();
            return { url: '', color: colors[Math.abs(hash) % colors.length], initial: initial };
        }

        function generateSavedMessagesAvatar() {
            return {
                url: '',
                color: '#3b82f6',
                initial: '<i class="fas fa-bookmark text-white"></i>'
            };
        }

        function hideEmptyChatPlaceholder() {
            if (!state.dom.emptyChatPlaceholder) return;
            state.dom.emptyChatPlaceholder.classList.add('hidden');
            state.dom.emptyChatPlaceholder.classList.remove('flex');
        }

        function setupEventListeners() {
            state.dom.loginButton.addEventListener('click', onLoginClick);
            state.dom.registerButton.addEventListener('click', onRegisterClick);
            state.dom.showRegister.addEventListener('click', (e) => { e.preventDefault(); state.dom.loginForm.classList.add('hidden'); state.dom.registerForm.classList.remove('hidden'); state.dom.authError.textContent = ''; });
            state.dom.showLogin.addEventListener('click', (e) => { e.preventDefault(); state.dom.registerForm.classList.add('hidden'); state.dom.loginForm.classList.remove('hidden'); state.dom.authError.textContent = ''; });
			state.dom.messageInput.addEventListener('keydown', (e) => {
			  // Don't do anything if input is disabled (recording mode disables it)
			  if (state.dom.messageInput.disabled) return;

			  if (e.key === 'Enter') {
				if (e.shiftKey) {
				  // Shift+Enter: newline (textarea default behavior)
				  return;
				}

				// Enter alone: send
				e.preventDefault();
				sendMessage();
			  }
			});

			// Typing indicator with throttling
			let typingTimer = null;
			let isTyping = false;
			state.dom.messageInput.addEventListener('input', () => {
			  if (!state.socket || state.socket.readyState !== WebSocket.OPEN || !state.currentChat?.chatId) return;

			  if (!isTyping) {
				isTyping = true;
				state.socket.send(JSON.stringify({ type: 'typing', chatId: state.currentChat.chatId }));
			  }

			  clearTimeout(typingTimer);
			  typingTimer = setTimeout(() => {
				isTyping = false;
			  }, 2000); // Cooldown for 2 seconds
			});
			state.dom.sendButton.addEventListener('click', (e) => {
				// If recording is active, ignore click (touch devices can generate click after press)
				if (window.voiceRecorder?.isRecording) {
					e.preventDefault();
					return;
				}

				e.preventDefault();
				sendMessage();
			});
            state.dom.fileUploadButton.addEventListener('click', () => {
                const isHidden = state.dom.attachMenuPanel?.classList.contains('hidden');
                if (isHidden) {
                    openAttachMenuPanel();
                } else {
                    closeAttachPanels();
                }
            });
            state.dom.fileInput.addEventListener('change', (e) => ui.showFilePreview(e.target.files[0]));
            state.dom.closeAttachMenuButton?.addEventListener('click', () => closeAttachPanels());
            state.dom.attachMenuFileButton?.addEventListener('click', () => {
                closeAttachPanels();
                state.dom.fileInput.click();
            });
            state.dom.attachMenuPollButton?.addEventListener('click', () => openPollComposerPanel());
            state.dom.closePollComposerButton?.addEventListener('click', () => closeAttachPanels());
            state.dom.addPollOptionButton?.addEventListener('click', () => addPollOptionInput());
            state.dom.sendPollButton?.addEventListener('click', () => sendPoll());
            state.dom.pollExamModeToggle?.addEventListener('change', () => syncPollComposerMode());
            state.dom.pollAnonymousToggle?.addEventListener('change', () => syncPollComposerMode());
            state.dom.closePollVotesButton?.addEventListener('click', () => ui.closeModal(state.dom.pollVotesModal));
            state.dom.pollVotesModal?.addEventListener('click', (e) => {
                if (e.target === state.dom.pollVotesModal) ui.closeModal(state.dom.pollVotesModal);
            });
            state.dom.pollComposerModal?.addEventListener('click', (e) => {
                if (e.target === state.dom.pollComposerModal) ui.closeModal(state.dom.pollComposerModal);
            });
			state.dom.stickersButton.addEventListener('click', () => toggleStickersModal());
			state.dom.closeStickersButton.addEventListener('click', () => state.dom.stickersModal.classList.add('hidden'));
			// Close inline composer panels when clicking outside
			document.addEventListener('click', (e) => {
				if (state.dom.stickersModal && !state.dom.stickersModal.classList.contains('hidden')) {
					if (!state.dom.stickersModal.contains(e.target) && e.target.id !== 'stickersButton' && !e.target.closest('#stickersButton')) {
						state.dom.stickersModal.classList.add('hidden');
					}
				}
                if (state.dom.attachMenuPanel && !state.dom.attachMenuPanel.classList.contains('hidden')) {
                    if (!state.dom.attachMenuPanel.contains(e.target) && e.target.id !== 'fileUploadButton' && !e.target.closest('#fileUploadButton')) {
                        state.dom.attachMenuPanel.classList.add('hidden');
                    }
                }
			});
            state.dom.removeFilePreview.addEventListener('click', () => ui.hideFilePreview());
            state.dom.removeReplyPreview.addEventListener('click', () => cancelReplyMode());
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    flushSeenForCurrentChat();
                    syncNotificationPreferenceUi();
                    if (getValidSession() && (!state.socket || state.socket.readyState === WebSocket.CLOSED)) {
                        scheduleReconnect();
                    }
                }
            });
            window.addEventListener('focus', () => {
                flushSeenForCurrentChat();
                syncNotificationPreferenceUi();
                if (getValidSession() && (!state.socket || state.socket.readyState === WebSocket.CLOSED)) {
                    scheduleReconnect();
                }
            });
            window.addEventListener('online', () => {
                if (getValidSession() && (!state.socket || state.socket.readyState === WebSocket.CLOSED)) {
                    scheduleReconnect();
                }
            });
            state.dom.editHandleCloseBtn?.addEventListener('click', () => ui.closeModal(state.dom.editHandleModal));
            state.dom.editHandleModal?.addEventListener('click', (e) => { if (e.target === state.dom.editHandleModal) ui.closeModal(state.dom.editHandleModal); });
            state.dom.errorToast?.addEventListener('click', () => dismissErrorToast(true));
            state.dom.settingsButton.addEventListener('click', () => {
                if (state.chatSelectionMode) {
                    exitChatSelectionMode();
                    return;
                }
                ui.openMainMenu();
            });
            state.dom.onboardingSkipButton?.addEventListener('click', () => finishOnboarding());
            state.dom.onboardingNextButton?.addEventListener('click', () => moveOnboarding(1));
            state.dom.onboardingCard?.addEventListener('pointerdown', (event) => {
                state.onboardingSwipeStartX = event.clientX;
            });
            state.dom.onboardingCard?.addEventListener('pointerup', (event) => {
                const startX = state.onboardingSwipeStartX;
                state.onboardingSwipeStartX = null;
                if (typeof startX !== 'number') return;
                const deltaX = event.clientX - startX;
                if (Math.abs(deltaX) < 40) return;
                moveOnboarding(deltaX < 0 ? 1 : -1);
            });
            state.dom.onboardingCard?.addEventListener('pointercancel', () => {
                state.onboardingSwipeStartX = null;
            });
            state.dom.closeSettingsButton.addEventListener('click', () => { ui.showSettingsMenu(); ui.closeModal(state.dom.themesModal); ui.closeModal(state.dom.settingsModal); });
            state.dom.settingsBackBtn.addEventListener('click', () => ui.showSettingsMenu());
            state.dom.settingsPremiumOption?.addEventListener('click', () => openSubscriptionMenuModal());
            state.dom.settingsProfileOption.addEventListener('click', () => ui.showSettingsSection('profile'));
            state.dom.settingsAccountOption.addEventListener('click', () => ui.showSettingsSection('account'));
            state.dom.settingsPreferencesOption.addEventListener('click', () => ui.showSettingsSection('preferences'));
            state.dom.settingsChangelogOption.addEventListener('click', () => ui.showSettingsSection('changelog'));
            state.dom.closeEmailComposerButton?.addEventListener('click', () => closeEmailComposerModal());
            state.dom.cancelEmailComposerButton?.addEventListener('click', () => closeEmailComposerModal());
            state.dom.sendEmailComposerButton?.addEventListener('click', () => submitEmailComposer());
            state.dom.emailComposerModal?.addEventListener('click', (event) => {
                if (event.target === state.dom.emailComposerModal) closeEmailComposerModal();
            });
            state.dom.closeEmailAddressButton?.addEventListener('click', () => closeEmailAddressModal());
            state.dom.cancelEmailAddressButton?.addEventListener('click', () => closeEmailAddressModal());
            state.dom.createEmailAddressButton?.addEventListener('click', () => submitEmailAddressCreate());
            state.dom.emailAddressLocalPartInput?.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    submitEmailAddressCreate();
                }
            });
            state.dom.emailAddressModal?.addEventListener('click', (event) => {
                if (event.target === state.dom.emailAddressModal) closeEmailAddressModal();
            });
            state.dom.closeEmailViewerButton?.addEventListener('click', () => closeEmailViewerModal());
            state.dom.emailViewerModal?.addEventListener('click', (event) => {
                if (event.target === state.dom.emailViewerModal) closeEmailViewerModal();
            });
            state.dom.emailViewerDeleteButton?.addEventListener('click', async () => {
                const ctx = state.emailViewerContext;
                if (!ctx?.deleteCallbackData) return;
                try {
                    await triggerBotCallback(state.currentChat?.chatId, ctx.sourceMessageId, ctx.deleteCallbackData);
                    closeEmailViewerModal();
                } catch (error) {
                    showErrorModal(t('emailBot.title', 'Email'), error.message || t('bot.callbackFailed', 'Could not send that bot action.'));
                }
            });
            state.dom.emailViewerBlockButton?.addEventListener('click', async () => {
                const ctx = state.emailViewerContext;
                if (!ctx?.blockCallbackData) return;
                try {
                    await triggerBotCallback(state.currentChat?.chatId, ctx.sourceMessageId, ctx.blockCallbackData);
                    closeEmailViewerModal();
                } catch (error) {
                    showErrorModal(t('emailBot.title', 'Email'), error.message || t('bot.callbackFailed', 'Could not send that bot action.'));
                }
            });
            state.dom.emailViewerReplyButton?.addEventListener('click', async () => {
                const ctx = state.emailViewerContext;
                if (!ctx?.mailId) return;
                closeEmailViewerModal();
                await handleEmailBotAction(`email:reply:${ctx.mailId}`, ctx.sourceMessageId);
            });
            state.dom.closePremiumModalButton?.addEventListener('click', () => { destroyPremiumPreview(); ui.closeModal(state.dom.premiumModal); });
            state.dom.premiumModal?.addEventListener('click', (event) => { if (event.target === state.dom.premiumModal) { destroyPremiumPreview(); ui.closeModal(state.dom.premiumModal); } });
            state.dom.closePremiumPaymentModalButton?.addEventListener('click', () => ui.closeModal(state.dom.premiumPaymentModal));
            state.dom.premiumPaymentModal?.addEventListener('click', (event) => { if (event.target === state.dom.premiumPaymentModal) ui.closeModal(state.dom.premiumPaymentModal); });
            state.dom.premiumBuyButton?.addEventListener('click', () => openPremiumPaymentModal());
            state.dom.premiumSilverUpsellButton?.addEventListener('click', () => {
                openPremiumModal('silver');
            });
            state.dom.premiumCancelButton?.addEventListener('click', () => cancelPremiumSubscription());
            state.dom.premiumViewProfileButton?.addEventListener('click', () => {
                destroyPremiumPreview();
                ui.closeModal(state.dom.premiumModal);
                ui.closeUserInfoModal();
                ui.openSettings();
                ui.showSettingsSection('profile');
            });
            state.dom.premiumReceiptInput?.addEventListener('change', (event) => {
                const file = event.target?.files?.[0] || null;
                updatePremiumPaymentPreview(file);
            });
            state.dom.submitPremiumPaymentButton?.addEventListener('click', () => submitPremiumPaymentRequest());
            state.dom.settingsLanguageSelect?.addEventListener('change', async (event) => {
                const nextLanguage = normalizeLanguageCode(event.target.value);
                if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
                await loadLanguage(nextLanguage, true);
                if (state.socket?.readyState === WebSocket.OPEN && state.currentUser?.userId) {
                    state.socket.send(JSON.stringify({ type: 'update_profile', languageCode: nextLanguage }));
                }
                if (state.currentUser?.userId && state.allUsers[state.currentUser.userId]) {
                    ui.populateSettingsProfile(state.allUsers[state.currentUser.userId]);
                }
                if (!state.dom.settingsChangelogSection.classList.contains('hidden')) {
                    ui.renderSettingsChangelog();
                }
            });
            state.dom.settingsEmojiSelect?.addEventListener('change', async (event) => {
                await applyEmojiMode(event.target.value, true);
            });
            state.dom.notificationsPermissionButton?.addEventListener('click', async () => {
                if (typeof PushNotificationManager === 'undefined') return;
                await PushNotificationManager.requestPermission(state.currentUser?.userId || '', state.sessionToken || '');
                setTimeout(syncNotificationPreferenceUi, 50);
                syncNotificationPreferenceUi();
            });
            state.dom.openThemesButton?.addEventListener('click', () => ui.openModal(state.dom.themesModal));
            state.dom.closeThemesButton?.addEventListener('click', () => ui.closeModal(state.dom.themesModal));
            state.dom.themesModal?.addEventListener('click', (event) => { if (event.target === state.dom.themesModal) ui.closeModal(state.dom.themesModal); });
            state.dom.themePresetsGrid?.addEventListener('click', (event) => {
                const button = event.target.closest('[data-theme-preset]');
                if (!button) return;
                const presetId = button.dataset.themePreset || '';
                if (!presetId) return;
                if (!canUseThemePreset(presetId)) {
                    if (isSilverThemePreset(presetId)) {
                        openPremiumModal('silver');
                    } else if (isPremiumThemePreset(presetId)) {
                        openPremiumModal('premium_theme');
                    }
                    return;
                }
                applyThemePreset(presetId);
            });
            ['Bio', 'Gifts', 'MutualGroups'].forEach((name) => {
                const panelName = name === 'MutualGroups' ? 'mutual-groups' : name.toLowerCase();
                const userInfoTab = state.dom[`userInfoTab${name}`];
                const settingsProfileTab = state.dom[`settingsProfileTab${name}`];
                if (userInfoTab) {
                    userInfoTab.addEventListener('click', () => setProfileTab('userInfo', panelName));
                }
                if (settingsProfileTab) {
                    settingsProfileTab.addEventListener('click', () => setProfileTab('settingsProfile', panelName));
                }
            });
            state.dom.settingsProfileEditButton?.addEventListener('click', () => setSettingsProfileEditing(true));
            state.dom.settingsProfileCancelEdit?.addEventListener('click', () => {
                ui.populateSettingsProfile(state.allUsers[state.currentUser?.userId]);
            });
            state.dom.editBioInput?.addEventListener('input', () => {
                if (state.dom.editBioInput.value.length > PROFILE_BIO_MAX_LENGTH) {
                    state.dom.editBioInput.value = state.dom.editBioInput.value.slice(0, PROFILE_BIO_MAX_LENGTH);
                }
                ui.updateBioCounter();
            });
            state.dom.editUsernameFontSelect?.addEventListener('change', () => {
                applyNicknameFontPreview(state.dom.editUsernameFontSelect?.value || '');
            });
            state.dom.profileSkinModeSelect?.addEventListener('change', () => {
                syncProfileSkinControls();
            });
            state.dom.profileSkinGradientStopsSelect?.addEventListener('change', () => {
                syncProfileSkinControls();
            });
            [state.dom.profileSkinColorPrimary, state.dom.profileSkinColorSecondary, state.dom.profileSkinColorTertiary].forEach((input) => {
                input?.addEventListener('input', () => syncProfileSkinControls());
            });
            state.dom.saveSettingsButton.addEventListener('click', () => {
                const currentUser = state.allUsers[state.currentUser.userId];
                const newUsername = state.dom.editUsernameInput.value.trim();
                const selectedNicknameFont = normalizeNicknameFont(state.dom.editUsernameFontSelect?.value || '');
                const newHandle = state.dom.editHandleInput?.value.trim() || '';
                const normalizedHandle = newHandle ? `@${newHandle.replace(/^@/, '').toLowerCase()}` : '';
                const newBio = String(state.dom.editBioInput.value || '').slice(0, PROFILE_BIO_MAX_LENGTH);
                const skinMode = String(state.dom.profileSkinModeSelect?.value || '').trim().toLowerCase();
                const nextProfileSkin = buildProfileSkinFromInputs();
                if (selectedNicknameFont && String(currentUser?.membershipTier || '').toLowerCase() !== 'premium') {
                    openPremiumModal();
                    return;
                }
                if ((skinMode || nextProfileSkin) && String(currentUser?.membershipTier || '').toLowerCase() !== 'premium') {
                    openPremiumModal();
                    return;
                }
                const payload = { type: 'update_profile' };
                let hasChanges = false;
                if (newUsername && newUsername !== currentUser?.username) {
                    payload.username = newUsername;
                    hasChanges = true;
                }
                if (newBio !== String(currentUser?.bio || '')) {
                    payload.bio = newBio;
                    hasChanges = true;
                }
                if (normalizedHandle !== String(currentUser?.handle || '')) {
                    payload.handle = newHandle;
                    hasChanges = true;
                }
                if (selectedNicknameFont !== normalizeNicknameFont(currentUser?.nicknameFont || '')) {
                    payload.nicknameFont = selectedNicknameFont;
                    hasChanges = true;
                }
                if (JSON.stringify(nextProfileSkin || null) !== JSON.stringify(normalizeProfileSkin(currentUser?.profileSkin) || null)) {
                    payload.profileSkin = nextProfileSkin;
                    hasChanges = true;
                }
                if (hasChanges && state.socket?.readyState === WebSocket.OPEN) {
                    state.socket.send(JSON.stringify(payload));
                    state.allUsers[state.currentUser.userId] = {
                        ...currentUser,
                        username: payload.username || currentUser?.username,
                        handle: Object.prototype.hasOwnProperty.call(payload, 'handle') ? (normalizedHandle || null) : currentUser?.handle,
                        bio: Object.prototype.hasOwnProperty.call(payload, 'bio') ? payload.bio : currentUser?.bio,
                        nicknameFont: Object.prototype.hasOwnProperty.call(payload, 'nicknameFont') ? selectedNicknameFont : currentUser?.nicknameFont,
                        profileSkin: Object.prototype.hasOwnProperty.call(payload, 'profileSkin') ? (nextProfileSkin || null) : currentUser?.profileSkin,
                    };
                    state.currentUser = {
                        ...state.currentUser,
                        username: payload.username || state.currentUser?.username,
                        handle: Object.prototype.hasOwnProperty.call(payload, 'handle') ? (normalizedHandle || null) : state.currentUser?.handle,
                        bio: Object.prototype.hasOwnProperty.call(payload, 'bio') ? payload.bio : state.currentUser?.bio,
                        nicknameFont: Object.prototype.hasOwnProperty.call(payload, 'nicknameFont') ? selectedNicknameFont : state.currentUser?.nicknameFont,
                        profileSkin: Object.prototype.hasOwnProperty.call(payload, 'profileSkin') ? (nextProfileSkin || null) : state.currentUser?.profileSkin,
                    };
                }
                ui.populateSettingsProfile(state.allUsers[state.currentUser.userId]);
            });
            const findMembershipBadgeElement = (event) => event.target?.closest?.('[data-membership-badge="1"], [data-premium-badge="1"]')
                || (typeof event.composedPath === 'function' && event.composedPath().find((node) => node?.dataset?.membershipBadge === '1' || node?.dataset?.premiumBadge === '1')) || null;
            const openMembershipPurchaseFromEvent = (event, user, allowPremiumEditor = false) => {
                const badgeEl = findMembershipBadgeElement(event);
                if (!badgeEl) return false;
                const tier = String(badgeEl.dataset.membershipTier || (badgeEl.dataset.premiumBadge === '1' ? 'premium' : '')).toLowerCase();
            if (allowPremiumEditor && tier === 'premium') {
                    openPremiumStarPickerModal();
                    return true;
                }
                openPremiumModal(tier === 'silver' ? 'silver' : 'premium', 'profile_badge');
                return true;
            };
            state.dom.settingsUsername?.addEventListener('click', (event) => {
                openMembershipPurchaseFromEvent(event, state.currentUser, true);
            });
            state.dom.settingsUsername?.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                if (openMembershipPurchaseFromEvent(event, state.currentUser, true)) {
                    event.preventDefault();
                }
            });
            state.dom.userInfoUsername?.addEventListener('click', (event) => {
                const userId = state.activeUserInfoUserId;
                if (!userId) return;
                openMembershipPurchaseFromEvent(event, state.allUsers[userId] || { userId });
            });
            state.dom.userInfoUsername?.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                const userId = state.activeUserInfoUserId;
                if (!userId) return;
                if (openMembershipPurchaseFromEvent(event, state.allUsers[userId] || { userId })) {
                    event.preventDefault();
                }
            });
            state.dom.closePremiumStarPickerButton?.addEventListener('click', closePremiumStarPickerModal);
            state.dom.cancelPremiumStarPickerButton?.addEventListener('click', closePremiumStarPickerModal);
            state.dom.savePremiumStarPickerButton?.addEventListener('click', commitPremiumStarPickerSelection);
            state.dom.premiumStarSourceStickers?.addEventListener('click', () => {
                state.premiumStarPickerSource = 'stickers';
                renderPremiumStarPickerGrid();
            });
            state.dom.premiumStarSourceTemplates?.addEventListener('click', () => {
                state.premiumStarPickerSource = 'templates';
                renderPremiumStarPickerGrid();
            });
            state.dom.premiumStarResetButton?.addEventListener('click', () => {
                state.premiumStarPickerSelection = null;
                commitPremiumStarPickerSelection();
            });
            state.dom.logoutButton.addEventListener('click', () => handleLogoutSequence(true));
            state.dom.logoutFromLoadingButton.addEventListener('click', () => handleLogoutSequence(true));
            state.dom.backToContacts.addEventListener('click', () => { state.dom.mainApp.classList.remove('chat-view-active'); state.currentChat = null; ui.renderContactList(); });
            state.dom.messagesContainer.addEventListener('scroll', handleMessageScroll);
            state.dom.settingsAvatar.addEventListener('click', () => {
                if (!state.settingsProfileEditing) return;
                state.dom.avatarInput.click();
            });
            state.dom.avatarInput.addEventListener('change', handleAvatarSelect);
            state.dom.closeAvatarEditorButton?.addEventListener('click', closeAvatarEditor);
            state.dom.cancelAvatarEditorButton?.addEventListener('click', closeAvatarEditor);
            state.dom.avatarEditorModal?.addEventListener('click', (event) => {
                if (event.target === state.dom.avatarEditorModal) closeAvatarEditor();
            });
            state.dom.avatarEditorReset?.addEventListener('click', () => {
                if (state.avatarEditor.saving) return;
                state.avatarEditor.rotation = 0;
                state.avatarEditor.cropRotation = 0;
                state.avatarEditor.zoom = 1;
                state.avatarEditor.offsetX = 0;
                state.avatarEditor.offsetY = 0;
                initializeAvatarEditorCropBox();
                if (state.dom.avatarEditorZoom) {
                    state.dom.avatarEditorZoom.value = '1';
                }
                syncAvatarEditorPreview();
            });
            state.dom.avatarEditorZoom?.addEventListener('input', (event) => {
                if (state.avatarEditor.saving) return;
                state.avatarEditor.zoom = Math.max(1, Math.min(3, Number(event.target.value) || 1));
                syncAvatarEditorPreview();
            });
            state.dom.saveAvatarEditorButton?.addEventListener('click', saveAvatarEditor);
            state.dom.avatarEditorViewport?.addEventListener('pointerdown', (event) => {
                if (!state.avatarEditor.image || event.button !== 0 || state.avatarEditor.saving) return;
                const handle = event.target.closest('[data-avatar-crop-handle]')?.dataset.avatarCropHandle || '';
                const cropBox = event.target.closest('#avatarEditorCropBox');
                if (cropBox && event.pointerType === 'touch') {
                    state.avatarEditor.activePointers[event.pointerId] = { x: event.clientX, y: event.clientY };
                    if (Object.keys(state.avatarEditor.activePointers).length === 2) {
                        state.avatarEditor.pointerId = event.pointerId;
                        state.avatarEditor.interactionMode = 'rotate-crop';
                        state.avatarEditor.startRotation = state.avatarEditor.cropRotation;
                        state.avatarEditor.gestureStartAngle = getAvatarEditorGestureAngle();
                        state.dom.avatarEditorViewport.classList.remove('is-dragging-image');
                        state.dom.avatarEditorViewport.classList.add('is-dragging-crop');
                        state.dom.avatarEditorViewport.setPointerCapture?.(event.pointerId);
                        event.preventDefault();
                        return;
                    }
                }
                state.avatarEditor.pointerId = event.pointerId;
                state.avatarEditor.pointerStartX = event.clientX;
                state.avatarEditor.pointerStartY = event.clientY;
                state.avatarEditor.startOffsetX = state.avatarEditor.offsetX;
                state.avatarEditor.startOffsetY = state.avatarEditor.offsetY;
                state.avatarEditor.startCropX = state.avatarEditor.cropX;
                state.avatarEditor.startCropY = state.avatarEditor.cropY;
                state.avatarEditor.startCropSize = state.avatarEditor.cropSize;
                state.avatarEditor.startRotation = state.avatarEditor.cropRotation;
                state.avatarEditor.resizeHandle = handle;
                state.avatarEditor.interactionMode = handle ? 'resize-crop' : (cropBox ? 'move-crop' : 'move-image');
                state.dom.avatarEditorViewport.classList.toggle('is-dragging-image', state.avatarEditor.interactionMode === 'move-image');
                state.dom.avatarEditorViewport.classList.toggle('is-dragging-crop', state.avatarEditor.interactionMode !== 'move-image');
                state.dom.avatarEditorViewport.setPointerCapture?.(event.pointerId);
                event.preventDefault();
            });
            state.dom.avatarEditorViewport?.addEventListener('pointermove', (event) => {
                if (state.avatarEditor.activePointers[event.pointerId]) {
                    state.avatarEditor.activePointers[event.pointerId] = { x: event.clientX, y: event.clientY };
                }
                if (state.avatarEditor.pointerId !== event.pointerId) return;
                const dx = event.clientX - state.avatarEditor.pointerStartX;
                const dy = event.clientY - state.avatarEditor.pointerStartY;
                if (state.avatarEditor.interactionMode === 'move-image') {
                    state.avatarEditor.offsetX = state.avatarEditor.startOffsetX + dx;
                    state.avatarEditor.offsetY = state.avatarEditor.startOffsetY + dy;
                } else if (state.avatarEditor.interactionMode === 'move-crop') {
                    state.avatarEditor.cropX = state.avatarEditor.startCropX + dx;
                    state.avatarEditor.cropY = state.avatarEditor.startCropY + dy;
                } else if (state.avatarEditor.interactionMode === 'rotate-crop') {
                    rotateAvatarEditorCropGesture();
                } else if (state.avatarEditor.interactionMode === 'resize-crop') {
                    resizeAvatarEditorCropBox(dx, dy, state.avatarEditor.resizeHandle);
                }
                syncAvatarEditorPreview();
            });
            state.dom.avatarEditorViewport?.addEventListener('pointerup', (event) => {
                delete state.avatarEditor.activePointers[event.pointerId];
                if (state.avatarEditor.pointerId !== event.pointerId) return;
                endAvatarEditorPointerInteraction(event.pointerId);
            });
            state.dom.avatarEditorViewport?.addEventListener('pointercancel', (event) => {
                delete state.avatarEditor.activePointers[event.pointerId];
                if (state.avatarEditor.pointerId !== event.pointerId) return;
                endAvatarEditorPointerInteraction(event.pointerId);
            });
            state.dom.avatarEditorViewport?.addEventListener('wheel', (event) => {
                if (!state.avatarEditor.image || state.avatarEditor.saving) return;
                event.preventDefault();
                const nextZoom = Math.max(1, Math.min(3, state.avatarEditor.zoom + (event.deltaY > 0 ? -0.08 : 0.08)));
                state.avatarEditor.zoom = nextZoom;
                if (state.dom.avatarEditorZoom) {
                    state.dom.avatarEditorZoom.value = String(nextZoom);
                }
                syncAvatarEditorPreview();
            }, { passive: false });
            window.addEventListener('resize', () => {
                if (!state.dom.avatarEditorModal?.classList.contains('flex')) return;
                syncAvatarEditorPreview();
            });
            state.dom.cancelDeleteButton.addEventListener('click', () => ui.closeModal(state.dom.confirmDeleteModal));
            state.dom.confirmDeleteButton.addEventListener('click', (e) => {
                if ((e.target.dataset.mode || 'delete') !== 'delete') return;
                const msgId = e.target.dataset.msgId;
                requestMessageDelete(msgId, 'everyone');
                ui.closeModal(state.dom.confirmDeleteModal);
            });
            state.sidebarSearchRequestId = Number(state.sidebarSearchRequestId || 0);
            state.dom.createChannelButton.addEventListener('click', () => {
                if (state.chatSelectionMode) {
                    handleSelectedChatsDelete();
                    return;
                }
                setSidebarSearchActive(!state.isSidebarSearchActive);
            });
            state.dom.chatSearchButton?.addEventListener('click', () => {
                if (!state.currentChat) return;
                state.sidebarSearchQuery = '';
                state.chatSearchResults = [];
                if (window.innerWidth < 768) {
                    state.dom.mainApp?.classList.remove('chat-view-active');
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setSidebarSearchActive(true, {
                                mode: 'chat',
                                chatId: state.currentChat.chatId
                            });
                        });
                    });
                    return;
                }
                setSidebarSearchActive(true, {
                    mode: 'chat',
                    chatId: state.currentChat.chatId
                });
            });
            state.dom.closeSidebarSearchButton?.addEventListener('click', () => setSidebarSearchActive(false));
            state.dom.sidebarSearchInput?.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setSidebarSearchActive(false);
                }
            });
            state.dom.sidebarSearchInput?.addEventListener('input', () => {
                const query = String(state.dom.sidebarSearchInput.value || '').trim();
                state.sidebarSearchQuery = query;
                if (state.sidebarSearchTimer) clearTimeout(state.sidebarSearchTimer);
                if (state.sidebarSearchMode === 'chat') {
                    state.chatSearchResults = query ? searchMessagesInChat(state.sidebarSearchChatId, query) : [];
                    prepareSidebarListForEnter();
                    renderSidebarSearchResults(query, state.chatSearchResults, 'chat');
                    applySidebarListEnterAnimation();
                    if (query) {
                        const requestId = ++state.sidebarSearchRequestId;
                        state.sidebarSearchTimer = window.setTimeout(() => {
                            requestChatMessageSearch(state.sidebarSearchChatId, query, requestId);
                        }, 120);
                    }
                    return;
                }
                if (!query) {
                    state.publicSearchResults = [];
                    prepareSidebarListForEnter();
                    renderSidebarSearchResults('', [], 'public');
                    applySidebarListEnterAnimation();
                    return;
                }
                prepareSidebarListForEnter();
                renderSidebarSearchResults(query, state.publicSearchResults, 'public');
                applySidebarListEnterAnimation();
                const requestId = ++state.sidebarSearchRequestId;
                state.sidebarSearchTimer = window.setTimeout(async () => {
                    try {
                        const results = await searchPublicDirectory(query);
                        if (requestId !== state.sidebarSearchRequestId || !state.isSidebarSearchActive || state.sidebarSearchMode !== 'public') return;
                        state.publicSearchResults = results;
                        prepareSidebarListForEnter();
                        renderSidebarSearchResults(query, results, 'public');
                        applySidebarListEnterAnimation();
                    } catch (error) {
                        if (requestId !== state.sidebarSearchRequestId || !state.isSidebarSearchActive || state.sidebarSearchMode !== 'public') return;
                        state.publicSearchResults = [];
                        prepareSidebarListForEnter();
                        renderSidebarSearchResults(query, [], 'public');
                        applySidebarListEnterAnimation();
                    }
                }, 180);
            });
            state.dom.closeChannelModalButton.addEventListener('click', () => ui.closeModal(state.dom.createChannelModal));
      // Create options modal listeners
      state.dom.closeCreateOptionsModalButton.addEventListener('click', () => ui.closeModal(state.dom.createOptionsModal));
      state.dom.createOptionsModal.addEventListener('click', (e) => {
        if (e.target === state.dom.createOptionsModal) ui.closeModal(state.dom.createOptionsModal);
      });
      state.dom.createOptionCreateChannel.addEventListener('click', () => {
        ui.closeModal(state.dom.createOptionsModal);
        ui.openModal(state.dom.createChannelModal);
      });
      state.dom.createOptionCreateGroup.addEventListener('click', () => {
        ui.closeModal(state.dom.createOptionsModal);
        renderGroupMembersList();
        ui.openModal(state.dom.createGroupModal);
      });

      // Create group modal listeners
      state.dom.closeGroupModalButton.addEventListener('click', () => ui.closeModal(state.dom.createGroupModal));
      state.dom.createGroupModal.addEventListener('click', (e) => {
        if (e.target === state.dom.createGroupModal) ui.closeModal(state.dom.createGroupModal);
      });
      state.dom.submitCreateGroup.addEventListener('click', handleCreateGroup);

            state.dom.channelAvatarPreview.addEventListener('click', () => state.dom.channelAvatarInput.click());
            state.dom.channelAvatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0]; if(file) { const reader = new FileReader(); reader.onload = (ev) => { state.dom.channelAvatarPreview.style.backgroundImage = `url(${ev.target.result})`; state.dom.channelAvatarPreview.innerHTML = ''; }; reader.readAsDataURL(file); }
            });
            state.dom.submitCreateChannel.addEventListener('click', handleCreateChannel);
            state.dom.joinChannelButton.addEventListener('click', () => {
                if (!assertUserNotBanned('join chats')) return;
                if(state.currentChat && state.socket?.readyState === WebSocket.OPEN) {
                    state.justJoinedChannelId = state.currentChat.chatId;
                    state.socket.send(JSON.stringify({ type: 'join_channel', chatId: state.currentChat.chatId }));
                }
            });
            state.dom.chatHeaderInfo.addEventListener('click', () => {
                if (!state.currentChat) return;
                if (state.currentChat.chatType === 'private') {
                    const otherUserId = state.currentChat.members.find(id => id !== state.currentUser.userId);
                    ui.openUserInfoModal(state.allUsers[otherUserId]);
                    return;
                }
                if (state.currentChat.chatType === 'group' || state.currentChat.chatType === 'channel') {
                    const isMember = state.currentChat.ownerId === state.currentUser.userId || (state.currentChat.members || []).includes(state.currentUser.userId);
                    if (!isMember) return;
                    openChatSettings(state.currentChat.chatId);
                }
            });
            state.dom.closeUserInfoModal.addEventListener('click', () => ui.closeUserInfoModal());
            state.dom.userInfoModal.addEventListener('click', (e) => { if (e.target === state.dom.userInfoModal) ui.closeUserInfoModal(); });
            state.dom.userInfoMessageButton?.addEventListener('click', () => {
                const userId = state.dom.userInfoMessageButton.dataset.userId;
                if (!userId) return;
                ui.closeUserInfoModal();
                openPrivateChatWithUser(userId);
            });
            [state.dom.userInfoGiftsList, state.dom.settingsProfileGiftsList].forEach((list) => {
                list?.addEventListener('click', (event) => {
                    const button = event.target.closest('[data-action="open-gift-detail"]');
                    if (!button) return;
                    event.preventDefault();
                    openGiftDetailModal(button.dataset.giftId || '', button.dataset.giftMode || 'catalog');
                });
            });
            state.dom.closeGiftDetailModal?.addEventListener('click', () => ui.closeModal(state.dom.giftDetailModal));
            state.dom.giftDetailModal?.addEventListener('click', (event) => { if (event.target === state.dom.giftDetailModal) ui.closeModal(state.dom.giftDetailModal); });
            state.dom.giftDetailBuyButton?.addEventListener('click', async () => {
                const giftId = state.dom.giftDetailBuyButton.dataset.giftId || '';
                const mode = state.dom.giftDetailBuyButton.dataset.mode || 'catalog';
                if (!giftId) return;
                if (!state.isFullyAuthenticated) {
                    setGiftDetailStatus('Sign in required.', 'error');
                    return;
                }
                if (mode === 'owned') {
                    resetGiftActionState();
                    state.dom.giftActionModal.dataset.giftId = giftId;
                    state.dom.giftActionModal.dataset.mode = 'owned';
                    const actionTitle = state.dom.giftActionModal?.querySelector('.gift-action-title');
                    if (actionTitle) {
                        actionTitle.textContent = t('gift.chooseAction', 'Choose what to do with this gift');
                    }
                    if (state.dom.giftActionOwnButton) {
                        state.dom.giftActionOwnButton.textContent = t('gift.sell', 'Sell');
                    }
                    if (state.dom.giftActionGiftButton) {
                        state.dom.giftActionGiftButton.textContent = t('gift.shareToChat', 'Share to chat');
                    }
                    ui.openModal(state.dom.giftActionModal);
                    setGiftActionStatus(t('gift.shareOrSellHint', 'Share this gift to a chat or sell it for a full refund.'));
                    return;
                }
                resetGiftActionState();
                state.dom.giftActionModal.dataset.giftId = giftId;
                state.dom.giftActionModal.dataset.mode = 'catalog';
                ui.openModal(state.dom.giftActionModal);
                setGiftActionStatus('Choose how you want to use this gift.');
            });
            state.dom.closeGiftActionModal?.addEventListener('click', () => ui.closeModal(state.dom.giftActionModal));
            state.dom.giftActionModal?.addEventListener('click', (event) => { if (event.target === state.dom.giftActionModal) ui.closeModal(state.dom.giftActionModal); });
            state.dom.giftActionOwnButton?.addEventListener('click', async () => {
                const giftId = state.dom.giftActionModal?.dataset.giftId || '';
                const actionMode = state.dom.giftActionModal?.dataset.mode || 'catalog';
                if (!giftId) return;
                state.dom.giftActionOwnButton.disabled = true;
                state.dom.giftActionGiftButton.disabled = true;
                setGiftActionStatus(actionMode === 'owned' ? t('gift.selling', 'Selling gift...') : t('gift.completingPurchase', 'Completing purchase...'));
                try {
                    const payload = actionMode === 'owned'
                        ? await authenticatedFetch('/gifts/sell', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ giftId }),
                        })
                        : await authenticatedFetch('/gifts/purchase', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ giftId, mode: 'own' }),
                        });
                    if (payload?.gift) {
                        state.giftCatalogCache[giftId] = payload.gift;
                        applyGiftDetailModal(payload.gift);
                    }
                    state.walletOverview = null;
                    await loadWalletOverview(true);
                    if (state.currentUser?.userId) {
                        const profile = await loadUserProfile(state.currentUser.userId, true);
                        if (profile) {
                            state.allUsers[state.currentUser.userId] = { ...(state.allUsers[state.currentUser.userId] || {}), ...profile };
                            ui.populateSettingsProfile(state.allUsers[state.currentUser.userId]);
                            if (state.activeUserInfoUserId === state.currentUser.userId && !state.dom.userInfoModal.classList.contains('hidden')) {
                                ui.openUserInfoModal(state.allUsers[state.currentUser.userId]);
                            }
                        }
                    }
                    ui.closeModal(state.dom.giftActionModal);
                    setGiftDetailStatus(actionMode === 'owned' ? t('gift.soldSuccess', 'Gift sold.') : t('gift.addedSuccess', 'Gift added to your account.'), 'ok');
                } catch (error) {
                    setGiftActionStatus(error.message || (actionMode === 'owned' ? t('gift.sellFailed', 'Sell failed.') : t('gift.purchaseFailed', 'Purchase failed.')), 'error');
                    const currentGift = await getGiftCatalogItem(giftId);
                    if (currentGift) applyGiftDetailModal(currentGift);
                } finally {
                    state.dom.giftActionOwnButton.disabled = false;
                    state.dom.giftActionGiftButton.disabled = false;
                }
            });
            state.dom.giftActionGiftButton?.addEventListener('click', () => {
                const actionMode = state.dom.giftActionModal?.dataset.mode || 'catalog';
                const chats = fillGiftActionChatOptions();
                state.dom.giftActionChatField?.classList.remove('hidden');
                if (!chats.length) {
                    setGiftActionStatus(t('gift.noChatsForGiveaways', 'No chats available for giveaways.'), 'error');
                    state.dom.giftActionConfirmButton.disabled = true;
                    return;
                }
                if (state.dom.giftActionConfirmButton) {
                    state.dom.giftActionConfirmButton.textContent = actionMode === 'owned'
                        ? t('gift.shareToChat', 'Share to chat')
                        : t('gift.sendToChat', 'Send to chat');
                }
                state.dom.giftActionConfirmButton.disabled = false;
                setGiftActionStatus(actionMode === 'owned' ? t('gift.selectChatToShare', 'Select a chat to share this gift.') : t('gift.selectChatThenSend', 'Select a chat, then send the gift.'));
            });
            state.dom.giftActionConfirmButton?.addEventListener('click', async () => {
                const giftId = state.dom.giftActionModal?.dataset.giftId || '';
                const chatId = state.dom.giftActionChatSelect?.value || '';
                if (!giftId || !chatId) return;
                state.dom.giftActionConfirmButton.disabled = true;
                setGiftActionStatus('Posting gift giveaway...');
                try {
                    const payload = await authenticatedFetch('/gifts/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ giftId, mode: 'gift', chatId }),
                    });
                    if (payload?.gift) {
                        state.giftCatalogCache[giftId] = payload.gift;
                        applyGiftDetailModal(payload.gift);
                    }
                    state.walletOverview = null;
                    await loadWalletOverview(true);
                    ui.closeModal(state.dom.giftActionModal);
                    setGiftDetailStatus('Gift sent to chat.', 'ok');
                    resetGiftActionState();
                } catch (error) {
                    setGiftActionStatus(error.message || 'Gift send failed.', 'error');
                    const currentGift = await getGiftCatalogItem(giftId);
                    if (currentGift) applyGiftDetailModal(currentGift);
                } finally {
                    state.dom.giftActionConfirmButton.disabled = false;
                }
            });
            state.dom.closeMediaViewer.addEventListener('click', () => ui.closeModal(state.dom.mediaViewerModal));
            state.dom.mediaViewerModal.addEventListener('click', (e) => { if (e.target === state.dom.mediaViewerModal) ui.closeModal(state.dom.mediaViewerModal) });
            state.dom.messagesContainer.addEventListener('click', (e) => { const replyQuote = e.target.closest('.reply-quote'); if (replyQuote && replyQuote.dataset.replyToId) scrollToMessage(replyQuote.dataset.replyToId); });
            state.dom.closeForwardModalButton.addEventListener('click', () => ui.closeModal(state.dom.forwardMessageModal));
            state.dom.cancelForwardButton.addEventListener('click', () => ui.closeModal(state.dom.forwardMessageModal));
            state.dom.confirmForwardButton.addEventListener('click', handleConfirmForward);
            state.dom.pinnedMessageBar.addEventListener('click', () => { if (state.currentChat && state.currentChat.pinnedMessage) scrollToMessage(state.currentChat.pinnedMessage.messageId); });
            state.dom.unpinButton.addEventListener('click', (e) => { e.stopPropagation(); unpinMessage(); });
            state.dom.leaveGroupButton?.addEventListener('click', handleLeaveGroup);
            state.dom.e2eeToggleButton.addEventListener('click', async () => {
                if (!state.currentChat || state.currentChat.chatType !== 'private') return;
                const session = getE2EESession(state.currentChat);
                if (session) endE2EESession(state.currentChat, true, t('e2ee.disabled', 'E2EE Chat disabled.'));
                else await startE2EESession(state.currentChat);
                openChat(state.currentChat, true);
            });

            // Voice Chat Event Listeners
            state.dom.voiceCallButton.addEventListener('click', handleVoiceCallButtonClick);
            state.dom.leaveCallButton.addEventListener('click', leaveVoiceChat);
            state.dom.toggleScreenShareButton.addEventListener('click', toggleVoiceScreenShare);
            state.dom.toggleScreenShareQualityButton.addEventListener('click', toggleScreenShareQuality);
            state.dom.toggleMuteButton.addEventListener('click', toggleVoiceMute);
            state.dom.toggleDeafenButton.addEventListener('click', toggleVoiceDeafen);
            state.dom.toggleCallStageButton.addEventListener('click', toggleVoiceStageSize);
            state.dom.acceptCallButton.addEventListener('click', acceptIncomingCall);
            state.dom.declineCallButton.addEventListener('click', () => {
                playUiSound('call-denied');
                ui.closeIncomingCallModal();
            });
            
            state.dom.resetThemeButton.addEventListener('click', () => {
                resetThemeCss();
                ui.closeModal(state.dom.themesModal);
            });
            
            state.dom.blockGroupInvitesCheckbox.addEventListener('change', async () => {
                if (!state.currentUser) return;
                const session = getValidSession();
                if (!session?.token) {
                    handleLogoutSequence(false);
                    return;
                }
                try {
                    const res = await fetch(resolveServerUrl('/user/privacy'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-User-ID': state.currentUser.userId, 'X-Auth-Token': session?.token },
                        body: JSON.stringify({ blockGroupInvites: state.dom.blockGroupInvitesCheckbox.checked })
                    });
                    const result = await res.json();
                    if (!res.ok || !result.success) {
                        state.dom.blockGroupInvitesCheckbox.checked = !state.dom.blockGroupInvitesCheckbox.checked;
                        showErrorModal(t('settings.privacySettings', 'Privacy Settings'), result.error || t('error.privacyUpdateFailed', 'Failed to update privacy settings'));
                    }
                } catch (err) {
                    state.dom.blockGroupInvitesCheckbox.checked = !state.dom.blockGroupInvitesCheckbox.checked;
                    showErrorModal(t('error.networkTitle', 'Network Error'), err.message || t('error.requestFailed', 'Request failed'));
                }
            });
            
            state.dom.openChangePasswordBtn.addEventListener('click', () => {
                state.dom.changePasswordOld.value = ''; state.dom.changePasswordNew.value = '';
                ui.openModal(state.dom.changePasswordModal);
            });
            state.dom.openDevicesButton?.addEventListener('click', async () => {
                try {
                    await openDevicesModal();
                } catch (error) {
                    showErrorModal(t('account.devices', 'Devices'), error.message || t('error.couldNotLoadDevices', 'Could not load devices.'));
                }
            });
            state.dom.closeDevicesButton?.addEventListener('click', () => ui.closeModal(state.dom.devicesModal));
            state.dom.devicesModal?.addEventListener('click', (e) => { if (e.target === state.dom.devicesModal) ui.closeModal(state.dom.devicesModal); });
            state.dom.devicesList?.addEventListener('click', async (event) => {
                const button = event.target.closest('[data-action="revoke-session"]');
                if (!button) return;
                const sessionId = button.dataset.sessionId || '';
                if (!sessionId) return;
                button.disabled = true;
                try {
                    const current = normalizeSession(getStorage().loadSession());
                    await authenticatedFetch('/user/sessions/revoke', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId }),
                    });
                    if (current?.sessionId && current.sessionId === sessionId) {
                        handleLogoutSequence(false);
                        return;
                    }
                    renderDeviceSessions(await loadDeviceSessions());
                } catch (error) {
                    button.disabled = false;
                    showErrorModal(t('account.devices', 'Devices'), error.message || t('error.couldNotLogoutDevice', 'Could not log out that device.'));
                }
            });
            state.dom.closeChangePasswordButton.addEventListener('click', () => { state.dom.changePasswordOld.value = ''; state.dom.changePasswordNew.value = ''; ui.closeModal(state.dom.changePasswordModal); });
            state.dom.cancelChangePasswordButton.addEventListener('click', () => { state.dom.changePasswordOld.value = ''; state.dom.changePasswordNew.value = ''; ui.closeModal(state.dom.changePasswordModal); });
            state.dom.changePasswordModal.addEventListener('click', (e) => { if (e.target === state.dom.changePasswordModal) { state.dom.changePasswordOld.value = ''; state.dom.changePasswordNew.value = ''; ui.closeModal(state.dom.changePasswordModal); } });
            state.dom.changePasswordButton.addEventListener('click', () => {
                const oldPwd = state.dom.changePasswordOld.value;
                const newPwd = state.dom.changePasswordNew.value;
                if (!oldPwd || !newPwd) { showErrorModal(t('account.changePassword', 'Change Password'), t('error.enterCurrentNewPassword', 'Please enter both current and new password.')); return; }
                if (newPwd.length < PASSWORD_MIN_LENGTH) {
                    showErrorModal(t('account.changePassword', 'Change Password'), t('auth.passwordMin', `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`).replace('{min}', PASSWORD_MIN_LENGTH));
                    return;
                }
                state.socket.send(JSON.stringify({ type: 'change_password', oldPassword: oldPwd, newPassword: newPwd }));
                state.dom.changePasswordOld.value = ''; state.dom.changePasswordNew.value = '';
                ui.closeModal(state.dom.changePasswordModal);
            });

            state.dom.openDeleteAccountBtn.addEventListener('click', () => {
                state.dom.deleteAccountPassword.value = ''; state.dom.deleteAccountConfirmCheck.checked = false;
                ui.openModal(state.dom.deleteAccountModal);
            });
            state.dom.requestBanRecheckButton?.addEventListener('click', () => {
                requestBanRecheck();
            });
            state.dom.closeDeleteAccountButton.addEventListener('click', () => { state.dom.deleteAccountPassword.value = ''; state.dom.deleteAccountConfirmCheck.checked = false; ui.closeModal(state.dom.deleteAccountModal); });
            state.dom.cancelDeleteAccountButton.addEventListener('click', () => { state.dom.deleteAccountPassword.value = ''; state.dom.deleteAccountConfirmCheck.checked = false; ui.closeModal(state.dom.deleteAccountModal); });
            state.dom.deleteAccountModal.addEventListener('click', (e) => { if (e.target === state.dom.deleteAccountModal) { state.dom.deleteAccountPassword.value = ''; state.dom.deleteAccountConfirmCheck.checked = false; ui.closeModal(state.dom.deleteAccountModal); } });
            state.dom.deleteAccountButton.addEventListener('click', () => {
                const pwd = state.dom.deleteAccountPassword.value;
                const confirmed = state.dom.deleteAccountConfirmCheck.checked;
                if (!pwd) { showErrorModal(t('account.deleteAccount', 'Delete Account'), t('error.enterPasswordConfirm', 'Please enter your password to confirm.')); return; }
                if (!confirmed) { showErrorModal(t('account.deleteAccount', 'Delete Account'), t('error.checkConfirmationBox', 'Please check the confirmation box to proceed.')); return; }
                state.socket.send(JSON.stringify({ type: 'delete_account', password: pwd }));
                state.dom.deleteAccountPassword.value = ''; state.dom.deleteAccountConfirmCheck.checked = false;
                ui.closeModal(state.dom.deleteAccountModal);
            });

            state.dom.closeErrorModalButton.addEventListener('click', () => ui.closeModal(state.dom.errorModal));
    
            // New Menu Listeners
            state.dom.menuCloseBtn.addEventListener('click', () => ui.closeMainMenu());
            state.dom.mainMenuOverlay.addEventListener('click', (e) => { if(e.target === state.dom.mainMenuOverlay) ui.closeMainMenu(); });
            state.dom.menuSettingsBtn.addEventListener('click', () => { ui.closeMainMenu(); ui.openSettings(); });
            state.dom.menuContactsBtn.addEventListener('click', () => ui.openContactsModal());
            state.dom.menuNewChatBtn?.addEventListener('click', () => {
                if (!assertUserNotBanned('create chats')) return;
                ui.closeMainMenu();
                ui.openModal(state.dom.createOptionsModal);
            });
            state.dom.menuStarsBtn?.addEventListener('click', async () => {
                ui.closeMainMenu();
                try {
                    await openWalletModal();
                } catch (error) {
                    showErrorModal(t('wallet.errorTitle', 'Wallet Error'), error.message || t('error.couldNotLoadWallet', 'Could not load the wallet.'));
                }
            });
            state.dom.openWalletButton?.addEventListener('click', async () => {
                try {
                    await openWalletModal();
                } catch (error) {
                    showErrorModal(t('wallet.errorTitle', 'Wallet Error'), error.message || t('error.couldNotLoadWallet', 'Could not load the wallet.'));
                }
            });
            state.dom.closeWalletModal?.addEventListener('click', () => ui.closeModal(state.dom.walletModal));
            state.dom.walletModal?.addEventListener('click', (e) => { if (e.target === state.dom.walletModal) ui.closeModal(state.dom.walletModal); });
            state.dom.walletOpenSendSection?.addEventListener('click', () => showWalletSection('send'));
            state.dom.walletOpenTransactionsSection?.addEventListener('click', () => showWalletSection('transactions'));
            state.dom.walletBackToMain?.addEventListener('click', () => showWalletSection('main'));
            state.dom.walletTransactionsBackToMain?.addEventListener('click', () => showWalletSection('main'));
            state.dom.walletGiveawaySubmit?.addEventListener('click', async () => {
                const chatId = state.dom.walletGiveawayChat.value;
                const amount = state.dom.walletGiveawayAmount.value;
                if (!chatId || !amount) {
                    showErrorModal(t('wallet.starsGiveaway', 'Stars Giveaway'), t('error.chooseChatEnterAmount', 'Choose a chat and enter an amount.'));
                    return;
                }
                try {
                    await authenticatedFetch('/stars/giveaway', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chatId, amount }),
                    });
                    state.dom.walletGiveawayAmount.value = '';
                    await loadWalletOverview(true);
                    showWalletSection('main');
                } catch (error) {
                    showErrorModal(t('wallet.starsGiveaway', 'Stars Giveaway'), error.message || t('error.couldNotCreateGiveaway', 'Could not create the giveaway.'));
                }
            });
             
            // New Contact Modal Listeners
            state.dom.closeContactsModal.addEventListener('click', () => ui.closeModal(state.dom.contactsModal));
            state.dom.contactsModal.addEventListener('click', (e) => { if(e.target === state.dom.contactsModal) ui.closeModal(state.dom.contactsModal); });
            state.dom.contactSearchInput.addEventListener('input', (e) => ui.renderAllContacts(e.target.value));

            // CTRL+V Paste Support
            state.dom.messageInput.addEventListener('paste', (e) => {
                const items = (e.clipboardData || e.originalEvent.clipboardData).items;
                for (let index in items) {
                    const item = items[index];
                    if (item.kind === 'file') {
                        e.preventDefault();
                        const blob = item.getAsFile();
                        ui.showFilePreview(blob);
                        return; // Only upload one file at a time
                    }
                }
            });
        }

        
        function changeTitleWithFade(newText, delay = 0) {
            setTimeout(() => {
                const title = document.getElementById('sidebarTitle');
                if (!title) return;
                title.style.opacity = '0';
                setTimeout(() => {
                    title.textContent = newText;
                    title.style.opacity = '1';
                }, 350);
            }, delay);
        }

        function connect(authPayload) {
            if (state.socket?.readyState === WebSocket.OPEN || state.socket?.readyState === WebSocket.CONNECTING) return;
            const isReconnecting = authPayload.type === 'reconnect';
            if (!isReconnecting) {
                resetAuthBootstrapState();
            }
            
            const hasVisibleAppShell = !state.dom.mainApp?.classList.contains('hidden');
            ui.showLoading(
                isReconnecting ? t('loading.reconnectingAttempt', `Reconnecting (attempt ${state.reconnectAttempts + 1})...`).replace('{attempt}', state.reconnectAttempts + 1) : t('loading.connecting', 'Connecting...'),
                {
                    blocking: !hasVisibleAppShell,
                    showLogout: isReconnecting && !hasVisibleAppShell
                }
            );
            
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = "noveo.ir:8443";
            const websocketUrl = `${wsProtocol}//${wsHost}/ws`;
            
            state.socket = new WebSocket(websocketUrl);
            state.socket.binaryType = 'arraybuffer';

            state.socket.onopen = () => {
                state.socket.send(JSON.stringify(authPayload));
            };

            state.socket.onmessage = handleSocketMessage;
            state.socket.onclose = (event) => {
                console.log(`WebSocket Closed: code=${event.code}, reason='${event.reason}'`);
                getVoiceChatModule()?.handleAppDisconnect();
                state.e2eeSessions = {};
                state.socket = null;
                
                if (event.code === 4001 || event.code === 4002 || event.code === 4003) { // Custom codes for auth/session/account failure
                    handleLogoutSequence(false);
                    state.dom.authError.textContent = event.reason || (event.code === 4003
                        ? t('error.accountUnavailable', 'This account is no longer available.')
                        : t('error.authenticationFailed', 'Authentication failed.'));
                    state.dom.loginButton.innerHTML = t('auth.login', 'Login');
                    state.dom.loginButton.disabled = false;
                    state.dom.registerButton.innerHTML = t('auth.register', 'Register');
                    state.dom.registerButton.disabled = false;
                    return;
                }

                if (event.code === 1008) {
                    handleLogoutSequence(false);
                    setTimeout(() => { if(state.dom.authError) state.dom.authError.textContent = t('error.sessionTerminatedOtherDevice', 'Session terminated. You logged in from another device.'); }, 100);
                } else if (getValidSession()) {
                    scheduleReconnect();
                } else {
                    ui.showAuthScreen();
                }
            };
            state.socket.onerror = (e) => { 
                console.error('WebSocket Error:', e); 
                if (state.socket?.readyState !== WebSocket.OPEN) {
                    state.socket = null;
                }
                if (getValidSession()) {
                    scheduleReconnect();
                } else {
                    ui.showAuthScreen();
                    state.dom.authError.textContent = t('error.couldNotConnect', 'Could not connect to the server.');
                }
            };
        }
        
        function scheduleReconnect() {
            if (state.reconnectTimer) return;
            state.isReconnecting = true; 
            state.reconnectAttempts++;
            const delay = Math.min(1000 * (2 ** state.reconnectAttempts), 30000); 
            ui.setReconnectingState(true);
            if (state.dom.loadingStatus) {
                state.dom.loadingStatus.textContent = t('loading.reconnectingAttempt', `Reconnecting (attempt ${state.reconnectAttempts})...`).replace('{attempt}', state.reconnectAttempts);
            }
            state.dom.loadingSpinner?.classList.remove('hidden');
            if (!state.dom.mainApp?.classList.contains('hidden')) {
                state.dom.logoutFromLoadingButton?.classList.add('hidden');
            }
            state.reconnectTimer = setTimeout(() => {
                state.reconnectTimer = null;
                const session = getValidSession();
                if (session) connect({ type: 'reconnect', userId: session.userId, token: session.token });
            }, delay);
        }

        function getChatStatusText(chat) {
            if (!chat || !state.currentUser) return '';
            if (isCurrentUserBanned()) return t('chat.readOnlyBanned', 'Account banned - chats are read only');
            let baseStatus = '';
            if (chat.chatType === 'channel') {
                baseStatus = tr('chat.memberCount', '{count} members', { count: chat.members.length });
            } else if (chat.chatType === 'group') {
                const onlineCount = (chat.members || []).filter(id => state.allUsers[id]?.online).length;
                baseStatus = state.isReconnecting
                    ? t('loading.connecting', 'Connecting...')
                    : tr('chat.membersOnlineCount', '{members} members, {online} online', { members: chat.members.length, online: onlineCount });
            } else if (chat.chatType === 'saved') {
                baseStatus = t('chat.savedMessagesSub', 'Your personal cloud chat');
            } else {
                const otherId = (chat.members || []).find(id => id !== state.currentUser.userId);
                const otherUser = state.allUsers[otherId];
                baseStatus = state.isReconnecting ? t('loading.connecting', 'Connecting...') : getPresenceLabel(otherUser);
            }
            const session = getE2EESession(chat);
            if (chat.chatType === 'private' && session?.status === 'active') {
                return tr('chat.statusE2eeActive', '{status} - E2EE active', { status: baseStatus });
            }
            if (chat.chatType === 'private' && session?.status === 'pending') {
                return tr('chat.statusE2eeConnecting', '{status} - E2EE connecting', { status: baseStatus });
            }
            return baseStatus;
        }

        async function startE2EESession(chat = state.currentChat) {
            if (!chat || chat.chatType !== 'private' || state.socket?.readyState !== WebSocket.OPEN) return;
            const peerId = getPrivateChatPeerId(chat);
            if (!peerId) return;
            chat = canonicalizePrivateChat(chat, peerId);
            if (!state.allUsers[peerId]?.online) {
                showErrorModal(t('e2ee.unavailableTitle', 'E2EE Unavailable'), t('e2ee.peerMustBeOnline', 'The other user must be online to start E2EE Chat.'));
                return;
            }
            if (state.attachedFile && state.attachedFileChatId === chat.chatId) {
                ui.hideFilePreview();
            }
            const sessionId = `e2ee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const keyPair = await generateE2EEKeyPair();
            state.e2eeSessions[chat.chatId] = {
                status: 'pending',
                sessionId,
                recipientId: peerId,
                keyPair,
                aesKey: null,
            };
            window.setTimeout(() => {
                const session = state.e2eeSessions[chat.chatId];
                if (session && session.status === 'pending' && session.sessionId === sessionId) {
                    delete state.e2eeSessions[chat.chatId];
                    updateE2EEButton(chat);
                    addLocalSystemMessage(chat.chatId, t('e2ee.requestTimedOut', 'E2EE Chat request timed out.'));
                    if (state.currentChat?.chatId === chat.chatId) {
                        restoreChatStatus(chat.chatId);
                    }
                }
            }, 15000);
            updateE2EEButton(chat);
            state.socket.send(JSON.stringify({
                type: 'e2ee_session_request',
                chatId: getE2EEChatIdForPeer(peerId),
                recipientId: peerId,
                sessionId,
                publicKey: await exportE2EEPublicKey(keyPair.publicKey),
            }));
        }

        function endE2EESession(chat = state.currentChat, notifyPeer = true, reason = t('e2ee.disabled', 'E2EE Chat disabled.')) {
            if (!chat) return;
            const session = getE2EESession(chat);
            if (!session) return;
            delete state.e2eeSessions[chat.chatId];
            updateE2EEButton(chat);
            if (notifyPeer && state.socket?.readyState === WebSocket.OPEN && session.recipientId) {
                state.socket.send(JSON.stringify({
                    type: 'e2ee_session_end',
                    chatId: chat.chatId,
                    recipientId: session.recipientId,
                    sessionId: session.sessionId,
                }));
            }
            addLocalSystemMessage(chat.chatId, reason);
            if (state.currentChat?.chatId === chat.chatId) {
                restoreChatStatus(chat.chatId);
            }
        }

        async function handleE2EESessionRequest(data) {
            const peerId = data.senderId;
            const chatId = data.chatId || getE2EEChatIdForPeer(peerId);
            const chat = ensurePrivateChatExists(chatId, peerId);
            if (!chat) return;
            if (!state.allUsers[peerId]?.online) {
                return;
            }
            const keyPair = await generateE2EEKeyPair();
            const peerPublicKey = await importE2EEPublicKey(data.publicKey);
            const aesKey = await deriveE2EEAesKey(keyPair.privateKey, peerPublicKey);
            state.e2eeSessions[chatId] = {
                status: 'active',
                sessionId: data.sessionId,
                recipientId: peerId,
                keyPair,
                aesKey,
            };
            state.socket.send(JSON.stringify({
                type: 'e2ee_session_accept',
                chatId,
                recipientId: peerId,
                sessionId: data.sessionId,
                publicKey: await exportE2EEPublicKey(keyPair.publicKey),
            }));
            addLocalSystemMessage(chatId, t('e2ee.enabled', 'E2EE Chat enabled.'));
            updateE2EEButton(chat);
            updateChatMetadata(chatId);
        }

        async function handleE2EESessionAccept(data) {
            const chatId = data.chatId;
            const session = state.e2eeSessions[chatId];
            if (!session || session.sessionId !== data.sessionId || !session.keyPair) return;
            const peerPublicKey = await importE2EEPublicKey(data.publicKey);
            session.aesKey = await deriveE2EEAesKey(session.keyPair.privateKey, peerPublicKey);
            session.status = 'active';
            updateE2EEButton(state.allChats[chatId] || state.currentChat);
            addLocalSystemMessage(chatId, t('e2ee.enabled', 'E2EE Chat enabled.'));
            if (state.currentChat?.chatId === chatId) {
                restoreChatStatus(chatId);
            }
        }

        function handleE2EESessionEnd(data) {
            const chatId = data.chatId;
            if (!chatId || !state.e2eeSessions[chatId]) return;
            delete state.e2eeSessions[chatId];
            updateE2EEButton(state.allChats[chatId] || state.currentChat);
            addLocalSystemMessage(chatId, data.reason || t('e2ee.ended', 'E2EE Chat ended.'));
            if (state.currentChat?.chatId === chatId) {
                restoreChatStatus(chatId);
            }
        }

        async function handleIncomingE2EEMessage(msg) {
            const peerId = msg.senderId === state.currentUser.userId ? msg.recipientId : msg.senderId;
            const chatId = msg.chatId || getE2EEChatIdForPeer(peerId);
            const chat = ensurePrivateChatExists(chatId, peerId);
            if (!chat) return;
            const session = state.e2eeSessions[chatId];
            if (!session?.aesKey) {
                addLocalSystemMessage(chatId, t('e2ee.noSessionKey', 'Received a secure message, but no active secure session is available.'));
                return;
            }
            try {
                const plaintext = await decryptE2EEText(session.aesKey, msg.encryptedPayload || {});
                const fullMessage = {
                    messageId: msg.messageId,
                    chatId,
                    senderId: msg.senderId,
                    recipientId: msg.recipientId,
                    content: JSON.stringify({ text: plaintext }),
                    text: plaintext,
                    timestamp: msg.timestamp,
                    seenBy: [],
                    ephemeral: true,
                    e2ee: true,
                };
                chat.messages.push(fullMessage);
                if (state.currentChat?.chatId === chatId) {
                    state.dom.emptyChatPlaceholder.classList.add('hidden');
                    state.dom.emptyChatPlaceholder.classList.remove('flex');
                    ui.renderMessage(fullMessage);
                    state.dom.messagesContainer.scrollTop = state.dom.messagesContainer.scrollHeight;
                } else if (msg.senderId !== state.currentUser.userId) {
                    chat.unreadCount = (chat.unreadCount || 0) + 1;
                }
                updateChatMetadata(chatId);
            } catch (error) {
                console.error('Failed to decrypt E2EE message', error);
                addLocalSystemMessage(chatId, t('e2ee.decryptFailed', 'Failed to decrypt a secure message.'));
            }
        }

        function restoreChatStatus(chatId) {
            if (!state.currentChat || state.currentChat.chatId !== chatId) return;
            state.dom.chatStatus.textContent = getChatStatusText(state.currentChat);
        }

        function updateTypingStatus(chatId) {
            if (state.currentChat?.chatId !== chatId) return;
            const typingNow = state.typingUsers[chatId] ? Object.keys(state.typingUsers[chatId]).filter(uid => uid !== state.currentUser.userId) : [];
            const users = typingNow.map(id => state.allUsers[id]?.username?.split(' ')[0]).filter(Boolean);
            let statusText = '';
            if (users.length > 0) {
                if (users.length === 1) statusText = `${users[0]} is typing...`;
                else if (users.length === 2) statusText = `${users.join(' and ')} are typing...`;
                else statusText = `${users.length} people are typing...`;
                const signature = `${chatId}:${statusText}`;
                if (state.dom.chatStatus.dataset.typingSignature !== signature) {
                    state.dom.chatStatus.textContent = statusText;
                    const indicator = document.createElement('span');
                    indicator.className = 'typing-indicator';
                    indicator.innerHTML = '<span></span><span></span><span></span>';
                    state.dom.chatStatus.appendChild(document.createTextNode(' '));
                    state.dom.chatStatus.appendChild(indicator);
                    state.dom.chatStatus.dataset.typingSignature = signature;
                }
            } else {
                delete state.dom.chatStatus.dataset.typingSignature;
                restoreChatStatus(chatId);
            }
        }

        function checkFullAuthentication() {
            if (state.dataLoaded.user && state.dataLoaded.userList && state.dataLoaded.chats && state.dataLoaded.contacts && !state.isFullyAuthenticated) {
                state.isFullyAuthenticated = true;
                ui.updateUiForAuthState(true);
                ui.showApp();
                ui.renderContactList();
                syncCurrentBanStateUi();
                loadWalletOverview(true).catch((error) => {
                    console.error('Failed to load wallet overview', error);
                });
                if (typeof PushNotificationManager !== 'undefined' && state.currentUser?.userId && state.sessionToken) {
                    PushNotificationManager.syncSubscription(state.currentUser.userId, state.sessionToken).catch((error) => {
                        console.error('Push subscription sync failed', error);
                    });
                }

                changeTitleWithFade(t('brand.appName', 'Noveo'), 100);
            }
        }

        function resetAuthBootstrapState() {
            state.isFullyAuthenticated = false;
            state.authResyncAttempts = 0;
            state.dataLoaded = { user: false, userList: false, chats: false, contacts: false };
            state.currentChat = null;
            state.allUsers = {};
            state.allChats = {};
            state.typingUsers = {};
            state.messagePages = {};
            state.chatHistoryState = {};
            state.userProfiles = {};
            state.walletOverview = null;
            state.lastSidebarListAnimationSignature = '';
            state.chatSearchResults = [];
            state.pendingMessageContextRequests = {};
            state.pendingSearchJump = null;
            state.sidebarSearchMode = 'public';
            state.sidebarSearchChatId = null;
        }

        async function handleSocketMessage(event) {
            if (event.data instanceof ArrayBuffer) {
                console.warn("Ignoring unexpected binary WebSocket payload.");
                return;
            }

            const msg = JSON.parse(event.data);
            const handlers = {
                'login_success': (data) => { 
                    state.reconnectAttempts = 0;
                    if (state.reconnectTimer) {
                        clearTimeout(state.reconnectTimer);
                        state.reconnectTimer = null;
                    }
                    state.authResyncAttempts = 0;
                    ui.setReconnectingState(false);
                    const fallbackToken = data.token || state.sessionToken || normalizeSession(getStorage().loadSession())?.token || '';
                    const fallbackExpiresAt = Number(data.expiresAt || state.sessionExpiresAt || 0);
                    const session = { userId: data.user.userId, token: fallbackToken, sessionId: data.sessionId || '', expiresAt: fallbackExpiresAt };
                    getStorage().saveSession(session);
                    state.sessionToken = session.token || null;
                    state.sessionExpiresAt = Number(session.expiresAt || 0);
                    state.currentUser = data.user; 
                    state.allUsers[data.user.userId] = { ...(state.allUsers[data.user.userId] || {}), ...data.user };
                    enforcePremiumEntitlements();
                    state.PUBLIC_CHAT_ID = data.publicChatId; 
                    loadContacts(true).catch(() => {}).finally(() => {
                        state.dataLoaded.contacts = true;
                        checkFullAuthentication();
                    });
                    ui.showApp();
                    ui.showLoading('Loading chats...');
                    state.dataLoaded.user = true; 
                    setTimeout(() => {
                        if (!state.isFullyAuthenticated && state.socket?.readyState === WebSocket.OPEN && state.authResyncAttempts < 2) {
                            state.authResyncAttempts += 1;
                            state.socket.send(JSON.stringify({ type: 'resync_state' }));
                        }
                    }, 700);
                    setTimeout(() => {
                        if (!state.isFullyAuthenticated && state.socket?.readyState === WebSocket.OPEN && state.authResyncAttempts < 3) {
                            state.authResyncAttempts += 1;
                            state.socket.send(JSON.stringify({ type: 'resync_state' }));
                        }
                    }, 1800);
                    checkFullAuthentication(); 
                },
                'auth_failed': (data) => {
                    getStorage().clearSession();
                    state.sessionToken = null;
                    state.sessionExpiresAt = 0;
                    ui.showAuthScreen();
                    state.dom.authError.textContent = data.message;
                },
                'chat_history': (data) => {
                    processChatHistory(data.chats);
                    state.dataLoaded.chats = true;
                    state.activeVoiceChats = data.activeVoiceChats || {};
                    checkFullAuthentication();
                    if (state.justJoinedChannelId && state.allChats[state.justJoinedChannelId]) {
                        openChat(state.allChats[state.justJoinedChannelId]);
                        state.justJoinedChannelId = null;
                    }
                },
                'user_list_update': (data) => {
                    state.allUsers = {};
                    data.users.forEach(u => {
                        const cachedProfile = state.userProfiles[u.userId] || {};
                        const existingUser = state.allUsers[u.userId] || {};
                        const membershipTier = String(u.membershipTier ?? cachedProfile.membershipTier ?? existingUser.membershipTier ?? '').trim().toLowerCase();
                        state.allUsers[u.userId] = {
                            ...cachedProfile,
                            ...existingUser,
                            ...u,
                            avatarUrl: u.avatarUrl,
                            bio: u.bio || cachedProfile.bio || '',
                            blockGroupInvites: Boolean(u.blockGroupInvites),
                            lastSeen: u.lastSeen ?? cachedProfile.lastSeen ?? existingUser.lastSeen ?? null,
                            contactName: u.contactName || existingUser.contactName || cachedProfile.contactName || '',
                            membershipTier,
                            premiumStarIcon: u.premiumStarIcon ?? existingUser.premiumStarIcon ?? cachedProfile.premiumStarIcon ?? null,
                            isContact: Boolean(u.isContact || existingUser.isContact || cachedProfile.isContact),
                        };
                    });
                    Object.values(state.allUsers).forEach(u => u.online = data.online.includes(u.userId));
                    if (state.currentUser?.userId && state.allUsers[state.currentUser.userId]) {
                        const currentUserProfile = state.allUsers[state.currentUser.userId];
                        state.currentUser = {
                            ...state.currentUser,
                            ...currentUserProfile,
                            membershipTier: resolveBestMembershipTier(state.currentUser.membershipTier, currentUserProfile?.membershipTier),
                            premiumStarIcon: currentUserProfile?.premiumStarIcon ?? state.currentUser.premiumStarIcon ?? null,
                        };
                        if (!state.dom.settingsModal.classList.contains('hidden')) {
                            ui.populateSettingsProfile(state.allUsers[state.currentUser.userId]);
                        }
                    }
                    if (state.activeUserInfoUserId && state.allUsers[state.activeUserInfoUserId] && !state.dom.userInfoModal.classList.contains('hidden')) {
                        ui.openUserInfoModal(state.allUsers[state.activeUserInfoUserId]);
                    }
                    state.dataLoaded.userList = true;
                    if (state.isFullyAuthenticated) ui.renderContactList(); else checkFullAuthentication();
                },
                'presence_update': (data) => {
                    if (state.allUsers[data.userId]) {
                        state.allUsers[data.userId].online = data.online;
                        if (Object.prototype.hasOwnProperty.call(data, 'lastSeen')) {
                            state.allUsers[data.userId].lastSeen = data.lastSeen;
                        }
                        if (state.userProfiles[data.userId]) {
                            state.userProfiles[data.userId] = {
                                ...state.userProfiles[data.userId],
                                online: data.online,
                                lastSeen: Object.prototype.hasOwnProperty.call(data, 'lastSeen')
                                    ? data.lastSeen
                                    : state.userProfiles[data.userId].lastSeen
                            };
                        }
                        if (state.activeUserInfoUserId === data.userId && !state.dom.userInfoModal.classList.contains('hidden')) {
                            ui.openUserInfoModal(state.allUsers[data.userId]);
                        }
                        if (!data.online) {
                            Object.entries(state.e2eeSessions).forEach(([chatId, session]) => {
                                if (session?.recipientId === data.userId) {
                                    delete state.e2eeSessions[chatId];
                                    addLocalSystemMessage(chatId, t('e2ee.endedOffline', 'E2EE Chat ended because the other user went offline.'));
                                }
                            });
                        }
                        ui.renderContactList();
                        if (state.currentChat?.members.includes(data.userId)) openChat(state.currentChat, true);
                    }
                },
                'new_chat_info': (data) => {
                    const incomingChat = data.chat || {};
                    const existingChat = state.allChats[incomingChat.chatId] || {};
                    const peerId = incomingChat.chatType === 'private'
                        ? (incomingChat.members || []).find(id => id !== state.currentUser.userId)
                        : null;
                    const tempChatId = peerId ? `temp_${peerId}` : null;
                    const tempChat = tempChatId ? state.allChats[tempChatId] : null;
                    const mergedMessages = dedupeMessages([
                        ...(Array.isArray(existingChat.messages) ? existingChat.messages : []),
                        ...(Array.isArray(tempChat?.messages) ? tempChat.messages : [])
                    ]);

                    state.allChats[incomingChat.chatId] = {
                        ...existingChat,
                        ...incomingChat,
                        messages: mergedMessages,
                        unreadCount: existingChat.unreadCount || tempChat?.unreadCount || 0,
                        previewOnly: false
                    };
                    trimChatMessages(incomingChat.chatId, incomingChat.chatId === state.currentChat?.chatId ? ACTIVE_CHAT_MESSAGE_LIMIT : INACTIVE_CHAT_MESSAGE_LIMIT);
                    ensureChatHistoryState(incomingChat.chatId, {
                        hasMore: Boolean(incomingChat.hasMoreHistory),
                        loading: false,
                        initialRendered: false,
                        lastRequestedBefore: null
                    });

                    if (tempChatId && tempChatId !== incomingChat.chatId) {
                        delete state.allChats[tempChatId];
                        delete state.chatHistoryState[tempChatId];
                    }

                    ui.renderContactList();
                    if (state.currentChat?.chatId === incomingChat.chatId) {
                        openChat(state.allChats[incomingChat.chatId]);
                    }
                    if (state.justJoinedChannelId === incomingChat.chatId) {
                        openChat(state.allChats[incomingChat.chatId]);
                        state.justJoinedChannelId = null;
                    }
                    if (state.pendingRecipientId && incomingChat.members.includes(state.pendingRecipientId)) {
                        openChat(state.allChats[incomingChat.chatId]);
                        state.pendingRecipientId = null;
                    }
                },
                'message': handleIncomingMessage,
                'e2ee_session_request': handleE2EESessionRequest,
                'e2ee_session_accept': handleE2EESessionAccept,
                'e2ee_session_end': handleE2EESessionEnd,
                'e2ee_message': handleIncomingE2EEMessage,
                'message_updated': handleMessageUpdate,
                'message_deleted': (data) => { removeMessageFromChatState(data.chatId, data.messageId); },
                'message_deleted_local': (data) => { removeMessageFromChatState(data.chatId, data.messageId); },
                'message_seen_update': handleMessageSeenEvent,
                'message_seen': handleMessageSeenEvent,
                'typing': (data) => {
                    const { chatId, senderId } = data; if (!state.currentChat || state.currentChat.chatId !== chatId || senderId === state.currentUser.userId) return;
                    if (!state.typingUsers[chatId]) state.typingUsers[chatId] = {};
                    if (state.typingUsers[chatId][senderId]) clearTimeout(state.typingUsers[chatId][senderId]);
                    state.typingUsers[chatId][senderId] = setTimeout(() => { delete state.typingUsers[chatId][senderId]; updateTypingStatus(chatId); }, 3000);
                    updateTypingStatus(chatId);
                },
                'channel_info': (data) => {
                    const incomingChannel = data.channel || {};
                    const existingChat = state.allChats[incomingChannel.chatId] || {};
                    const isMember = Object.prototype.hasOwnProperty.call(incomingChannel, 'isMember')
                        ? Boolean(incomingChannel.isMember)
                        : (incomingChannel.ownerId === state.currentUser.userId || (incomingChannel.members || []).includes(state.currentUser.userId));
                    const mergedMessages = incomingChannel.messages
                        ? normalizeMessages([
                            ...(Array.isArray(existingChat.messages) ? existingChat.messages : []),
                            ...incomingChannel.messages
                        ])
                        : (Array.isArray(existingChat.messages) ? existingChat.messages : []);
                    state.allChats[incomingChannel.chatId] = {
                        ...existingChat,
                        ...incomingChannel,
                        messages: mergedMessages,
                        previewOnly: !isMember
                    };
                    trimChatMessages(incomingChannel.chatId, incomingChannel.chatId === state.currentChat?.chatId ? ACTIVE_CHAT_MESSAGE_LIMIT : INACTIVE_CHAT_MESSAGE_LIMIT);
                    ensureChatHistoryState(incomingChannel.chatId, {
                        hasMore: Boolean(incomingChannel.hasMoreHistory),
                        loading: false,
                        initialRendered: false,
                        lastRequestedBefore: null
                    });
                    updateChatMetadata(incomingChannel.chatId);
                    openChat(state.allChats[incomingChannel.chatId]);
                    ui.renderContactList();
                },
                'older_messages': (data) => {
                    const chatId = data.chatId;
                    const chat = state.allChats[chatId];
                    if (!chat) return;
                    const olderMessages = normalizeMessages(data.messages || []);
                    chat.messages = normalizeMessages([
                        ...olderMessages,
                        ...(Array.isArray(chat.messages) ? chat.messages : [])
                    ]);
                    ensureChatHistoryState(chatId, {
                        hasMore: Boolean(data.hasMoreHistory),
                        loading: false,
                        initialRendered: true,
                        lastRequestedBefore: null
                    });
                    if (state.currentChat?.chatId === chatId) {
                        const oldScrollHeight = state.dom.messagesContainer.scrollHeight;
                        olderMessages.forEach((msg) => ui.renderMessage(msg, true));
                        state.dom.messagesContainer.scrollTop = state.dom.messagesContainer.scrollHeight - oldScrollHeight;
                    }
                    hideChatLoadingSpinner();
                    state.isLoadingMore = false;
                },
                'chat_message_search_results': (data) => {
                    if (!state.isSidebarSearchActive || state.sidebarSearchMode !== 'chat') return;
                    if (data.chatId !== state.sidebarSearchChatId) return;
                    if (Number(data.requestId) !== Number(state.sidebarSearchRequestId)) return;
                    if (String(data.query || '').trim() !== String(state.sidebarSearchQuery || '').trim()) return;
                    state.chatSearchResults = normalizeMessages(data.messages || []);
                    prepareSidebarListForEnter();
                    renderSidebarSearchResults(state.sidebarSearchQuery, state.chatSearchResults, 'chat');
                    applySidebarListEnterAnimation();
                },
                'message_context': (data) => {
                    const requestId = String(data.requestId || '');
                    const resolver = state.pendingMessageContextRequests[requestId];
                    if (resolver) {
                        delete state.pendingMessageContextRequests[requestId];
                        resolver(data);
                    }
                },
                'chat_updated': (data) => {
                    const chat = state.allChats[data.chatId];
                    if (!chat) return;
                    if (Object.prototype.hasOwnProperty.call(data, 'handle')) chat.handle = data.handle;
                    if (Object.prototype.hasOwnProperty.call(data, 'avatarUrl')) chat.avatarUrl = data.avatarUrl;
                    if (Object.prototype.hasOwnProperty.call(data, 'seenReceiptsEnabled')) chat.seenReceiptsEnabled = Boolean(data.seenReceiptsEnabled);
                    if (Object.prototype.hasOwnProperty.call(data, 'isVerified')) chat.isVerified = Boolean(data.isVerified);
                    if (Object.prototype.hasOwnProperty.call(data, 'ownerId')) chat.ownerId = data.ownerId;
                    if (state.currentChat?.chatId === data.chatId && Object.prototype.hasOwnProperty.call(data, 'avatarUrl')) {
                        state.currentChat.avatarUrl = data.avatarUrl;
                    }
                    if (state.currentChat?.chatId === data.chatId) openChat(chat, true);
                    ui.renderContactList();
                },
                'security_notice_acknowledged': (data) => {
                    const messageId = data.messageId;
                    if (!messageId) return;
                    const button = state.dom.messagesContainer?.querySelector(`[data-action="acknowledge_login"][data-message-id="${CSS.escape(String(messageId))}"]`);
                    if (!button) return;
                    button.disabled = true;
                    button.textContent = t('securityNotice.confirmed', 'Confirmed');
                },
                'member_joined': (data) => { const chat = state.allChats[data.chatId]; if(chat) { chat.members = data.members; if(state.currentChat?.chatId === data.chatId) openChat(chat, true); } },
                'user_left_chat': (data) => {
                    const chat = state.allChats[data.chatId];
                    if (!chat) return;
                    chat.members = Array.isArray(data.members) ? data.members : (chat.members || []).filter(id => id !== data.userId);
                    if (state.currentChat?.chatId === data.chatId) {
                        openChat(chat, true);
                    } else {
                        ui.renderContactList();
                    }
                },
                'sender_messages_deleted': (data) => {
                    const chat = state.allChats[data.chatId];
                    if (!chat || !Array.isArray(chat.messages)) return;
                    chat.messages = chat.messages.filter((message) => message.senderId !== data.senderId);
                    updateChatMetadata(data.chatId);
                    if (state.currentChat?.chatId === data.chatId) {
                        openChat(chat, true);
                    } else {
                        ui.renderContactList();
                    }
                },
                'left_group': (data) => {
                    removeChatLocally(data.chatId);
                    ui.renderContactList();
                    showSuccessModal('Left Chat', `You left ${data.chatName || 'the chat'}.`);
                },
                'removed_from_chat': (data) => {
                    removeChatLocally(data.chatId);
                    ui.renderContactList();
                    showErrorModal('Removed From Chat', 'You were removed from this chat.');
                },
                'chat_deleted': (data) => {
                    removeChatLocally(data.chatId);
                    ui.renderContactList();
                },
                'message_pinned': (data) => {
                    const chat = state.allChats[data.chatId];
                    if (!chat) return;
                    const normalizedPinnedMessage = normalizePinnedMessage(data.message);
                    chat.pinnedMessage = normalizedPinnedMessage;
                    if (state.currentChat?.chatId === data.chatId) {
                        state.currentChat.pinnedMessage = normalizedPinnedMessage;
                        ui.renderPinnedBar(state.currentChat);
                    }
                },
                'message_unpinned': (data) => {
                    const chat = state.allChats[data.chatId];
                    if (!chat) return;
                    chat.pinnedMessage = null;
                    if (state.currentChat?.chatId === data.chatId) {
                        state.currentChat.pinnedMessage = null;
                        ui.renderPinnedBar(state.currentChat);
                    }
                },
                'message_reactions_update': (data) => {
                    applyMessageReactionUpdate(data.chatId, data.messageId, data.reactions || []);
                },
                'error': async (data) => {
                    if (await handleDmCaptchaRequiredError(data.message)) return;
                    showErrorModal('Server Error', data.message);
                    ui.hideLoading();
                },
                'password_changed': (data) => {
                    const current = getValidSession();
                    if (current && data.token && data.expiresAt) {
                        const rotated = {
                            userId: current.userId,
                            token: data.token,
                            sessionId: data.sessionId || current.sessionId || '',
                            expiresAt: Number(data.expiresAt || 0)
                        };
                        getStorage().saveSession(rotated);
                        state.sessionToken = rotated.token;
                        state.sessionExpiresAt = Number(rotated.expiresAt || 0);
                    }
                    ui.closeModal(state.dom.settingsModal);
                    showSuccessModal('Password Changed', data.warning || 'Your password has been changed successfully.');
                },
                'voice_chat_update': (data) => {
                    state.activeVoiceChats = data.activeVoiceChats;
                    if (state.currentVoiceChatId && !state.activeVoiceChats[state.currentVoiceChatId]) {
                        const endedChatId = state.currentVoiceChatId;
                        state.currentVoiceChatId = null;
                        if (state.currentChat?.chatId === endedChatId) {
                            ui.renderVoiceUI(endedChatId);
                        }
                    }
                    getVoiceChatModule()?.handleServerEvent(data);
                    ui.renderContactList();
                    if (state.currentChat) {
                        ui.renderVoiceUI(state.currentChat.chatId);
                    }
                },
                'wallet_updated': async (data) => {
                    updateWalletSummary(data.balanceTenths || 0, data.giftCount || 0);
                    if (!state.dom.walletModal.classList.contains('hidden')) {
                        try {
                            await loadWalletOverview(true);
                        } catch (error) {
                            console.error('Failed to refresh wallet overview', error);
                        }
                    }
                },
                'incoming_call': (data) => {
                    if (state.currentVoiceChatId) return;
                    const voiceChat = getVoiceChatModule();
                    if (voiceChat) voiceChat.handleServerEvent(data);
                    else ui.showIncomingCallModal(data);
                },
                'voice_call_error': (data) => {
                    getVoiceChatModule()?.handleServerEvent(data);
                },
                'voice_call_ended': (data) => {
                    playUiSound('call-denied');
                    getVoiceChatModule()?.handleServerEvent(data);
                },
                'account_ban_state': (data) => {
                    if (!state.currentUser) return;
                    state.currentUser.isBanned = Boolean(data.isBanned);
                    state.currentUser.banReason = data.banReason || '';
                    state.currentUser.bannedAt = data.bannedAt || null;
                    state.currentUser.pardonRequest = data.pardonRequest || null;
                    syncCurrentBanStateUi();
                },
                'user_updated': (data) => {
                    if (state.allUsers[data.userId]) {
                        // selectively update user data
                        const existingUser = state.allUsers[data.userId];
                        const hasContactAlias = Boolean(existingUser.isContact && existingUser.contactName);
                        const nextMembershipTier = String(data.membershipTier ?? '').trim().toLowerCase();
                        existingUser.originalUsername = data.username;
                        existingUser.username = hasContactAlias ? existingUser.contactName : data.username;
                        existingUser.avatarUrl = data.avatarUrl;
                        existingUser.handle = data.handle ?? existingUser.handle ?? '';
                        existingUser.blockGroupInvites = data.blockGroupInvites;
                        existingUser.bio = data.bio ?? existingUser.bio ?? '';
                        existingUser.isVerified = data.isVerified ?? existingUser.isVerified ?? false;
                        existingUser.isBot = data.isBot ?? existingUser.isBot ?? false;
                        existingUser.membershipTier = resolveBestMembershipTier(existingUser.membershipTier, nextMembershipTier);
                        existingUser.nicknameFont = data.nicknameFont ?? existingUser.nicknameFont ?? '';
                        existingUser.profileSkin = data.profileSkin ?? existingUser.profileSkin ?? null;
                        existingUser.premiumStarIcon = data.premiumStarIcon ?? existingUser.premiumStarIcon ?? null;
                        existingUser.languageCode = data.languageCode ?? existingUser.languageCode ?? 'en';
                        if (state.userProfiles[data.userId]) {
                            state.userProfiles[data.userId] = { ...state.userProfiles[data.userId], ...data, username: existingUser.username, originalUsername: existingUser.originalUsername };
                        }
                    }
                    if (state.currentUser?.userId === data.userId) {
                        const nextMembershipTier = String(data.membershipTier ?? '').trim().toLowerCase();
                        state.currentUser = {
                            ...state.currentUser,
                            username: data.username ?? state.currentUser.username,
                            avatarUrl: data.avatarUrl ?? state.currentUser.avatarUrl,
                            handle: data.handle ?? state.currentUser.handle ?? '',
                            blockGroupInvites: data.blockGroupInvites ?? state.currentUser.blockGroupInvites,
                            bio: data.bio ?? state.currentUser.bio ?? '',
                            isVerified: data.isVerified ?? state.currentUser.isVerified ?? false,
                            isBot: data.isBot ?? state.currentUser.isBot ?? false,
                            membershipTier: resolveBestMembershipTier(state.currentUser.membershipTier, nextMembershipTier),
                            nicknameFont: data.nicknameFont ?? state.currentUser.nicknameFont ?? '',
                            profileSkin: data.profileSkin ?? state.currentUser.profileSkin ?? null,
                            premiumStarIcon: data.premiumStarIcon ?? state.currentUser.premiumStarIcon ?? null,
                            languageCode: data.languageCode ?? state.currentUser.languageCode ?? state.currentLanguage
                        };
                        enforcePremiumEntitlements();
                        if (!state.dom.settingsModal.classList.contains('hidden') && state.allUsers[data.userId]) {
                            ui.populateSettingsProfile(state.allUsers[data.userId]);
                        }
                    }
                    if (state.activeUserInfoUserId === data.userId && state.allUsers[data.userId] && !state.dom.userInfoModal.classList.contains('hidden')) {
                        ui.openUserInfoModal(state.allUsers[data.userId]);
                    }
                    if (
                        state.currentChat?.chatType === 'private' &&
                        Array.isArray(state.currentChat.members) &&
                        state.currentChat.members.includes(data.userId)
                    ) {
                        openChat(state.currentChat, true);
                    }
                    ui.renderContactList();
                }
            };
            if (handlers[msg.type]) {
                try {
                    await handlers[msg.type](msg);
                } catch (error) {
                    console.error(`Socket handler failed for ${msg.type}`, error);
                }
            }
        }
        
        function processChatHistory(chats) {
            for (const chatData of chats) {
                const messages = normalizeMessages(chatData.messages);
                const pinnedMessage = normalizePinnedMessage(chatData.pinnedMessage);
                const lastOwnMessageIndex = messages.reduce((lastIndex, message, index) => (
                    message?.senderId === state.currentUser.userId ? index : lastIndex
                ), -1);
                const unreadCount = messages.filter((message, index) => (
                    index > lastOwnMessageIndex &&
                    message?.senderId !== state.currentUser.userId &&
                    !(message?.seenBy?.includes(state.currentUser.userId))
                )).length;
                state.allChats[chatData.chatId] = { ...chatData, messages, pinnedMessage, unreadCount: unreadCount };
                ensureChatHistoryState(chatData.chatId, {
                    hasMore: Boolean(chatData.hasMoreHistory),
                    loading: false,
                    initialRendered: false,
                    lastRequestedBefore: null
                });
                trimChatMessages(chatData.chatId, chatData.chatId === state.currentChat?.chatId ? ACTIVE_CHAT_MESSAGE_LIMIT : INACTIVE_CHAT_MESSAGE_LIMIT);
                updateChatMetadata(chatData.chatId);
            }
        }
        
        function handleIncomingMessage(msg) {
            if (!state.allChats[msg.chatId]) {
                const participants = String(msg.chatId || '').split('_').filter(Boolean);
                if (participants.length === 2 && participants.includes(state.currentUser.userId)) {
                    const peerId = participants[0] === state.currentUser.userId ? participants[1] : participants[0];
                    ensurePrivateChatExists(msg.chatId, peerId);
                }
            }
            if (!state.allChats[msg.chatId]) return;

            // Parse content
            const fullMessage = applyPendingSeenReceipts({ ...msg, ...parseMessageContent(msg.content), seenBy: msg.seenBy || [] });

            // SMOOTH TRANSITION LOGIC
            let isReplacement = false;
            if (msg.senderId === state.currentUser.userId) {
                const messages = state.allChats[msg.chatId].messages;
                const pendingIdx = msg.clientTempId
                    ? messages.findIndex(m => m.pending && m.messageId === msg.clientTempId)
                    : findPendingMessageIndex(messages, fullMessage);

                if (pendingIdx > -1) {
                    const pendingMsg = messages[pendingIdx];
                    isReplacement = true;

                    // 1. Update State: Replace pending object with real object
                    messages[pendingIdx] = fullMessage;

                    // 2. Update DOM In-Place
                    if (state.currentChat?.chatId === msg.chatId) {
                        const el = document.querySelector(`.message-wrapper[data-msg-id="${pendingMsg.messageId}"]`);
                        if (el) {
                            const existingRealEl = document.querySelector(`.message-wrapper[data-msg-id="${msg.messageId}"]`);
                            if (existingRealEl && existingRealEl !== el) {
                                el.remove();
                            } else {
                                el.setAttribute('data-msg-id', msg.messageId);
                                ui.renderMessage(fullMessage);
                            }
                        } else {
                            // Fallback if user scrolled away or DOM missing
                            ui.renderMessage(fullMessage);
                        }
                    }
                }
            }

            if (!isReplacement) {
                state.allChats[msg.chatId].messages.push(fullMessage);
                if (state.currentChat?.chatId === msg.chatId) {
                     const isFirstMessage = state.allChats[msg.chatId].messages.length === 1;
                     if (isFirstMessage) { state.dom.emptyChatPlaceholder.classList.add('hidden'); state.dom.emptyChatPlaceholder.classList.remove('flex'); }

                     ui.renderMessage(fullMessage);

                     if (msg.senderId === state.currentUser.userId || shouldStickChatToBottom(msg.chatId)) {
                         forceScrollChatToBottom(msg.chatId);
                     } else {
                         saveChatScrollPosition(msg.chatId);
                     }

                     if (msg.senderId !== state.currentUser.userId && chatSupportsSeenReceipts(state.allChats[msg.chatId]) && isCurrentChatActivelyVisible()) {
                        state.socket.send(JSON.stringify({ type: 'message_seen', messageId: msg.messageId, chatId: msg.chatId }));
                     }
                } else {
                    if (msg.senderId !== state.currentUser.userId) {
                         state.allChats[msg.chatId].unreadCount = (state.allChats[msg.chatId].unreadCount || 0) + 1;
                         if (!isUserMutedLocally(msg.senderId) && !isChatMutedLocally(msg.chatId) && typeof PushNotificationManager !== 'undefined') {
                            PushNotificationManager.notifyNewMessage(getMessageSenderName(msg, state.allChats[msg.chatId]), msg.content);
                         }
                    }
                }
                if (
                    msg.senderId !== state.currentUser.userId &&
                    !isUserMutedLocally(msg.senderId) &&
                    !isChatMutedLocally(msg.chatId) &&
                    state.currentChat?.chatId === msg.chatId &&
                    state.allChats[msg.chatId]?.chatType === 'private' &&
                    isCurrentChatActivelyVisible()
                ) {
                    playUiSound('message-received');
                }
            }

            trimChatMessages(msg.chatId, state.currentChat?.chatId === msg.chatId ? ACTIVE_CHAT_MESSAGE_LIMIT : INACTIVE_CHAT_MESSAGE_LIMIT);

            updateChatMetadata(msg.chatId);
    }

        function handleMessageUpdate(msg) { const chat = state.allChats[msg.chatId]; if(!chat) return; const msgIndex = chat.messages.findIndex(m => m.messageId === msg.messageId); if(msgIndex > -1) { const updatedMsg = { ...chat.messages[msgIndex], content: msg.newContent, ...parseMessageContent(msg.newContent), editedAt: msg.editedAt }; chat.messages[msgIndex] = updatedMsg; if(state.currentChat?.chatId === msg.chatId) ui.renderMessage(updatedMsg); updateChatMetadata(msg.chatId); } }

        async function onLoginClick() { 
            const username = state.dom.loginUsernameInput.value.trim(), password = state.dom.loginPasswordInput.value; 
            if (!username || !password) { state.dom.authError.textContent = t('auth.usernamePasswordRequired', 'Username and password are required.'); return; }
            state.dom.authError.textContent = '';
            state.dom.loginButton.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>';
            state.dom.loginButton.disabled = true;
            try {
                const captchaToken = await runCaptchaGate('login');
                connect({ type: 'login_with_password', username, password, languageCode: state.currentLanguage || resolvePreferredLanguage(), captchaToken });
            } catch (error) {
                state.dom.authError.textContent = error.message || 'Captcha failed.';
                state.dom.loginButton.innerHTML = t('auth.login', 'Login');
                state.dom.loginButton.disabled = false;
            }
        }
        async function onRegisterClick() {
            const username = state.dom.registerUsernameInput.value.trim(), password = state.dom.registerPasswordInput.value;
            if (!username || !password) { state.dom.authError.textContent = t('auth.usernamePasswordRequired', 'Username and password are required.'); return; }
            if (password.length < PASSWORD_MIN_LENGTH) {
                state.dom.authError.textContent = t('auth.passwordMin', `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`).replace('{min}', PASSWORD_MIN_LENGTH);
                return;
            }
            state.dom.authError.textContent = '';
            state.dom.registerButton.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>';
            state.dom.registerButton.disabled = true;
            try {
                const captchaToken = await runCaptchaGate('register');
                connect({ type: 'register', username, password, languageCode: state.currentLanguage || resolvePreferredLanguage(), captchaToken });
            } catch (error) {
                state.dom.authError.textContent = error.message || 'Captcha failed.';
                state.dom.registerButton.innerHTML = t('auth.register', 'Register');
                state.dom.registerButton.disabled = false;
            }
        }
        
        function openChat(chat, isUpdate = false) {
            if (state.currentChat?.chatId && state.currentChat.chatId !== chat.chatId) {
                trimChatMessages(state.currentChat.chatId, INACTIVE_CHAT_MESSAGE_LIMIT);
                saveChatScrollPosition(state.currentChat.chatId);
            }
            state.currentChat = state.allChats[chat.chatId] || chat; if (!state.currentChat.messages) state.currentChat.messages = [];
            if (state.isSidebarSearchActive && state.sidebarSearchMode === 'chat') {
                state.sidebarSearchChatId = chat.chatId;
                state.chatSearchResults = state.sidebarSearchQuery
                    ? searchMessagesInChat(chat.chatId, state.sidebarSearchQuery)
                    : [];
                if (state.dom.sidebarSearchInput) {
                    state.dom.sidebarSearchInput.placeholder = t('menu.searchMessages', 'Search messages');
                }
                renderSidebarSearchResults(state.sidebarSearchQuery, state.chatSearchResults, 'chat');
            }
            ensureChatHistoryState(chat.chatId, {
                hasMore: state.currentChat.hasMoreHistory ?? state.chatHistoryState[chat.chatId]?.hasMore ?? false,
                loading: false
            });
            if (!isUpdate) {
                delete state.messagePages[chat.chatId];
            }
            if (!isUpdate || typeof state.messagePages[chat.chatId] === 'undefined') {
                state.messagePages[chat.chatId] = 0;
                state.isLoadingMore = false;
            }
            ui.renderContactList();
            if (window.innerWidth < 768) {
                state.dom.mainApp?.classList.add('chat-view-active');
            }
            state.dom.welcomeScreen.classList.add('hidden'); state.dom.chatArea.classList.remove('hidden'); state.dom.chatArea.classList.add('flex');
            state.dom.chatHeaderInfo.classList.remove('cursor-pointer', 'hover:bg-gray-50');
            
            state.dom.chatSearchButton?.classList.remove('hidden');
            state.dom.voiceCallButton.classList.remove('hidden');
            state.dom.voiceCallButton.classList.remove('disabled-interaction');
            updateE2EEButton(state.currentChat);

            let name, status = '', avatar, isChannel = chat.chatType === 'channel';
            const isOwner = chat.ownerId === state.currentUser.userId;
            const isMember = isOwner || chat.members.includes(state.currentUser.userId);
            const isGroupOrChannel = chat.chatType === 'group' || chat.chatType === 'channel';
            state.dom.leaveGroupButton.classList.toggle('hidden', !(isGroupOrChannel && !isOwner));
            if(isChannel) {
                name = chat.chatName; status = tr('chat.memberCount', '{count} members', { count: chat.members.length }); avatar = generateAvatar(name, chat.chatId, chat.avatarUrl, true);
                state.dom.joinChannelButton.textContent = t('chat.joinChannel', 'Join Channel');
                state.dom.joinChannelBar.classList.toggle('hidden', isMember);
                state.dom.joinChannelBar.classList.toggle('flex', !isMember);
                state.dom.messageInputContainer.classList.toggle('hidden', !isOwner);
                state.dom.voiceCallButton.classList.add('disabled-interaction'); // Disable calls in channels
            } else if (chat.chatType === 'group') {
                name = chat.chatName; const onlineCount = chat.members.filter(id => state.allUsers[id]?.online).length;
                status = state.isReconnecting ? t('loading.connecting', 'Connecting...') : tr('chat.membersOnlineCount', '{members} members, {online} online', { members: chat.members.length, online: onlineCount }); avatar = generateAvatar(name, chat.chatId, chat.avatarUrl);
                state.dom.joinChannelButton.textContent = t('chat.joinGroup', 'Join Group');
                state.dom.joinChannelBar.classList.toggle('hidden', isMember);
                state.dom.joinChannelBar.classList.toggle('flex', !isMember);
                state.dom.messageInputContainer.classList.toggle('hidden', !isMember);
            } else if (chat.chatType === 'saved') {
                name = chat.chatName || 'Saved Messages';
                status = t('chat.savedMessagesSub', 'Your personal cloud chat');
                avatar = generateSavedMessagesAvatar();
                state.dom.joinChannelBar.classList.add('hidden');
                state.dom.messageInputContainer.classList.remove('hidden');
                state.dom.voiceCallButton.classList.add('hidden');
            } else { 
                const otherId = chat.members.find(id => id !== state.currentUser.userId), otherUser = state.allUsers[otherId];
                name = getUserDisplayName(otherUser, t('common.unknown', 'Unknown')); status = state.isReconnecting ? t('loading.connecting', 'Connecting...') : getPresenceLabel(otherUser);
                avatar = generateAvatar(name, otherId, otherUser?.avatarUrl);
                state.dom.chatName.innerHTML = renderDisplayName(name, Boolean(otherUser?.isVerified), Boolean(otherUser?.isBot), otherUser?.membershipTier, otherUser?.nicknameFont, otherUser?.premiumStarIcon);
                state.dom.chatHeaderInfo.classList.add('cursor-pointer', 'hover:bg-gray-50');
                state.dom.joinChannelBar.classList.add('hidden'); state.dom.messageInputContainer.classList.remove('hidden');
            }
            if(chat.chatType !== 'private') {
                state.dom.chatName.innerHTML = renderPlainDisplayName(name, Boolean(chat.isVerified));
            }
            initTgsPlayers(state.dom.chatName).catch(() => {});
            state.dom.chatStatus.textContent = getChatStatusText(state.currentChat);
            const e2eeSession = getE2EESession(state.currentChat);
            const e2eeActive = e2eeSession?.status === 'active';
            const bannedLocked = isCurrentUserBanned();
            if (state.currentChat.chatType === 'private') {
                state.dom.fileUploadButton.disabled = e2eeActive || bannedLocked;
                state.dom.stickersButton.disabled = e2eeActive || bannedLocked;
                state.dom.fileUploadButton.classList.toggle('opacity-50', e2eeActive || bannedLocked);
                state.dom.stickersButton.classList.toggle('opacity-50', e2eeActive || bannedLocked);
                state.dom.messageInput.placeholder = bannedLocked
                    ? t('chat.readOnlyBanned', 'Account banned - chats are read only')
                    : (e2eeActive ? t('chat.e2eeMessagePlaceholder', 'E2EE message...') : t('chat.messagePlaceholder', 'Message...'));
            } else {
                state.dom.fileUploadButton.disabled = bannedLocked;
                state.dom.stickersButton.disabled = bannedLocked;
                state.dom.fileUploadButton.classList.toggle('opacity-50', bannedLocked);
                state.dom.stickersButton.classList.toggle('opacity-50', bannedLocked);
                state.dom.messageInput.placeholder = bannedLocked ? t('chat.readOnlyBanned', 'Account banned - chats are read only') : t('chat.messagePlaceholder', 'Message...');
            }
            state.dom.messageInput.disabled = bannedLocked;
            state.dom.sendButton.disabled = bannedLocked;
            state.dom.sendButton.classList.toggle('opacity-50', bannedLocked);
            state.dom.messageInputContainer.classList.toggle('opacity-60', bannedLocked);
            state.dom.messageInputContainer.classList.toggle('pointer-events-none', bannedLocked);
            state.dom.voiceCallButton.classList.toggle('disabled-interaction', bannedLocked || isChannel || state.currentChat.chatType === 'saved');
            if (bannedLocked) {
                state.dom.joinChannelBar.classList.add('hidden');
                state.dom.joinChannelBar.classList.remove('flex');
            }
            state.dom.chatAvatar.style.backgroundImage = `url(${avatar.url})`; state.dom.chatAvatar.style.backgroundColor = avatar.color;
            state.dom.chatAvatar.innerHTML = avatar.initial;
            state.dom.chatAvatar.className = `relative mr-3 w-10 h-10 avatar-circle`;
            renderEmptyChatPlaceholder(state.currentChat);
            if (!isUpdate) {
                delete state.chatScrollPositions[chat.chatId];
                state.typingUsers[chat.chatId] = {};
                showChatLoadingSpinner(true);
                state.historyLoadSuppressedUntil = Date.now() + 1200;
                state.dom.messagesContainer.classList.add('chat-initial-loading');
                state.dom.emptyChatPlaceholder.classList.add('hidden');
                state.dom.emptyChatPlaceholder.classList.remove('flex');
                state.dom.messagesContainer.querySelectorAll('.message-wrapper').forEach(el => {
                    cleanupAnimatedMedia(el);
                    el.remove();
                });
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (state.currentChat?.chatId !== chat.chatId) return;
                        loadMoreMessages(true);
                        flushSeenForCurrentChat();
                        if(state.allChats[chat.chatId]) state.allChats[chat.chatId].unreadCount = 0;
                        state.dom.mainApp.classList.add('chat-view-active');
                    });
                });
            }
            ui.renderPinnedBar(state.currentChat);
            ui.renderVoiceUI(chat.chatId);
            ui.syncFilePreviewVisibility();
            syncComposerUploadProgress();
            getVoiceChatModule()?.handleChatChanged(state.currentChat);
        }
        
        function handleMessageScroll(e) {
            if (!state.currentChat) return;
            const chatId = state.currentChat.chatId;
            if (state.dom.messagesContainer?.classList.contains('chat-initial-loading')) return;
            if (Date.now() < Number(state.historyLoadSuppressedUntil || 0)) return;
            saveChatScrollPosition(chatId);
            const historyState = ensureChatHistoryState(chatId);
            if (state.isLoadingMore || historyState.loading || historyState.hasMore === false) return;
            if (e.target.scrollTop >= 100) return;

            state.isLoadingMore = true;
            historyState.loading = true;
            state.dom.historyLoader.classList.remove('hidden');
            setTimeout(() => {
                if (state.currentChat?.chatId !== chatId) {
                    state.isLoadingMore = false;
                    historyState.loading = false;
                    state.dom.historyLoader.classList.add('hidden');
                    return;
                }
                loadMoreMessages(false);
            }, 150);
        }
        
        function loadMoreMessages(isInitial = false) {
            const chatId = state.currentChat?.chatId;
            const historyState = chatId ? ensureChatHistoryState(chatId) : null;
            if (!chatId) {
                state.isLoadingMore = false;
                hideChatLoadingSpinner();
                return;
            }
            const allMessages = state.allChats[chatId]?.messages || [];
            if (allMessages.length === 0) {
                renderEmptyChatPlaceholder(state.currentChat);
                state.dom.messagesContainer.classList.remove('chat-initial-loading');
                hideChatLoadingSpinner(); state.dom.emptyChatPlaceholder.classList.remove('hidden');
                state.dom.emptyChatPlaceholder.classList.add('flex'); state.isLoadingMore = false; historyState.loading = false; state.messagePages[chatId] = -1; return;
            } else { state.dom.emptyChatPlaceholder.classList.add('hidden'); state.dom.emptyChatPlaceholder.classList.remove('flex'); }
            if (isInitial) {
                state.historyLoadSuppressedUntil = Date.now() + 1200;
                allMessages.forEach(msg => ui.renderMessage(msg));
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (state.currentChat?.chatId !== chatId) return;
                        waitForRenderedChatMedia(chatId).finally(() => {
                            if (state.currentChat?.chatId !== chatId) return;
                            finalizeInitialChatScroll(chatId);
                        });
                    });
                });
                historyState.initialRendered = true;
                historyState.loading = false;
                state.messagePages[chatId] = historyState.hasMore ? 0 : -1;
                return;
            }
            const oldestMessage = getOldestLoadedMessage(chatId);
            if (!oldestMessage || historyState.hasMore === false) {
                historyState.loading = false;
                state.messagePages[chatId] = -1;
                hideChatLoadingSpinner();
                state.isLoadingMore = false;
                return;
            }
            const beforeTimestamp = Number(oldestMessage.timestamp || 0);
            if (!beforeTimestamp || historyState.lastRequestedBefore === beforeTimestamp) {
                historyState.loading = false;
                hideChatLoadingSpinner();
                state.isLoadingMore = false;
                return;
            }
            historyState.lastRequestedBefore = beforeTimestamp;
            state.socket?.send(JSON.stringify({ type: 'load_older_messages', chatId, beforeTimestamp }));
        }
		
		// Stickers functionality
		let stickersCache = null;
        let savedStickersCache = null;
        let savedStickersOwnerId = null;
        let savedStickersLoadPromise = null;

        function normalizeLocalStickerEntry(item) {
            if (typeof item === 'string' && item) return { url: item, type: 'image' };
            if (!item || typeof item !== 'object' || !item.url) return null;
            const stickerMeta = getStickerFileMeta(item);
            return {
                url: String(item.url),
                type: item.type === 'tgs' ? 'tgs' : stickerMeta.stickerType
            };
        }

        function getLocalStickers() {
            try {
                const raw = localStorage.getItem(LOCAL_STICKERS_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(parsed)) return [];
                return parsed.map(normalizeLocalStickerEntry).filter(Boolean);
            } catch (error) {
                console.error('Failed to read local stickers', error);
                return [];
            }
        }

        function setLocalStickers(stickers) {
            try {
                localStorage.setItem(LOCAL_STICKERS_STORAGE_KEY, JSON.stringify(stickers));
            } catch (error) {
                console.error('Failed to store local stickers', error);
            }
        }

        function getSavedStickerEntries() {
            return Array.isArray(savedStickersCache) ? savedStickersCache : getLocalStickers();
        }

        async function syncSavedStickers(forceReload = false) {
            const currentUserId = state.currentUser?.userId || '';
            if (!currentUserId) {
                savedStickersCache = getLocalStickers();
                savedStickersOwnerId = null;
                return savedStickersCache;
            }
            if (savedStickersOwnerId !== currentUserId) {
                savedStickersCache = null;
                savedStickersLoadPromise = null;
                savedStickersOwnerId = currentUserId;
            }
            if (!forceReload && Array.isArray(savedStickersCache)) {
                return savedStickersCache;
            }
            if (!forceReload && savedStickersLoadPromise) {
                return savedStickersLoadPromise;
            }
            savedStickersLoadPromise = (async () => {
                try {
                    const payload = await authenticatedFetch('/user/stickers');
                    let stickers = Array.isArray(payload?.stickers) ? payload.stickers.map(normalizeLocalStickerEntry).filter(Boolean) : [];
                    const localStickers = getLocalStickers();
                    if (localStickers.length) {
                        const merged = [];
                        const seen = new Set();
                        [...localStickers, ...stickers].forEach((entry) => {
                            if (!entry?.url || seen.has(entry.url)) return;
                            seen.add(entry.url);
                            merged.push(entry);
                        });
                        const synced = await authenticatedFetch('/user/stickers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'replace', stickers: merged.slice(0, 120) })
                        });
                        stickers = Array.isArray(synced?.stickers) ? synced.stickers.map(normalizeLocalStickerEntry).filter(Boolean) : merged;
                        setLocalStickers([]);
                    }
                    savedStickersCache = stickers;
                } catch (error) {
                    console.error('Failed to sync saved stickers', error);
                    savedStickersCache = getLocalStickers();
                } finally {
                    savedStickersLoadPromise = null;
                }
                return savedStickersCache;
            })();
            return savedStickersLoadPromise;
        }

        function mergeStickerSources(remoteStickers = []) {
            const merged = [];
            const seen = new Set();
            getSavedStickerEntries().forEach((entry) => {
                if (!entry?.url || seen.has(entry.url)) return;
                seen.add(entry.url);
                merged.push({ ...entry, local: true });
            });
            remoteStickers.forEach((url) => {
                if (typeof url !== 'string' || !url || seen.has(url)) return;
                seen.add(url);
                merged.push({ url, type: isTgsMedia(url) ? 'tgs' : 'image', local: false });
            });
            return merged;
        }

        function isStickerSavableFile(file) {
            if (!file || typeof file !== 'object') return false;
            const url = sanitizeMediaUrl(resolveServerUrl(file.url || ''));
            if (!url) return false;
            const fileType = String(file.type || '').toLowerCase();
            const fileName = String(file.name || '').toLowerCase();
            return fileType === 'image/png'
                || fileType === 'image/gif'
                || fileType === 'image/webp'
                || fileType === 'application/x-tgsticker'
                || fileName.endsWith('.png')
                || fileName.endsWith('.gif')
                || fileName.endsWith('.webp')
                || fileName.endsWith('.tgs');
        }

        function canSaveMessageAsSticker(message) {
            return isStickerSavableFile(message?.file);
        }

        async function saveMessageAsSticker(message) {
            if (!canSaveMessageAsSticker(message)) return;
            const stickerUrl = sanitizeMediaUrl(resolveServerUrl(message.file.url || ''));
            if (!stickerUrl) return;
            const current = await syncSavedStickers();
            if (current.some((entry) => entry.url === stickerUrl)) {
                        showSuccessModal(t('stickers.title', 'Stickers'), t('stickers.alreadySaved', 'That sticker is already saved.'));
                return;
            }
            const next = [{
                url: stickerUrl,
                type: getStickerFileMeta(message.file).stickerType
            }, ...current].slice(0, 120);
            if (state.currentUser?.userId) {
                try {
                    const payload = await authenticatedFetch('/user/stickers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'add', sticker: next[0] })
                    });
                    savedStickersCache = Array.isArray(payload?.stickers) ? payload.stickers.map(normalizeLocalStickerEntry).filter(Boolean) : next;
                    setLocalStickers([]);
                } catch (error) {
                    console.error('Failed to save sticker on server', error);
                    savedStickersCache = next;
                    setLocalStickers(next);
                }
            } else {
                savedStickersCache = next;
                setLocalStickers(next);
            }
            if (stickersCache) {
                displayStickers(mergeStickerSources(stickersCache));
            }
            showSuccessModal(t('stickers.title', 'Stickers'), t('stickers.saved', 'Sticker saved to your account.'));
        }

        async function removeLocalSticker(stickerUrl) {
            const current = await syncSavedStickers();
            const next = current.filter((entry) => entry.url !== stickerUrl);
            if (state.currentUser?.userId) {
                try {
                    const payload = await authenticatedFetch('/user/stickers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'remove', url: stickerUrl })
                    });
                    savedStickersCache = Array.isArray(payload?.stickers) ? payload.stickers.map(normalizeLocalStickerEntry).filter(Boolean) : next;
                    setLocalStickers([]);
                } catch (error) {
                    console.error('Failed to remove sticker from server', error);
                    savedStickersCache = next;
                    setLocalStickers(next);
                }
            } else {
                savedStickersCache = next;
                setLocalStickers(next);
            }
            displayStickers(mergeStickerSources(stickersCache || []));
            showSuccessModal(t('stickers.title', 'Stickers'), t('stickers.removed', 'Sticker removed from your account.'));
        }

		async function loadStickers() {
            await syncSavedStickers();
			if (stickersCache) {
				displayStickers(mergeStickerSources(stickersCache));
				return;
			}
			
			try {
				const response = await fetch('https://noveo.ir/stickers.json');
				if (!response.ok) throw new Error('Failed to fetch stickers');
				const stickers = await response.json();
				stickersCache = Array.isArray(stickers) ? stickers : [];
				displayStickers(mergeStickerSources(stickersCache));
			} catch (error) {
				console.error('Error loading stickers:', error);
				const savedStickers = getSavedStickerEntries();
				if (savedStickers.length) {
					displayStickers(savedStickers);
					return;
				}
				state.dom.stickersGrid.innerHTML = `<div class="col-span-3 text-center app-danger-text py-8"><i class="fas fa-exclamation-triangle text-2xl mb-2"></i><p>${escapeHtml(t('stickers.failedToLoad', 'Failed to load stickers'))}</p></div>`;
			}
		}

		function displayStickers(stickers) {
			if (!Array.isArray(stickers) || stickers.length === 0) {
				state.dom.stickersGrid.innerHTML = `<div class="col-span-3 text-center app-text-muted py-8"><p>${escapeHtml(t('stickers.noneAvailable', 'No stickers available'))}</p></div>`;
				return;
			}
			
			state.dom.stickersGrid.innerHTML = '';
			stickers.forEach((sticker) => {
                const stickerUrl = typeof sticker === 'string' ? sticker : sticker?.url;
                const safeStickerUrl = sanitizeMediaUrl(stickerUrl);
                if (!safeStickerUrl) return;
				const stickerDiv = document.createElement('div');
				stickerDiv.className = 'app-list-row app-list-row-hover cursor-pointer rounded-lg p-1 transition interactive-pop relative';
                if (sticker?.local) {
                    stickerDiv.dataset.localSticker = '1';
                    const badge = document.createElement('div');
                    badge.className = 'absolute top-1 right-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] text-white';
                    badge.textContent = 'L';
                    stickerDiv.appendChild(badge);
                }
                if ((sticker?.type === 'tgs') || isTgsMedia(safeStickerUrl)) {
                    stickerDiv.innerHTML += createTgsMarkup(safeStickerUrl, 'Sticker', 'w-full rounded');
                    initTgsPlayers(stickerDiv).catch(() => {});
                } else {
                    const img = document.createElement('img');
                    img.src = safeStickerUrl;
                    img.alt = 'Sticker';
                    img.className = 'w-full h-auto rounded';
                    img.addEventListener('error', () => {
                        if ((sticker?.type === 'tgs') || isTgsMedia(safeStickerUrl, sticker?.name || '', sticker?.mimeType || '')) {
                            stickerDiv.innerHTML = createTgsMarkup(safeStickerUrl, 'Sticker', 'w-full rounded');
                            initTgsPlayers(stickerDiv).catch(() => {});
                            return;
                        }
                        stickerDiv.classList.add('opacity-50');
                    }, { once: true });
                    stickerDiv.appendChild(img);
                }
				stickerDiv.addEventListener('click', () => sendSticker(typeof sticker === 'string' ? { url: safeStickerUrl } : { ...sticker, url: safeStickerUrl }));
                if (sticker?.local) {
                    let holdTimer = null;
                    const startHold = () => {
                        holdTimer = window.setTimeout(() => {
                            removeLocalSticker(safeStickerUrl);
                        }, 550);
                    };
                    const stopHold = () => {
                        if (holdTimer) {
                            clearTimeout(holdTimer);
                            holdTimer = null;
                        }
                    };
                    stickerDiv.addEventListener('pointerdown', startHold);
                    stickerDiv.addEventListener('pointerup', stopHold);
                    stickerDiv.addEventListener('pointerleave', stopHold);
                    stickerDiv.addEventListener('pointercancel', stopHold);
                    stickerDiv.addEventListener('contextmenu', (event) => {
                        event.preventDefault();
                        stopHold();
                        removeLocalSticker(safeStickerUrl);
                    });
                }
				state.dom.stickersGrid.appendChild(stickerDiv);
			});
		}

		function toggleStickersModal() {
			const isHidden = state.dom.stickersModal.classList.contains('hidden');
			if (isHidden) {
				closeAttachPanels();
				state.dom.stickersModal.classList.remove('hidden');
				if (!stickersCache) {
					loadStickers();
				}
			} else {
				state.dom.stickersModal.classList.add('hidden');
			}
		}

        function closeAttachPanels() {
            state.dom.attachMenuPanel?.classList.add('hidden');
            ui.closeModal(state.dom.pollComposerModal);
        }

        function openAttachMenuPanel() {
            state.dom.stickersModal?.classList.add('hidden');
            ui.closeModal(state.dom.pollComposerModal);
            state.dom.attachMenuPanel?.classList.remove('hidden');
        }

        function addPollOptionInput(value = '') {
            const container = state.dom.pollOptionsContainer;
            if (!container) return;
            const currentInputs = container.querySelectorAll('.poll-option-input');
            if (currentInputs.length >= 6) return;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'poll-option-input w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500';
            input.placeholder = t('polls.optionPlaceholder', 'Option');
            input.value = value;
            container.appendChild(input);
            syncPollComposerMode();
        }

        function syncPollComposerMode() {
            const examMode = Boolean(state.dom.pollExamModeToggle?.checked);
            if (examMode && state.dom.pollAnonymousToggle) {
                state.dom.pollAnonymousToggle.checked = false;
                state.dom.pollAnonymousToggle.disabled = true;
            } else if (state.dom.pollAnonymousToggle) {
                state.dom.pollAnonymousToggle.disabled = false;
            }
            state.dom.pollCorrectOptionRow?.classList.toggle('hidden', !examMode);
            const select = state.dom.pollCorrectOptionSelect;
            if (!select) return;
            const optionInputs = Array.from(state.dom.pollOptionsContainer?.querySelectorAll('.poll-option-input') || []);
            const currentValue = select.value;
            const nextOptions = optionInputs
                .map((input, index) => ({ value: `option-${index + 1}`, text: String(input.value || '').trim() || tr('polls.optionNumber', 'Option {number}', { number: index + 1 }) }))
                .slice(0, 6);
            select.innerHTML = nextOptions.map((option) => `<option value="${escapeAttr(option.value)}">${escapeHtml(option.text)}</option>`).join('');
            if (nextOptions.some((option) => option.value === currentValue)) {
                select.value = currentValue;
            }
        }

        function resetPollComposer() {
            if (state.dom.pollQuestionInput) state.dom.pollQuestionInput.value = '';
            if (state.dom.pollOptionsContainer) {
                const inputs = Array.from(state.dom.pollOptionsContainer.querySelectorAll('.poll-option-input'));
                inputs.forEach((input, index) => {
                    if (index < 2) {
                        input.value = '';
                    } else {
                        input.remove();
                    }
                });
            }
            if (state.dom.pollAnonymousToggle) state.dom.pollAnonymousToggle.checked = false;
            if (state.dom.pollExamModeToggle) state.dom.pollExamModeToggle.checked = false;
            if (state.dom.pollResultsAfterVoteToggle) state.dom.pollResultsAfterVoteToggle.checked = false;
            if (state.dom.pollTimerSelect) state.dom.pollTimerSelect.value = '0';
            syncPollComposerMode();
        }

        function openPollComposerPanel() {
            state.dom.attachMenuPanel?.classList.add('hidden');
            state.dom.stickersModal?.classList.add('hidden');
            syncPollComposerMode();
            ui.openModal(state.dom.pollComposerModal);
            state.dom.pollQuestionInput?.focus();
        }

        async function sendPoll() {
            if (!assertUserNotBanned('send polls')) return;
            if (!state.currentChat || state.socket?.readyState !== WebSocket.OPEN) return;
            const question = String(state.dom.pollQuestionInput?.value || '').trim();
            const optionInputs = Array.from(state.dom.pollOptionsContainer?.querySelectorAll('.poll-option-input') || []);
            const options = optionInputs
                .map((input) => String(input.value || '').trim())
                .filter(Boolean)
                .slice(0, 6)
                .map((text, index) => ({ id: `option-${index + 1}`, text }));
            const examMode = Boolean(state.dom.pollExamModeToggle?.checked);
            const anonymous = examMode ? false : Boolean(state.dom.pollAnonymousToggle?.checked);
            const resultsAfterVote = Boolean(state.dom.pollResultsAfterVoteToggle?.checked);
            const durationSeconds = Math.max(0, Number.parseInt(state.dom.pollTimerSelect?.value || '0', 10) || 0);
            if (!question) {
                showErrorModal(t('polls.title', 'Polls'), t('polls.questionRequired', 'Enter a question for the poll.'));
                return;
            }
            if (options.length < 2) {
                showErrorModal(t('polls.title', 'Polls'), t('polls.optionsRequired', 'Add at least two options.'));
                return;
            }
            let correctOptionId = null;
            if (examMode) {
                correctOptionId = String(state.dom.pollCorrectOptionSelect?.value || '');
                if (!correctOptionId || !options.some((option) => option.id === correctOptionId)) {
                    showErrorModal(t('polls.title', 'Polls'), t('polls.correctAnswerRequired', 'Choose the correct answer for exam mode.'));
                    return;
                }
            }
            const replyId = state.replyingToMessage ? state.replyingToMessage.messageId : null;
            let captchaToken = '';
            let chatId = state.currentChat.chatId;
            let recipientId = null;
            if (chatId.startsWith('temp_')) {
                recipientId = state.currentChat.members.find(id => id !== state.currentUser.userId);
                if (recipientId && !state.allUsers[recipientId]?.isBot) {
                    try {
                        captchaToken = await runCaptchaGate('dm_start', { targetUserId: recipientId });
                    } catch (error) {
                        showErrorModal('Captcha Required', error.message || 'Captcha failed.');
                        return;
                    }
                }
            }
            const content = {
                text: null,
                file: null,
                theme: null,
                poll: { question, options, anonymous, examMode, resultsAfterVote, durationSeconds, correctOptionId }
            };
            const tempId = 'temp-' + Date.now() + Math.random().toString(36).substr(2, 9);
            const tempMsg = {
                messageId: tempId,
                chatId,
                senderId: state.currentUser.userId,
                content: JSON.stringify(content),
                timestamp: Date.now() / 1000,
                pending: true,
                seenBy: [],
                text: null,
                file: null,
                theme: null,
                poll: {
                    question,
                    options: options.map((option) => ({
                        id: option.id,
                        text: option.text,
                        voteCount: 0,
                        percentage: 0,
                        voterIds: [],
                    })),
                    totalVotes: 0,
                    viewerChoiceId: null,
                    anonymous,
                    examMode,
                    resultsAfterVote,
                    correctOptionId: examMode ? correctOptionId : null,
                    canVote: true,
                    canSeeResults: !resultsAfterVote,
                    canViewVotes: false,
                    expiresAt: durationSeconds > 0 ? Math.floor(Date.now() / 1000) + durationSeconds : null,
                    isExpired: false,
                },
                replyToId: replyId
            };
            if (state.allChats[chatId]) {
                state.allChats[chatId].messages.push(tempMsg);
            }
            if (state.currentChat?.chatId === chatId) {
                hideEmptyChatPlaceholder();
                ui.renderMessage(tempMsg);
                forceScrollChatToBottom(chatId);
            }
            let payload = {
                type: 'message',
                content,
                chatId,
                replyToId: replyId,
                clientTempId: tempId
            };
            if (chatId.startsWith('temp_')) {
                payload.recipientId = recipientId;
                state.pendingRecipientId = recipientId;
                if (captchaToken) payload.captchaToken = captchaToken;
                delete payload.chatId;
            }
            closeAttachPanels();
            resetPollComposer();
            if (typeof cancelReplyMode === 'function') cancelReplyMode();
            state.socket.send(JSON.stringify(payload));
        }

        async function sendSticker(stickerInput) {
		  if (!assertUserNotBanned('send messages')) return;
		  if (!state.currentChat || state.socket?.readyState !== WebSocket.OPEN) return;

		  // Close the stickers modal
		  state.dom.stickersModal?.classList.add('hidden');

		  // Keep the reply target for THIS sticker message, but exit reply mode right after sending (like sendMessage does)
		  const replyId = state.replyingToMessage ? state.replyingToMessage.messageId : null;

		  // Send using the same "content" shape used by sendMessage
		  const stickerFileMeta = getStickerFileMeta(stickerInput);
		  if (!stickerFileMeta.url) return;
		  const stickerFile = { url: stickerFileMeta.url, name: stickerFileMeta.name, type: stickerFileMeta.type };
          let captchaToken = '';
          let chatId = state.currentChat.chatId;
          let recipientId = null;
          if (chatId.startsWith('temp_')) {
            recipientId = state.currentChat.members.find(id => id !== state.currentUser.userId);
            if (recipientId && !state.allUsers[recipientId]?.isBot) {
                try {
                    captchaToken = await runCaptchaGate('dm_start', { targetUserId: recipientId });
                } catch (error) {
                    showErrorModal('Captcha Required', error.message || 'Captcha failed.');
                    return;
                }
            }
          }
		  const payload = {
			type: 'message',
			content: { text: null, file: stickerFile, theme: null },
			chatId,
			replyToId: replyId,
		  };
          if (chatId.startsWith('temp_')) {
            payload.recipientId = recipientId;
            if (captchaToken) payload.captchaToken = captchaToken;
            delete payload.chatId;
            state.pendingRecipientId = recipientId;
          }

          hideEmptyChatPlaceholder();
		  state.socket.send(JSON.stringify(payload));

		  // IMPORTANT: fully leave reply mode (clears inline styles too)
		  if (typeof cancelReplyMode === 'function') {
			cancelReplyMode();
		  } else {
			// Fallback (in case cancelReplyMode isn't in scope for some reason)
			state.replyingToMessage = null;
			if (state.dom.replyPreviewContainer) {
			  state.dom.replyPreviewContainer.classList.add('hidden');
			  state.dom.replyPreviewContainer.style.display = '';
			  state.dom.replyPreviewContainer.style.zIndex = '';
			}
		  }

		  state.dom.messageInput?.focus?.();
		}


        async function sendMessage(forcedText = null) {
            if (!assertUserNotBanned('send messages')) return;
            const currentChatAttachment = state.attachedFileChatId === state.currentChat?.chatId ? state.attachedFile : null;
            const text = (forcedText == null ? state.dom.messageInput.value : String(forcedText)).trim(), file = currentChatAttachment;
            if ((!text && !file) || !state.currentChat || state.socket?.readyState !== WebSocket.OPEN) return;
            if (!file && isEmailBotChat(state.currentChat) && text.toLowerCase() === '/send') {
                state.dom.messageInput.value = '';
                state.dom.messageInput.style.height = 'auto';
                openEmailComposerModal();
                return;
            }
            const sendingChat = state.currentChat;
            const sendingChatId = sendingChat.chatId;
            const replyId = state.replyingToMessage ? state.replyingToMessage.messageId : null;
            let captchaToken = '';
            hideEmptyChatPlaceholder();
            if (state.currentChat.chatType === 'private') {
                const peerId = getPrivateChatPeerId(state.currentChat);
                if (peerId) {
                    canonicalizePrivateChat(state.currentChat, peerId);
                }
            }
            const e2eeSession = getE2EESession(state.currentChat);
            if (e2eeSession?.status === 'active') {
                if (file) {
                    showErrorModal('E2EE Text Only', 'E2EE Chat currently supports text messages only.');
                    return;
                }
                try {
                    const encryptedPayload = await encryptE2EEText(e2eeSession.aesKey, text);
                    const messageId = `e2ee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const timestamp = Math.floor(Date.now() / 1000);
                    const recipientId = e2eeSession.recipientId || getPrivateChatPeerId(sendingChat);
                    const tempMsg = {
                        messageId,
                        chatId: sendingChatId,
                        senderId: state.currentUser.userId,
                        recipientId,
                        content: JSON.stringify({ text }),
                        text,
                        timestamp,
                        pending: false,
                        seenBy: [],
                        ephemeral: true,
                        e2ee: true,
                    };
                    if (state.allChats[sendingChatId]) {
                        state.allChats[sendingChatId].messages.push(tempMsg);
                    }
                    if (state.currentChat?.chatId === sendingChatId) {
                        hideEmptyChatPlaceholder();
                        ui.renderMessage(tempMsg);
                        forceScrollChatToBottom(sendingChatId);
                    }
                    state.socket.send(JSON.stringify({
                        type: 'e2ee_message',
                        chatId: sendingChatId,
                        recipientId,
                        messageId,
                        timestamp,
                        encryptedPayload,
                    }));
                    state.dom.messageInput.value = '';
                    state.dom.messageInput.style.height = 'auto';
                    updateChatMetadata(sendingChatId);
                    state.dom.messageInput.focus();
                    return;
                } catch (error) {
                    console.error('Failed to send E2EE message', error);
                    showErrorModal('E2EE Error', 'Failed to encrypt the message.');
                    return;
                }
            }

            if (sendingChatId.startsWith('temp_')) {
                const recipientId = sendingChat.members.find(id => id !== state.currentUser.userId);
                if (recipientId && !state.allUsers[recipientId]?.isBot) {
                    try {
                        captchaToken = await runCaptchaGate('dm_start', { targetUserId: recipientId });
                    } catch (error) {
                        showErrorModal('Captcha Required', error.message || 'Captcha failed.');
                        return;
                    }
                }
            }

            // 1. Prepare Content Object
            let content = { text: text || null, file: null, theme: null };
            if (file && state.attachedFile === file && state.attachedFileChatId === sendingChatId) {
                ui.hideFilePreview();
            }

            // Handle File (Keep original logic)
            if (file) {
                try {
                    const fileInfo = await uploadFile(file, '/upload/file', {
                        chatId: sendingChatId,
                        showComposerProgress: true
                    });
                    if (!fileInfo) return;
                    content.file = fileInfo.file;
                    if (content.file && isVoiceRecorderFileName(file.name)) {
                        content.file.name = 'Voice Message';
                    }
                } catch (error) {
                    showErrorModal('Upload Failed', error.message || 'File upload failed.');
                    return;
                }
            }

            // 2. Create Optimistic Message
            const tempId = 'temp-' + Date.now() + Math.random().toString(36).substr(2, 9);

            const tempMsg = {
                messageId: tempId,
                chatId: sendingChatId,
                senderId: state.currentUser.userId,
                content: JSON.stringify(content), // Store as string
                timestamp: Date.now() / 1000,
                pending: true,
                seenBy: [],
                // Unpacked fields for renderer:
                text: content.text,
                file: content.file,
                theme: content.theme,
                replyToId: replyId
            };

            // 3. Render Immediately
            if (state.allChats[sendingChatId]) {
                state.allChats[sendingChatId].messages.push(tempMsg);
            }
            if (state.currentChat?.chatId === sendingChatId) {
                hideEmptyChatPlaceholder();
                ui.renderMessage(tempMsg);
                forceScrollChatToBottom(sendingChatId);
            }

            // 4. Reset UI
            state.dom.messageInput.value = '';
            state.dom.messageInput.style.height = 'auto';
            if (state.attachedFile === file) ui.hideFilePreview();
            
            // Update send button icon back to microphone
            if (window.voiceRecorder && window.voiceRecorder.updateButtonIcon) {
                window.voiceRecorder.updateButtonIcon();
            }

            // 5. Send to Network
            let payload = { 
                type: 'message', 
                content: content, // Original: sends object
                chatId: sendingChatId, 
                replyToId: replyId,
                clientTempId: tempId
            };

            if (sendingChatId.startsWith('temp_')) { 
                const recipientId = sendingChat.members.find(id => id !== state.currentUser.userId); 
                payload.recipientId = recipientId; 
                state.pendingRecipientId = recipientId; 
                if (captchaToken) payload.captchaToken = captchaToken;
                delete payload.chatId; 
            }

            state.socket.send(JSON.stringify(payload));
            playUiSound('message-sent');

            // 6. Cleanup
            if (typeof cancelReplyMode === 'function') {
                cancelReplyMode();
            } else {
                state.replyingToMessage = null; 
                if (state.dom.replyPreviewContainer) state.dom.replyPreviewContainer.classList.add('hidden');
            }
            state.dom.messageInput.focus();
        }
        
		function enterReplyMode(message) {
			if (!message) return;
			state.replyingToMessage = message; 

			const senderName = getMessageSenderName(message, state.currentChat);
            const sender = message?.senderId ? state.allUsers[message.senderId] : null;

			// Set username with proper tag rendering (FIX #3)
			const replyIsVerified = state.currentChat?.chatType !== 'private'
				? isMessageSenderVerified(message, state.currentChat)
				: Boolean(state.currentChat?.otherUserId && state.allUsers[state.currentChat.otherUserId]?.isVerified);
			state.dom.replyPreviewUsername.innerHTML = renderDisplayName(senderName, replyIsVerified, Boolean(sender?.isBot), sender?.membershipTier, sender?.nicknameFont, sender?.premiumStarIcon);

			// Set message preview content
			let previewText = '';
			if (message.file) {
				previewText = `<i class="fas fa-paperclip"></i> ${escapeHtml(message.file.name || 'File')}`;
			} else if (message.text) {
				const safeText = escapeHtml(message.text);
				previewText = safeText;
			} else {
				previewText = 'Media message';
			}

			state.dom.replyPreviewText.innerHTML = previewText;

			// Force show container
			if (state.dom.replyPreviewContainer) {
				state.dom.replyPreviewContainer.classList.remove('hidden');
				state.dom.replyPreviewContainer.style.display = 'block';
				state.dom.replyPreviewContainer.style.zIndex = '50';
			}

			if (state.dom.messageInput) state.dom.messageInput.focus();

			console.log('Reply mode entered for:', senderName);
		}

		function cancelReplyMode() { 
			state.replyingToMessage = null; 
			if (state.dom.replyPreviewContainer) {
				state.dom.replyPreviewContainer.classList.add('hidden');
				// Clear inline styles added by enterReplyMode
				state.dom.replyPreviewContainer.style.display = '';
				state.dom.replyPreviewContainer.style.zIndex = '';
			}
		}

        function resetAvatarEditorState() {
            const editor = state.avatarEditor;
            if (editor.objectUrl) {
                URL.revokeObjectURL(editor.objectUrl);
            }
            state.avatarEditor = {
                file: null,
                image: null,
                objectUrl: '',
                rotation: 0,
                zoom: 1,
                offsetX: 0,
                offsetY: 0,
                baseScale: 1,
                referenceCropSize: 0,
                cropX: 0,
                cropY: 0,
                cropSize: 0,
                cropRotation: 0,
                minCropSize: 120,
                pointerId: null,
                activePointers: {},
                interactionMode: '',
                resizeHandle: '',
                pointerStartX: 0,
                pointerStartY: 0,
                startRotation: 0,
                gestureStartAngle: 0,
                startOffsetX: 0,
                startOffsetY: 0,
                startCropX: 0,
                startCropY: 0,
                startCropSize: 0,
                saving: false
            };
            if (state.dom.avatarEditorImage) {
                state.dom.avatarEditorImage.removeAttribute('src');
                state.dom.avatarEditorImage.style.width = '';
                state.dom.avatarEditorImage.style.height = '';
                state.dom.avatarEditorImage.style.transform = '';
            }
            if (state.dom.avatarEditorViewport) {
                state.dom.avatarEditorViewport.classList.remove('is-dragging-image', 'is-dragging-crop');
            }
            if (state.dom.avatarEditorCropBox) {
                state.dom.avatarEditorCropBox.style.left = '';
                state.dom.avatarEditorCropBox.style.top = '';
                state.dom.avatarEditorCropBox.style.width = '';
                state.dom.avatarEditorCropBox.style.height = '';
            }
            if (state.dom.avatarEditorZoom) {
                state.dom.avatarEditorZoom.value = '1';
            }
            if (state.dom.saveAvatarEditorButton) {
                state.dom.saveAvatarEditorButton.disabled = false;
            }
            setAvatarEditorUploading(false);
        }

        function setAvatarEditorUploading(isUploading, percent = 0) {
            const container = state.dom.avatarEditorUploadProgressContainer;
            const bar = state.dom.avatarEditorUploadProgressBar;
            const text = state.dom.avatarEditorUploadProgressText;
            if (container) {
                container.classList.toggle('hidden', !isUploading);
            }
            if (bar) {
                bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
            }
            if (text) {
                const rounded = Math.round(percent);
                text.textContent = isUploading
                    ? tr('profile.uploadingPhotoProgress', 'Uploading photo... {percent}%', { percent: rounded })
                    : t('profile.uploadingPhoto', 'Uploading photo...');
            }
        }

        function syncComposerUploadProgress() {
            const currentChatId = state.currentChat?.chatId || null;
            const shouldShow = Boolean(
                state.composerUpload.requestId &&
                state.composerUpload.chatId &&
                currentChatId === state.composerUpload.chatId
            );
            state.dom.uploadProgressContainer.classList.toggle('hidden', !shouldShow);
            state.dom.uploadProgressBar.style.width = shouldShow
                ? `${Math.max(0, Math.min(100, state.composerUpload.percent || 0))}%`
                : '0%';
        }

        function beginComposerUpload(chatId) {
            const requestId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            state.composerUpload = { requestId, chatId: chatId || null, percent: 0 };
            syncComposerUploadProgress();
            return requestId;
        }

        function updateComposerUploadProgress(requestId, percent) {
            if (!requestId || state.composerUpload.requestId !== requestId) return;
            const boundedPercent = Math.max(0, Math.min(100, Math.round(percent)));
            state.composerUpload.percent = Math.max(state.composerUpload.percent || 0, boundedPercent);
            syncComposerUploadProgress();
        }

        function endComposerUpload(requestId, finalPercent = 100) {
            if (!requestId || state.composerUpload.requestId !== requestId) return;
            updateComposerUploadProgress(requestId, finalPercent);
            window.setTimeout(() => {
                if (state.composerUpload.requestId !== requestId) return;
                state.composerUpload = { requestId: '', chatId: null, percent: 0 };
                syncComposerUploadProgress();
            }, 500);
        }

        function getAvatarEditorViewportMetrics() {
            const viewport = state.dom.avatarEditorViewport;
            return viewport ? { width: viewport.clientWidth || 0, height: viewport.clientHeight || 0 } : { width: 0, height: 0 };
        }

        function getAvatarEditorRotatedDimensions() {
            const image = state.avatarEditor.image;
            if (!image) return { width: 0, height: 0 };
            const turns = Math.abs((state.avatarEditor.rotation / 90) % 2);
            if (turns === 1) {
                return { width: image.naturalHeight, height: image.naturalWidth };
            }
            return { width: image.naturalWidth, height: image.naturalHeight };
        }

        function getAvatarEditorActualScale() {
            return state.avatarEditor.baseScale * state.avatarEditor.zoom;
        }

        function ensureAvatarEditorCoverage(rotated = getAvatarEditorRotatedDimensions()) {
            if (!rotated.width || !rotated.height || !state.avatarEditor.baseScale) return;
            const minimumZoom = Math.max(
                state.avatarEditor.cropSize / (rotated.width * state.avatarEditor.baseScale),
                state.avatarEditor.cropSize / (rotated.height * state.avatarEditor.baseScale),
                1
            );
            if (state.avatarEditor.zoom < minimumZoom) {
                state.avatarEditor.zoom = minimumZoom;
                if (state.dom.avatarEditorZoom) {
                    state.dom.avatarEditorZoom.value = String(Math.min(3, minimumZoom));
                }
            }
        }

        function initializeAvatarEditorCropBox() {
            const viewport = getAvatarEditorViewportMetrics();
            if (!viewport.width || !viewport.height) return;
            const defaultSize = Math.round(Math.min(viewport.width, viewport.height) * 0.72);
            state.avatarEditor.minCropSize = Math.max(96, Math.round(Math.min(viewport.width, viewport.height) * 0.32));
            state.avatarEditor.referenceCropSize = defaultSize;
            state.avatarEditor.cropSize = defaultSize;
            state.avatarEditor.cropX = Math.round((viewport.width - defaultSize) / 2);
            state.avatarEditor.cropY = Math.round((viewport.height - defaultSize) / 2);
        }

        function clampAvatarEditorCropBox() {
            const viewport = getAvatarEditorViewportMetrics();
            if (!viewport.width || !viewport.height) return;
            const maxSize = Math.min(viewport.width, viewport.height);
            state.avatarEditor.cropSize = Math.max(state.avatarEditor.minCropSize, Math.min(maxSize, state.avatarEditor.cropSize));
            state.avatarEditor.cropX = Math.max(0, Math.min(viewport.width - state.avatarEditor.cropSize, state.avatarEditor.cropX));
            state.avatarEditor.cropY = Math.max(0, Math.min(viewport.height - state.avatarEditor.cropSize, state.avatarEditor.cropY));
        }

        function resizeAvatarEditorCropBox(dx, dy, handle) {
            const viewport = getAvatarEditorViewportMetrics();
            if (!viewport.width || !viewport.height) return;
            const startX = state.avatarEditor.startCropX;
            const startY = state.avatarEditor.startCropY;
            const startSize = state.avatarEditor.startCropSize;
            const right = startX + startSize;
            const bottom = startY + startSize;
            if (handle === 'se') {
                const nextSize = Math.max(state.avatarEditor.minCropSize, Math.max(startSize + dx, startSize + dy));
                state.avatarEditor.cropX = startX;
                state.avatarEditor.cropY = startY;
                state.avatarEditor.cropSize = Math.min(nextSize, viewport.width - startX, viewport.height - startY);
                return;
            }
            if (handle === 'nw') {
                const nextSize = Math.max(state.avatarEditor.minCropSize, Math.max(startSize - dx, startSize - dy));
                state.avatarEditor.cropSize = Math.min(nextSize, right, bottom);
                state.avatarEditor.cropX = right - state.avatarEditor.cropSize;
                state.avatarEditor.cropY = bottom - state.avatarEditor.cropSize;
                return;
            }
            if (handle === 'ne') {
                const nextSize = Math.max(state.avatarEditor.minCropSize, Math.max(startSize + dx, startSize - dy));
                state.avatarEditor.cropSize = Math.min(nextSize, viewport.width - startX, bottom);
                state.avatarEditor.cropX = startX;
                state.avatarEditor.cropY = bottom - state.avatarEditor.cropSize;
                return;
            }
            if (handle === 'sw') {
                const nextSize = Math.max(state.avatarEditor.minCropSize, Math.max(startSize - dx, startSize + dy));
                state.avatarEditor.cropSize = Math.min(nextSize, right, viewport.height - startY);
                state.avatarEditor.cropX = right - state.avatarEditor.cropSize;
                state.avatarEditor.cropY = startY;
            }
        }

        function getAvatarEditorGestureAngle() {
            const points = Object.values(state.avatarEditor.activePointers);
            if (points.length < 2) return 0;
            const [a, b] = points;
            return Math.atan2(b.y - a.y, b.x - a.x);
        }

        function rotateAvatarEditorCropGesture() {
            if (Object.keys(state.avatarEditor.activePointers).length < 2) return;
            const currentAngle = getAvatarEditorGestureAngle();
            state.avatarEditor.cropRotation = state.avatarEditor.startRotation + (currentAngle - state.avatarEditor.gestureStartAngle);
        }

        function clampAvatarEditorOffsets() {
            const viewport = getAvatarEditorViewportMetrics();
            if (!viewport.width || !viewport.height || !state.avatarEditor.image) return;
            const rotated = getAvatarEditorRotatedDimensions();
            const actualScale = getAvatarEditorActualScale();
            const visibleWidth = rotated.width * actualScale;
            const visibleHeight = rotated.height * actualScale;
            const cropLeft = state.avatarEditor.cropX;
            const cropTop = state.avatarEditor.cropY;
            const cropRight = cropLeft + state.avatarEditor.cropSize;
            const cropBottom = cropTop + state.avatarEditor.cropSize;
            const minOffsetX = cropRight - (viewport.width / 2) - (visibleWidth / 2);
            const maxOffsetX = cropLeft - (viewport.width / 2) + (visibleWidth / 2);
            const minOffsetY = cropBottom - (viewport.height / 2) - (visibleHeight / 2);
            const maxOffsetY = cropTop - (viewport.height / 2) + (visibleHeight / 2);
            state.avatarEditor.offsetX = Math.min(maxOffsetX, Math.max(minOffsetX, state.avatarEditor.offsetX));
            state.avatarEditor.offsetY = Math.min(maxOffsetY, Math.max(minOffsetY, state.avatarEditor.offsetY));
        }

        function syncAvatarEditorCropBox() {
            if (!state.dom.avatarEditorCropBox) return;
            state.dom.avatarEditorCropBox.style.left = `${state.avatarEditor.cropX}px`;
            state.dom.avatarEditorCropBox.style.top = `${state.avatarEditor.cropY}px`;
            state.dom.avatarEditorCropBox.style.width = `${state.avatarEditor.cropSize}px`;
            state.dom.avatarEditorCropBox.style.height = `${state.avatarEditor.cropSize}px`;
            state.dom.avatarEditorCropBox.style.transform = `rotate(${state.avatarEditor.cropRotation}rad)`;
        }

        function endAvatarEditorPointerInteraction(pointerId = null) {
            if (pointerId !== null) {
                state.dom.avatarEditorViewport?.releasePointerCapture?.(pointerId);
            }
            state.avatarEditor.pointerId = null;
            state.avatarEditor.activePointers = {};
            state.avatarEditor.interactionMode = '';
            state.avatarEditor.resizeHandle = '';
            state.dom.avatarEditorViewport?.classList.remove('is-dragging-image', 'is-dragging-crop');
        }

        function syncAvatarEditorPreview() {
            const imageEl = state.dom.avatarEditorImage;
            const viewport = getAvatarEditorViewportMetrics();
            const image = state.avatarEditor.image;
            if (!imageEl || !image || !viewport.width || !viewport.height) return;
            clampAvatarEditorCropBox();
            const rotated = getAvatarEditorRotatedDimensions();
            const referenceCropSize = state.avatarEditor.referenceCropSize || state.avatarEditor.cropSize;
            state.avatarEditor.baseScale = Math.max(referenceCropSize / rotated.width, referenceCropSize / rotated.height);
            ensureAvatarEditorCoverage(rotated);
            clampAvatarEditorOffsets();
            const actualScale = getAvatarEditorActualScale();
            imageEl.style.width = `${image.naturalWidth}px`;
            imageEl.style.height = `${image.naturalHeight}px`;
            imageEl.style.transform = `translate(-50%, -50%) translate(${state.avatarEditor.offsetX}px, ${state.avatarEditor.offsetY}px) rotate(${state.avatarEditor.rotation}deg) scale(${actualScale})`;
            syncAvatarEditorCropBox();
        }

        function closeAvatarEditor() {
            if (state.avatarEditor.saving) return;
            ui.closeModal(state.dom.avatarEditorModal);
            resetAvatarEditorState();
            if (state.dom.avatarInput) {
                state.dom.avatarInput.value = '';
            }
        }

        async function openAvatarEditor(file) {
            if (!file || !file.type.startsWith('image/')) {
                throw new Error(t('profile.avatarImageOnly', 'Please choose an image file.'));
            }
            resetAvatarEditorState();
            const objectUrl = URL.createObjectURL(file);
            const image = new Image();
            image.decoding = 'async';
            await new Promise((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error(t('profile.avatarLoadFailed', 'Failed to load that image.')));
                image.src = objectUrl;
            });
            state.avatarEditor.file = file;
            state.avatarEditor.image = image;
            state.avatarEditor.objectUrl = objectUrl;
            if (state.dom.avatarEditorImage) {
                state.dom.avatarEditorImage.src = objectUrl;
            }
            if (state.dom.avatarEditorZoom) {
                state.dom.avatarEditorZoom.value = '1';
            }
            ui.openModal(state.dom.avatarEditorModal);
            requestAnimationFrame(() => {
                initializeAvatarEditorCropBox();
                syncAvatarEditorPreview();
            });
        }

        async function exportAvatarEditorFile() {
            const image = state.avatarEditor.image;
            if (!image) throw new Error(t('profile.avatarLoadFailed', 'Failed to load that image.'));
            const viewport = getAvatarEditorViewportMetrics();
            const cropSize = state.avatarEditor.cropSize || 320;
            const cropCenterX = state.avatarEditor.cropX + (cropSize / 2);
            const cropCenterY = state.avatarEditor.cropY + (cropSize / 2);
            const preferredSize = cropSize >= 420 ? 1024 : 768;
            const exportSize = preferredSize;
            const factor = exportSize / cropSize;
            const canvas = document.createElement('canvas');
            canvas.width = exportSize;
            canvas.height = exportSize;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error(t('profile.avatarExportFailed', 'Failed to prepare your profile photo.'));
            ctx.clearRect(0, 0, exportSize, exportSize);
            const relativeImageCenterX = (viewport.width / 2) + state.avatarEditor.offsetX - cropCenterX;
            const relativeImageCenterY = (viewport.height / 2) + state.avatarEditor.offsetY - cropCenterY;
            ctx.translate((exportSize / 2) + (relativeImageCenterX * factor), (exportSize / 2) + (relativeImageCenterY * factor));
            ctx.rotate(state.avatarEditor.cropRotation);
            if (state.avatarEditor.rotation) {
                ctx.rotate((state.avatarEditor.rotation * Math.PI) / 180);
            }
            const actualScale = getAvatarEditorActualScale() * factor;
            ctx.scale(actualScale, actualScale);
            ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2, image.naturalWidth, image.naturalHeight);
            const attempts = [
                { type: 'image/jpeg', quality: 0.88 },
                { type: 'image/jpeg', quality: 0.8 },
                { type: 'image/jpeg', quality: 0.72 }
            ];
            let blob = null;
            for (const attempt of attempts) {
                blob = await new Promise((resolve, reject) => {
                    canvas.toBlob((value) => {
                        if (value) resolve(value);
                        else reject(new Error(t('profile.avatarExportFailed', 'Failed to prepare your profile photo.')));
                    }, attempt.type, attempt.quality);
                });
                if (blob.size <= 700 * 1024) break;
            }
            if (!blob) {
                throw new Error(t('profile.avatarExportFailed', 'Failed to prepare your profile photo.'));
            }
            return new File([blob], `avatar-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        }

        async function saveAvatarEditor() {
            if (state.avatarEditor.saving) return;
            state.avatarEditor.saving = true;
            if (state.dom.saveAvatarEditorButton) {
                state.dom.saveAvatarEditorButton.disabled = true;
            }
            try {
                const file = await exportAvatarEditorFile();
                setAvatarEditorUploading(true, 0);
                await uploadFile(file, '/upload/avatar', {
                    onProgress: (percent) => setAvatarEditorUploading(true, percent)
                });
                ui.closeModal(state.dom.avatarEditorModal);
                resetAvatarEditorState();
                if (state.dom.avatarInput) {
                    state.dom.avatarInput.value = '';
                }
            } catch (error) {
                setAvatarEditorUploading(false);
                showErrorModal(t('profile.avatarUploadFailedTitle', 'Upload Failed'), error.message || t('profile.avatarUploadFailedBody', 'Avatar upload failed.'));
            } finally {
                state.avatarEditor.saving = false;
                if (state.dom.saveAvatarEditorButton) {
                    state.dom.saveAvatarEditorButton.disabled = false;
                }
            }
        }

        async function handleAvatarSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            try {
                await openAvatarEditor(file);
            } catch (error) {
                resetAvatarEditorState();
                if (state.dom.avatarInput) {
                    state.dom.avatarInput.value = '';
                }
                showErrorModal(t('profile.avatarUploadFailedTitle', 'Upload Failed'), error.message || t('profile.avatarUploadFailedBody', 'Avatar upload failed.'));
            }
        }
        
        function uploadFile(file, url, options = {}) {
            return new Promise((resolve, reject) => {
                if (file.size > MAX_FILE_SIZE) { showErrorModal('Upload Failed', `File is too large. The maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`); return reject('File too large'); }
                const token = getSessionToken();
                if (!token) { return reject(new Error('Session token unavailable. Please reconnect and try again.')); }
                const showComposerProgress = options.showComposerProgress === true;
                const composerUploadId = showComposerProgress
                    ? beginComposerUpload(options.chatId || state.currentChat?.chatId || null)
                    : '';
                const xhr = new XMLHttpRequest(), formData = new FormData();
                formData.append("file", file); xhr.open('POST', `${SERVER_URL}${url}`, true);
                xhr.setRequestHeader('X-User-ID', state.currentUser.userId); xhr.setRequestHeader('X-Auth-Token', token);
                xhr.upload.onprogress = (event) => {
                    if (!event.lengthComputable || !event.total) return;
                    const percent = (event.loaded / event.total) * 100;
                    updateComposerUploadProgress(composerUploadId, percent);
                    options.onProgress?.(percent);
                };
                xhr.onloadstart = () => {
                    updateComposerUploadProgress(composerUploadId, 0);
                    options.onProgress?.(0);
                };
                xhr.onload = () => {
                    endComposerUpload(composerUploadId, 100);
                    options.onProgress?.(100);
                    const responseText = xhr.responseText || '';
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(responseText || '{}');
                            if (!result.success) throw new Error(result.error || 'Server rejected upload.');
                            resolve(result);
                        } catch (e) {
                            reject(new Error(`Failed to parse server response: ${e.message}`));
                        }
                        return;
                    }
                    let serverMessage = '';
                    if (responseText) {
                        try {
                            const parsed = JSON.parse(responseText);
                            serverMessage = parsed.error || parsed.message || parsed.reason || '';
                        } catch (_) {
                            serverMessage = responseText.slice(0, 200).trim();
                        }
                    }
                    const details = serverMessage ? `: ${serverMessage}` : '';
                    reject(new Error(`HTTP error! status: ${xhr.status}${details}`));
                };
                xhr.onerror = () => {
                    endComposerUpload(composerUploadId, 0);
                    options.onProgress?.(0);
                    reject(new Error('Upload failed due to a network error.'));
                };
                xhr.send(formData);
            });
        }
        
		function handleLogoutSequence(showLoadingMessage = true) {
			if (showLoadingMessage) ui.showLoading('Logging out...');
			
			// FIX: Close settings modal if it's open
			if (state.dom.settingsModal) {
				ui.closeModal(state.dom.settingsModal);
			}
			
			leaveVoiceChat();
			if (typeof PushNotificationManager !== 'undefined' && state.currentUser?.userId && state.sessionToken) {
				PushNotificationManager.detachSubscription(state.currentUser.userId, state.sessionToken, false).catch(() => {});
			}
			ui.updateUiForAuthState(false);
			getStorage().clearSession();
            state.sessionToken = null;
            state.sessionExpiresAt = 0;
			if (state.socket) {
				state.socket.onclose = null;
				state.socket.close();
			}
			state.socket = null;
			state.currentUser = null;
			state.currentChat = null;
			state.allUsers = {};
            state.allChats = {};
            state.userProfiles = {};
            state.walletOverview = null;
            updateWalletSummary(0, 0);
			state.e2eeSessions = {};
			state.typingUsers = {};
			state.isFullyAuthenticated = false;
			state.reconnectAttempts = 0;
			state.dataLoaded = { user: false, userList: false, chats: false };
			state.messagePages = {};
			state.attachedFile = null;
			state.attachedFileChatId = null;
			if (state.dom.stickersModal) state.dom.stickersModal.classList.add('hidden');
			state.replyingToMessage = null;
			state.messageToForward = null;

			// Reset title to Connecting...
			const title = document.getElementById('sidebarTitle');
			if (title) title.textContent = t('loading.connecting', 'Connecting...');

			ui.showAuthScreen();
		}

        function handleConfirmForward() {
            if (!state.messageToForward || state.socket?.readyState !== WebSocket.OPEN) return;
            const selectedCheckboxes = state.dom.forwardContactsList.querySelectorAll('input[type="checkbox"]:checked');
            if (selectedCheckboxes.length === 0) { showErrorModal('No Chat Selected', 'Please select at least one chat to forward the message to.'); return; }
            const forwardSourceChat = state.allChats[state.messageToForward.chatId] || state.currentChat;
            const originalContent = {
                text: state.messageToForward.text,
                file: state.messageToForward.file,
                theme: state.messageToForward.theme,
                forwardedInfo: { from: getMessageSenderName(state.messageToForward, forwardSourceChat), originalTs: state.messageToForward.timestamp }
            };
            selectedCheckboxes.forEach(checkbox => {
                const chatId = checkbox.dataset.chatId, chat = state.allChats[chatId];
                if (chat && chat.chatType === 'channel' && chat.ownerId !== state.currentUser.userId) { showErrorModal('Permission Denied', `You cannot send messages to the channel "${chat.chatName}".`); return; }
                state.socket.send(JSON.stringify({ type: 'message', content: originalContent, chatId: chatId, replyToId: null }));
            });
            ui.closeModal(state.dom.forwardMessageModal); state.messageToForward = null;
        }

        async function ensureMessageRendered(messageId, chatId = state.currentChat?.chatId) {
            if (!messageId || !chatId || state.currentChat?.chatId !== chatId) return null;
            const selectMessageEl = () => {
                if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
                    return document.querySelector(`.message-wrapper[data-msg-id="${CSS.escape(String(messageId))}"]`);
                }
                return Array.from(document.querySelectorAll('.message-wrapper[data-msg-id]')).find((el) => el.dataset.msgId === String(messageId)) || null;
            };
            const getRenderedStartIndex = () => {
                const chatMessages = state.allChats[chatId]?.messages || [];
                const renderedCount = state.dom.messagesContainer?.querySelectorAll('.message-wrapper[data-msg-id]')?.length || 0;
                return Math.max(0, chatMessages.length - renderedCount);
            };

            let messageEl = selectMessageEl();
            if (messageEl) return messageEl;

            const chat = state.allChats[chatId];
            const targetIndex = chat?.messages?.findIndex((msg) => String(msg.messageId) === String(messageId)) ?? -1;
            if (targetIndex === -1) return null;

            while (state.currentChat?.chatId === chatId && targetIndex < getRenderedStartIndex()) {
                if (state.isLoadingMore) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    messageEl = selectMessageEl();
                    if (messageEl) return messageEl;
                    continue;
                }
                const renderedBefore = state.dom.messagesContainer?.querySelectorAll('.message-wrapper[data-msg-id]')?.length || 0;
                if (state.messagePages[chatId] === -1) break;
                state.isLoadingMore = true;
                state.dom.historyLoader.classList.remove('hidden');
                loadMoreMessages(false);
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(resolve);
                    });
                });
                messageEl = selectMessageEl();
                if (messageEl) return messageEl;
                const renderedAfter = state.dom.messagesContainer?.querySelectorAll('.message-wrapper[data-msg-id]')?.length || 0;
                if (renderedAfter <= renderedBefore && state.messagePages[chatId] === -1) break;
            }

            return selectMessageEl();
        }

        async function waitForChatRenderCycle() {
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        }

        async function scrollToMessage(messageId, options = {}) {
            const chatId = state.currentChat?.chatId;
            const messageEl = await ensureMessageRendered(messageId, chatId);
            if (state.currentChat?.chatId !== chatId) return false;
            if (messageEl) {
                messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                messageEl.classList.remove('message-highlight');
                void messageEl.offsetWidth;
                messageEl.classList.add('message-highlight');
                return true;
            }
            if (!options.suppressError) {
                showErrorModal('Message Not Found', 'The original message could not be found in this chat.');
            }
            return false;
        }

        
function renderGroupMembersList() {
  if (!state.isFullyAuthenticated || !state.currentUser) return;
  const listEl = state.dom.groupMembersList;
  if (!listEl) return;
  listEl.innerHTML = '';

  const users = Object.values(state.allUsers)
    .filter(u => u && u.userId && u.userId !== state.currentUser.userId && u.username !== 'Deleted Account')
    .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  if (users.length === 0) {
    listEl.innerHTML = `<div class="text-center app-text-muted p-4">No users available.</div>`;
    return;
  }

  users.forEach(user => {
    const avatar = generateAvatar(user.username, user.userId, user.avatarUrl);
    const nameHtml = renderDisplayName(user.username, Boolean(user.isVerified), Boolean(user.isBot), user.membershipTier, user.nicknameFont, user.premiumStarIcon);

    const row = document.createElement('label');
    row.className = 'app-list-row app-list-row-hover flex items-center gap-3 p-2 rounded-lg cursor-pointer transition';
    row.innerHTML = `
      <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" data-user-id="${escapeAttr(user.userId)}" />
      <div class="w-10 h-10 avatar-circle flex-shrink-0" style="background-image: url('${escapeAttr(avatar.url)}'); background-color: ${avatar.color};">${avatar.initial}</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold truncate flex items-center">${nameHtml}</div>
        <div class="text-xs text-gray-500">${escapeHtml(getPresenceLabel(user))}</div>
      </div>
    `;
    listEl.appendChild(row);
  });
}

async function handleCreateGroup(e) {
  if (!assertUserNotBanned('create groups')) return;
  e.preventDefault();
  if (!state.isFullyAuthenticated || !state.currentUser) return;

  const name = state.dom.groupNameInput.value.trim();
  if (!name) {
    showErrorModal('Missing Name', 'Please enter a group name.');
    return;
  }

  const checkboxes = state.dom.groupMembersList.querySelectorAll('input[type="checkbox"]:checked');
  const members = Array.from(checkboxes).map(cb => cb.dataset.userId).filter(Boolean);
  if (members.length < 1) {
    showErrorModal(t('chat.noMembersSelectedTitle', 'No Members Selected'), t('chat.selectAtLeastOneMemberForGroup', 'Select at least 1 member for the group.'));
    return;
  }

  try {
    const session = getValidSession();
    if (!session?.token) {
      handleLogoutSequence(false);
      return;
    }
    const captchaToken = await runCaptchaGate('create_group');
    const response = await fetch(resolveServerUrl('/create_group'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': state.currentUser.userId,
        'X-Auth-Token': session?.token
      },
      body: JSON.stringify({ name, members, captchaToken })
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      showErrorModal('Group Creation Failed', result?.error || `HTTP error: ${response.status}`);
      return;
    }

    const group = result.group;
    if (group && group.chatId) {
      state.allChats[group.chatId] = { ...group, messages: group.messages || [], unreadCount: 0 };
      ui.renderContactList();
      openChat(state.allChats[group.chatId]);
    }

    ui.closeModal(state.dom.createGroupModal);
    state.dom.createGroupForm.reset();
  } catch (err) {
    console.error('Failed to create group', err);
    showErrorModal('An Error Occurred', err.message);
  }
}

async function handleCreateChannel(e) {
            if (!assertUserNotBanned('create channels')) return;
            e.preventDefault();
            if (!state.isFullyAuthenticated || !state.currentUser) return;
            const formData = new FormData(state.dom.createChannelForm);
            const session = getValidSession();
            if (!session?.token) {
                handleLogoutSequence(false);
                return;
            }
            try {
                const captchaToken = await runCaptchaGate('create_channel');
                formData.set('captchaToken', captchaToken);
                const response = await fetch(`${SERVER_URL}/create_channel`, { method: 'POST', headers: { 'X-User-ID': state.currentUser.userId, 'X-Auth-Token': session.token }, body: formData });
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = `HTTP error! status: ${response.status}`;
                    try {
                        const jsonError = JSON.parse(errorText);
                        errorMessage = jsonError.error || errorMessage;
                    } catch (e) {
                        errorMessage = errorText.substring(0, 100);
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();
                if (result.success) { 
                    ui.closeModal(state.dom.createChannelModal); 
                    state.dom.createChannelForm.reset(); 
                    state.dom.channelAvatarPreview.style.backgroundImage = ''; 
                    state.dom.channelAvatarPreview.innerHTML = '<i class="fas fa-camera text-2xl text-gray-500"></i>'; 
                } else { 
                    showErrorModal('Channel Creation Failed', result.error || 'Could not create channel.'); 
                }
            } catch (error) { 
                console.error("Failed to create channel:", error); 
                showErrorModal('An Error Occurred', error.message); 
            }
        }
        
        // --- Voice Chat Functions ---
        async function handleVoiceCallButtonClick() {
            if (!assertUserNotBanned('start calls')) return;
            if (!state.currentChat || state.currentVoiceChatId) return;
            if (state.currentChat.chatType === 'saved') return;
            const voiceChat = getVoiceChatModule();
            if (!voiceChat) {
                showErrorModal('Voice Chat Unavailable', 'The voice chat runtime failed to load.');
                return;
            }
            await voiceChat.startOutgoingCall(state.currentChat);
        }

        async function leaveVoiceChat() {
            const voiceChat = getVoiceChatModule();
            if (!voiceChat) return;
            await voiceChat.leaveCall('left');
        }

        async function toggleVoiceScreenShare() {
            const voiceChat = getVoiceChatModule();
            if (!voiceChat || !state.currentVoiceChatId) return;
            try {
                await voiceChat.toggleScreenShare();
            } catch (error) {
                showErrorModal('Screen Share', error?.message || 'Unable to change screen sharing.');
            }
        }

        async function toggleVoiceMute() {
            const voiceChat = getVoiceChatModule();
            if (!voiceChat || !state.currentVoiceChatId) return;
            try {
                await voiceChat.toggleMute();
            } catch (error) {
                showErrorModal('Voice Chat', error?.message || 'Unable to change microphone state.');
            }
        }

        async function toggleVoiceDeafen() {
            const voiceChat = getVoiceChatModule();
            if (!voiceChat || !state.currentVoiceChatId) return;
            try {
                await voiceChat.toggleDeafen();
            } catch (error) {
                showErrorModal('Voice Chat', error?.message || 'Unable to change audio state.');
            }
        }

        function toggleVoiceStageSize() {
            if (!state.currentScreenShareOwnerId) return;
            state.isCallStageMinimized = !state.isCallStageMinimized;
            if (state.currentChat?.chatId) {
                ui.renderVoiceUI(state.currentChat.chatId);
            }
        }
        
        async function acceptIncomingCall() {
            const callData = state.incomingCallData;
            if (!callData) return;
            const voiceChat = getVoiceChatModule();
            if (!voiceChat) {
                showErrorModal('Voice Chat Unavailable', 'The voice chat runtime failed to load.');
                return;
            }
            ui.closeIncomingCallModal();
            const { chatId } = callData;
            const chatToJoin = state.allChats[chatId];
            if (chatToJoin && (!state.currentChat || state.currentChat.chatId !== chatId)) {
                openChat(chatToJoin);
            }
            await voiceChat.acceptIncomingCall(callData);
        }

        function openChannelByHandle(handle) {
            const h = (handle || '').toLowerCase();
            const knownChannel = Object.values(state.allChats).find(c => c.handle && c.handle.toLowerCase() === h);
            if (knownChannel && Array.isArray(knownChannel.messages) && knownChannel.messages.length > 0) {
                openChat(knownChannel);
            }
            if (state.socket?.readyState === WebSocket.OPEN) {
                state.socket.send(JSON.stringify({ type: 'get_channel_by_handle', handle: handle || '' }));
            } else if (knownChannel) {
                openChat(knownChannel);
            }
        }
        function pinMessage(messageId) {
            if (!state.currentChat || !messageId || state.socket?.readyState !== WebSocket.OPEN) return;
            const pinnedMessage = normalizePinnedMessage(findMessage(state.currentChat.chatId, messageId));
            if (pinnedMessage) {
                state.currentChat.pinnedMessage = pinnedMessage;
                if (state.allChats[state.currentChat.chatId]) {
                    state.allChats[state.currentChat.chatId].pinnedMessage = pinnedMessage;
                }
                ui.renderPinnedBar(state.currentChat);
            }
            state.socket.send(JSON.stringify({ type: 'pin_message', chatId: state.currentChat.chatId, messageId: messageId }));
        }

        function unpinMessage() {
            if (!state.currentChat || state.socket?.readyState !== WebSocket.OPEN) return;
            state.currentChat.pinnedMessage = null;
            if (state.allChats[state.currentChat.chatId]) {
                state.allChats[state.currentChat.chatId].pinnedMessage = null;
            }
            ui.renderPinnedBar(state.currentChat);
            state.socket.send(JSON.stringify({ type: 'unpin_message', chatId: state.currentChat.chatId }));
        }
        function promptDmDeleteScope(count) {
            return new Promise((resolve) => {
                const existing = document.getElementById('bulkDmDeleteModal');
                if (existing) existing.remove();
                const modal = document.createElement('div');
                modal.id = 'bulkDmDeleteModal';
                modal.className = 'fixed inset-0 modal-bg items-center justify-center z-[70] p-4 flex';
                modal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl w-full max-w-sm modal-content">
                        <div class="p-5 border-b border-gray-200">
                            <h3 class="font-bold text-lg">${escapeHtml(tr('chat.deleteDmCountTitle', 'Delete {count} direct chats', { count }))}</h3>
                            <p class="text-sm text-gray-500 mt-2">${escapeHtml(t('chat.deleteSelectedDmScopePrompt', 'Choose whether to remove the selected direct chats only for you or for both participants.'))}</p>
                        </div>
                        <div class="p-4 flex flex-col gap-3">
                            <button data-scope="me" class="w-full bg-gray-800 hover:bg-black text-white font-semibold py-2 px-4 rounded-lg">${escapeHtml(t('chat.deleteForMe', 'Delete For Me'))}</button>
                            <button data-scope="everyone" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">${escapeHtml(t('chat.deleteForEveryone', 'Delete For Everyone'))}</button>
                            <button data-scope="cancel" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">${escapeHtml(t('common.cancel', 'Cancel'))}</button>
                        </div>
                    </div>
                `;
                const cleanup = (result) => {
                    modal.remove();
                    resolve(result);
                };
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) cleanup(null);
                });
                modal.querySelectorAll('button[data-scope]').forEach((button) => {
                    button.addEventListener('click', () => {
                        const scope = button.dataset.scope;
                        cleanup(scope === 'cancel' ? null : scope);
                    });
                });
                document.body.appendChild(modal);
            });
        }
        async function handleSelectedChatsDelete() {
            const selectedChats = getSelectedChats();
            if (!selectedChats.length) return;
            const allPrivate = selectedChats.every(chat => chat.chatType === 'private');
            let dmScope = 'me';
            if (allPrivate) {
                dmScope = await promptDmDeleteScope(selectedChats.length);
                if (!dmScope) return;
            } else if (!window.confirm(t('chat.confirmDeleteSelectedChats', 'Delete the selected chats? Joined groups/channels will be left. Owned groups/channels will be deleted. DMs will be deleted only for you.'))) {
                return;
            }

            const failures = [];
            for (const chat of selectedChats) {
                if (!chat) continue;
                try {
                    if (chat.chatType === 'private') {
                        if (chat.chatId.startsWith('temp_')) {
                            removeChatLocally(chat.chatId);
                            continue;
                        }
                        const success = await performChatSettingsAction('delete_private_chat', chat.chatId, { scope: allPrivate ? dmScope : 'me' }, { skipCloseModal: true, suppressSuccessRender: true });
                        if (!success) failures.push(chat.chatId);
                    } else if (chat.ownerId === state.currentUser.userId) {
                        const success = await performChatSettingsAction('delete_chat', chat.chatId, {}, { skipCloseModal: true, suppressSuccessRender: true });
                        if (!success) failures.push(chat.chatId);
                    } else {
                        const success = await performChatSettingsAction('leave_chat', chat.chatId, {}, { skipCloseModal: true, suppressSuccessRender: true });
                        if (!success) failures.push(chat.chatId);
                    }
                } catch (error) {
                    failures.push(chat.chatId);
                }
            }

            exitChatSelectionMode(false);
            ui.renderContactList();
            if (failures.length) {
                showErrorModal('Some Actions Failed', `${failures.length} selected chat${failures.length === 1 ? '' : 's'} could not be removed.`);
            }
        }
        async function handleLeaveGroup() {
            if (!state.currentChat) return;
            const chat = state.currentChat;
            if (chat.chatType !== 'group' && chat.chatType !== 'channel') return;
            const chatName = chat.chatName || t('chat.unnamedChat', 'this chat');
            const confirmed = await promptAppConfirm(
                t('chat.leaveChat', 'Leave Group/Channel'),
                tr('chat.confirmLeaveChat', 'Leave {name}?', { name: chatName }),
                t('chat.leaveChat', 'Leave Group/Channel')
            );
            if (!confirmed) return;
            await performChatSettingsAction('leave_chat', chat.chatId, {}, { skipCloseModal: true });
        }

        function promptAppConfirm(title, message, confirmLabel = t('common.delete', 'Delete')) {
            return new Promise((resolve) => {
                const modal = state.dom.confirmDeleteModal;
                const confirmBtn = state.dom.confirmDeleteButton;
                const cancelBtn = state.dom.cancelDeleteButton;
                const modalCard = modal?.querySelector('.modal-content');
                const titleEl = modalCard?.querySelector('.text-lg');
                const bodyEl = modalCard?.querySelector('.text-sm');
                if (!modal || !confirmBtn || !cancelBtn || !titleEl || !bodyEl) {
                    resolve(window.confirm(message));
                    return;
                }
                const originalTitle = titleEl.textContent;
                const originalBody = bodyEl.textContent;
                const originalConfirm = confirmBtn.textContent;
                const originalConfirmClass = confirmBtn.className;
                const originalMode = confirmBtn.dataset.mode || 'delete';
                const originalMsgId = confirmBtn.dataset.msgId || '';
                titleEl.textContent = title || originalTitle;
                bodyEl.textContent = message || originalBody;
                confirmBtn.textContent = confirmLabel || originalConfirm;
                confirmBtn.dataset.mode = 'confirm';
                delete confirmBtn.dataset.msgId;
                confirmBtn.className = originalConfirmClass.replace('bg-red-500 hover:bg-red-600', 'bg-blue-500 hover:bg-blue-600');

                const cleanup = (result) => {
                    titleEl.textContent = originalTitle;
                    bodyEl.textContent = originalBody;
                    confirmBtn.textContent = originalConfirm;
                    confirmBtn.className = originalConfirmClass;
                    confirmBtn.dataset.mode = originalMode;
                    if (originalMsgId) confirmBtn.dataset.msgId = originalMsgId;
                    else delete confirmBtn.dataset.msgId;
                    confirmBtn.removeEventListener('click', onConfirm);
                    cancelBtn.removeEventListener('click', onCancel);
                    ui.closeModal(modal);
                    resolve(result);
                };
                const onConfirm = () => cleanup(true);
                const onCancel = () => cleanup(false);
                confirmBtn.addEventListener('click', onConfirm, { once: true });
                cancelBtn.addEventListener('click', onCancel, { once: true });
                ui.openModal(modal);
            });
        }
        
        function updateChatMetadata(chatId) {
            const chat = state.allChats[chatId]; if (!chat) return;
            const rawMsg = chat.messages[chat.messages.length - 1];
            if (rawMsg) {
                chat.lastMessage = { ...rawMsg, ...parseMessageContent(rawMsg.content) };
                chat.lastMessageTimestamp = chat.lastMessage.timestamp;
            } else {
                chat.lastMessageTimestamp = chat.created_at || 0;
            }
            if (state.isFullyAuthenticated) ui.renderContactList();
        }

        function findMessage(chatId, messageId) {
            const targetId = String(messageId ?? '');
            return state.allChats[chatId]?.messages.find((m) => String(m?.messageId ?? '') === targetId);
        }
        function findMessageInAnyChat(messageId) {
            const targetId = String(messageId ?? '');
            for (const chat of Object.values(state.allChats)) {
                const match = chat?.messages?.find((m) => String(m?.messageId ?? '') === targetId);
                if (match) return { chat, message: match };
            }
            return null;
        }
        function openPrivateChatWithUser(userId) { if (!assertUserNotBanned('open chats')) return; if (userId === state.currentUser.userId) { const savedChat = Object.values(state.allChats).find(c => c && c.chatType === 'saved'); if (savedChat) openChat(savedChat); return; } const chat = Object.values(state.allChats).find(c => c && c.chatType === 'private' && c.members.length === 2 && c.members.includes(userId)); if (chat) openChat(chat); else openChat({ chatId: `temp_${userId}`, chatType: 'private', members: [state.currentUser.userId, userId], messages: [] }); }

        // --- Chat Settings (owner controls) ---
        async function fetchChatSettingsProfile(chatId, force = false) {
            if (!state.currentUser) return null;
            if (!force && state.chatSettingsProfiles[chatId]) return state.chatSettingsProfiles[chatId];
            const session = getValidSession();
            if (!session?.token) return null;
            const res = await fetch(resolveServerUrl('/chat/settings'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-ID': state.currentUser.userId, 'X-Auth-Token': session.token },
                body: JSON.stringify({ action: 'get_profile', chatId })
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok || !result.success) throw new Error(result.error || 'Could not load chat profile.');
            if (result.profile) {
                state.chatSettingsProfiles[chatId] = result.profile;
            }
            return result.profile || null;
        }

        async function uploadChatAvatar(chatId, file) {
            if (!state.currentUser || !file) return null;
            const session = getValidSession();
            if (!session?.token) return null;
            const formData = new FormData();
            formData.append('chatId', chatId);
            formData.append('avatar', file);
            const response = await fetch(resolveServerUrl('/chat/upload_avatar'), {
                method: 'POST',
                headers: { 'X-User-ID': state.currentUser.userId, 'X-Auth-Token': session.token },
                body: formData
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
                throw new Error(result.error || t('profile.avatarUploadFailedBody', 'Avatar upload failed.'));
            }
            if (state.allChats[chatId]) state.allChats[chatId].avatarUrl = result.url || state.allChats[chatId].avatarUrl;
            if (state.chatSettingsProfiles[chatId]) state.chatSettingsProfiles[chatId].avatarUrl = result.url || state.chatSettingsProfiles[chatId].avatarUrl;
            if (state.currentChat?.chatId === chatId) {
                state.currentChat.avatarUrl = result.url || state.currentChat.avatarUrl;
                openChat(state.currentChat, true);
            }
            ui.renderContactList();
            return result.url || null;
        }

        function closeChatAdminSettingsModal() {
            document.getElementById('chatAdminSettingsModal')?.remove();
        }

        async function openChatAdminSettingsModal(chatId) {
            const chat = state.allChats[chatId];
            if (!chat) return;
            const isMember = chat.ownerId === state.currentUser?.userId || (chat.members || []).includes(state.currentUser?.userId);
            if (!isMember) return;
            const profile = await fetchChatSettingsProfile(chatId, true);
            if (!profile) return;
            closeChatAdminSettingsModal();
            const isPublicChat = chatId === state.PUBLIC_CHAT_ID;
            const isChannel = chat.chatType === 'channel';
            const modal = document.createElement('div');
            modal.id = 'chatAdminSettingsModal';
            modal.className = 'fixed inset-0 modal-bg z-[60] flex items-center justify-center p-3';
            const avatar = generateAvatar(profile.chatName || chat.chatName || chat.chatId, chat.chatId, profile.avatarUrl || chat.avatarUrl, isChannel);
            modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-xl w-full max-w-md modal-content profile-sheet-modal overflow-hidden">
                    <div class="p-5 md:p-6 profile-sheet profile-sheet-settings">
                        <button type="button" data-close-admin-settings class="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-gray-100 text-xl text-gray-500 hover:text-gray-700">&times;</button>
                        <div class="profile-sheet-header pr-12">
                            <button type="button" id="chatAdminAvatarButton" class="profile-sheet-avatar ${isChannel ? 'chat-profile-avatar-channel' : 'avatar-circle'} shadow-sm"></button>
                            <input type="file" id="chatAdminAvatarInput" class="hidden" accept="image/*">
                            <div class="min-w-0 flex-1">
                                <h3 class="profile-sheet-name">${escapeHtml(profile.chatName || chat.chatName || chat.chatId)}</h3>
                                <p class="profile-sheet-status">${escapeHtml(t('chat.chatSettings', 'Chat Settings'))}</p>
                            </div>
                        </div>
                        <div class="profile-sheet-panels custom-scrollbar !mt-5">
                            <section class="profile-sheet-panel">
                                <div class="profile-sheet-section">
                                    <div class="profile-sheet-section-title">${escapeHtml(t('chat.profileSection', 'Profile'))}</div>
                                    <div class="profile-sheet-form-field">
                                        <label class="profile-sheet-form-label" for="chatAdminNameInput">${escapeHtml(t('chat.chatName', 'Chat Name'))}</label>
                                        <input id="chatAdminNameInput" type="text" class="profile-sheet-input" value="${escapeAttr(profile.chatName || chat.chatName || '')}">
                                    </div>
                                    <div class="profile-sheet-form-field mt-4">
                                        <label class="profile-sheet-form-label" for="chatAdminBioInput">${escapeHtml(t('profile.bio', 'Bio'))}</label>
                                        <textarea id="chatAdminBioInput" class="profile-sheet-textarea" placeholder="${escapeAttr(t('profile.bioPlaceholder', 'Tell people a bit about yourself.'))}">${escapeHtml(profile.bio || '')}</textarea>
                                    </div>
                                    <div class="profile-sheet-form-field mt-4">
                                        <label class="profile-sheet-form-label">${escapeHtml(t('chat.privateInvite', 'Private Invite'))}</label>
                                        <input type="text" class="profile-sheet-input" value="${escapeAttr(profile.privateHandle || '')}" readonly>
                                    </div>
                                    <div class="mt-4 flex flex-wrap gap-3">
                                        <button id="chatAdminSaveProfileBtn" type="button" class="profile-sheet-primary-button">${escapeHtml(t('common.save', 'Save'))}</button>
                                        <button id="chatAdminEditHandleBtn" type="button" class="profile-sheet-secondary-button">${escapeHtml(t('chat.editHandle', 'Edit Handle'))}</button>
                                    </div>
                                </div>
                                ${chat.chatType === 'group' ? `
                                    <div class="profile-sheet-section">
                                        <div class="profile-sheet-section-title">${escapeHtml(t('chat.accesses', 'Accesses'))}</div>
                                        <label class="flex items-center gap-3 rounded-xl px-1 py-2">
                                            <input id="chatSettingsSeenReceiptsToggle" type="checkbox" class="h-4 w-4 rounded" ${profile.seenReceiptsEnabled !== false ? 'checked' : ''}>
                                            <div class="min-w-0">
                                                <div class="font-semibold">${escapeHtml(t('chat.seenReceipts', 'Seen Receipts'))}</div>
                                                <div class="profile-sheet-group-meta">${escapeHtml(t('chat.seenReceiptsDesc', 'Allow members to see who read their messages'))}</div>
                                            </div>
                                        </label>
                                        <div class="space-y-3 mt-4">
                                            ${[
                                                ['canSendMessages', t('chat.sendMessages', 'Send Messages')],
                                                ['canSendFiles', t('chat.sendFiles', 'Send Files')],
                                                ['canAddMembers', t('chat.addMembers', 'Add Members')],
                                                ['canViewMembers', t('chat.viewMembers', 'View Members')]
                                            ].map(([key, label]) => `
                                                <label class="flex items-center justify-between gap-3">
                                                    <span class="text-sm font-medium">${escapeHtml(label)}</span>
                                                    <input type="checkbox" data-permission-key="${escapeAttr(key)}" class="h-4 w-4 rounded" ${profile.permissions?.[key] !== false ? 'checked' : ''}>
                                                </label>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                <div class="profile-sheet-section">
                                    <div class="profile-sheet-section-title">${escapeHtml(t('chat.manageChat', 'Manage Chat'))}</div>
                                    <div class="chat-profile-admin-actions !mt-0">
                                        ${chat.chatType === 'group' && profile.canAddMembers && !isPublicChat ? `<button id="chatAdminAddMembersBtn" type="button" class="profile-sheet-secondary-button">${escapeHtml(t('chat.addMembers', 'Add Members'))}</button>` : ''}
                                        ${profile.ownerId === state.currentUser?.userId && !isPublicChat ? `<button id="chatAdminTransferOwnershipBtn" type="button" class="profile-sheet-secondary-button">${escapeHtml(t('chat.transferOwnership', 'Transfer Ownership'))}</button>` : ''}
                                        ${profile.ownerId === state.currentUser?.userId ? `<button id="chatAdminDeleteBtn" type="button" class="profile-sheet-secondary-button chat-profile-danger-button">${escapeHtml(t('chat.deleteChat', 'Delete Chat'))}</button>` : ''}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            const avatarButton = modal.querySelector('#chatAdminAvatarButton');
            const syncChatAdminProfilePatch = (patch = {}) => {
                Object.assign(profile, patch);
                if (state.chatSettingsProfiles[chatId]) Object.assign(state.chatSettingsProfiles[chatId], patch);
                if (state.allChats[chatId]) Object.assign(state.allChats[chatId], patch);
                if (state.currentChat?.chatId === chatId) {
                    Object.assign(state.currentChat, patch);
                    openChat(state.currentChat, true);
                }
                ui.renderContactList();
            };
            const renderChatAdminAvatar = () => {
                const nextAvatar = generateAvatar(profile.chatName || chat.chatName || chat.chatId, chat.chatId, profile.avatarUrl || chat.avatarUrl, isChannel);
                avatarButton.style.backgroundImage = `url(${nextAvatar.url})`;
                avatarButton.style.backgroundColor = nextAvatar.color;
                avatarButton.innerHTML = nextAvatar.url ? '' : nextAvatar.initial;
            };
            renderChatAdminAvatar();
            modal.querySelectorAll('[data-close-admin-settings]').forEach((button) => {
                button.addEventListener('click', closeChatAdminSettingsModal);
            });
            modal.querySelector('#chatAdminEditHandleBtn')?.addEventListener('click', () => openEditHandleModal(chatId));
            modal.querySelector('#chatAdminAddMembersBtn')?.addEventListener('click', () => openAddMembersModal(chatId));
            modal.querySelector('#chatAdminTransferOwnershipBtn')?.addEventListener('click', () => openTransferOwnershipModal(chatId));
            modal.querySelector('#chatAdminDeleteBtn')?.addEventListener('click', async () => {
                if (!confirm(t('chat.confirmDeleteChat', 'Permanently delete this chat? This cannot be undone.'))) return;
                await performChatSettingsAction('delete_chat', chatId);
                closeChatAdminSettingsModal();
            });
            modal.querySelector('#chatAdminSaveProfileBtn')?.addEventListener('click', async () => {
                const chatName = String(modal.querySelector('#chatAdminNameInput')?.value || '').trim();
                const bio = String(modal.querySelector('#chatAdminBioInput')?.value || '').trim();
                const success = await performChatSettingsAction('update_profile', chatId, { chatName, bio }, { skipCloseModal: true });
                if (!success) return;
                syncChatAdminProfilePatch({
                    chatName: chatName || profile.chatName || chat.chatName,
                    bio,
                });
                const headerName = modal.querySelector('.profile-sheet-name');
                if (headerName) headerName.textContent = profile.chatName || chat.chatName || chat.chatId;
                renderChatAdminAvatar();
            });
            modal.querySelector('#chatAdminAvatarButton')?.addEventListener('click', () => modal.querySelector('#chatAdminAvatarInput')?.click());
            modal.querySelector('#chatAdminAvatarInput')?.addEventListener('change', async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                    const nextAvatarUrl = await uploadChatAvatar(chatId, file);
                    syncChatAdminProfilePatch({ avatarUrl: nextAvatarUrl || profile.avatarUrl || chat.avatarUrl });
                    renderChatAdminAvatar();
                } catch (error) {
                    showErrorModal(t('profile.avatarUploadFailedTitle', 'Upload Failed'), error.message || t('profile.avatarUploadFailedBody', 'Avatar upload failed.'));
                }
            });
            modal.querySelector('#chatSettingsSeenReceiptsToggle')?.addEventListener('change', async (event) => {
                await performChatSettingsAction('set_seen_receipts', chatId, { enabled: Boolean(event.target.checked) }, { skipCloseModal: true });
                await fetchChatSettingsProfile(chatId, true);
                openChatSettings(chatId, 'bio');
                openChatAdminSettingsModal(chatId);
            });
            modal.querySelectorAll('[data-permission-key]').forEach((input) => {
                input.addEventListener('change', async () => {
                    const payload = {};
                    modal.querySelectorAll('[data-permission-key]').forEach((node) => {
                        payload[node.dataset.permissionKey] = Boolean(node.checked);
                    });
                    await performChatSettingsAction('set_permissions', chatId, payload, { skipCloseModal: true });
                    await fetchChatSettingsProfile(chatId, true);
                    openChatSettings(chatId, 'bio');
                    openChatAdminSettingsModal(chatId);
                });
            });
        }

        async function openChatSettings(chatId, activeTab = 'bio') {
            const chat = state.allChats[chatId];
            if (!chat) return;
            const isMember = chat.ownerId === state.currentUser?.userId || (chat.members || []).includes(state.currentUser?.userId);
            if (!isMember) return;
            const modal = document.getElementById('chatSettingsModal');
            const title = document.getElementById('chatSettingsTitle');
            const panel = modal?.querySelector('.modal-content');
            const body = title?.parentElement?.nextElementSibling;
            const headerBar = title?.parentElement;
            if (!modal || !title || !panel || !body) return;
            modal.classList.add('items-center');
            modal.classList.remove('items-start', 'overflow-y-auto');
            headerBar?.classList.add('hidden');
            panel.classList.remove('max-w-3xl', 'rounded-lg');
            panel.classList.add('max-w-md', 'rounded-2xl', 'profile-sheet-modal', 'relative');
            body.className = 'p-5 md:p-6 flex flex-1 min-h-0 flex-col overflow-hidden';
            document.getElementById('chatSettingsCloseBtn').onclick = () => { ui.closeModal(modal); };
            try {
                if (!state.chatSettingsProfiles[chatId]) {
                    body.innerHTML = `<div class="text-sm app-text-muted">${escapeHtml(t('loading.updating', 'Updating...'))}</div>`;
                    if (modal.classList.contains('hidden')) ui.openModal(modal);
                }
                const profile = await fetchChatSettingsProfile(chatId, false);
                if (!profile) return;
                if (modal.classList.contains('hidden')) ui.openModal(modal);
                const baseChat = state.allChats[chatId] || chat;
                const mergedChat = {
                    ...baseChat,
                    ...profile,
                    members: Array.isArray(baseChat.members) ? [...baseChat.members] : [],
                    messages: Array.isArray(baseChat.messages) ? baseChat.messages : [],
                };
                state.allChats[chatId] = {
                    ...baseChat,
                    chatName: profile.chatName || baseChat.chatName,
                    avatarUrl: Object.prototype.hasOwnProperty.call(profile, 'avatarUrl') ? profile.avatarUrl : baseChat.avatarUrl,
                    handle: Object.prototype.hasOwnProperty.call(profile, 'handle') ? profile.handle : baseChat.handle,
                    bio: Object.prototype.hasOwnProperty.call(profile, 'bio') ? profile.bio : baseChat.bio,
                    ownerId: Object.prototype.hasOwnProperty.call(profile, 'ownerId') ? profile.ownerId : baseChat.ownerId,
                    adminIds: Array.isArray(profile.adminIds) ? [...profile.adminIds] : (baseChat.adminIds || []),
                    permissions: profile.permissions || baseChat.permissions,
                    canManageSettings: Object.prototype.hasOwnProperty.call(profile, 'canManageSettings') ? profile.canManageSettings : baseChat.canManageSettings,
                    canViewMembers: Object.prototype.hasOwnProperty.call(profile, 'canViewMembers') ? profile.canViewMembers : baseChat.canViewMembers,
                    canSearchMembers: Object.prototype.hasOwnProperty.call(profile, 'canSearchMembers') ? profile.canSearchMembers : baseChat.canSearchMembers,
                };
                const isChannel = mergedChat.chatType === 'channel';
                const isPublicChat = chatId === state.PUBLIC_CHAT_ID;
                const adminIds = new Set([profile.ownerId, ...(profile.adminIds || [])].filter(Boolean));
                const canManage = Boolean(
                    profile.canManageSettings
                    || profile.ownerId === state.currentUser?.userId
                    || (profile.adminIds || []).includes(state.currentUser?.userId)
                ) && !isPublicChat;
                const canViewMembers = Boolean(profile.canViewMembers) && !isPublicChat;
                const canSearchMembers = Boolean(profile.canSearchMembers) && !isPublicChat;
                const isMuted = isChatMutedLocally(chatId);
                const showMembersTab = !isPublicChat && (mergedChat.chatType === 'group' || (isChannel && canManage));
                const tabs = [
                    { key: 'bio', label: t('profile.bio', 'Bio') },
                    ...(isChannel ? [{ key: 'files', label: t('chat.files', 'Files') }] : []),
                    ...(showMembersTab ? [{ key: 'members', label: t('chat.members', 'Members') }] : [])
                ];
                if (!tabs.some((tab) => tab.key === activeTab)) activeTab = 'bio';
                const displayName = profile.chatName || mergedChat.chatName || mergedChat.chatId;
                const avatar = generateAvatar(displayName, mergedChat.chatId, mergedChat.avatarUrl, isChannel);
                const statusLabel = tr('chat.memberCount', '{count} members', { count: localizeDigits(profile.memberCount || (profile.members || []).length || 0) });
                const visibleMembers = canViewMembers ? (profile.members || []) : Array.from(adminIds);
                const files = isChannel ? (mergedChat.messages || []).filter((message) => message?.file) : [];
                const renderMemberRows = (memberIds) => memberIds.map((memberId) => {
                    const user = state.allUsers[memberId] || { userId: memberId, username: memberId };
                    const memberName = getUserDisplayName(user, memberId);
                    const memberAvatar = generateAvatar(memberName, memberId, user.avatarUrl);
                    const role = memberId === profile.ownerId ? t('chat.owner', 'Owner') : (adminIds.has(memberId) ? t('chat.admin', 'Admin') : t('chat.member', 'Member'));
                    const adminAction = canManage && memberId !== profile.ownerId
                        ? `<button type="button" class="profile-sheet-secondary-button !min-w-0 !px-3 !py-2 !text-xs" data-action="${adminIds.has(memberId) ? 'remove-admin' : 'add-admin'}" data-member-id="${escapeAttr(memberId)}">${escapeHtml(adminIds.has(memberId) ? t('chat.removeAdmin', 'Remove Admin') : t('chat.makeAdmin', 'Make Admin'))}</button>`
                        : '';
                    const removeAction = canManage && memberId !== profile.ownerId
                        ? `<button type="button" class="profile-sheet-secondary-button !min-w-0 !px-3 !py-2 !text-xs !bg-red-50 !text-red-600" data-action="remove-member" data-member-id="${escapeAttr(memberId)}">${escapeHtml(t('common.remove', 'Remove'))}</button>`
                        : '';
                    return `
                        <div class="profile-sheet-group-card chat-profile-member-row">
                            <div class="flex items-center gap-3">
                                <div class="w-11 h-11 avatar-circle flex-shrink-0" style="background-image:url('${escapeAttr(memberAvatar.url)}');background-color:${memberAvatar.color};">${memberAvatar.initial}</div>
                                <div class="min-w-0 flex-1">
                                    <div class="profile-sheet-group-name truncate">${renderDisplayName(memberName, Boolean(user.isVerified), Boolean(user.isBot), user.membershipTier, user.nicknameFont, user.premiumStarIcon)}</div>
                                    <div class="profile-sheet-group-meta">${escapeHtml(role)}</div>
                                </div>
                            </div>
                            ${(adminAction || removeAction) ? `<div class="chat-profile-member-actions">${adminAction}${removeAction}</div>` : ''}
                        </div>
                    `;
                }).join('') || `<div class="profile-sheet-empty">${escapeHtml(t('chat.noMembers', 'No members found.'))}</div>`;
                const bioPage = `
                    <section class="profile-sheet-panel">
                        <div class="profile-sheet-section">
                            <div class="profile-sheet-section-title">${escapeHtml(t('chat.handle', 'Handle'))}</div>
                            <p class="profile-sheet-id">${escapeHtml(profile.handle || t('chat.noHandle', 'No handle'))}</p>
                        </div>
                        <div class="profile-sheet-section">
                            <div class="profile-sheet-section-title">${escapeHtml(t('chat.privateInvite', 'Private Invite'))}</div>
                            <p class="profile-sheet-id">${escapeHtml(profile.privateHandle || t('chat.noHandle', 'No handle'))}</p>
                        </div>
                        <div class="profile-sheet-section">
                            <div class="profile-sheet-section-title">${escapeHtml(t('profile.bio', 'Bio'))}</div>
                            <p class="profile-sheet-text">${escapeHtml((profile.bio || '').trim() || t('settings.noBioYet', 'No bio yet.'))}</p>
                        </div>
                    </section>
                `;
                const filesPage = `
                    <section class="profile-sheet-panel">
                        <div class="profile-sheet-section">
                            <div class="profile-sheet-section-title">${escapeHtml(t('chat.files', 'Files'))}</div>
                            <div class="profile-sheet-groups-list">
                                ${files.length ? files.map((message) => {
                                    const file = message.file || {};
                                    return `<a href="${escapeAttr(resolveServerUrl(file.url || ''))}" target="_blank" class="profile-sheet-group-card flex items-center gap-3">
                                        <i class="fas fa-paperclip app-accent-text"></i>
                                        <div class="min-w-0 flex-1">
                                            <div class="profile-sheet-group-name truncate">${escapeHtml(file.name || t('chat.file', 'File'))}</div>
                                            <div class="profile-sheet-group-meta">${escapeHtml(formatMessageTimestamp(message.timestamp || 0))}</div>
                                        </div>
                                    </a>`;
                                }).join('') : `<div class="profile-sheet-empty">${escapeHtml(t('chat.noFilesYet', 'No files yet.'))}</div>`}
                            </div>
                        </div>
                    </section>
                `;
                const membersPage = `
                    <section class="profile-sheet-panel">
                        <div class="profile-sheet-section">
                            <div class="profile-sheet-section-title">${escapeHtml(t('chat.members', 'Members'))}</div>
                            ${canSearchMembers ? `<input id="chatSettingsMemberSearchInput" type="text" class="profile-sheet-input mb-3" placeholder="${escapeAttr(t('common.search', 'Search'))}">` : ''}
                            <div id="chatSettingsMembersList" class="profile-sheet-gifts-grid chat-profile-member-list">${renderMemberRows(visibleMembers)}</div>
                            ${!canViewMembers && mergedChat.chatType === 'group' ? `<div class="profile-sheet-group-meta mt-3">${escapeHtml(t('chat.membersHidden', 'Only admins are visible in this group.'))}</div>` : ''}
                        </div>
                    </section>
                `;
                body.innerHTML = `
                    <div class="profile-sheet profile-sheet-settings">
                        <button id="chatSettingsCloseInlineBtn" class="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-gray-100 text-xl text-gray-500 hover:text-gray-700">&times;</button>
                        <button id="chatSettingsMuteButton" class="absolute top-3 left-3 z-10 h-10 w-10 rounded-full bg-gray-100 text-lg text-gray-500 hover:text-gray-700 interactive-pop" type="button" title="${escapeAttr(isMuted ? t('profile.unmuteNotifications', 'Unmute notifications') : t('profile.muteNotifications', 'Mute notifications'))}" aria-label="${escapeAttr(isMuted ? t('profile.unmuteNotifications', 'Unmute notifications') : t('profile.muteNotifications', 'Mute notifications'))}"><i class="fas ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i></button>
                        ${canManage ? `<button id="chatSettingsGearButton" class="absolute top-3 left-16 z-10 h-10 w-10 rounded-full bg-gray-100 text-lg text-blue-600 hover:text-blue-700 interactive-pop" type="button" title="${escapeAttr(t('chat.chatSettings', 'Chat Settings'))}"><i class="fas fa-gear"></i></button>` : ''}
                        <div class="profile-sheet-header pt-14 pr-12 pl-12">
                            <div class="profile-sheet-avatar ${isChannel ? 'chat-profile-avatar-channel' : 'avatar-circle'} shadow-sm" style="background-image:url('${escapeAttr(avatar.url)}');background-color:${avatar.color};">${avatar.url ? '' : avatar.initial}</div>
                            <div class="min-w-0 flex-1">
                                <h3 class="profile-sheet-name flex items-center leading-tight">${renderPlainDisplayName(displayName, Boolean(profile.isVerified || mergedChat.isVerified))}</h3>
                                <p class="profile-sheet-status">${escapeHtml(statusLabel)}</p>
                                <div class="profile-sheet-meta-row">
                                    <span class="profile-sheet-meta-chip">${escapeHtml(profile.handle || t('chat.noHandle', 'No handle'))}</span>
                                </div>
                            </div>
                        </div>
                        <div class="profile-sheet-tabs">
                            ${tabs.map((tab) => `<button type="button" class="profile-sheet-tab ${tab.key === activeTab ? 'active' : ''}" data-chat-profile-tab="${escapeAttr(tab.key)}">${escapeHtml(tab.label)}</button>`).join('')}
                        </div>
                        <div class="profile-sheet-panels custom-scrollbar">
                            ${activeTab === 'bio' ? bioPage : ''}
                            ${activeTab === 'files' ? filesPage : ''}
                            ${activeTab === 'members' ? membersPage : ''}
                        </div>
                    </div>
                `;
                body.querySelector('#chatSettingsCloseInlineBtn')?.addEventListener('click', () => ui.closeModal(modal));
                body.querySelector('#chatSettingsMuteButton')?.addEventListener('click', () => {
                    toggleLocalChatMute(chatId);
                    openChatSettings(chatId, activeTab);
                });
                body.querySelectorAll('[data-chat-profile-tab]').forEach((button) => {
                    button.addEventListener('click', () => openChatSettings(chatId, button.dataset.chatProfileTab || 'bio'));
                });
                body.querySelector('#chatSettingsGearButton')?.addEventListener('click', () => openChatAdminSettingsModal(chatId));
                const applyMemberFilter = () => {
                    const query = String(body.querySelector('#chatSettingsMemberSearchInput')?.value || '').trim().toLowerCase();
                    body.querySelectorAll('#chatSettingsMembersList .chat-profile-member-row').forEach((row) => {
                        row.classList.toggle('hidden', Boolean(query) && !String(row.textContent || '').toLowerCase().includes(query));
                    });
                };
                body.querySelector('#chatSettingsMemberSearchInput')?.addEventListener('input', applyMemberFilter);
                body.querySelectorAll('[data-action="add-admin"], [data-action="remove-admin"], [data-action="remove-member"]').forEach((button) => {
                    button.addEventListener('click', async () => {
                        const memberId = button.dataset.memberId;
                        const action = button.dataset.action;
                        if (!memberId || !action) return;
                        if (action === 'remove-member' && !confirm(tr('chat.confirmRemoveMember', 'Remove {name} from this chat?', { name: state.allUsers[memberId]?.username || memberId }))) return;
                        await performChatSettingsAction(action === 'remove-member' ? 'remove_member' : (action === 'add-admin' ? 'add_admin' : 'remove_admin'), chatId, { memberId }, { skipCloseModal: true });
                        await fetchChatSettingsProfile(chatId, true);
                        openChatSettings(chatId, activeTab);
                    });
                });
            } catch (error) {
                body.innerHTML = `<div class="text-sm text-red-500">${escapeHtml(error.message || t('chat.chatSettings', 'Chat Settings'))}</div>`;
            }
        }

        function openEditHandleModal(chatId) {
            const chat = state.allChats[chatId];
            if (!chat) return;
            closeChatAdminSettingsModal();
            state.dom.editHandleInput.value = String(chat.handle || '').replace(/^@/, '');
            state.dom.editHandleError.textContent = '';
            state.dom.editHandleSaveBtn.onclick = async () => {
                const rawHandle = (state.dom.editHandleInput.value || '').trim();
                if (!rawHandle) {
                    state.dom.editHandleError.textContent = t('chat.handleRequired', 'Handle is required.');
                    return;
                }
                const success = await performChatSettingsAction('set_handle', chatId, { handle: rawHandle }, { skipCloseModal: true });
                if (success) {
                    ui.closeModal(state.dom.editHandleModal);
                    openChatSettings(chatId);
                }
            };
            state.dom.editHandleDeleteBtn.onclick = async () => {
                if (!confirm(t('chat.confirmRemoveHandle', 'Remove the handle for this chat?'))) return;
                const success = await performChatSettingsAction('remove_handle', chatId, {}, { skipCloseModal: true });
                if (success) {
                    ui.closeModal(state.dom.editHandleModal);
                    openChatSettings(chatId);
                }
            };
            ui.openModal(state.dom.editHandleModal);
        }

        async function performChatSettingsAction(action, chatId, extra = {}, options = {}) {
            if (!state.currentUser) return false;
            const session = getValidSession();
            if (!session?.token) {
                handleLogoutSequence(false);
                return false;
            }
            try {
                const res = await fetch(resolveServerUrl('/chat/settings'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-User-ID': state.currentUser.userId, 'X-Auth-Token': session?.token },
                    body: JSON.stringify({ action, chatId, ...extra })
                });
                const result = await res.json();
                if (!res.ok || !result.success) { showErrorModal(t('error.actionFailedTitle', 'Action Failed'), result.error || t('error.serverRejectedAction', 'Server rejected action')); return false; }

                // Update local state accordingly
                if (action === 'remove_handle') {
                    if (state.allChats[chatId]) { state.allChats[chatId].handle = null; ui.renderContactList(); }
                    if (state.chatSettingsProfiles[chatId]) state.chatSettingsProfiles[chatId].handle = null;
                } else if (action === 'set_handle') {
                    const nextHandle = result.handle || (extra.handle ? `@${String(extra.handle).replace(/^@/, '')}` : null);
                    if (state.allChats[chatId]) { state.allChats[chatId].handle = nextHandle; ui.renderContactList(); }
                    if (state.chatSettingsProfiles[chatId]) state.chatSettingsProfiles[chatId].handle = nextHandle;
                } else if (action === 'update_profile') {
                    if (state.allChats[chatId]) {
                        state.allChats[chatId].chatName = result.chatName || extra.chatName || state.allChats[chatId].chatName;
                        state.allChats[chatId].bio = typeof result.bio === 'string' ? result.bio : (typeof extra.bio === 'string' ? extra.bio : state.allChats[chatId].bio);
                    }
                    if (state.chatSettingsProfiles[chatId]) {
                        state.chatSettingsProfiles[chatId].chatName = result.chatName || extra.chatName || state.chatSettingsProfiles[chatId].chatName;
                        state.chatSettingsProfiles[chatId].bio = typeof result.bio === 'string' ? result.bio : (typeof extra.bio === 'string' ? extra.bio : state.chatSettingsProfiles[chatId].bio);
                    }
                    ui.renderContactList();
                } else if (action === 'set_seen_receipts') {
                    if (state.allChats[chatId] && Object.prototype.hasOwnProperty.call(extra, 'enabled')) {
                        state.allChats[chatId].seenReceiptsEnabled = Boolean(extra.enabled);
                        if (state.chatSettingsProfiles[chatId]) state.chatSettingsProfiles[chatId].seenReceiptsEnabled = Boolean(extra.enabled);
                        if (state.currentChat?.chatId === chatId) {
                            state.currentChat.seenReceiptsEnabled = Boolean(extra.enabled);
                            openChat(state.currentChat, true);
                        }
                        ui.renderContactList();
                    }
                } else if (action === 'set_permissions') {
                    if (state.chatSettingsProfiles[chatId] && result.permissions) {
                        state.chatSettingsProfiles[chatId].permissions = result.permissions;
                    }
                } else if (action === 'transfer_ownership') {
                    if (state.allChats[chatId] && result.ownerId) state.allChats[chatId].ownerId = result.ownerId;
                    if (state.chatSettingsProfiles[chatId]) {
                        state.chatSettingsProfiles[chatId].ownerId = result.ownerId;
                        if (result.adminIds) state.chatSettingsProfiles[chatId].adminIds = result.adminIds;
                    }
                    ui.renderContactList();
                } else if (action === 'remove_member') {
                    const mid = extra.memberId;
                    if (state.allChats[chatId]) { state.allChats[chatId].members = (state.allChats[chatId].members || []).filter(m => m !== mid); ui.renderContactList(); }
                    if (mid === state.currentUser.userId && state.currentChat && state.currentChat.chatId === chatId) { state.currentChat = null; ui.showApp(); }
                } else if (action === 'add_members') {
                    if (state.allChats[chatId] && result.members) { 
                        state.allChats[chatId].members = result.members; 
                        ui.renderContactList(); 
                        if (state.chatSettingsProfiles[chatId]) state.chatSettingsProfiles[chatId].members = result.members;
                        openChatSettings(chatId); 
                    }
                } else if (action === 'delete_chat' || action === 'delete_private_chat' || action === 'leave_chat') {
                    removeChatLocally(chatId);
                    delete state.chatSettingsProfiles[chatId];
                    if (!options.suppressSuccessRender) {
                        ui.renderContactList();
                    }
                }

                if (!options.skipCloseModal) {
                    ui.closeModal(state.dom.chatSettingsModal || document.getElementById('chatSettingsModal'));
                }
                return true;
            } catch (err) {
                showErrorModal(t('error.networkTitle', 'Network Error'), err.message || t('error.requestFailed', 'Request failed'));
                return false;
            }
        }

        // Add members modal
        function openAddMembersModal(chatId) {
            const chat = state.allChats[chatId];
            if (!chat) return;
            const existing = document.getElementById('addMembersModal');
            if (existing) existing.remove();
            
            const modal = document.createElement('div');
            modal.id = 'addMembersModal';
            modal.className = 'fixed inset-0 modal-bg items-center justify-center z-[60] p-4 flex';
            const currentMembers = chat.members || [];
            const selectedMembers = {};
            
            const memberListHtml = Object.values(state.allUsers)
                .filter(u => u && u.userId && !currentMembers.includes(u.userId) && state.contactIds.has(u.userId))
                .map(user => {
                    const avatar = generateAvatar(user.username, user.userId, user.avatarUrl);
                    return `<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="member-checkbox h-4 w-4 rounded" value="${escapeAttr(user.userId)}">
                        <div class="w-10 h-10 avatar-circle flex-shrink-0" style="background-image: url('${escapeAttr(avatar.url)}'); background-color: ${avatar.color};">${avatar.initial}</div>
                        <div class="flex-1">
                            <div class="font-semibold">${renderDisplayName(user.username, Boolean(user.isVerified), Boolean(user.isBot), user.membershipTier, user.nicknameFont, user.premiumStarIcon)}</div>
                            <div class="text-xs text-gray-500">${escapeHtml(getPresenceLabel(user))}</div>
                        </div>
                    </label>`;
                }).join('');
            
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl w-full max-w-md modal-content">
                    <div class="p-4 border-b flex justify-between items-center">
                        <h2 class="text-xl font-bold">${escapeHtml(tr('chat.addMembersTo', 'Add Members to {chat}', { chat: chat.chatName || t('chat.chatFallback', 'Chat') }))}</h2>
                        <button class="text-xl p-2" data-action="close-add-members-modal">&times;</button>
                    </div>
                    <div class="px-4 pt-3 text-xs app-text-muted">${escapeHtml(t('chat.contactsOnlyMembers', 'Only your contacts can be added here.'))}</div>
                    <div id="addMembersListContainer" class="p-2 max-h-80 overflow-y-auto custom-scrollbar space-y-2">${memberListHtml || `<div class="text-center text-gray-500 p-4">${escapeHtml(t('chat.noMembersToAdd', 'No members to add'))}</div>`}</div>
                    <div class="p-4 bg-gray-50 border-t flex justify-end items-center gap-2">
                        <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg interactive-pop" data-action="close-add-members-modal">${escapeHtml(t('common.cancel', 'Cancel'))}</button>
                        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg interactive-pop" id="confirmAddMembersBtn">${escapeHtml(t('chat.addSelected', 'Add Selected'))}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelectorAll('[data-action="close-add-members-modal"]').forEach((btn) => {
                btn.addEventListener('click', () => modal.remove());
            });
            
            document.querySelectorAll('#addMembersModal .member-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    selectedMembers[e.target.value] = e.target.checked;
                });
            });
            
            document.getElementById('confirmAddMembersBtn').addEventListener('click', async () => {
                const selected = Object.keys(selectedMembers).filter(id => selectedMembers[id]);
                if (selected.length === 0) { alert(t('chat.selectAtLeastOneMember', 'Select at least one member')); return; }
                await performChatSettingsAction('add_members', chatId, { memberIds: selected });
                modal.remove();
            });
        }

        function openTransferOwnershipModal(chatId) {
            const chat = state.allChats[chatId];
            const profile = state.chatSettingsProfiles[chatId];
            if (!chat || !profile) return;
            const existing = document.getElementById('transferOwnershipModal');
            if (existing) existing.remove();
            const ownerId = profile.ownerId || chat.ownerId;
            const eligibleMembers = (profile.members || chat.members || [])
                .filter((memberId) => memberId && memberId !== ownerId && memberId !== 'anonymous')
                .map((memberId) => state.allUsers[memberId])
                .filter(Boolean);
            const modal = document.createElement('div');
            modal.id = 'transferOwnershipModal';
            modal.className = 'fixed inset-0 modal-bg items-center justify-center z-[61] p-4 flex';
            let selectedMemberId = '';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl w-full max-w-md modal-content">
                    <div class="p-4 border-b flex justify-between items-center">
                        <h2 class="text-xl font-bold">${escapeHtml(t('chat.transferOwnership', 'Transfer Ownership'))}</h2>
                        <button class="text-xl p-2" data-action="close-transfer-ownership">&times;</button>
                    </div>
                    <div class="p-2 max-h-80 overflow-y-auto custom-scrollbar space-y-2">
                        ${eligibleMembers.length ? eligibleMembers.map((user) => {
                            const avatar = generateAvatar(getUserDisplayName(user), user.userId, user.avatarUrl);
                            return `<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="radio" name="transferOwnershipMember" class="h-4 w-4 rounded" value="${escapeAttr(user.userId)}">
                                <div class="w-10 h-10 avatar-circle flex-shrink-0" style="background-image: url('${escapeAttr(avatar.url)}'); background-color: ${avatar.color};">${avatar.initial}</div>
                                <div class="flex-1">
                                    <div class="font-semibold">${renderDisplayName(getUserDisplayName(user), Boolean(user.isVerified), Boolean(user.isBot), user.membershipTier, user.nicknameFont, user.premiumStarIcon)}</div>
                                    <div class="text-xs text-gray-500">${escapeHtml(getPresenceLabel(user))}</div>
                                </div>
                            </label>`;
                        }).join('') : `<div class="text-center text-gray-500 p-4">${escapeHtml(t('chat.noEligibleOwnerTarget', 'No eligible members found.'))}</div>`}
                    </div>
                    <div class="p-4 bg-gray-50 border-t flex justify-end items-center gap-2">
                        <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg interactive-pop" data-action="close-transfer-ownership">${escapeHtml(t('common.cancel', 'Cancel'))}</button>
                        <button class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg interactive-pop" id="confirmTransferOwnershipBtn">${escapeHtml(t('chat.confirmTransferOwnership', 'Transfer Ownership'))}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelectorAll('[data-action="close-transfer-ownership"]').forEach((button) => {
                button.addEventListener('click', () => modal.remove());
            });
            modal.querySelectorAll('input[name="transferOwnershipMember"]').forEach((input) => {
                input.addEventListener('change', (event) => {
                    selectedMemberId = String(event.target.value || '');
                });
            });
            modal.querySelector('#confirmTransferOwnershipBtn')?.addEventListener('click', async () => {
                if (!selectedMemberId) {
                    showErrorModal(t('chat.transferOwnership', 'Transfer Ownership'), t('chat.selectOwnershipTarget', 'Select a member first.'));
                    return;
                }
                const confirmed = confirm(t('chat.transferOwnershipConfirmPrompt', 'Transfer ownership to this member?'));
                if (!confirmed) return;
                const success = await performChatSettingsAction('transfer_ownership', chatId, { memberId: selectedMemberId });
                if (!success) return;
                modal.remove();
                closeChatAdminSettingsModal();
                await fetchChatSettingsProfile(chatId, true);
                openChatSettings(chatId, 'bio');
            });
        }

        function showPremiumFallbackIcon() {
            state.dom.premiumStarCanvas?.classList.add('hidden');
            state.dom.premiumStarFallback?.classList.remove('hidden');
        }

        function resizePremiumPreview() {
            const renderer = premiumPreviewState.renderer;
            const canvas = premiumPreviewState.activeCanvas;
            const camera = premiumPreviewState.camera;
            if (!renderer || !canvas || !camera) return;
            const rect = canvas.getBoundingClientRect();
            const size = Math.max(120, Math.min(rect.width || 160, rect.height || 160));
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
            renderer.setSize(size, size, false);
            camera.aspect = 1;
            camera.updateProjectionMatrix();
            const particlesCanvas = state.dom.premiumParticlesCanvas;
            if (particlesCanvas) {
                const parentRect = particlesCanvas.getBoundingClientRect();
                particlesCanvas.width = Math.max(1, Math.floor(parentRect.width));
                particlesCanvas.height = Math.max(1, Math.floor(parentRect.height));
                premiumPreviewState.particlesCanvas = particlesCanvas;
                premiumPreviewState.particlesCtx = particlesCanvas.getContext('2d');
            }
            if (!premiumPreviewState.particles.length) {
                premiumPreviewState.particles = Array.from({ length: 24 }, () => ({
                    angle: Math.random() * Math.PI * 2,
                    radius: 44 + Math.random() * 50,
                    speed: 0.18 + Math.random() * 0.42,
                    size: 1.4 + Math.random() * 2.8,
                    alpha: 0.2 + Math.random() * 0.55,
                    wobble: Math.random() * Math.PI * 2
                }));
            }
        }

        function drawPremiumParticles(tsSeconds) {
            const canvas = premiumPreviewState.particlesCanvas;
            const ctx = premiumPreviewState.particlesCtx;
            if (!canvas || !ctx) return;
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const baseRadius = Math.min(w, h) * 0.24;
            const isSilver = state.subscriptionModalTier === 'silver';
            const outerColor = isSilver ? '203, 213, 225' : '168, 85, 247';
            const innerColor = isSilver ? '255, 255, 255' : '255, 255, 255';
            ctx.clearRect(0, 0, w, h);
            for (const particle of premiumPreviewState.particles) {
                particle.angle += particle.speed * 0.0026;
                particle.wobble += 0.03;
                const radius = baseRadius + particle.radius * 0.55 + Math.sin(tsSeconds * 1.7 + particle.wobble) * 8;
                const x = cx + Math.cos(particle.angle) * radius * 1.15;
                const y = cy + Math.sin(particle.angle) * radius * 0.88;
                const size = particle.size * (1 + Math.sin(tsSeconds * 2.3 + particle.wobble) * 0.18);
                const alpha = particle.alpha * (0.72 + Math.sin(tsSeconds * 2 + particle.wobble) * 0.28);
                ctx.fillStyle = `rgba(${outerColor}, ${Math.max(0.08, alpha)})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(${innerColor}, ${Math.max(0.08, alpha * 0.65)})`;
                ctx.beginPath();
                ctx.arc(x, y, Math.max(0.5, size * 0.42), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function applyPremiumPreviewPalette() {
            const isSilver = state.subscriptionModalTier === 'silver';
            if (premiumPreviewState.material) {
                premiumPreviewState.material.color.setHex(isSilver ? 0xcbd5e1 : 0x9f4fff);
                premiumPreviewState.material.emissive.setHex(isSilver ? 0x94a3b8 : 0x5b21b6);
                premiumPreviewState.material.emissiveIntensity = isSilver ? 0.18 : 0.24;
                premiumPreviewState.material.needsUpdate = true;
            }
            state.dom.premiumModal?.querySelector('.premium-modal')?.classList.toggle('is-silver', isSilver);
            state.dom.premiumPaymentModal?.querySelector('.premium-payment-modal')?.classList.toggle('is-silver', isSilver);
        }

        function getSubscriptionModalContent(tier = 'premium') {
            if (tier === 'silver') {
                return {
                    title: t('premium.silverHeroTitle', 'Get Silver'),
                    lines: [
                        t('premium.silverBenefitCapacity', 'Create up to 7 Groups/Channels'),
                        t('premium.silverBenefitFiles', 'Upload files up to 50mb!'),
                        t('premium.silverBenefitFonts', 'Have custom fonts on your Name!'),
                        t('premium.silverBenefitStars', 'Get 40 Stars for FREE!'),
                    t('premium.silverBenefitDeepSeek', 'Talk with AI models'),
                    ],
                    buyLabel: t('premium.buySilverNow', 'Buy Silver'),
                    paymentTitle: t('premium.silverPaymentTitle', 'Silver Payment'),
                    paymentAmount: t('premium.silverPaymentAmount', '35,000 Tomans'),
                    paymentInstructions: t('premium.silverPaymentInstructions', 'Send the payment to the card below, then upload the receipt image for Silver review.'),
                    submitLabel: t('premium.submitSilverPayment', 'Send Silver Payment Request')
                };
            }
            return {
                title: t('premium.heroTitleDefault', 'Get Premium'),
                lines: [
                    t('premium.benefitQuality', 'Stream with much better Quality!'),
                    t('premium.benefitCapacity', 'Create up to 10 Groups/Channels'),
                    t('premium.benefitOutsideIran', 'Talk with AI models'),
                    t('premium.benefitFiles', 'Upload files up to 100mb!'),
                    t('premium.benefitFonts', 'Have custom fonts on your Name!'),
                    t('premium.benefitColors', 'Color everything on your Profile!'),
                    t('premium.benefitStars', 'Get 100 Stars for FREE!')
                ],
                buyLabel: t('premium.buy', 'Buy Premium'),
                paymentTitle: t('premium.paymentTitle', 'Premium Payment'),
                paymentAmount: t('premium.paymentAmount', '50,000 Tomans'),
                paymentInstructions: t('premium.paymentInstructions', 'Send the payment to the card below, then upload the receipt image.'),
                submitLabel: t('premium.submitPayment', 'Send Payment Request')
            };
        }

        function resolveSubscriptionModalContext() {
            const currentTierRank = getMembershipTierRank(getCurrentViewerMembershipTier());
            const actionTier = String(state.subscriptionModalAction || '').toLowerCase();
            const modalTier = String(state.subscriptionModalTier || '').toLowerCase();
            const modalSource = String(state.subscriptionModalSource || '').toLowerCase();
            const isProfileBadgeContext = modalSource === 'profile_badge';
            const isOwnedContext = isProfileBadgeContext && !actionTier && ((modalTier === 'silver' && currentTierRank >= 1) || (modalTier === 'premium' && currentTierRank >= 2) || (!modalTier && currentTierRank >= 2));
            if (isOwnedContext) {
                return {
                    displayTier: modalTier || 'premium',
                    actionTier: '',
                    owned: true,
                    source: 'profile_badge',
                    title: t('premium.alreadyHaveIt', 'You have it Already!'),
                    buyLabel: t('profile.viewProfile', 'View Profile'),
                    paymentTitle: modalTier === 'silver'
                        ? t('premium.silverPaymentTitle', 'Silver Payment')
                        : t('premium.paymentTitle', 'Premium Payment'),
                    paymentAmount: modalTier === 'silver'
                        ? t('premium.silverPaymentAmount', '35,000 Tomans')
                        : t('premium.paymentAmount', '50,000 Tomans'),
                    paymentInstructions: modalTier === 'silver'
                        ? t('premium.silverPaymentInstructions', 'Send the payment to the card below, then upload the receipt image for Silver review.')
                        : t('premium.paymentInstructions', 'Send the payment to the card below, then upload the receipt image.'),
                    submitLabel: t('profile.viewProfile', 'View Profile')
                };
            }
            if (modalSource === 'premium_theme') {
                if (actionTier === 'premium_upgrade' || currentTierRank >= 1) {
                    return {
                        displayTier: 'premium',
                        actionTier: 'premium_upgrade',
                        title: t('premium.upgradeToPremium', 'Upgrade to Premium'),
                        buyLabel: t('premium.upgradeToPremium', 'Upgrade to Premium'),
                        paymentTitle: t('premium.upgradePaymentTitle', 'Premium Upgrade Payment'),
                        paymentAmount: t('premium.upgradePaymentAmount', '15,000 Tomans'),
                        paymentInstructions: t('premium.upgradePaymentInstructions', 'Send the payment to the card below, then upload the receipt image to upgrade to Premium.'),
                        submitLabel: t('premium.submitUpgradePayment', 'Send Upgrade Request')
                    };
                }
                return {
                    displayTier: 'premium',
                    actionTier: 'premium',
                    title: t('premium.heroTitleDefault', 'Get Premium'),
                    buyLabel: t('premium.buy', 'Buy Premium'),
                    paymentTitle: t('premium.paymentTitle', 'Premium Payment'),
                    paymentAmount: t('premium.paymentAmount', '50,000 Tomans'),
                    paymentInstructions: t('premium.paymentInstructions', 'Send the payment to the card below, then upload the receipt image.'),
                    submitLabel: t('premium.submitPayment', 'Send Payment Request')
                };
            }
            if (modalSource === 'subscription_menu' && !actionTier && modalTier === 'premium' && currentTierRank >= 2) {
                return {
                    displayTier: 'premium',
                    actionTier: '',
                    source: modalSource || 'subscription_menu',
                    title: t('premium.title', 'Premium'),
                    buyLabel: t('premium.buy', 'Buy Premium'),
                    paymentTitle: t('premium.paymentTitle', 'Premium Payment'),
                    paymentAmount: t('premium.paymentAmount', '50,000 Tomans'),
                    paymentInstructions: t('premium.paymentInstructions', 'Send the payment to the card below, then upload the receipt image.'),
                    submitLabel: t('premium.submitPayment', 'Send Payment Request')
                };
            }
            if (modalSource === 'profile_badge_upgrade' && modalTier === 'premium') {
                return {
                    displayTier: 'premium',
                    actionTier: 'premium_upgrade',
                    source: 'profile_badge_upgrade',
                    title: t('premium.upgradeToPremium', 'Upgrade to Premium'),
                    buyLabel: t('premium.upgradeToPremium', 'Upgrade to Premium'),
                    paymentTitle: t('premium.upgradePaymentTitle', 'Premium Upgrade Payment'),
                    paymentAmount: t('premium.upgradePaymentAmount', '15,000 Tomans'),
                    paymentInstructions: t('premium.upgradePaymentInstructions', 'Send the payment to the card below, then upload the receipt image to upgrade to Premium.'),
                    submitLabel: t('premium.submitUpgradePayment', 'Send Upgrade Request')
                };
            }
            if (actionTier === 'premium_upgrade' && modalTier === 'premium') {
                return {
                    displayTier: 'premium',
                    actionTier: 'premium_upgrade',
                    title: t('premium.upgradeToPremium', 'Upgrade to Premium'),
                    buyLabel: t('premium.upgradeToPremium', 'Upgrade to Premium'),
                    paymentTitle: t('premium.upgradePaymentTitle', 'Premium Upgrade Payment'),
                    paymentAmount: t('premium.upgradePaymentAmount', '15,000 Tomans'),
                    paymentInstructions: t('premium.upgradePaymentInstructions', 'Send the payment to the card below, then upload the receipt image to upgrade to Premium.'),
                    submitLabel: t('premium.submitUpgradePayment', 'Send Upgrade Request')
                };
            }
            if (actionTier === 'premium_upgrade' || (currentTierRank >= 1 && !actionTier && modalTier === 'silver')) {
                return {
                    displayTier: 'silver',
                    actionTier: 'premium_upgrade',
                    title: t('premium.silverTitle', 'Silver'),
                    buyLabel: t('premium.upgradeSubscription', 'Upgrade Subscription'),
                    paymentTitle: t('premium.upgradePaymentTitle', 'Premium Upgrade Payment'),
                    paymentAmount: t('premium.upgradePaymentAmount', '15,000 Tomans'),
                    paymentInstructions: t('premium.upgradePaymentInstructions', 'Send the payment to the card below, then upload the receipt image to upgrade to Premium.'),
                    submitLabel: t('premium.submitUpgradePayment', 'Send Upgrade Request')
                };
            }
            if (actionTier === 'silver') {
                return {
                    displayTier: 'silver',
                    actionTier: 'silver',
                    title: t('premium.silverHeroTitle', 'Get Silver'),
                    buyLabel: t('premium.buySilverNow', 'Buy Silver'),
                    paymentTitle: t('premium.silverPaymentTitle', 'Silver Payment'),
                    paymentAmount: t('premium.silverPaymentAmount', '35,000 Tomans'),
                    paymentInstructions: t('premium.silverPaymentInstructions', 'Send the payment to the card below, then upload the receipt image for Silver review.'),
                    submitLabel: t('premium.submitSilverPayment', 'Send Silver Payment Request')
                };
            }
            return {
                displayTier: 'premium',
                actionTier: 'premium',
                title: t('premium.heroTitleDefault', 'Get Premium'),
                buyLabel: t('premium.buy', 'Buy Premium'),
                paymentTitle: t('premium.paymentTitle', 'Premium Payment'),
                paymentAmount: t('premium.paymentAmount', '50,000 Tomans'),
                paymentInstructions: t('premium.paymentInstructions', 'Send the payment to the card below, then upload the receipt image.'),
                submitLabel: t('premium.submitPayment', 'Send Payment Request')
            };
        }

        function applySubscriptionModalContent() {
            const context = resolveSubscriptionModalContext();
            const content = getSubscriptionModalContent(context.displayTier);
            const activeTier = getCurrentViewerMembershipTier();
            const hasActiveSubscription = Boolean(activeTier);
            state.subscriptionModalTier = context.displayTier;
            state.subscriptionModalAction = context.actionTier;
            state.subscriptionModalSource = context.source || state.subscriptionModalSource;
            if (state.dom.premiumHeroTitle) {
                state.dom.premiumHeroTitle.textContent = context.title;
            }
            for (let index = 0; index < 7; index += 1) {
                const lineEl = state.dom[`premiumBenefitLine${index + 1}`];
                if (!lineEl) continue;
                const line = content.lines[index] || '';
                lineEl.textContent = line;
                lineEl.classList.toggle('hidden', !line);
            }
            if (state.dom.premiumBuyButtonLabel) {
                state.dom.premiumBuyButtonLabel.textContent = context.buyLabel || content.buyLabel;
            }
            if (state.dom.premiumPaymentKicker) {
                state.dom.premiumPaymentKicker.textContent = context.paymentTitle;
            }
            if (state.dom.premiumPaymentAmount) {
                state.dom.premiumPaymentAmount.textContent = context.paymentAmount;
            }
            if (state.dom.premiumPaymentHelp) {
                state.dom.premiumPaymentHelp.textContent = context.paymentInstructions;
            }
            if (state.dom.submitPremiumPaymentLabel) {
                state.dom.submitPremiumPaymentLabel.textContent = context.submitLabel;
            }
            if (state.dom.premiumBuyButton) {
                state.dom.premiumBuyButton.classList.toggle('hidden', !context.actionTier || Boolean(context.owned));
            }
            if (state.dom.premiumSilverUpsellButton) {
                const showUpsell = !hasActiveSubscription
                    && (state.subscriptionModalSource === 'subscription' || state.subscriptionModalSource === 'subscription_menu')
                    && context.displayTier === 'premium'
                    && context.actionTier === 'premium';
                state.dom.premiumSilverUpsellButton.classList.toggle('hidden', !showUpsell);
            }
            if (state.dom.premiumCancelButton) {
                state.dom.premiumCancelButton.classList.toggle('hidden', !hasActiveSubscription || Boolean(context.owned));
            }
            if (state.dom.premiumViewProfileButton) {
                state.dom.premiumViewProfileButton.textContent = context.buyLabel || t('profile.viewProfile', 'View Profile');
                state.dom.premiumViewProfileButton.classList.toggle('hidden', !context.owned);
            }
            applyPremiumPreviewPalette();
        }

        function animatePremiumPreview(ts = performance.now()) {
            if (!premiumPreviewState.renderer || !premiumPreviewState.scene || !premiumPreviewState.camera || !premiumPreviewState.mesh) return;
            if (state.dom.premiumModal?.classList.contains('hidden')) {
                premiumPreviewState.frameHandle = 0;
                return;
            }
            if (premiumPreviewState.lastRenderTs && ts - premiumPreviewState.lastRenderTs < 33) {
                premiumPreviewState.frameHandle = requestAnimationFrame(animatePremiumPreview);
                return;
            }
            premiumPreviewState.lastRenderTs = ts;
            const tsSeconds = ts / 1000;
            if (!premiumPreviewState.dragging) {
                premiumPreviewState.targetX = premiumPreviewState.baseX + Math.sin(tsSeconds * 1.35) * 0.045;
                premiumPreviewState.targetY = premiumPreviewState.baseY + Math.cos(tsSeconds * 1.1) * 0.055;
            }
            premiumPreviewState.currentX += (premiumPreviewState.targetX - premiumPreviewState.currentX) * 0.12;
            premiumPreviewState.currentY += (premiumPreviewState.targetY - premiumPreviewState.currentY) * 0.12;
            premiumPreviewState.mesh.rotation.x = premiumPreviewState.currentX;
            premiumPreviewState.mesh.rotation.y = premiumPreviewState.currentY;
            drawPremiumParticles(tsSeconds);
            premiumPreviewState.renderer.render(premiumPreviewState.scene, premiumPreviewState.camera);
            premiumPreviewState.frameHandle = requestAnimationFrame(animatePremiumPreview);
        }

        function stopPremiumPreview() {
            if (premiumPreviewState.frameHandle) {
                cancelAnimationFrame(premiumPreviewState.frameHandle);
                premiumPreviewState.frameHandle = 0;
            }
            premiumPreviewState.dragging = false;
            premiumPreviewState.pointerId = null;
        }

        function destroyPremiumPreview() {
            stopPremiumPreview();
            if (premiumPreviewState.renderer) {
                try {
                    premiumPreviewState.renderer.setAnimationLoop?.(null);
                    premiumPreviewState.renderer.dispose?.();
                } catch (error) {
                    console.warn('Premium preview renderer cleanup failed', error);
                }
            }
            if (premiumPreviewState.scene) {
                premiumPreviewState.scene.traverse((child) => {
                    if (!child?.isMesh) return;
                    child.geometry?.dispose?.();
                    if (Array.isArray(child.material)) {
                        child.material.forEach((material) => material?.dispose?.());
                    } else {
                        child.material?.dispose?.();
                    }
                });
            }
            premiumPreviewState.renderer = null;
            premiumPreviewState.scene = null;
            premiumPreviewState.camera = null;
            premiumPreviewState.mesh = null;
            premiumPreviewState.material = null;
            premiumPreviewState.activeCanvas = null;
            premiumPreviewState.currentX = premiumPreviewState.baseX;
            premiumPreviewState.currentY = premiumPreviewState.baseY;
            premiumPreviewState.targetX = premiumPreviewState.baseX;
            premiumPreviewState.targetY = premiumPreviewState.baseY;
            premiumPreviewState.dragging = false;
            premiumPreviewState.pointerId = null;
            premiumPreviewState.initialized = false;
            premiumPreviewState.lastRenderTs = 0;
            state.dom.premiumStarCanvas?.classList.add('hidden');
            state.dom.premiumStarFallback?.classList.remove('hidden');
        }

        async function ensurePremiumPreview() {
            if (premiumPreviewState.failed) {
                premiumPreviewState.failed = false;
            }
            if (premiumPreviewState.initialized) {
                state.dom.premiumStarCanvas?.classList.remove('hidden');
                state.dom.premiumStarFallback?.classList.add('hidden');
                premiumPreviewState.activeCanvas = premiumPreviewState.renderer?.domElement || state.dom.premiumStarCanvas;
                applyPremiumPreviewPalette();
                resizePremiumPreview();
                if (!premiumPreviewState.frameHandle) animatePremiumPreview();
                return;
            }
            try {
                const THREE = await import('../../vendor/three/build/three.module.js');
                const { OBJLoader } = await import('../../vendor/three/examples/jsm/loaders/OBJLoader.js');
                const canvas = state.dom.premiumStarCanvas;
                if (!canvas) return;
                const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
                camera.position.set(0, 0, 9);
                scene.add(new THREE.AmbientLight(0xffffff, 1.3));
                const lightA = new THREE.DirectionalLight(0xf5d0fe, 1.8);
                lightA.position.set(4, 5, 8);
                scene.add(lightA);
                const lightB = new THREE.DirectionalLight(0xffffff, 0.9);
                lightB.position.set(-5, -2, 6);
                scene.add(lightB);
                const loader = new OBJLoader();
                const obj = await new Promise((resolve, reject) => {
                    loader.load(new URL('../../telegram_star.obj', import.meta.url).href, resolve, undefined, reject);
                });
                const material = new THREE.MeshPhysicalMaterial({
                    color: 0x9f4fff,
                    emissive: 0x5b21b6,
                    emissiveIntensity: 0.24,
                    metalness: 0.2,
                    roughness: 0.22,
                    clearcoat: 0.8,
                    clearcoatRoughness: 0.18
                });
                obj.traverse((child) => {
                    if (child.isMesh) {
                        child.material = material;
                        child.castShadow = false;
                        child.receiveShadow = false;
                    }
                });
                const box = new THREE.Box3().setFromObject(obj);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                obj.position.sub(center);
                const maxSize = Math.max(size.x, size.y, size.z) || 1;
                const scale = 4.35 / maxSize;
                obj.scale.setScalar(scale);
                obj.rotation.x = premiumPreviewState.baseX;
                obj.rotation.y = premiumPreviewState.baseY;
                scene.add(obj);
                premiumPreviewState.initialized = true;
                premiumPreviewState.renderer = renderer;
                premiumPreviewState.scene = scene;
                premiumPreviewState.camera = camera;
                premiumPreviewState.mesh = obj;
                premiumPreviewState.material = material;
                premiumPreviewState.activeCanvas = renderer.domElement;
                premiumPreviewState.currentX = premiumPreviewState.targetX = premiumPreviewState.baseX;
                premiumPreviewState.currentY = premiumPreviewState.targetY = premiumPreviewState.baseY;
                applyPremiumPreviewPalette();
                resizePremiumPreview();
                if (!premiumPreviewState.interactionBound) {
                    canvas.addEventListener('pointerdown', (event) => {
                        premiumPreviewState.dragging = true;
                        premiumPreviewState.pointerId = event.pointerId;
                        premiumPreviewState.lastX = event.clientX;
                        premiumPreviewState.lastY = event.clientY;
                        canvas.classList.add('is-dragging');
                        canvas.setPointerCapture?.(event.pointerId);
                    });
                    canvas.addEventListener('pointermove', (event) => {
                        if (!premiumPreviewState.dragging || premiumPreviewState.pointerId !== event.pointerId) return;
                        const deltaX = event.clientX - premiumPreviewState.lastX;
                        const deltaY = event.clientY - premiumPreviewState.lastY;
                        premiumPreviewState.lastX = event.clientX;
                        premiumPreviewState.lastY = event.clientY;
                        premiumPreviewState.targetY += deltaX * 0.015;
                        premiumPreviewState.targetX += deltaY * 0.01;
                    });
                    const endDrag = (event) => {
                        if (event && premiumPreviewState.pointerId !== event.pointerId) return;
                        premiumPreviewState.dragging = false;
                        premiumPreviewState.pointerId = null;
                        premiumPreviewState.targetX = premiumPreviewState.baseX;
                        premiumPreviewState.targetY = premiumPreviewState.baseY;
                        canvas.classList.remove('is-dragging');
                    };
                    canvas.addEventListener('pointerup', endDrag);
                    canvas.addEventListener('pointercancel', endDrag);
                    canvas.addEventListener('pointerleave', endDrag);
                    window.addEventListener('resize', resizePremiumPreview);
                    premiumPreviewState.interactionBound = true;
                }
                state.dom.premiumStarFallback?.classList.add('hidden');
                canvas.classList.remove('hidden');
                animatePremiumPreview();
            } catch (error) {
                console.error('Premium preview failed', error);
                showPremiumFallbackIcon();
            }
        }

        async function openPremiumModal(tier = '', source = '') {
            if (!state.dom.premiumModal) return;
            const currentTierRank = getMembershipTierRank(getCurrentViewerMembershipTier());
            const preferredTier = String(tier || '').toLowerCase();
            const preferredSource = String(source || '').toLowerCase();
            const preferredTierRank = getMembershipTierRank(preferredTier === 'silver' ? 'silver' : preferredTier === 'premium' ? 'premium' : '');
            if (premiumPreviewState.initialized || premiumPreviewState.frameHandle) {
                destroyPremiumPreview();
            }
            if (preferredTier === 'premium' || preferredTier === 'silver') {
                if (currentTierRank >= preferredTierRank) {
                    state.subscriptionModalTier = preferredTier;
                    state.subscriptionModalAction = '';
                    state.subscriptionModalSource = preferredSource || 'profile_badge';
                } else if (preferredSource === 'profile_badge' && preferredTier === 'premium' && currentTierRank >= 1) {
                    state.subscriptionModalTier = 'premium';
                    state.subscriptionModalAction = 'premium_upgrade';
                    state.subscriptionModalSource = 'profile_badge_upgrade';
                } else {
                    state.subscriptionModalTier = preferredTier;
                    state.subscriptionModalAction = preferredTier === 'silver' ? 'silver' : 'premium';
                    state.subscriptionModalSource = preferredSource || (preferredTier === 'silver' ? 'silver_purchase' : 'subscription');
                }
            } else if (preferredTier === 'premium_theme') {
                if (currentTierRank >= 1) {
                    state.subscriptionModalTier = 'premium';
                    state.subscriptionModalAction = 'premium_upgrade';
                    state.subscriptionModalSource = 'premium_theme';
                } else {
                    state.subscriptionModalTier = 'premium';
                    state.subscriptionModalAction = 'premium';
                    state.subscriptionModalSource = 'premium_theme';
                }
            } else if (currentTierRank >= 2) {
                state.subscriptionModalTier = 'premium';
                state.subscriptionModalAction = '';
                state.subscriptionModalSource = preferredSource || 'subscription_menu';
            } else if (currentTierRank >= 1) {
                state.subscriptionModalTier = 'silver';
                state.subscriptionModalAction = 'premium_upgrade';
                state.subscriptionModalSource = preferredSource || 'subscription';
            } else {
                state.subscriptionModalTier = 'premium';
                state.subscriptionModalAction = 'premium';
                state.subscriptionModalSource = preferredSource || 'subscription';
            }
            applySubscriptionModalContent();
            ui.openModal(state.dom.premiumModal);
            await ensurePremiumPreview();
        }

        async function openSubscriptionMenuModal() {
            if (!state.dom.premiumModal) return;
            const currentTierRank = getMembershipTierRank(getCurrentViewerMembershipTier());
            if (premiumPreviewState.initialized || premiumPreviewState.frameHandle) {
                destroyPremiumPreview();
            }
            state.subscriptionModalSource = 'subscription_menu';
            if (currentTierRank >= 2) {
                state.subscriptionModalTier = 'premium';
                state.subscriptionModalAction = '';
            } else if (currentTierRank >= 1) {
                state.subscriptionModalTier = 'silver';
                state.subscriptionModalAction = 'premium_upgrade';
            } else {
                state.subscriptionModalTier = 'premium';
                state.subscriptionModalAction = 'premium';
            }
            applySubscriptionModalContent();
            ui.openModal(state.dom.premiumModal);
            await ensurePremiumPreview();
        }

        function resetPremiumPaymentPreview() {
            state.premiumReceiptFile = null;
            if (!state.dom.premiumReceiptInput) return;
            state.dom.premiumReceiptInput.value = '';
            if (state.dom.premiumReceiptPreview) {
                state.dom.premiumReceiptPreview.innerHTML = `<div class="premium-payment-preview-empty">${escapeHtml(t('premium.uploadReceipt', 'Upload receipt image'))}</div>`;
            }
        }

        function updatePremiumPaymentPreview(file) {
            state.premiumReceiptFile = file || null;
            if (!state.dom.premiumReceiptPreview) return;
            if (!file) {
                resetPremiumPaymentPreview();
                return;
            }
            const objectUrl = URL.createObjectURL(file);
            state.dom.premiumReceiptPreview.innerHTML = `<img src="${escapeAttr(objectUrl)}" alt="${escapeAttr(file.name || 'receipt')}">`;
            const image = state.dom.premiumReceiptPreview.querySelector('img');
            image?.addEventListener('load', () => URL.revokeObjectURL(objectUrl), { once: true });
        }

        function openPremiumPaymentModal() {
            if (!state.dom.premiumPaymentModal) return;
            if (!state.subscriptionModalAction) return;
            destroyPremiumPreview();
            ui.closeModal(state.dom.premiumModal);
            state.dom.premiumPaymentCardNumber.textContent = '';
            state.dom.premiumPaymentCardholderName.textContent = '';
            resetPremiumPaymentPreview();
            applySubscriptionModalContent();
            ui.openModal(state.dom.premiumPaymentModal);
        }

        async function cancelPremiumSubscription() {
            try {
                await authenticatedFetch('/subscription/cancel', {
                    method: 'POST',
                });
                destroyPremiumPreview();
                ui.closeModal(state.dom.premiumModal);
                showSuccessModal(
                    t('premium.title', 'Premium'),
                    t('premium.cancelledBody', 'Your subscription was cancelled.')
                );
            } catch (error) {
                showErrorModal(
                    t('premium.title', 'Premium'),
                    error.message || t('premium.cancelFailed', 'Could not cancel the subscription.')
                );
            }
        }

        function toggleScreenShareQuality() {
            const tier = String(state.currentUser?.membershipTier || '').toLowerCase();
            if (tier !== 'premium') {
                showErrorModal(t('premium.title', 'Premium'), t('voice.screenShareQualityPremiumOnly', '720p screen share is only available for Premium users.'));
                return;
            }
            state.preferredScreenShareQuality = state.preferredScreenShareQuality === '720p' ? '480p' : '720p';
            if (state.currentChat?.chatId) {
                ui.renderVoiceUI(state.currentChat.chatId);
            }
        }

        async function submitPremiumPaymentRequest() {
            if (!state.premiumReceiptFile) {
                showErrorModal(t('premium.paymentTitle', 'Premium Payment'), t('premium.receiptRequired', 'Upload the receipt image first.'));
                return;
            }
            if (!state.subscriptionModalAction) {
                showErrorModal(t('premium.title', 'Premium'), t('premium.paymentFailed', 'Could not send the payment request.'));
                return;
            }
            const formData = new FormData();
            formData.append('tier', state.subscriptionModalAction === 'premium_upgrade' ? 'premium_upgrade' : state.subscriptionModalAction === 'silver' ? 'silver' : 'premium');
            formData.append('receipt', state.premiumReceiptFile);
            try {
                state.dom.submitPremiumPaymentButton?.setAttribute('disabled', 'disabled');
                await authenticatedFetch('/payment/request', {
                    method: 'POST',
                    body: formData,
                });
                ui.closeModal(state.dom.premiumPaymentModal);
                showSuccessModal(t('premium.paymentSentTitle', 'Payment Request Sent'), t('premium.paymentSentBody', 'Your receipt was sent for review.'));
            } catch (error) {
                showErrorModal(t('premium.paymentTitle', 'Premium Payment'), error.message || t('premium.paymentFailed', 'Could not send the payment request.'));
            } finally {
                state.dom.submitPremiumPaymentButton?.removeAttribute('disabled');
            }
        }

        async function init() {
            ui.initDOM();
            await loadLanguage(resolvePreferredLanguage(), false);
            await applyEmojiMode(getStorage().loadEmojiMode(), false);
            ui.updateUiForAuthState(false);
            syncVoiceChatModule();
            setupEventListeners();
            state.mutedUserIds = new Set(getStorage().loadMutedUsers());
            state.mutedChatIds = new Set(getStorage().loadMutedChats());
            const savedTheme = getStorage().loadTheme();
            const savedThemePreset = getStorage().loadThemePreset();
            if (savedThemePreset && THEME_PRESETS[savedThemePreset]) {
                applyThemeCss('', false, savedThemePreset);
            } else if (savedTheme.includes(':root')) {
                applyThemeCss(savedTheme, false, '');
            } else if (savedTheme.trim()) {
                getStorage().clearTheme();
                getStorage().clearThemePreset();
            }
            else renderThemePresetSelection();
            
            // MODIFIED: Electron-specific logic
            if (window.electronAPI) {
                console.log("Running in Electron environment.");
                const { dom } = state;
                dom.updaterSection.classList.remove('hidden');
                dom.updaterStatus.textContent = localizeDigits(`You are on version ${state.currentAppVersion}.`);

                dom.checkUpdateButton.addEventListener('click', () => {
                    dom.updaterStatus.textContent = 'Checking for updates...';
                    window.electronAPI.checkForUpdate();
                });

                dom.downloadUpdateButton.addEventListener('click', () => {
                    dom.updaterStatus.textContent = 'Downloading update...';
                    dom.updaterProgressContainer.classList.remove('hidden');
                    dom.downloadUpdateButton.classList.add('hidden');
                    window.electronAPI.downloadUpdate();
                });

                dom.restartAndUpdateButton.addEventListener('click', () => {
                    window.electronAPI.restartApp();
                });

                window.electronAPI.onUpdateAvailable((info) => {
                    dom.updaterStatus.textContent = localizeDigits(`You are on version ${state.currentAppVersion}. Update to ${info.version} to stay current.`);
                    dom.checkUpdateButton.classList.add('hidden');
                    dom.downloadUpdateButton.classList.remove('hidden');
                });

                window.electronAPI.onUpdateNotAvailable((info) => {
                    dom.updaterStatus.textContent = `You are on the latest version (${info.version}).`;
                });

                window.electronAPI.onDownloadProgress((progressObj) => {
                    const percent = Math.floor(progressObj.percent);
                    dom.updaterProgressBar.style.width = `${percent}%`;
                    dom.updaterStatus.textContent = `Downloading... ${percent}%`;
                });

                window.electronAPI.onUpdateDownloaded(() => {
                    dom.updaterStatus.textContent = 'Update downloaded. Ready to install.';
                    dom.updaterProgressContainer.classList.add('hidden');
                    dom.restartAndUpdateButton.classList.remove('hidden');
                });
            }

            const session = getValidSession();
            if (session && session.userId && session.token) {
                state.sessionToken = session.token;
                state.sessionExpiresAt = Number(session.expiresAt || 0);
                connect({ type: 'reconnect', userId: session.userId, token: session.token });
            } else {
                state.onboardingIndex = 0;
                renderOnboarding();
                if (getStorage().loadOnboardingSeen()) ui.showAuthScreen();
                else ui.showOnboardingScreen();
            }
        }
        init();
    });



