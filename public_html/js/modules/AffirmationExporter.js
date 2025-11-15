/**
 * AffirmationExporter.js
 * Combines collected affirmations into a single MP3/WAV file for export
 */

export class AffirmationExporter {
    constructor(audioFiles) {
        this.audioFiles = audioFiles.filter(file => file.url); // Only successful ones
        this.gapDuration = 2; // seconds between affirmations
    }
    
    /**
     * Create a combined audio file from all affirmations
     * @returns {Promise<Blob>} Combined audio blob
     */
    async createCombinedAudio() {
        if (this.audioFiles.length === 0) {
            throw new Error('No audio files to combine');
        }
        
        console.log(`📦 Combining ${this.audioFiles.length} affirmations...`);
        
        try {
            // Create audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Decode all audio buffers
            console.log('🔄 Decoding audio buffers...');
            const buffers = await Promise.all(
                this.audioFiles.map(file => 
                    audioContext.decodeAudioData(file.audioData.slice(0))
                )
            );
            
            console.log(`✅ Decoded ${buffers.length} audio buffers`);
            
            // Calculate total length (affirmations + gaps)
            const totalDuration = buffers.reduce((sum, buf) => 
                sum + buf.duration + this.gapDuration, 0
            );
            
            console.log(`⏱️ Total duration: ${totalDuration.toFixed(2)}s`);
            
            // Create offline context for rendering
            const offlineContext = new OfflineAudioContext(
                2, // stereo
                Math.ceil(audioContext.sampleRate * totalDuration),
                audioContext.sampleRate
            );
            
            // Schedule all affirmations with gaps
            let currentTime = 0;
            buffers.forEach((buffer, index) => {
                const source = offlineContext.createBufferSource();
                source.buffer = buffer;
                source.connect(offlineContext.destination);
                source.start(currentTime);
                
                console.log(`   ${index + 1}. "${this.audioFiles[index].text.substring(0, 40)}..." at ${currentTime.toFixed(2)}s`);
                
                currentTime += buffer.duration + this.gapDuration;
            });
            
            // Render to buffer
            console.log('🎵 Rendering combined audio...');
            const renderedBuffer = await offlineContext.startRendering();
            
            // Convert to WAV blob
            console.log('💾 Converting to WAV format...');
            const wavBlob = this.bufferToWave(renderedBuffer, audioContext.sampleRate);
            
            console.log(`✅ Combined audio created: ${(wavBlob.size / 1024 / 1024).toFixed(2)} MB`);
            
            return wavBlob;
            
        } catch (error) {
            console.error('❌ Error combining audio:', error);
            throw error;
        }
    }
    
    /**
     * Convert audio buffer to WAV blob
     * @param {AudioBuffer} buffer - Audio buffer to convert
     * @param {number} sampleRate - Sample rate
     * @returns {Blob} WAV blob
     */
    bufferToWave(buffer, sampleRate) {
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numberOfChannels * 2; // 16-bit samples
        const arrayBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(arrayBuffer);
        
        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        // RIFF chunk descriptor
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(8, 'WAVE');
        
        // fmt sub-chunk
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk size
        view.setUint16(20, 1, true); // Audio format (1 = PCM)
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true); // Byte rate
        view.setUint16(32, numberOfChannels * 2, true); // Block align
        view.setUint16(34, 16, true); // Bits per sample
        
        // data sub-chunk
        writeString(36, 'data');
        view.setUint32(40, length, true);
        
        // Write audio data
        const offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(
                    offset + (i * numberOfChannels + channel) * 2,
                    int16,
                    true
                );
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
    
    /**
     * Download the combined audio file
     * @param {Blob} blob - Audio blob to download
     * @param {string} filename - Filename for download
     */
    download(blob, filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().split('T')[0];
            filename = `my-affirmations-${timestamp}.wav`;
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`✅ Downloaded: ${filename}`);
    }
    
    /**
     * Show export UI with download button
     * @param {Object} responses - User survey responses
     */
    showExportUI(responses) {
        const overlay = document.createElement('div');
        overlay.className = 'affirmation-export-overlay';
        overlay.id = 'affirmation-export';
        
        const tone = responses.emotionalTone;
        const focus = responses.focusArea;
        
        overlay.innerHTML = `
            <div class="export-card">
                <div class="export-header">
                    <div class="export-icon">🎉</div>
                    <h2>Journey Complete!</h2>
                    <p>You've discovered all ${this.audioFiles.length} of your personalized affirmations</p>
                </div>
                
                <div class="export-stats">
                    <div class="stat-item">
                        <span class="stat-icon">✨</span>
                        <div class="stat-content">
                            <strong>${tone}</strong>
                            <span>Emotional Tone</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🎯</span>
                        <div class="stat-content">
                            <strong>${focus}</strong>
                            <span>Focus Area</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🎵</span>
                        <div class="stat-content">
                            <strong>${this.audioFiles.length} affirmations</strong>
                            <span>Collected</span>
                        </div>
                    </div>
                </div>
                
                <div class="export-message">
                    <p>Your personalized affirmations are ready to take with you!</p>
                    <p>Listen to them anytime you need encouragement, motivation, or peace.</p>
                </div>
                
                <div class="export-actions">
                    <button class="export-btn download-btn">
                        <span class="btn-icon">⬇️</span>
                        <span class="btn-text">Download My Affirmations</span>
                    </button>
                    <button class="export-btn share-btn">
                        <span class="btn-icon">✨</span>
                        <span class="btn-text">Create New Journey</span>
                    </button>
                </div>
                
                <div class="export-footer">
                    <small>Powered by ElevenLabs AI Voice Generation</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Fade in
        setTimeout(() => overlay.classList.add('visible'), 10);
        
        // Download button
        overlay.querySelector('.download-btn').addEventListener('click', async () => {
            const btn = overlay.querySelector('.download-btn');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading-spinner-small"></span><span class="btn-text">Combining Audio...</span>';
            
            try {
                const combinedBlob = await this.createCombinedAudio();
                this.download(combinedBlob);
                
                btn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Downloaded!</span>';
                
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="btn-icon">⬇️</span><span class="btn-text">Download Again</span>';
                }, 2000);
                
            } catch (error) {
                console.error('Export error:', error);
                btn.innerHTML = '<span class="btn-icon">❌</span><span class="btn-text">Export Failed</span>';
                
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="btn-icon">⬇️</span><span class="btn-text">Try Again</span>';
                }, 2000);
            }
        });
        
        // Share/restart button
        overlay.querySelector('.share-btn').addEventListener('click', () => {
            overlay.remove();
            window.location.reload(); // Restart experience
        });
        
        console.log('📤 Export UI displayed');
    }
    
    /**
     * Create a playlist/text file with all affirmations
     * @returns {Blob} Text file blob
     */
    createPlaylist() {
        const timestamp = new Date().toLocaleString();
        let content = `My Personal Affirmations\n`;
        content += `Created: ${timestamp}\n`;
        content += `\n`;
        content += `=====================================\n\n`;
        
        this.audioFiles.forEach((file, index) => {
            content += `${index + 1}. ${file.text}\n\n`;
        });
        
        content += `=====================================\n`;
        content += `Generated with ElevenLabs AI Voice\n`;
        content += `EyeTrip VR - Immersive Affirmation Experience\n`;
        
        return new Blob([content], { type: 'text/plain' });
    }
    
    /**
     * Download the text playlist
     */
    downloadPlaylist() {
        const blob = this.createPlaylist();
        const timestamp = new Date().toISOString().split('T')[0];
        this.download(blob, `my-affirmations-${timestamp}.txt`);
    }
}
