/**
 * ElevenLabsService.js
 * Integrates with ElevenLabs API for AI voice generation
 * Generates personalized affirmations based on user survey responses
 */

export class ElevenLabsService {
    constructor() {
        this.apiKey = 'sk_7ba71d78f96f3f7f529102f3f89bd7c8c9ef94dd9d670763';
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        
        // DEBUG MODE - Set to true for testing without API calls
        this.TEST_MODE = false;  // ← DISABLED - Using real ElevenLabs API now
        
        // Cache for generated audio to avoid regeneration
        this.audioCache = new Map();
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests
        
        // Retry configuration
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
        
        // Progress callback for UI updates
        this.onProgress = null;
        
        // Voice IDs for different emotional tones
        this.voiceIds = {
            calming: 'EXAVITQu4vr4xnSDxMaL',      // Sarah - calm, soothing
            energizing: '21m00Tcm4TlvDq8ikWAM',   // Rachel - energetic, confident
            compassionate: 'AZnzlk1XvdvUeBnXmlld', // Domi - warm, caring
            grounding: 'VR6AewLTigWG4xSOukaG'     // Arnold - deep, steady
        };
        
        // Affirmation library: 4 tones × 4 focus areas = 16 combinations
        // Each combination has 10 affirmations
        this.affirmationLibrary = this.buildAffirmationLibrary();
    }
    
    /**
     * Generate affirmations based on survey responses
     * OPTIMIZED: Generates ONE complete MP3 with all 10 affirmations, then splits it
     * PHASE 1 IMPROVEMENTS: Debugging, caching, progress tracking, retry logic
     * @param {Object} responses - User's survey responses
     * @returns {Promise<Object>} Object with full MP3 and individual clips
     */
    async generateAffirmations(responses) {
        console.log('🎤 ========================================');
        console.log('🎤 PHASE 1: AFFIRMATION GENERATION START');
        console.log('🎤 ========================================');
        console.log('📊 Survey responses:', JSON.stringify(responses, null, 2));
        console.log('🧪 TEST_MODE:', this.TEST_MODE);
        console.log('💾 Cache size:', this.audioCache.size, 'entries');
        
        // Check cache first
        const cacheKey = `${responses.emotionalTone}_${responses.focusArea}_${responses.currentMood}`;
        console.log('🔑 Cache key:', cacheKey);
        
        if (this.audioCache.has(cacheKey)) {
            console.log('✅ CACHE HIT! Returning cached affirmations');
            this.updateProgress('Loading cached affirmations...', 100);
            return this.audioCache.get(cacheKey);
        }
        
        console.log('❌ Cache miss - generating new affirmations');
        
        // TEST MODE - Return mock data
        if (this.TEST_MODE) {
            console.log('🧪 TEST MODE: Returning mock data');
            return this.generateMockAffirmations(responses);
        }
        
        try {
            // Step 1: Get affirmation texts
            this.updateProgress('Selecting affirmations...', 10);
            const affirmationTexts = this.getAffirmations(
                responses.emotionalTone,
                responses.focusArea,
                responses.currentMood
            );
            
            console.log(`📝 Selected ${affirmationTexts.length} affirmations:`);
            affirmationTexts.forEach((text, i) => {
                console.log(`   ${i + 1}. ${text.substring(0, 50)}...`);
            });
            
            // Step 2: Get voice ID
            const voiceId = this.voiceIds[responses.emotionalTone];
            console.log(`🎙️ Voice ID: ${voiceId} (${responses.emotionalTone})`);
            
            // Step 3: Generate ALL 10 affirmations in one combined text
            console.log('🎤 Generating ALL 10 affirmations with ElevenLabs API');
            
            // Combine all affirmations with pauses between them
            const combinedText = affirmationTexts.join('... '); // Add pauses between affirmations
            
            this.updateProgress('Generating 10 personalized affirmations...', 30);
            console.log(`📄 Combined text: ${affirmationTexts.length} affirmations`);
            console.log(`📏 Total text length: ${combinedText.length} characters`);
            
            // Step 4: Generate audio with retry logic
            const audioBuffer = await this.generateAudioWithRetry(
                combinedText,
                voiceId,
                responses.emotionalTone
            );
            
            console.log('✅ Audio generated successfully!');
            console.log('📦 Buffer size:', audioBuffer.byteLength, 'bytes');
            
            // Validate audio buffer
            if (!audioBuffer || audioBuffer.byteLength === 0) {
                throw new Error('Received empty audio buffer from API');
            }
            
            if (audioBuffer.byteLength < 100) {
                throw new Error(`Audio buffer too small (${audioBuffer.byteLength} bytes) - likely an error response`);
            }
            
            // Check if it looks like MP3 data (starts with ID3 or 0xFF)
            const dataView = new DataView(audioBuffer);
            const firstByte = dataView.getUint8(0);
            console.log('🔍 First byte of audio:', '0x' + firstByte.toString(16));
            
            if (firstByte !== 0xFF && firstByte !== 0x49) { // 0xFF = MP3, 0x49 = 'I' (ID3)
                console.warn('⚠️ Audio data does not start with expected MP3 header');
                console.warn('⚠️ First 20 bytes:', new Uint8Array(audioBuffer.slice(0, 20)));
            }
            
            // Step 5: Decode audio
            this.updateProgress('Decoding audio...', 70);
            console.log('🎼 Creating audio context...');
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎼 Audio context state:', audioContext.state);
            
            if (audioContext.state === 'suspended') {
                console.log('🎵 Resuming suspended audio context...');
                await audioContext.resume();
                console.log('🎵 Audio context resumed, new state:', audioContext.state);
            }
            
            console.log('🎼 Decoding audio data...');
            console.log('🎼 Buffer to decode:', audioBuffer.byteLength, 'bytes');
            
            let decodedBuffer;
            try {
                // Set a timeout for decoding
                const decodePromise = audioContext.decodeAudioData(audioBuffer.slice(0));
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Decode timeout after 10 seconds')), 10000);
                });
                
                decodedBuffer = await Promise.race([decodePromise, timeoutPromise]);
                console.log(`✅ Audio decoded successfully!`);
                console.log(`   Duration: ${decodedBuffer.duration.toFixed(2)}s`);
                console.log(`   Channels: ${decodedBuffer.numberOfChannels}`);
                console.log(`   Sample rate: ${decodedBuffer.sampleRate}Hz`);
            } catch (decodeError) {
                console.error('❌ Audio decode error:', decodeError);
                console.error('❌ Error name:', decodeError.name);
                console.error('❌ Error message:', decodeError.message);
                
                // Fallback: Return raw audio for each affirmation (no splitting)
                console.log('⚠️ Falling back to raw audio (no splitting) for all affirmations');
                
                const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                
                // Create all 10 affirmations with the same full audio
                const fallbackAffirmations = affirmationTexts.map((text, i) => ({
                    id: i + 1,
                    text: text,
                    audioBuffer: null,
                    url: url,
                    blob: blob,
                    startTime: 0,
                    endTime: 0,
                    tone: responses.emotionalTone,
                    mood: responses.currentMood,
                    focus: responses.focusArea,
                    playCount: 0,
                    cached: false,
                    rawAudio: true
                }));
                
                const result = {
                    affirmations: fallbackAffirmations,
                    fullAudio: {
                        buffer: null,
                        blob: blob,
                        url: url,
                        duration: 0
                    },
                    metadata: {
                        tone: responses.emotionalTone,
                        mood: responses.currentMood,
                        focus: responses.focusArea,
                        voiceId: voiceId,
                        generatedAt: new Date().toISOString(),
                        testMode: false,
                        totalAffirmations: affirmationTexts.length,
                        decodeFailed: true,
                        decodeError: decodeError.message
                    }
                };
                
                this.audioCache.set(cacheKey, result);
                this.updateProgress('Complete (decode failed, but audio available)', 100);
                return result;
            }
            
            // Step 6: Split the full audio into 10 individual affirmation clips
            this.updateProgress('Splitting audio into 10 affirmations...', 90);
            
            const totalDuration = decodedBuffer.duration;
            const segmentDuration = totalDuration / affirmationTexts.length;
            
            console.log(`✂️ Splitting audio:`);
            console.log(`   Total duration: ${totalDuration.toFixed(2)}s`);
            console.log(`   Segments: ${affirmationTexts.length}`);
            console.log(`   Segment duration: ${segmentDuration.toFixed(2)}s`);
            
            const affirmations = [];
            
            for (let i = 0; i < affirmationTexts.length; i++) {
                const startTime = i * segmentDuration;
                const endTime = (i + 1) * segmentDuration;
                
                // Extract segment from audio buffer
                const segmentBuffer = await this.extractAudioSegment(
                    decodedBuffer,
                    startTime,
                    endTime
                );
                
                // Convert to blob
                const blob = await this.audioBufferToBlob(segmentBuffer);
                const url = URL.createObjectURL(blob);
                
                affirmations.push({
                    id: i + 1,
                    text: affirmationTexts[i],
                    audioBuffer: segmentBuffer,
                    url: url,
                    blob: blob,
                    startTime: startTime,
                    endTime: endTime,
                    duration: segmentDuration,
                    tone: responses.emotionalTone,
                    mood: responses.currentMood,
                    focus: responses.focusArea,
                    playCount: 0,
                    cached: false
                });
                
                console.log(`   ✅ Affirmation ${i + 1}: ${startTime.toFixed(2)}s - ${endTime.toFixed(2)}s`);
            }
            
            const fullBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const fullUrl = URL.createObjectURL(fullBlob);
            
            const result = {
                affirmations: affirmations, // All 10 affirmations
                fullAudio: {
                    buffer: decodedBuffer,
                    blob: fullBlob,
                    url: fullUrl,
                    duration: decodedBuffer.duration,
                    rawData: audioBuffer  // ← ADD: Store the raw ArrayBuffer
                },
                metadata: {
                    tone: responses.emotionalTone,
                    mood: responses.currentMood,
                    focus: responses.focusArea,
                    voiceId: voiceId,
                    generatedAt: new Date().toISOString(),
                    testMode: false,
                    totalAffirmations: affirmationTexts.length
                }
            };
            
            // Cache the result
            this.audioCache.set(cacheKey, result);
            console.log('💾 Result cached with key:', cacheKey);
            
            this.updateProgress('Complete!', 100);
            console.log('🎤 ========================================');
            console.log('🎤 GENERATION COMPLETE');
            console.log('🎤 ========================================');
            
            return result;
            
        } catch (error) {
            console.error('❌ ========================================');
            console.error('❌ GENERATION FAILED');
            console.error('❌ ========================================');
            console.error('❌ Error type:', error.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Stack trace:', error.stack);
            
            this.updateProgress('Failed: ' + error.message, 0);
            throw error;
        }
    }
    
    /**
     * Extract a segment from an audio buffer
     */
    async extractAudioSegment(audioBuffer, startTime, endTime) {
        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const segmentLength = endSample - startSample;
        
        // Create a new buffer for the segment
        const segmentBuffer = new AudioContext().createBuffer(
            audioBuffer.numberOfChannels,
            segmentLength,
            sampleRate
        );
        
        // Copy audio data for each channel
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const sourceData = audioBuffer.getChannelData(channel);
            const segmentData = segmentBuffer.getChannelData(channel);
            
            for (let i = 0; i < segmentLength; i++) {
                segmentData[i] = sourceData[startSample + i];
            }
        }
        
        return segmentBuffer;
    }
    
    /**
     * Generate mock affirmations for testing
     */
    async generateMockAffirmations(responses) {
        console.log('🧪 Generating mock affirmations...');
        
        // Create a simple test audio (sine wave beep)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const duration = 3;
        const sampleRate = audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Generate 440Hz tone
        for (let i = 0; i < numSamples; i++) {
            channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3;
        }
        
        // Convert to blob
        const blob = await this.audioBufferToBlob(audioBuffer);
        const url = URL.createObjectURL(blob);
        
        const mockAffirmations = [
            {
                id: 1,
                text: "TEST: You are amazing and worthy of love.",
                audioBuffer: audioBuffer,
                url: url,
                blob: blob,  // Include the blob
                startTime: 0,
                endTime: duration,
                tone: responses.emotionalTone,
                mood: responses.currentMood,
                focus: responses.focusArea,
                playCount: 0,
                cached: true,
                mock: true
            }
        ];
        
        return {
            affirmations: mockAffirmations,
            fullAudio: {
                buffer: audioBuffer,
                blob: blob,
                url: url,
                duration: duration
            },
            metadata: {
                tone: responses.emotionalTone,
                mood: responses.currentMood,
                focus: responses.focusArea,
                generatedAt: new Date().toISOString(),
                testMode: true,
                mock: true
            }
        };
    }
    
    /**
     * Generate audio with retry logic
     */
    async generateAudioWithRetry(text, voiceId, tone, attempt = 1) {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries}`);
        
        try {
            // Rate limiting
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.minRequestInterval) {
                const waitTime = this.minRequestInterval - timeSinceLastRequest;
                console.log(`⏱️ Rate limiting: waiting ${waitTime}ms...`);
                await this.sleep(waitTime);
            }
            
            this.lastRequestTime = Date.now();
            
            const audioBuffer = await this.textToSpeech(text, voiceId, tone);
            console.log(`✅ Attempt ${attempt} succeeded`);
            return audioBuffer;
            
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error.message);
            
            if (attempt < this.maxRetries) {
                const delay = this.retryDelay * attempt; // Exponential backoff
                console.log(`⏳ Retrying in ${delay}ms...`);
                this.updateProgress(`Retry ${attempt}/${this.maxRetries} in ${delay/1000}s...`, 30 + (attempt * 10));
                await this.sleep(delay);
                return this.generateAudioWithRetry(text, voiceId, tone, attempt + 1);
            }
            
            throw new Error(`Failed after ${this.maxRetries} attempts: ${error.message}`);
        }
    }
    
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Update progress (calls callback if set)
     */
    updateProgress(message, percent) {
        console.log(`📊 Progress: ${percent}% - ${message}`);
        if (this.onProgress) {
            this.onProgress(message, percent);
        }
    }
    
    /**
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.onProgress = callback;
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        console.log(`🗑️ Clearing cache (${this.audioCache.size} entries)`);
        this.audioCache.clear();
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.audioCache.size,
            keys: Array.from(this.audioCache.keys())
        };
    }
    
    /**
     * Extract a segment from an audio buffer
     * @param {AudioContext} audioContext 
     * @param {AudioBuffer} sourceBuffer 
     * @param {number} startTime 
     * @param {number} endTime 
     * @returns {AudioBuffer}
     */
    extractAudioSegment(audioContext, sourceBuffer, startTime, endTime) {
        const sampleRate = sourceBuffer.sampleRate;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const segmentLength = endSample - startSample;
        
        // Create new buffer for this segment
        const segmentBuffer = audioContext.createBuffer(
            sourceBuffer.numberOfChannels,
            segmentLength,
            sampleRate
        );
        
        // Copy the audio data for this segment
        for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
            const sourceData = sourceBuffer.getChannelData(channel);
            const segmentData = segmentBuffer.getChannelData(channel);
            
            for (let i = 0; i < segmentLength; i++) {
                segmentData[i] = sourceData[startSample + i];
            }
        }
        
        return segmentBuffer;
    }
    
    /**
     * Convert AudioBuffer to Blob
     * @param {AudioBuffer} audioBuffer 
     * @returns {Promise<Blob>}
     */
    async audioBufferToBlob(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numberOfChannels * 2;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);
        const channels = [];
        let offset = 0;
        let pos = 0;
        
        // Write WAV header
        const setUint16 = (data) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };
        
        // "RIFF" chunk descriptor
        setUint32(0x46464952);
        setUint32(36 + length);
        setUint32(0x45564157);
        
        // "fmt " sub-chunk
        setUint32(0x20746d66);
        setUint32(16);
        setUint16(1);
        setUint16(numberOfChannels);
        setUint32(audioBuffer.sampleRate);
        setUint32(audioBuffer.sampleRate * 2 * numberOfChannels);
        setUint16(numberOfChannels * 2);
        setUint16(16);
        
        // "data" sub-chunk
        setUint32(0x61746164);
        setUint32(length);
        
        // Write interleaved data
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }
        
        while (pos < buffer.byteLength) {
            for (let i = 0; i < numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    }
    
    /**
     * Convert text to speech using ElevenLabs API
     * @param {string} text - Text to convert
     * @param {string} voiceId - Voice ID to use
     * @param {string} tone - Emotional tone for voice settings
     * @returns {Promise<ArrayBuffer>} Audio data
     */
    async textToSpeech(text, voiceId, tone) {
        console.log('🎙️ Calling ElevenLabs API...');
        console.log('📄 Text length:', text.length, 'characters');
        console.log('🎤 Voice ID:', voiceId);
        console.log('🎵 Tone:', tone);
        
        // Voice settings based on emotional tone
        const voiceSettings = {
            calming: {
                stability: 0.7,
                similarity_boost: 0.8,
                style: 0.2,
                use_speaker_boost: true
            },
            energizing: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.6,
                use_speaker_boost: true
            },
            compassionate: {
                stability: 0.65,
                similarity_boost: 0.85,
                style: 0.3,
                use_speaker_boost: true
            },
            grounding: {
                stability: 0.75,
                similarity_boost: 0.8,
                style: 0.4,
                use_speaker_boost: true
            }
        };
        
        const url = `${this.baseUrl}/text-to-speech/${voiceId}`;
        const requestBody = {
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: voiceSettings[tone] || voiceSettings.calming
        };
        
        console.log('📡 API URL:', url);
        console.log('📦 Request body:', JSON.stringify(requestBody).substring(0, 200) + '...');
        
        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error('⏱️ API request timeout after 30 seconds');
                controller.abort();
            }, 30000); // 30 second timeout
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('📨 API Response status:', response.status, response.statusText);
            console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API error response:', errorText);
                throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('✅ Received audio data:', arrayBuffer.byteLength, 'bytes');
            
            return arrayBuffer;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 30 seconds. Please check your internet connection and try again.');
            }
            console.error('❌ Fetch error:', error);
            throw error;
        }
    }
    
    /**
     * Get 10 affirmations for the given combination
     * @param {string} tone - Emotional tone
     * @param {string} focus - Focus area
     * @param {string} mood - Current mood (for customization)
     * @returns {Array<string>} 10 affirmation texts
     */
    getAffirmations(tone, focus, mood) {
        const key = `${tone}_${focus}`;
        return this.affirmationLibrary[key] || this.affirmationLibrary['calming_self-love'];
    }
    
    /**
     * Build the complete affirmation library
     * 16 combinations × 10 affirmations = 160 total affirmations
     */
    buildAffirmationLibrary() {
        return {
            // CALMING × SELF-LOVE
            'calming_self-love': [
                "You are enough, exactly as you are in this moment.",
                "Your worth is inherent and cannot be diminished.",
                "You deserve peace, love, and gentle kindness.",
                "Be patient with yourself, you are growing every day.",
                "Your heart is beautiful, and you are deeply loved.",
                "You are worthy of rest, care, and tenderness.",
                "Accept yourself completely, flaws and all.",
                "You are a precious soul deserving of compassion.",
                "Your value does not depend on productivity or perfection.",
                "You are learning to love yourself more each day."
            ],
            
            // CALMING × CONFIDENCE
            'calming_confidence': [
                "Trust yourself, you know your path forward.",
                "Your intuition is wise and worth listening to.",
                "You have everything you need within you right now.",
                "Believe in your unique journey and timing.",
                "Your voice matters and deserves to be heard.",
                "You are capable of making good decisions for yourself.",
                "Confidence grows from self-acceptance, not perfection.",
                "You trust your abilities and honor your pace.",
                "Your quiet strength is powerful and valid.",
                "You are becoming more confident with each breath."
            ],
            
            // CALMING × GRATITUDE
            'calming_gratitude': [
                "You are grateful for this peaceful moment of stillness.",
                "Abundance flows to you in gentle, perfect ways.",
                "You appreciate the simple beauty around you.",
                "Gratitude fills your heart with warmth and light.",
                "You are thankful for your breath and your life.",
                "Small joys surround you when you pause to notice.",
                "You receive life's gifts with an open, grateful heart.",
                "Peace and gratitude expand within you now.",
                "You are blessed, and you recognize your blessings.",
                "Thankfulness brings you serenity and contentment."
            ],
            
            // CALMING × RESILIENCE
            'calming_resilience': [
                "You have survived every difficult day so far.",
                "You are stronger than you realize, one step at a time.",
                "Healing unfolds gently in its own perfect timing.",
                "You bend but do not break, like a willow in the wind.",
                "Rest is part of resilience, not separate from it.",
                "You have the courage to begin again, peacefully.",
                "Challenges pass, and you remain steady at your core.",
                "You trust the process of your healing and growth.",
                "Your resilience grows quietly, like roots deepening.",
                "You are allowed to heal at your own gentle pace."
            ],
            
            // ENERGIZING × SELF-LOVE
            'energizing_self-love': [
                "You are amazing, powerful, and absolutely worthy!",
                "You radiate confidence and self-love today!",
                "You celebrate who you are with joy and pride!",
                "You are unstoppable when you believe in yourself!",
                "Your energy is magnetic and your spirit is bright!",
                "You honor yourself by showing up fully today!",
                "You are fierce, fabulous, and unapologetically you!",
                "You embrace your uniqueness with enthusiasm!",
                "You are worthy of celebrating yourself every day!",
                "You shine brightest when you love yourself boldly!"
            ],
            
            // ENERGIZING × CONFIDENCE
            'energizing_confidence': [
                "You are powerful and ready to conquer your goals!",
                "Today you will show the world what you're made of!",
                "Your potential is limitless, and you're claiming it now!",
                "You were born to stand out and make an impact!",
                "Success flows naturally to you when you take action!",
                "You trust yourself completely and move forward boldly!",
                "You are a force of nature, unstoppable and strong!",
                "Confidence is your superpower, and you're using it today!",
                "You speak your truth with clarity and conviction!",
                "You are ready to rise, shine, and absolutely thrive!"
            ],
            
            // ENERGIZING × GRATITUDE
            'energizing_gratitude': [
                "You are bursting with gratitude for all you have!",
                "Life is amazing, and you celebrate it fully today!",
                "You attract abundance by appreciating what's already here!",
                "Every moment is a gift, and you're unwrapping it with joy!",
                "You are thankful for your strength, energy, and vitality!",
                "Gratitude fuels your passion and lights your path!",
                "You radiate appreciation and attract even more blessings!",
                "You count your wins and celebrate every victory!",
                "Life is generous with you, and you notice all the good!",
                "You are grateful, energized, and ready for greatness!"
            ],
            
            // ENERGIZING × RESILIENCE
            'energizing_resilience': [
                "You bounce back stronger from every challenge!",
                "Obstacles are just opportunities in disguise for you!",
                "You are unbreakable, unstoppable, and always rising!",
                "Setbacks fuel your comeback story every single time!",
                "You transform difficulties into rocket fuel for success!",
                "You are a warrior, and challenges make you fiercer!",
                "Nothing can hold you down when you're determined to rise!",
                "You thrive under pressure and grow through adversity!",
                "Your resilience is legendary, and you prove it daily!",
                "You turn struggles into stepping stones to greatness!"
            ],
            
            // COMPASSIONATE × SELF-LOVE
            'compassionate_self-love': [
                "You are deeply loved, exactly as you are today.",
                "Your heart deserves the same kindness you give others.",
                "You hold yourself with tenderness and understanding.",
                "You are worthy of unconditional love and belonging.",
                "Be gentle with yourself, dear one, you're doing your best.",
                "You are cherished, valued, and irreplaceable.",
                "Your imperfections make you beautifully human.",
                "You extend compassion to yourself in every moment.",
                "You are loved for who you are, not what you do.",
                "You wrap yourself in warmth, care, and self-acceptance."
            ],
            
            // COMPASSIONATE × CONFIDENCE
            'compassionate_confidence': [
                "You trust yourself with loving kindness and patience.",
                "Your voice is valuable, and sharing it is brave.",
                "You honor your needs and boundaries with compassion.",
                "You are learning, growing, and that's more than enough.",
                "You give yourself permission to take up space.",
                "Your journey is yours alone, and it's perfectly valid.",
                "You believe in yourself with gentle, steady faith.",
                "You are capable, and you're allowed to be imperfect too.",
                "You speak to yourself with love, not criticism.",
                "Confidence blooms when you're kind to yourself first."
            ],
            
            // COMPASSIONATE × GRATITUDE
            'compassionate_gratitude': [
                "You appreciate the love that surrounds and holds you.",
                "You are grateful for the people who care for you.",
                "Your heart is full of thankfulness and warmth.",
                "You receive kindness with grace and appreciation.",
                "You notice the gentle gifts life offers you daily.",
                "Gratitude for connection fills you with belonging.",
                "You cherish the relationships that nourish your soul.",
                "You are thankful for every act of love in your life.",
                "You hold gratitude softly, like a precious treasure.",
                "Appreciation for yourself and others lights your way."
            ],
            
            // COMPASSIONATE × RESILIENCE
            'compassionate_resilience': [
                "You are healing, one compassionate moment at a time.",
                "You've been through so much, and you're still here.",
                "Your wounds are becoming wisdom, gently and beautifully.",
                "You honor your pain while trusting in your recovery.",
                "Resilience doesn't mean you don't hurt, it means you endure.",
                "You are tender with yourself as you move through hardship.",
                "Your scars tell a story of survival and courage.",
                "You allow yourself to rest, recover, and restore.",
                "Healing is not linear, and you accept that with grace.",
                "You are strong enough to be vulnerable and keep going."
            ],
            
            // GROUNDING × SELF-LOVE
            'grounding_self-love': [
                "You are rooted in your inherent worth and value.",
                "You stand firm in the knowledge that you are enough.",
                "Your foundation is built on self-acceptance and truth.",
                "You are solidly, unshakably worthy of love.",
                "You plant your feet and claim your right to exist fully.",
                "Your sense of self is strong, stable, and centered.",
                "You are anchored in self-love that cannot be moved.",
                "You know who you are, and that is powerful.",
                "Your worth is not up for debate or negotiation.",
                "You are grounded in the truth of your own value."
            ],
            
            // GROUNDING × CONFIDENCE
            'grounding_confidence': [
                "You trust your decisions and stand by them firmly.",
                "You are steady, focused, and clear on your path.",
                "Your confidence is built on a solid foundation of self-trust.",
                "You move forward with purpose and unwavering belief.",
                "You are certain of your abilities and your direction.",
                "Your power comes from being grounded in who you are.",
                "You speak with authority because you know your truth.",
                "You are unshaken by doubt because you trust yourself.",
                "Your confidence is deep-rooted and unbreakable.",
                "You stand tall, grounded in your own strength."
            ],
            
            // GROUNDING × GRATITUDE
            'grounding_gratitude': [
                "You are grateful for the solid ground beneath your feet.",
                "You appreciate the stability and security in your life.",
                "You are thankful for your roots and your foundation.",
                "Gratitude anchors you to the present moment.",
                "You recognize and honor what sustains you daily.",
                "You are grounded in appreciation for what is.",
                "Thankfulness connects you deeply to the earth and life.",
                "You are present, grateful, and firmly here now.",
                "You appreciate the reliable support around you.",
                "Gratitude roots you in abundance and stability."
            ],
            
            // GROUNDING × RESILIENCE
            'grounding_resilience': [
                "You are exactly where you need to be right now.",
                "You trust the journey, even when the path is unclear.",
                "Your roots run deep, and storms cannot uproot you.",
                "You stand firm through change, anchored in your core.",
                "You have weathered challenges before, and you will again.",
                "Your resilience is rooted in your unshakable spirit.",
                "You remain steady through uncertainty and upheaval.",
                "You are grounded in your capacity to endure and overcome.",
                "You plant your feet and face what comes with courage.",
                "Your foundation is strong enough to support your growth."
            ]
        };
    }
    
    /**
     * Get available voices from ElevenLabs API
     * @returns {Promise<Array>} List of available voices
     */
    async getAvailableVoices() {
        try {
            const response = await fetch(
                `${this.baseUrl}/voices`,
                {
                    headers: {
                        'xi-api-key': this.apiKey
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch voices: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🎤 Available voices:', data.voices);
            return data.voices;
            
        } catch (error) {
            console.error('❌ Error fetching voices:', error);
            return [];
        }
    }
    
    /**
     * Get user info from ElevenLabs API
     * @returns {Promise<Object>} User subscription info
     */
    async getUserInfo() {
        try {
            const response = await fetch(
                `${this.baseUrl}/user`,
                {
                    headers: {
                        'xi-api-key': this.apiKey
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('👤 User info:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error fetching user info:', error);
            return null;
        }
    }
}
