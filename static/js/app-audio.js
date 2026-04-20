// Simple Audio Player
		const audioPlayer = {
			audio: null,
			currentTrackName: '',
			isPlaying: false
		};

		function initSimpleAudioPlayer() {
			audioPlayer.audio = new Audio();

			// Update duration when metadata loads or duration changes
			const updateDuration = () => {
				const duration = document.getElementById('sidebarDuration');
				if (duration && isFinite(audioPlayer.audio.duration) && audioPlayer.audio.duration > 0) {
					duration.textContent = formatTime(audioPlayer.audio.duration);
				}
			};

			audioPlayer.audio.addEventListener('loadedmetadata', updateDuration);
			audioPlayer.audio.addEventListener('durationchange', updateDuration);
			
			// Also try updating after a short delay for stubborn files
			audioPlayer.audio.addEventListener('canplay', () => {
				setTimeout(updateDuration, 100);
			});

			audioPlayer.audio.addEventListener('timeupdate', () => {
				const currentTime = document.getElementById('sidebarCurrentTime');
				const seekBar = document.getElementById('sidebarSeekBar');

				if (currentTime) currentTime.textContent = formatTime(audioPlayer.audio.currentTime);
				if (seekBar && isFinite(audioPlayer.audio.duration) && audioPlayer.audio.duration > 0) {
					seekBar.value = (audioPlayer.audio.currentTime / audioPlayer.audio.duration) * 100;
				}
			});

			audioPlayer.audio.addEventListener('ended', () => {
				audioPlayer.isPlaying = false;
				updatePlayButton(false);
			});

			audioPlayer.audio.addEventListener('play', () => {
				audioPlayer.isPlaying = true;
				updatePlayButton(true);
			});

			audioPlayer.audio.addEventListener('pause', () => {
				audioPlayer.isPlaying = false;
				updatePlayButton(false);
			});

			// Seek bar
			const seekBar = document.getElementById('sidebarSeekBar');
			if (seekBar) {
				seekBar.addEventListener('input', (e) => {
					if (audioPlayer.audio && isFinite(audioPlayer.audio.duration) && audioPlayer.audio.duration > 0) {
						audioPlayer.audio.currentTime = (e.target.value / 100) * audioPlayer.audio.duration;
					}
				});
			}

			// Volume bar
			const volumeBar = document.getElementById('sidebarVolumeBar');
			if (volumeBar) {
				volumeBar.addEventListener('input', (e) => {
					if (audioPlayer.audio) {
						audioPlayer.audio.volume = e.target.value / 100;
					}
				});
			}
		}

		function playInlineAudio(url, name, audioElement) {
			// Stop any currently playing audio
			if (audioPlayer.audio) {
				audioPlayer.audio.pause();
			}

			// Update all inline players
			document.querySelectorAll('.inline-audio-player').forEach(player => {
				const icon = player.querySelector('.play-btn i');
				if (icon) icon.className = 'fas fa-play';
			});

			// Load new audio
			audioPlayer.audio.src = url;
			audioPlayer.currentTrackName = name;
			audioPlayer.audio.play();

			// Update this player's button
			const icon = audioElement.querySelector('.play-btn i');
			if (icon) icon.className = 'fas fa-pause';

			// Show sidebar player
			showSidebarPlayer(name);
		}

		function toggleInlineAudio(button, url, name) {
			const player = button.closest('.inline-audio-player');
			const icon = button.querySelector('i');

			if (audioPlayer.audio && audioPlayer.audio.src.endsWith(url.split('/').pop())) {
				// Same track - toggle play/pause
				if (audioPlayer.isPlaying) {
					audioPlayer.audio.pause();
					icon.className = 'fas fa-play';
				} else {
					audioPlayer.audio.play();
					icon.className = 'fas fa-pause';
					// Show sidebar player when resuming
					showSidebarPlayer(name);
				}
			} else {
				// Different track - play new one
				playInlineAudio(url, name, player);
			}
		}
		
		function showSidebarPlayer(trackName) {
			const sidebarPlayer = document.getElementById('sidebarAudioPlayer');
			const trackNameEl = document.getElementById('sidebarTrackName');

			if (sidebarPlayer) sidebarPlayer.classList.remove('hidden');
			if (trackNameEl) trackNameEl.textContent = trackName;
		}
		
		function toggleAudioPlayback() {
			if (!audioPlayer.audio) return;

			if (audioPlayer.isPlaying) {
				audioPlayer.audio.pause();
			} else {
				audioPlayer.audio.play();
			}
		}

		function updatePlayButton(isPlaying) {
			const sidebarBtn = document.getElementById('sidebarPlayBtn');
			if (sidebarBtn) {
				const icon = sidebarBtn.querySelector('i');
				if (icon) {
					icon.className = isPlaying ? 'fas fa-pause text-sm' : 'fas fa-play text-sm';
				}
			}
		}

		function closeSidebarPlayer() {
			if (audioPlayer.audio) {
				audioPlayer.audio.pause();
			}

			const sidebarPlayer = document.getElementById('sidebarAudioPlayer');
			if (sidebarPlayer) sidebarPlayer.classList.add('hidden');

			// Reset all inline players
			document.querySelectorAll('.inline-audio-player .play-btn i').forEach(icon => {
				icon.className = 'fas fa-play';
			});
		}

		function toggleSidebarVolume() {
			const volumeControl = document.getElementById('sidebarVolumeControl');
			if (volumeControl) {
				volumeControl.classList.toggle('hidden');
			}
		}

		function formatTime(seconds) {
			if (isNaN(seconds) || !isFinite(seconds) || seconds === 0) return '0:00';
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return mins + ':' + (secs < 10 ? '0' : '') + secs;
		}

		// Initialize on page load
		document.addEventListener('DOMContentLoaded', () => {
			initSimpleAudioPlayer();
            document.getElementById('sidebarPlayBtn')?.addEventListener('click', toggleAudioPlayback);
            document.getElementById('sidebarCloseButton')?.addEventListener('click', closeSidebarPlayer);
            document.getElementById('sidebarVolumeToggleButton')?.addEventListener('click', toggleSidebarVolume);
		});

        if (typeof window !== 'undefined') {
            window.toggleInlineAudio = toggleInlineAudio;
        }

        // Register Service Worker for media caching
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registered successfully:', registration.scope);
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }
