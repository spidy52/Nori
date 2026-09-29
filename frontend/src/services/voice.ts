
/**
 * Nori Real-Time Voice Engine (STT & TTS)
 * Web Speech API with continuous ambient listening, auto-restart,
 * echo suppression while speaking, and natural SpeechSynthesis.
 */

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

class VoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private isAmbientMode: boolean = false;
  private ttsEnabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voiceRate: number = 1.0;
  private voicePitch: number = 1.0;
  private isSpeaking: boolean = false;
  private lastSpokenTime: number = 0;
  private recentSpokenPhrases: string[] = [];
  private onAmbientTranscript: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onStateChange: ((state: VoiceState) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSTT();
      this.initTTS();
    }
  }

  private initSTT() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStateChange) this.onStateChange('listening');
      };

      this.recognition.onresult = (event: any) => {
        const now = Date.now();
        // Acoustic Echo Suppression: ignore microphone while speaking OR within 2.2s after speech ends
        if (this.isSpeaking || (now - this.lastSpokenTime < 2200)) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = (finalTranscript || interimTranscript).trim();
        const textLower = text.toLowerCase();

        // Echo Filter: Ignore if transcript matches Nori's own recent spoken text
        if (text && this.recentSpokenPhrases.some((phrase) => phrase.includes(textLower) || textLower.includes(phrase))) {
          return;
        }

        const isFinal = finalTranscript.length > 0;

        if (text && this.onAmbientTranscript) {
          this.onAmbientTranscript(text, isFinal);
        }
      };

      this.recognition.onerror = (event: any) => {
        // 'no-speech' is expected during ambient silence
        if (event.error !== 'no-speech') {
          console.warn('[VoiceEngine] STT Error:', event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Auto-restart if ambient listening is enabled
        if (this.isAmbientMode && !this.isSpeaking) {
          try {
            this.recognition.start();
          } catch (e) {
            // retry after short pause
            setTimeout(() => {
              if (this.isAmbientMode && !this.isListening && !this.isSpeaking) {
                try { this.recognition.start(); } catch (err) {}
              }
            }, 600);
          }
        } else {
          if (this.onStateChange) this.onStateChange('idle');
        }
      };
    }
  }

  private initTTS() {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Strictly select Microsoft Zira or female English voice
        const ziraVoice = voices.find((v) => v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('female'));
        const englishVoice =
          ziraVoice ||
          voices.find((v) => (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Zira')) && v.lang.startsWith('en')) ||
          voices.find((v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('david') && !v.name.toLowerCase().includes('mark') && !v.name.toLowerCase().includes('george')) ||
          voices[0];
        if (englishVoice) {
          this.selectedVoice = englishVoice;
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  public isSTTSupported(): boolean {
    return this.recognition !== null;
  }

  public isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
  }

  public setVoiceSettings(rate: number, pitch: number, enabled: boolean) {
    this.voiceRate = rate;
    this.voicePitch = pitch;
    this.ttsEnabled = enabled;
  }

  /**
   * Speak text out loud using browser SpeechSynthesis with natural phrasing.
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.ttsEnabled || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      // Clean markdown symbols for natural speech output
      const cleanText = text
        .replace(/[*_#`~\[\]]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .slice(0, 400);

      const cleanLower = cleanText.toLowerCase().trim();
      this.recentSpokenPhrases.push(cleanLower);
      if (this.recentSpokenPhrases.length > 10) this.recentSpokenPhrases.shift();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = this.voiceRate;
      utterance.pitch = this.voicePitch;

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (this.onStateChange) this.onStateChange('speaking');
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.lastSpokenTime = Date.now();
        setTimeout(() => {
          this.isSpeaking = false;
          if (onEnd) onEnd();
          // Resume ambient listening if enabled
          if (this.isAmbientMode && !this.isListening) {
            try { this.recognition.start(); } catch (e) {}
          } else if (this.onStateChange) {
            this.onStateChange('idle');
          }
        }, 1500);
      };

      utterance.onerror = (e) => {
        this.lastSpokenTime = Date.now();
        this.isSpeaking = false;
        if (onError) onError(e);
        if (onEnd) onEnd();
        if (this.isAmbientMode && !this.isListening) {
          try { this.recognition.start(); } catch (err) {}
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.isSpeaking = false;
      if (onError) onError(e);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    this.isSpeaking = false;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Continuous Ambient Listening Mode:
   * Keeps listening in the background and notifies listener when speech is detected.
   */
  public startAmbientListening(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onStateChange?: (state: VoiceState) => void
  ) {
    if (!this.recognition) return;
    this.isAmbientMode = true;
    this.onAmbientTranscript = onTranscript;
    if (onStateChange) this.onStateChange = onStateChange;

    if (!this.isListening && !this.isSpeaking) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('[VoiceEngine] Could not start ambient recognition immediately:', e);
      }
    }
  }

  public stopAmbientListening() {
    this.isAmbientMode = false;
    this.onAmbientTranscript = null;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
    if (this.onStateChange) this.onStateChange('idle');
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsAmbient(): boolean {
    return this.isAmbientMode;
  }

  /**
   * One-shot voice listening (fallback)
   */
  public startListening(
    onResult: (transcript: string) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this environment.');
      return;
    }

    this.isAmbientMode = false;
    if (this.isListening) {
      try { this.recognition.stop(); } catch (e) {}
    }

    const prevOnResult = this.recognition.onresult;
    const prevOnEnd = this.recognition.onend;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        onResult(transcript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (onError) onError(event.error || 'Speech recognition error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.recognition.onresult = prevOnResult;
      this.recognition.onend = prevOnEnd;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      if (onError) onError(e.message || 'Could not start microphone.');
    }
  }

  public stopListening() {
    this.stopAmbientListening();
  }
}

export const voiceEngine = new VoiceEngine();
