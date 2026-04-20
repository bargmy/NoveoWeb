// Voice Recording State
	const voiceRecorder = {
		mediaRecorder: null,
		audioChunks: [],
		startTime: null,
		timerInterval: null,
		isRecording: false,
		recordedBlob: null,

		elements: {
			sendButton: null,
			messageInput: null,
			voiceRecordingContainer: null,
			voicePreviewContainer: null,
			recordingTimer: null,
			voiceDuration: null,
			cancelVoiceBtn: null,
			sendVoiceBtn: null
		},

		init() {
			// Get DOM elements
			this.elements.sendButton = document.getElementById('sendButton');
			this.elements.sendIcon = document.getElementById('sendIcon');
			this.elements.micIcon = document.getElementById('micIcon');
			this.elements.stopRecordingButton = document.getElementById('stopRecordingButton');
			this.elements.messageInput = document.getElementById('messageInput');
			this.elements.voiceRecordingContainer = document.getElementById('voiceRecordingContainer');
			this.elements.voicePreviewContainer = document.getElementById('voicePreviewContainer');
			this.elements.recordingTimer = document.getElementById('recordingTimer');
			this.elements.voiceDuration = document.getElementById('voiceDuration');
			this.elements.cancelVoiceBtn = document.getElementById('cancelVoiceBtn');
			this.elements.sendVoiceBtn = document.getElementById('sendVoiceBtn');
			if (this.elements.sendButton && !this.elements.sendButton.dataset.hasAttachment) {
				this.elements.sendButton.dataset.hasAttachment = '0';
			}

			// Toggle icon based on input
			this.elements.messageInput.addEventListener('input', () => this.updateButtonIcon());
			this.updateButtonIcon();

			// Add event listeners
			this.setupEventListeners();
		},

		hasTypedText() {
			return this.elements.messageInput.value.trim().length > 0;
		},

		hasAttachedFile() {
			const filePreviewContainer = document.getElementById('filePreviewContainer');
			const hasVisiblePreview = !!(filePreviewContainer && !filePreviewContainer.classList.contains('hidden'));
			const hasAttachmentHint = this.elements.sendButton?.dataset?.hasAttachment === '1';
			const hasStateAttachment = typeof window.__noveoHasAttachedFile === 'function' && window.__noveoHasAttachedFile();
			return hasVisiblePreview || hasAttachmentHint || hasStateAttachment;
		},

		canStartVoiceRecording() {
			return !this.hasTypedText() && !this.hasAttachedFile();
		},

		updateButtonIcon() {
			const hasText = this.hasTypedText();
			const hasFile = this.hasAttachedFile();
			
			if (hasText || hasFile) {
				// Show send icon
				this.elements.sendIcon.classList.remove('hidden');
				this.elements.micIcon.classList.add('hidden');
			} else {
				// Show mic icon
				this.elements.sendIcon.classList.add('hidden');
				this.elements.micIcon.classList.remove('hidden');
			}
		},

		setupEventListeners() {
		  const btn = this.elements.sendButton;
		  const stopBtn = this.elements.stopRecordingButton;

		  const HOLD_DELAY_MS = 400; // Hold threshold
		  this._holdTimer = null;
		  this._holdTriggered = false;
		  this._isTapRecording = false; // Track if we're in tap-to-record mode
		  this._activePointerId = null;

		  const clearHold = () => {
			if (this._holdTimer) {
			  clearTimeout(this._holdTimer);
			  this._holdTimer = null;
			}
		  };

		  const releasePointerCaptureSafe = (pointerId) => {
			try {
			  if (btn?.hasPointerCapture?.(pointerId)) btn.releasePointerCapture(pointerId);
			} catch (_) {}
		  };

		  const stopHoldRecording = (e) => {
			if (this._holdTriggered && this.isRecording && !this._isTapRecording) {
			  if (e?.cancelable) e.preventDefault();
			  e?.stopPropagation?.();
			  this.stopRecording(e);
			  this._holdTriggered = false;
			  return true;
			}
			return false;
		  };

		  // Stop button listener
		  stopBtn.addEventListener('click', (e) => {
			e.preventDefault();
			if (this.isRecording) {
			  this.stopRecording(e);
			}
		  });

		  // Stop Android image download/callout + drag behaviors
		  btn.addEventListener('contextmenu', (e) => e.preventDefault());
		  btn.addEventListener('dragstart', (e) => e.preventDefault());

		  btn.addEventListener('pointerdown', (e) => {
			clearHold();
			this._holdTriggered = false;
			this.updateButtonIcon();
			// Only arm recording when there is no text and no attachment
			if (!this.canStartVoiceRecording()) return;
			this._activePointerId = e.pointerId;
			try { btn.setPointerCapture?.(e.pointerId); } catch (_) {}

			// Start hold timer
			this._holdTimer = setTimeout(() => {
			  // HOLD: Start recording, will stop on release
			  this._holdTriggered = true;
			  this._isTapRecording = false;
			  this.startRecording(e, 'hold');
			}, HOLD_DELAY_MS);
		  });

		  btn.addEventListener('pointerup', (e) => {
			if (this._activePointerId !== null && e.pointerId !== this._activePointerId) return;
			this.updateButtonIcon();
			clearHold();

			// If hold was triggered, stop recording and prevent click
			if (stopHoldRecording(e)) {
			  releasePointerCaptureSafe(e.pointerId);
			  this._activePointerId = null;
			  return;
			}

			// If allowed and not hold = TAP
			if (this.canStartVoiceRecording() && !this._holdTriggered) {
			  // Tap: start recording with stop button
			  if (!this.isRecording) {
				e.preventDefault();
				e.stopPropagation();
				this._isTapRecording = true;
				this.startRecording(e, 'tap');
			  }
			}
			// If text/file exists, do nothing so normal send click can proceed
			releasePointerCaptureSafe(e.pointerId);
			this._activePointerId = null;
		  });

		  btn.addEventListener('pointercancel', (e) => {
			clearHold();
			if (this.isRecording && !this._isTapRecording) {
			  // Only cancel hold recordings, not tap recordings
			  this.cancelRecording();
			}
			releasePointerCaptureSafe(e.pointerId);
			this._activePointerId = null;
		  });

		  // Cancel hold if finger leaves button
		  btn.addEventListener('pointerleave', () => {
			if (!this._holdTriggered) clearHold();
		  });

		  window.addEventListener('pointerup', (e) => {
			if (this._activePointerId === null || e.pointerId !== this._activePointerId) return;
			clearHold();
			stopHoldRecording(e);
			releasePointerCaptureSafe(e.pointerId);
			this._activePointerId = null;
		  }, true);

		  window.addEventListener('pointercancel', (e) => {
			if (this._activePointerId === null || e.pointerId !== this._activePointerId) return;
			clearHold();
			if (this.isRecording && !this._isTapRecording) this.cancelRecording();
			releasePointerCaptureSafe(e.pointerId);
			this._activePointerId = null;
		  }, true);
		},

		getVoiceFileMeta(rawMimeType) {
			const mime = String(rawMimeType || '').split(';')[0].trim().toLowerCase();
			if (mime === 'audio/ogg') {
				return { fileName: 'Voice Message', mimeType: 'audio/ogg' };
			}
			return { fileName: 'Voice Message', mimeType: 'audio/webm' };
		},

		startRecording(e, mode = 'hold') {
			// Start only when there is no text and no attachment
			if (!this.canStartVoiceRecording()) return;

			// If browser doesn't support getUserMedia, fail gracefully
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				alert('Microphone not supported on this device/browser.');
				return;
			}

			navigator.mediaDevices.getUserMedia({ audio: true })
				.then((stream) => {
					// Create recorder
					this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
					this.audioChunks = [];
					this.isRecording = true;
					this.startTime = Date.now();
					this.recordingMode = mode; // Store mode

					this.mediaRecorder.ondataavailable = (event) => {
						if (event.data && event.data.size > 0) this.audioChunks.push(event.data);
					};

					// Always stop mic tracks when recording ends
					this.mediaRecorder.onstop = () => {
						try { stream.getTracks().forEach(t => t.stop()); } catch (_) {}
					};

					this.mediaRecorder.start();
					this.showRecordingUI(mode);
					this.startTimer();
				})
				.catch((error) => {
					console.error('Microphone access denied:', error);
					alert('Please allow microphone access to send voice messages.');
					this.isRecording = false;
					if (this.stopTimer) this.stopTimer();
					this.hideAllUI();
				});
		},

		stopRecording(e) {
			if (!this.isRecording) return;
			this.isRecording = false;
			this.stopTimer();
			this._activePointerId = null;
			
			const mr = this.mediaRecorder;
			if (!mr) {
				this.hideAllUI();
				return;
			}
			
			mr.onstop = () => {
				try {
					const voiceMeta = this.getVoiceFileMeta(mr.mimeType || this.recordedBlob?.type);
					this.recordedBlob = new Blob(this.audioChunks, { type: voiceMeta.mimeType });
					
					// Convert to File object
					const voiceFile = new File([this.recordedBlob], voiceMeta.fileName, { type: voiceMeta.mimeType });
					
					// Get the file input element
					const fileInput = document.getElementById('fileInput');
					
					// Create a fake FileList with our voice file
					const dataTransfer = new DataTransfer();
					dataTransfer.items.add(voiceFile);
					fileInput.files = dataTransfer.files;
					
					// Trigger the change event (same as selecting a file)
					const event = new Event('change', { bubbles: true });
					fileInput.dispatchEvent(event);
					
					// DON'T auto-send - let user click send manually
					// setTimeout(() => document.getElementById('sendButton').click(), 100); // REMOVED
					
					// Clean up
					this.discardVoice();
					console.log('Voice attached as file!');
				} finally {
					try {
						mr?.stream?.getTracks?.().forEach(t => t.stop());
					} catch {}
					this.mediaRecorder = null;
					this.hideAllUI();
				}
			};
			
			try {
				if (mr.state !== 'inactive') mr.stop();
				else mr.onstop();
			} catch {
				mr.onstop();
			}
		},

		cancelRecording() {
			if (!this.isRecording) return;

			this.isRecording = false;
			this.stopTimer();
			this._activePointerId = null;

			const mr = this.mediaRecorder;

			const cleanup = () => {
				try { mr?.stream?.getTracks()?.forEach(t => t.stop()); } catch (_) {}
				this.mediaRecorder = null;
				this.audioChunks = [];
				this.recordedBlob = null;
				this.hideAllUI();
			};

			if (!mr) return cleanup();

			mr.onstop = cleanup;

			try {
				if (mr.state !== 'inactive') mr.stop();
				else cleanup();
			} catch (_) {
				cleanup();
			}
		},

		showRecordingUI(mode = 'hold') {
			// Apply recording classes so the composer state wins over theme-level !important rules.
			this.elements.messageInput.classList.add('is-recording', 'recording-mode');
			document.getElementById('messageInputContainer')?.classList.add('is-recording');
			this.elements.messageInput.placeholder = ' 0:00';
			this.elements.messageInput.disabled = true;
			this.elements.sendButton.classList.add('recording');

			// Show stop button in tap mode, hide in hold mode
			if (mode === 'tap') {
				this.elements.sendButton.classList.add('hidden');
				this.elements.stopRecordingButton.classList.remove('hidden');
			}

			// placeholder color style
			if (!document.getElementById('voice-recording-style')) {
				const style = document.createElement('style');
				style.id = 'voice-recording-style';
				style.textContent = `
					#messageInput::placeholder { color: #fff !important; opacity: 1 !important; }
				`;
				document.head.appendChild(style);
			}
		},



		hideAllUI() {
			// Reset to normal
			this.elements.messageInput.classList.remove('is-recording', 'recording-mode');
			document.getElementById('messageInputContainer')?.classList.remove('is-recording');
			this.elements.messageInput.placeholder = 'Message...';
			this.elements.messageInput.disabled = false;
			this.elements.sendButton.classList.remove('recording');
			this.elements.sendButton.classList.remove('hidden');
			this.elements.stopRecordingButton.classList.add('hidden');

			// Reset tap recording flag
			this._isTapRecording = false;
			this._activePointerId = null;

			// Update icon based on current input
			this.updateButtonIcon();

			// Remove placeholder style
			const style = document.getElementById('voice-recording-style');
			if (style) style.remove();

			// Hide containers if you use them
			this.elements.voiceRecordingContainer?.classList.add('hidden');
			this.elements.voicePreviewContainer?.classList.add('hidden');
		},

		startTimer() {
			// prevent orphan intervals
			this.stopTimer();

			this.timerInterval = setInterval(() => {
				// If recording already stopped but interval survived, kill it.
				if (!this.isRecording) {
					this.stopTimer();
					return;
				}

				const duration = Math.floor((Date.now() - this.startTime) / 1000);
				const minutes = Math.floor(duration / 60);
				const seconds = duration % 60;
				const t = `${minutes}:${seconds.toString().padStart(2, '0')}`;

				// Update placeholder (what you want)
				this.elements.messageInput.placeholder = ` ${t}`;

				// Optional: also update the red bar timer if you keep it visible
				if (this.elements.recordingTimer) this.elements.recordingTimer.textContent = t;
			}, 250);
		},


		stopTimer() {
			if (this.timerInterval) {
				clearInterval(this.timerInterval);
				this.timerInterval = null;
			}
		},

		sendVoiceMessage() {
			if (!this.recordedBlob) return;

			console.log('Voice recorded:', this.recordedBlob.size, 'bytes');

			const voiceMeta = this.getVoiceFileMeta(this.recordedBlob.type);

			// Convert to File object
			const voiceFile = new File(
				[this.recordedBlob], 
				voiceMeta.fileName,
				{ type: voiceMeta.mimeType }
			);

			// Get the file input element
			const fileInput = document.getElementById('fileInput');
			
			// Create a fake FileList with our voice file
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(voiceFile);
			fileInput.files = dataTransfer.files;

			// Trigger the change event (same as selecting a file)
			const event = new Event('change', { bubbles: true });
			fileInput.dispatchEvent(event);

			// Automatically send the message after a brief delay to allow the change handler to process
			setTimeout(() => {
				document.getElementById('sendButton').click();
			}, 100);

			// Clean up
			this.discardVoice();

			console.log('Voice attached as file!');
		},

		discardVoice() {
			this.stopTimer();
			this.recordedBlob = null;
			this.audioChunks = [];
			this.hideAllUI();
		},

	};
	
	window.voiceRecorder = voiceRecorder;

	// Initialize when DOM is ready
	document.addEventListener('DOMContentLoaded', () => {
		voiceRecorder.init();
	});
