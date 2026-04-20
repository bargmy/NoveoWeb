(function () {
    if (window.NoveoVoiceChat) return;

    var SDK_URLS = [
        "static/js/livekit-client.umd.min.js"
    ];

    var voiceState = {
        config: null,
        sdkPromise: null,
        room: null,
        localTrack: null,
        localScreenTracks: [],
        localTrackError: null,
        audioContainer: null,
        audioElements: new Map(),
        remoteScreenShareTracks: new Map(),
        screenShareContainer: null,
        screenShareElement: null,
        screenShareElementTrack: null,
        currentScreenShareOwnerId: null,
        selectedScreenShareOwnerId: null,
        currentChatId: null,
        connectingChatId: null,
        currentRoomName: "",
        currentCallId: "",
        pendingIncomingCall: null,
        connectionState: "idle",
        participantMap: new Map(),
        activeSpeakers: new Set(),
        currentAbortController: null,
        suppressDisconnectNotice: false,
        isMuted: false,
        isDeafened: false
    };

    function getConfig() {
        if (!voiceState.config) {
            throw new Error("NoveoVoiceChat has not been initialized.");
        }
        return voiceState.config;
    }

    function ensureAudioContainer() {
        if (voiceState.audioContainer) return voiceState.audioContainer;
        var container = document.createElement("div");
        container.id = "voicechat-audio-container";
        container.style.display = "none";
        document.body.appendChild(container);
        voiceState.audioContainer = container;
        return container;
    }

    function loadScript(url) {
        return new Promise(function (resolve, reject) {
            var existing = document.querySelector('script[data-voicechat-sdk="' + url + '"]');
            if (existing) {
                existing.addEventListener("load", function () { resolve(); }, { once: true });
                existing.addEventListener("error", function () { reject(new Error("Failed to load " + url)); }, { once: true });
                return;
            }
            var script = document.createElement("script");
            script.src = url;
            script.async = true;
            script.crossOrigin = "anonymous";
            script.dataset.voicechatSdk = url;
            script.onload = function () { resolve(); };
            script.onerror = function () { reject(new Error("Failed to load " + url)); };
            document.head.appendChild(script);
        });
    }

    function ensureLiveKitClient() {
        if (window.LivekitClient) return Promise.resolve(window.LivekitClient);
        if (voiceState.sdkPromise) return voiceState.sdkPromise;

        voiceState.sdkPromise = (async function () {
            var lastError = null;
            for (var i = 0; i < SDK_URLS.length; i += 1) {
                try {
                    await loadScript(SDK_URLS[i]);
                    if (window.LivekitClient) return window.LivekitClient;
                } catch (error) {
                    lastError = error;
                }
            }
            throw lastError || new Error("LiveKit client runtime is unavailable.");
        })();

        return voiceState.sdkPromise;
    }

    function setConnectionState(nextState) {
        voiceState.connectionState = nextState;
        try {
            getConfig().onCallStateChanged({ connectionState: nextState });
        } catch (_) {}
    }

    function getSocket() {
        return getConfig().getSocket ? getConfig().getSocket() : null;
    }

    function getCurrentUser() {
        return getConfig().getCurrentUser ? getConfig().getCurrentUser() : null;
    }

    function getCurrentChat() {
        return getConfig().getCurrentChat ? getConfig().getCurrentChat() : null;
    }

    function getPreferredScreenShareQuality() {
        return getConfig().getPreferredScreenShareQuality ? getConfig().getPreferredScreenShareQuality() : "480p";
    }

    function notifyState(partial) {
        try {
            getConfig().onCallStateChanged(partial || {});
        } catch (_) {}
    }

    function showError(title, message) {
        try {
            getConfig().showError(title, message);
        } catch (_) {}
    }

    function renderVoiceUi(chatId) {
        try {
            getConfig().renderVoiceUi(chatId);
        } catch (_) {}
    }

    function updateParticipants(chatId, participants, options) {
        try {
            getConfig().updateParticipants(chatId, participants, options || {});
        } catch (_) {}
    }

    function closeIncomingCallModal() {
        try {
            getConfig().closeIncomingCallModal();
        } catch (_) {}
    }

    function highlightActiveSpeakers(speakerIds) {
        voiceState.activeSpeakers = new Set((speakerIds || []).filter(Boolean));
        document.querySelectorAll(".voice-participant-avatar[data-user-id]").forEach(function (node) {
            var userId = node.dataset.userId;
            if (voiceState.activeSpeakers.has(userId)) {
                node.classList.add("voice-participant-speaking");
            } else {
                node.classList.remove("voice-participant-speaking");
            }
        });
    }

    function refreshParticipantSnapshot() {
        if (!voiceState.currentChatId) return;
        var ids = [];
        if (voiceState.room && voiceState.room.localParticipant) {
            var currentUser = getCurrentUser();
            if (currentUser && currentUser.userId) ids.push(currentUser.userId);
            voiceState.room.remoteParticipants.forEach(function (participant) {
                if (participant && participant.identity) ids.push(String(participant.identity));
            });
        } else if (voiceState.participantMap.size) {
            ids = Array.from(voiceState.participantMap.keys());
        }
        updateParticipants(voiceState.currentChatId, Array.from(new Set(ids)), { replace: true });
        renderVoiceUi(voiceState.currentChatId);
        highlightActiveSpeakers(Array.from(voiceState.activeSpeakers));
    }

    function attachAudioTrack(track, participantIdentity) {
        if (!track || !track.attach) return;
        var alreadyAttached = false;
        voiceState.audioElements.forEach(function (entry) {
            if (entry.track === track) alreadyAttached = true;
        });
        if (alreadyAttached) return;
        var container = ensureAudioContainer();
        var element = track.attach();
        element.autoplay = true;
        element.playsInline = true;
        element.muted = !!voiceState.isDeafened;
        if (participantIdentity) {
            element.dataset.participantIdentity = participantIdentity;
        }
        container.appendChild(element);
        voiceState.audioElements.set(track.sid || (participantIdentity + ":" + Date.now()), { track: track, element: element });
    }

    function applyDeafenState() {
        voiceState.audioElements.forEach(function (entry) {
            if (!entry || !entry.element) return;
            entry.element.muted = !!voiceState.isDeafened;
        });
        notifyState({ isDeafened: !!voiceState.isDeafened });
    }

    async function muteLocalTrack() {
        if (!voiceState.localTrack) {
            notifyState({ isMuted: true });
            return;
        }
        if (voiceState.room && voiceState.room.localParticipant) {
            try {
                await voiceState.room.localParticipant.unpublishTrack(voiceState.localTrack);
            } catch (_) {}
        }
        stopLocalTrack();
        notifyState({ isMuted: true });
    }

    async function unmuteLocalTrack() {
        if (voiceState.localTrack) {
            notifyState({ isMuted: false });
            return;
        }
        if (!voiceState.room) {
            notifyState({ isMuted: false });
            return;
        }
        var sdk = await ensureLiveKitClient();
        try {
            voiceState.localTrack = await createLocalTrack(sdk);
            voiceState.localTrackError = null;
        } catch (error) {
            voiceState.localTrack = null;
            voiceState.localTrackError = error;
            voiceState.isMuted = true;
            notifyState({ isMuted: true });
            showError(
                "Microphone Unavailable",
                "Joined the call without microphone access. " + (error && error.message ? error.message : "Microphone access is unavailable.")
            );
            return;
        }
        if (voiceState.room.localParticipant && voiceState.localTrack) {
            await voiceState.room.localParticipant.publishTrack(voiceState.localTrack);
        }
        notifyState({ isMuted: false });
    }

    async function applyMuteState() {
        if (voiceState.isMuted) {
            await muteLocalTrack();
            return;
        }
        await unmuteLocalTrack();
    }

    function reconcileExistingRemoteTracks(sdk, room) {
        var TrackSource = sdk.Track && sdk.Track.Source ? sdk.Track.Source : {};
        room.remoteParticipants.forEach(function (participant) {
            if (!participant) return;
            if (participant.identity) {
                voiceState.participantMap.set(String(participant.identity), participant);
            }
            if (!participant.trackPublications || typeof participant.trackPublications.forEach !== "function") {
                return;
            }
            participant.trackPublications.forEach(function (publication) {
                if (!publication) return;
                if (typeof publication.setSubscribed === "function") {
                    try {
                        publication.setSubscribed(true);
                    } catch (_) {}
                }
                var track = publication.track || publication.videoTrack || publication.audioTrack;
                if (!track) return;
                var source = publication.source || track.source;
                if (track.kind === sdk.Track.Kind.Audio) {
                    attachAudioTrack(track, participant ? participant.identity : "");
                }
                if (track.kind === sdk.Track.Kind.Video && source === TrackSource.ScreenShare && participant.identity) {
                    voiceState.remoteScreenShareTracks.set(String(participant.identity), track);
                }
            });
        });
        syncScreenShareState();
        refreshParticipantSnapshot();
    }

    function detachAudioTrack(track) {
        if (!track) return;
        voiceState.audioElements.forEach(function (entry, key) {
            if (entry.track !== track) return;
            try {
                track.detach(entry.element);
            } catch (_) {}
            try {
                entry.element.remove();
            } catch (_) {}
            voiceState.audioElements.delete(key);
        });
    }

    function cleanupAudioElements() {
        voiceState.audioElements.forEach(function (entry) {
            try {
                entry.track.detach(entry.element);
            } catch (_) {}
            try {
                entry.element.remove();
            } catch (_) {}
        });
        voiceState.audioElements.clear();
    }

    function cleanupScreenShareElement() {
        if (!voiceState.screenShareElement) return;
        try {
            if (voiceState.screenShareElementTrack && voiceState.screenShareElementTrack.detach) {
                voiceState.screenShareElementTrack.detach(voiceState.screenShareElement);
            }
        } catch (_) {}
        try {
            voiceState.screenShareElement.remove();
        } catch (_) {}
        voiceState.screenShareElement = null;
        voiceState.screenShareElementTrack = null;
    }

    function mountScreenShareStage(container) {
        voiceState.screenShareContainer = container || null;
        if (!voiceState.screenShareContainer) return;
        voiceState.screenShareContainer.innerHTML = "";
        if (voiceState.screenShareElement) {
            voiceState.screenShareContainer.appendChild(voiceState.screenShareElement);
        }
    }

    function getCurrentScreenShareSelection() {
        var currentUser = getCurrentUser();
        var localVideoTrack = voiceState.localScreenTracks.find(function (track) {
            return track && track.kind === "video";
        });
        var available = [];
        if (localVideoTrack && currentUser && currentUser.userId) {
            available.push({ participantId: String(currentUser.userId), track: localVideoTrack, isLocal: true });
        }
        voiceState.remoteScreenShareTracks.forEach(function (track, participantId) {
            if (!track) return;
            available.push({ participantId: String(participantId), track: track, isLocal: false });
        });
        if (!available.length) return null;
        var preferredId = String(voiceState.selectedScreenShareOwnerId || "");
        var preferred = available.find(function (entry) { return entry.participantId === preferredId; });
        if (preferred) return preferred;
        return available[0];
    }

    function syncScreenShareState() {
        var selection = getCurrentScreenShareSelection();
        var availableOwnerIds = [];
        var currentUser = getCurrentUser();
        var localVideoTrack = voiceState.localScreenTracks.find(function (track) {
            return track && track.kind === "video";
        });
        if (localVideoTrack && currentUser && currentUser.userId) {
            availableOwnerIds.push(String(currentUser.userId));
        }
        voiceState.remoteScreenShareTracks.forEach(function (_track, participantId) {
            availableOwnerIds.push(String(participantId));
        });
        availableOwnerIds = Array.from(new Set(availableOwnerIds.filter(Boolean)));
        if (voiceState.selectedScreenShareOwnerId && availableOwnerIds.indexOf(String(voiceState.selectedScreenShareOwnerId)) === -1) {
            voiceState.selectedScreenShareOwnerId = null;
        }
        cleanupScreenShareElement();
        if (selection && selection.track && selection.track.attach) {
            var element = selection.track.attach();
            element.autoplay = true;
            element.playsInline = true;
            element.muted = !!selection.isLocal;
            voiceState.screenShareElement = element;
            voiceState.screenShareElementTrack = selection.track;
            voiceState.currentScreenShareOwnerId = selection.participantId;
            voiceState.selectedScreenShareOwnerId = selection.participantId;
        } else {
            voiceState.currentScreenShareOwnerId = null;
            voiceState.selectedScreenShareOwnerId = null;
        }
        if (voiceState.screenShareContainer) {
            mountScreenShareStage(voiceState.screenShareContainer);
        }
        notifyState({
            currentScreenShareOwnerId: voiceState.currentScreenShareOwnerId,
            availableScreenShareOwnerIds: availableOwnerIds,
            isLocalScreenSharing: voiceState.localScreenTracks.length > 0
        });
        if (voiceState.currentChatId) {
            renderVoiceUi(voiceState.currentChatId);
        }
    }

    async function stopScreenShare() {
        if (!voiceState.localScreenTracks.length) {
            syncScreenShareState();
            return;
        }
        var room = voiceState.room;
        var tracks = voiceState.localScreenTracks.slice();
        voiceState.localScreenTracks = [];
        if (voiceState.currentChatId) {
            safeSendWs({ type: "voice_screen_share_stopped", chatId: voiceState.currentChatId });
        }
        for (var i = 0; i < tracks.length; i += 1) {
            var track = tracks[i];
            if (room && room.localParticipant) {
                try {
                    await room.localParticipant.unpublishTrack(track);
                } catch (_) {}
            }
            try {
                track.stop();
            } catch (_) {}
            try {
                track.detach().forEach(function (element) { element.remove(); });
            } catch (_) {}
        }
        syncScreenShareState();
    }

    function setScreenShareOwner(participantId) {
        var normalized = String(participantId || "").trim();
        if (!normalized) return getState();
        voiceState.selectedScreenShareOwnerId = normalized;
        syncScreenShareState();
        return getState();
    }

    function forceStopScreenShareTracks() {
        if (!voiceState.localScreenTracks.length) {
            cleanupScreenShareElement();
            return;
        }
        var tracks = voiceState.localScreenTracks.slice();
        voiceState.localScreenTracks = [];
        for (var i = 0; i < tracks.length; i += 1) {
            try {
                tracks[i].stop();
            } catch (_) {}
            try {
                tracks[i].detach().forEach(function (element) { element.remove(); });
            } catch (_) {}
        }
        cleanupScreenShareElement();
    }

    async function startScreenShare() {
        if (!voiceState.room || !voiceState.currentChatId) {
            throw new Error("Join a call before sharing your screen.");
        }
        if (voiceState.localScreenTracks.length) {
            return getState();
        }
        var preferredQuality = String(getPreferredScreenShareQuality() || "480p").toLowerCase();
        var use720p = preferredQuality === "720p";
        var targetWidth = use720p ? 1280 : 854;
        var targetHeight = use720p ? 720 : 480;
        var targetBitrate = use720p ? 4200000 : 2500000;
        var sdk = await ensureLiveKitClient();
        var screenTracks = await sdk.createLocalScreenTracks({ audio: true });
        var videoTrack = screenTracks.find(function (track) {
            return track && track.kind === sdk.Track.Kind.Video;
        });
        if (!videoTrack) {
            throw new Error("Screen sharing video track was not created.");
        }
        if (videoTrack.mediaStreamTrack && typeof videoTrack.mediaStreamTrack.applyConstraints === "function") {
            try {
                await videoTrack.mediaStreamTrack.applyConstraints({
                    width: { max: targetWidth, ideal: targetWidth },
                    height: { max: targetHeight, ideal: targetHeight },
                    frameRate: { max: 15, ideal: 15 }
                });
            } catch (_) {}
        }
        if (videoTrack.mediaStreamTrack && "contentHint" in videoTrack.mediaStreamTrack) {
            try {
                videoTrack.mediaStreamTrack.contentHint = "motion";
            } catch (_) {}
        }
        if (videoTrack.mediaStreamTrack && videoTrack.mediaStreamTrack.addEventListener) {
            videoTrack.mediaStreamTrack.addEventListener("ended", function () {
                stopScreenShare().catch(function () {});
            }, { once: true });
        }
        for (var i = 0; i < screenTracks.length; i += 1) {
            var track = screenTracks[i];
            var publishOptions = void 0;
            if (track && track.kind === sdk.Track.Kind.Video) {
                publishOptions = {
                    simulcast: false,
                    videoCodec: "h264",
                    degradationPreference: "maintain-framerate",
                    screenShareEncoding: {
                        maxBitrate: targetBitrate,
                        maxFramerate: 15
                    }
                };
            }
            await voiceState.room.localParticipant.publishTrack(track, publishOptions);
        }
        voiceState.localScreenTracks = screenTracks;
        safeSendWs({ type: "voice_screen_share_started", chatId: voiceState.currentChatId });
        syncScreenShareState();
        return getState();
    }

    function safeSendWs(payload) {
        var socket = getSocket();
        if (!socket || socket.readyState !== WebSocket.OPEN) return false;
        socket.send(JSON.stringify(payload));
        return true;
    }

    function scheduleScreenShareReconcile(delayMs) {
        window.setTimeout(function () {
            if (!voiceState.room || !voiceState.currentChatId) return;
            ensureLiveKitClient().then(function (sdk) {
                if (!voiceState.room) return;
                reconcileExistingRemoteTracks(sdk, voiceState.room);
            }).catch(function () {});
        }, Math.max(0, Number(delayMs) || 0));
    }

    async function fetchVoiceToken(chatId) {
        var config = getConfig();
        var currentUser = getCurrentUser();
        var sessionToken = config.getSessionToken ? config.getSessionToken() : "";
        if (!currentUser || !currentUser.userId || !sessionToken) {
            throw new Error("Authentication required to join voice chat.");
        }

        if (voiceState.currentAbortController) {
            voiceState.currentAbortController.abort();
        }
        voiceState.currentAbortController = new AbortController();

        var response = await fetch(config.serverUrl + "/voice/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-ID": currentUser.userId,
                "X-Auth-Token": sessionToken
            },
            body: JSON.stringify({
                chatId: chatId,
                callId: voiceState.currentCallId || undefined
            }),
            signal: voiceState.currentAbortController.signal
        });

        var payload = await response.json().catch(function () { return {}; });
        if (!response.ok || !payload.success) {
            throw new Error(payload.error || "Unable to start voice chat.");
        }
        return payload;
    }

    function stopLocalTrack() {
        if (!voiceState.localTrack) {
            voiceState.localTrackError = null;
            return;
        }
        try {
            voiceState.localTrack.stop();
        } catch (_) {}
        try {
            voiceState.localTrack.detach().forEach(function (element) { element.remove(); });
        } catch (_) {}
        voiceState.localTrack = null;
        voiceState.localTrackError = null;
    }

    async function createLocalTrack(sdk) {
        stopLocalTrack();
        return sdk.createLocalAudioTrack({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        });
    }

    function bindRoomEvents(sdk, room) {
        var RoomEvent = sdk.RoomEvent;
        var TrackSource = sdk.Track && sdk.Track.Source ? sdk.Track.Source : {};

        room.on(RoomEvent.TrackSubscribed, function (track, publication, participant) {
            var source = publication && publication.source ? publication.source : track && track.source;
            if (track.kind === sdk.Track.Kind.Audio) {
                attachAudioTrack(track, participant ? participant.identity : "");
            }
            if (track.kind === sdk.Track.Kind.Video && source === TrackSource.ScreenShare && participant && participant.identity) {
                voiceState.remoteScreenShareTracks.set(String(participant.identity), track);
                syncScreenShareState();
            }
            voiceState.participantMap.set(String(participant.identity), participant);
            refreshParticipantSnapshot();
        });

        room.on(RoomEvent.TrackUnsubscribed, function (track, publication, participant) {
            detachAudioTrack(track);
            if (participant && participant.identity) {
                var remoteTrack = voiceState.remoteScreenShareTracks.get(String(participant.identity));
                if (remoteTrack === track) {
                    voiceState.remoteScreenShareTracks.delete(String(participant.identity));
                    syncScreenShareState();
                }
            }
            if (participant && participant.identity && !room.remoteParticipants.has(participant.identity)) {
                voiceState.participantMap.delete(String(participant.identity));
            }
            refreshParticipantSnapshot();
        });

        room.on(RoomEvent.ParticipantConnected, function (participant) {
            if (participant && participant.identity) {
                voiceState.participantMap.set(String(participant.identity), participant);
            }
            refreshParticipantSnapshot();
        });

        room.on(RoomEvent.ParticipantDisconnected, function (participant) {
            if (participant && participant.identity) {
                voiceState.participantMap.delete(String(participant.identity));
                voiceState.remoteScreenShareTracks.delete(String(participant.identity));
                syncScreenShareState();
            }
            refreshParticipantSnapshot();
        });

        room.on(RoomEvent.ActiveSpeakersChanged, function (speakers) {
            var speakerIds = (speakers || []).map(function (participant) {
                return participant && participant.identity ? String(participant.identity) : "";
            }).filter(Boolean);
            highlightActiveSpeakers(speakerIds);
        });

        room.on(RoomEvent.Reconnecting, function () {
            setConnectionState("reconnecting");
        });

        room.on(RoomEvent.Reconnected, function () {
            setConnectionState("connected");
            refreshParticipantSnapshot();
        });

        room.on(RoomEvent.Disconnected, function () {
            var previousChatId = voiceState.currentChatId;
            cleanupAudioElements();
            stopLocalTrack();
            forceStopScreenShareTracks();
            voiceState.remoteScreenShareTracks.clear();
            voiceState.currentScreenShareOwnerId = null;
            voiceState.selectedScreenShareOwnerId = null;
            voiceState.room = null;
            voiceState.participantMap.clear();
            highlightActiveSpeakers([]);
            setConnectionState("idle");
            notifyState({ currentVoiceChatId: null, currentScreenShareOwnerId: null, isLocalScreenSharing: false });
            if (previousChatId) {
                updateParticipants(previousChatId, [], { clear: true });
                renderVoiceUi(previousChatId);
            }
            if (!voiceState.suppressDisconnectNotice) {
                showError("Voice Chat Ended", "The call has ended or the connection was lost.");
            }
            voiceState.suppressDisconnectNotice = false;
            voiceState.currentChatId = null;
            voiceState.currentRoomName = "";
            voiceState.currentCallId = "";
            voiceState.isMuted = false;
            voiceState.isDeafened = false;
        });
    }

    async function connectToRoom(chatId, shouldRing) {
        var config = getConfig();
        var currentChat = getCurrentChat();
        var currentUser = getCurrentUser();
        if (!chatId) {
            throw new Error("Missing chat id for voice chat.");
        }
        if (!currentUser || !currentUser.userId) {
            throw new Error("Authentication required to join voice chat.");
        }
        if (currentChat && currentChat.chatType === "channel") {
            throw new Error("Voice chats are not available in channels.");
        }

        if (voiceState.currentChatId && voiceState.currentChatId !== chatId) {
            await leaveCall("switch-chat");
        } else if (voiceState.room && voiceState.currentChatId === chatId) {
            return voiceState.getState();
        }

        var sdk = await ensureLiveKitClient();
        voiceState.connectingChatId = chatId;
        notifyState({ connectingVoiceChatId: chatId });
        setConnectionState("connecting");

        voiceState.localTrackError = null;
        try {
            voiceState.localTrack = await createLocalTrack(sdk);
        } catch (error) {
            voiceState.localTrack = null;
            voiceState.localTrackError = error;
        }

        if (shouldRing) {
            safeSendWs({ type: "voice_start", chatId: chatId });
        }

        try {
            var tokenPayload = await fetchVoiceToken(chatId);
            voiceState.currentChatId = chatId;
            voiceState.currentRoomName = tokenPayload.roomName || "";
            voiceState.currentCallId = tokenPayload.callId || "";

            var room = new sdk.Room({
                adaptiveStream: false,
                dynacast: false
            });
            voiceState.room = room;
            voiceState.suppressDisconnectNotice = false;
            bindRoomEvents(sdk, room);
            await room.connect(tokenPayload.serverUrl, tokenPayload.participantToken, {
                autoSubscribe: true
            });
            if (voiceState.localTrack) {
                await room.localParticipant.publishTrack(voiceState.localTrack);
            }
            await applyMuteState();
            applyDeafenState();
            reconcileExistingRemoteTracks(sdk, room);
            scheduleScreenShareReconcile(250);
            scheduleScreenShareReconcile(1000);
            scheduleScreenShareReconcile(2500);
            safeSendWs({ type: "voice_join", chatId: chatId });
            closeIncomingCallModal();
            voiceState.connectingChatId = null;
            notifyState({ currentVoiceChatId: chatId, incomingCallData: null, connectingVoiceChatId: null, currentScreenShareOwnerId: null, isLocalScreenSharing: false, isMuted: !!voiceState.isMuted, isDeafened: !!voiceState.isDeafened });
            setConnectionState("connected");
            refreshParticipantSnapshot();
            if (voiceState.localTrackError) {
                var micMessage = voiceState.localTrackError && voiceState.localTrackError.message
                    ? voiceState.localTrackError.message
                    : "Microphone access is unavailable.";
                showError("Microphone Unavailable", "Joined the call without microphone access. " + micMessage);
            }
            return getState();
        } catch (error) {
            voiceState.connectingChatId = null;
            stopLocalTrack();
            if (voiceState.room) {
                try {
                    voiceState.suppressDisconnectNotice = true;
                    await voiceState.room.disconnect();
                } catch (_) {}
            }
            voiceState.room = null;
            voiceState.currentChatId = null;
            voiceState.currentRoomName = "";
            voiceState.currentCallId = "";
            setConnectionState("idle");
            notifyState({ connectingVoiceChatId: null, currentScreenShareOwnerId: null, isLocalScreenSharing: false });
            if (shouldRing) {
                safeSendWs({ type: "voice_leave", chatId: chatId });
            }
            throw error;
        }
    }

    async function leaveCall(reason) {
        var chatId = voiceState.currentChatId;
        voiceState.suppressDisconnectNotice = true;
        if (voiceState.currentAbortController) {
            voiceState.currentAbortController.abort();
            voiceState.currentAbortController = null;
        }
        if (voiceState.room) {
            try {
                await voiceState.room.disconnect();
            } catch (_) {}
        }
        cleanupAudioElements();
        stopLocalTrack();
        await stopScreenShare();
        voiceState.room = null;
        voiceState.remoteScreenShareTracks.clear();
        voiceState.currentScreenShareOwnerId = null;
        voiceState.selectedScreenShareOwnerId = null;
        voiceState.participantMap.clear();
        highlightActiveSpeakers([]);
        if (chatId) {
            safeSendWs({ type: "voice_leave", chatId: chatId, reason: reason || "left" });
            updateParticipants(chatId, [], { clear: true });
            renderVoiceUi(chatId);
        }
        voiceState.connectingChatId = null;
        voiceState.currentChatId = null;
        voiceState.currentRoomName = "";
        voiceState.currentCallId = "";
        voiceState.isMuted = false;
        voiceState.isDeafened = false;
        setConnectionState("idle");
        notifyState({ currentVoiceChatId: null, incomingCallData: null, connectingVoiceChatId: null, currentScreenShareOwnerId: null, isLocalScreenSharing: false, isMuted: false, isDeafened: false });
    }

    function handleServerEvent(message) {
        if (!message || !message.type) return;
        if (message.type === "incoming_call") {
            var publicChatId = getConfig().getPublicChatId ? getConfig().getPublicChatId() : null;
            if (publicChatId && message.chatId === publicChatId) return;
            if (voiceState.currentChatId) return;
            voiceState.pendingIncomingCall = message;
            notifyState({ incomingCallData: message });
            try {
                getConfig().showIncomingCallModal(message);
            } catch (_) {}
            return;
        }

        if (message.type === "voice_chat_update") {
            var active = message.activeVoiceChats || {};
            if (voiceState.currentChatId && !active[voiceState.currentChatId] && voiceState.room) {
                leaveCall("server-ended").catch(function () {});
            }
            if (voiceState.currentChatId && active[voiceState.currentChatId] && active[voiceState.currentChatId].screenShareOwnerId) {
                notifyState({ currentScreenShareOwnerId: active[voiceState.currentChatId].screenShareOwnerId });
                scheduleScreenShareReconcile(0);
                scheduleScreenShareReconcile(500);
            }
            refreshParticipantSnapshot();
            return;
        }

        if (message.type === "voice_call_error") {
            showError("Voice Chat Error", message.message || "Unable to complete the voice action.");
            return;
        }

        if (message.type === "voice_call_ended") {
            if (message.chatId && message.chatId === voiceState.currentChatId) {
                leaveCall("server-ended").catch(function () {});
            }
        }
    }

    function handleChatChanged(chat) {
        if (!chat) return;
        if (voiceState.currentChatId && chat.chatId === voiceState.currentChatId) {
            refreshParticipantSnapshot();
        }
    }

    async function startOutgoingCall(chat) {
        if (!chat || !chat.chatId) {
            showError("Voice Chat", "Select a chat before starting a call.");
            return;
        }
        try {
            await connectToRoom(chat.chatId, true);
        } catch (error) {
            showError("Voice Chat", error && error.message ? error.message : "Unable to start the voice chat.");
        }
    }

    async function acceptIncomingCall(callData) {
        if (!callData || !callData.chatId) return;
        try {
            await connectToRoom(callData.chatId, false);
        } catch (error) {
            showError("Voice Chat", error && error.message ? error.message : "Unable to join the voice chat.");
        }
    }

    async function handleAppDisconnect() {
        voiceState.suppressDisconnectNotice = true;
        if (voiceState.currentAbortController) {
            voiceState.currentAbortController.abort();
            voiceState.currentAbortController = null;
        }
        if (voiceState.room) {
            try {
                await voiceState.room.disconnect();
            } catch (_) {}
        }
        cleanupAudioElements();
        stopLocalTrack();
        voiceState.room = null;
        voiceState.connectingChatId = null;
        voiceState.remoteScreenShareTracks.clear();
        forceStopScreenShareTracks();
        voiceState.currentScreenShareOwnerId = null;
        voiceState.selectedScreenShareOwnerId = null;
        voiceState.participantMap.clear();
        highlightActiveSpeakers([]);
        voiceState.isMuted = false;
        voiceState.isDeafened = false;
        setConnectionState("idle");
        notifyState({ currentVoiceChatId: null, connectingVoiceChatId: null, currentScreenShareOwnerId: null, isLocalScreenSharing: false, isMuted: false, isDeafened: false });
    }

    function destroy() {
        return handleAppDisconnect();
    }

    function getState() {
        var availableScreenShareOwnerIds = [];
        var currentUser = getCurrentUser();
        var localVideoTrack = voiceState.localScreenTracks.find(function (track) {
            return track && track.kind === "video";
        });
        if (localVideoTrack && currentUser && currentUser.userId) {
            availableScreenShareOwnerIds.push(String(currentUser.userId));
        }
        voiceState.remoteScreenShareTracks.forEach(function (_track, participantId) {
            availableScreenShareOwnerIds.push(String(participantId));
        });
        return {
            currentChatId: voiceState.currentChatId,
            connectingChatId: voiceState.connectingChatId,
            currentRoomName: voiceState.currentRoomName,
            currentCallId: voiceState.currentCallId,
            connectionState: voiceState.connectionState,
            currentScreenShareOwnerId: voiceState.currentScreenShareOwnerId,
            availableScreenShareOwnerIds: Array.from(new Set(availableScreenShareOwnerIds.filter(Boolean))),
            isLocalScreenSharing: voiceState.localScreenTracks.length > 0,
            isMuted: !!voiceState.isMuted,
            isDeafened: !!voiceState.isDeafened,
            activeSpeakers: Array.from(voiceState.activeSpeakers),
            pendingIncomingCall: voiceState.pendingIncomingCall
        };
    }

    function init(config) {
        voiceState.config = config || {};
        ensureAudioContainer();
        return getState();
    }

    window.NoveoVoiceChat = {
        init: init,
        startOutgoingCall: startOutgoingCall,
        acceptIncomingCall: acceptIncomingCall,
        toggleScreenShare: function () {
            return voiceState.localScreenTracks.length ? stopScreenShare() : startScreenShare();
        },
        setScreenShareOwner: setScreenShareOwner,
        toggleMute: async function () {
            voiceState.isMuted = !voiceState.isMuted;
            await applyMuteState();
            return getState();
        },
        toggleDeafen: function () {
            voiceState.isDeafened = !voiceState.isDeafened;
            applyDeafenState();
            return Promise.resolve(getState());
        },
        mountScreenShareStage: mountScreenShareStage,
        leaveCall: leaveCall,
        handleServerEvent: handleServerEvent,
        handleChatChanged: handleChatChanged,
        handleAppDisconnect: handleAppDisconnect,
        destroy: destroy,
        getState: getState
    };
})();
