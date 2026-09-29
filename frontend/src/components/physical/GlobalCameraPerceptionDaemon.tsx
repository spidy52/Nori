import React, { useEffect, useRef } from 'react';
import { useNori } from '../../context/NoriContext';
import { voiceEngine } from '../../services/voice';

export const GlobalCameraPerceptionDaemon: React.FC = () => {
  const { privacyState, activeView, userProfile, setCompanionThought } = useNori();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isAnalyzingRef = useRef<boolean>(false);
  const lastSpokenItemRef = useRef<string | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const lastPresenceTimeRef = useRef<number>(Date.now());
  const isUserAwayRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. If user is currently looking at Camera Guidance View, yield camera completely to avoid hardware lock
    if (activeView === 'physical' || activeView === 'camera') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    // 2. Check if camera permission is enabled in privacy state
    if (privacyState && !privacyState.camera_enabled) {
      return;
    }

    let isMounted = true;

    // Start background video stream with resilient constraint fallback
    const startBgStream = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        // Quiet background fallback
      }
    };

    if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator) {
      startBgStream();
    }

    // Background Autonomous Perception Loop (samples every 900ms to preserve battery/CPU)
    const interval = setInterval(async () => {
      if (isAnalyzingRef.current) return;
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        isAnalyzingRef.current = true;
        const offscreen = document.createElement('canvas');
        const vidW = video.videoWidth || 640;
        const vidH = video.videoHeight || 480;
        const targetW = 640;
        const targetH = Math.max(240, Math.round((vidH / vidW) * targetW));

        offscreen.width = targetW;
        offscreen.height = targetH;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
        const imageBase64 = offscreen.toDataURL('image/jpeg', 0.8).split(',')[1];

        const res = await fetch('http://127.0.0.1:8000/api/physical/analyze_frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: imageBase64, project_context: 'Autonomous Global Perception' }),
          signal: controller.signal
        });

        if (res.ok) {
          const data = await res.json();
          const primaryItem = data.primary_detected_item;
          const dialogue = data.interactive_dialogue || data.proactive_advice;
          const activityType = data.activity?.activity_type;
          const now = Date.now();

          // 0. Presence Return Tracking (Welcome back ONLY when user returns after being gone > 10 minutes)
          const isPresent =
            (data.objects && data.objects.some((o: any) => o.category === 'human' || o.label.toLowerCase().includes('face') || o.label.toLowerCase().includes('person'))) ||
            activityType === 'work_and_coding';

          if (isPresent) {
            const awayDurationMs = now - lastPresenceTimeRef.current;
            if (isUserAwayRef.current && awayDurationMs > 600000) { // 10 minutes = 600,000 ms
              isUserAwayRef.current = false;
              lastPresenceTimeRef.current = now;
              lastSpeechTimeRef.current = now;
              const name = userProfile?.name?.split(' ')[0] || 'there';
              const awayMins = Math.max(10, Math.round(awayDurationMs / 60000));
              const welcomeMsg = `Welcome back ${name}! You've been gone for about ${awayMins} minutes. Where were you? Hope you had a great break! Ready to pick up where we left off?`;
              setCompanionThought({
                id: `welcome_${now}`,
                timestamp: now / 1000,
                mood: 'friendly',
                thought: welcomeMsg,
                detail: `User returned after ${awayMins} mins away`,
                action_suggestion: 'Resume Session',
                source: 'presence_tracker'
              });
              voiceEngine.speak(welcomeMsg);
            } else {
              lastPresenceTimeRef.current = now;
            }
          } else {
            // Set user away state ONLY if camera frame has no human presence for > 10 minutes (600,000 ms)
            if (now - lastPresenceTimeRef.current > 600000) {
              isUserAwayRef.current = true;
            }
          }

          // 1. Group Discussion Proactive Voice Chime-in
          if (
            activityType === 'group_discussion' &&
            now - lastSpeechTimeRef.current > 15000
          ) {
            lastSpeechTimeRef.current = now;
            const groupSpeech = `I see a group discussion active! Feel free to ask me for architecture blueprints, code reviews, or live telemetry during your discussion.`;
            setCompanionThought({
              id: `group_${now}`,
              timestamp: now / 1000,
              mood: 'curious',
              thought: groupSpeech,
              detail: 'Detected multiple people in camera viewport',
              action_suggestion: 'Open Team Whiteboard',
              source: 'group_perception'
            });
            voiceEngine.speak(groupSpeech);
          }
          // 2. Speak proactively ONLY when a handheld gadget, component, wrapper, or tool is brought to view (NEVER face/person)
          else if (
            primaryItem &&
            dialogue &&
            !primaryItem.toLowerCase().includes('face') &&
            !primaryItem.toLowerCase().includes('person') &&
            !primaryItem.toLowerCase().includes('human') &&
            primaryItem !== lastSpokenItemRef.current &&
            now - lastSpeechTimeRef.current > 15000
          ) {
            lastSpokenItemRef.current = primaryItem;
            lastSpeechTimeRef.current = now;
            setCompanionThought({
              id: `vision_${now}`,
              timestamp: now / 1000,
              mood: 'observing',
              thought: dialogue,
              detail: `Item: ${primaryItem}`,
              action_suggestion: 'Inspect Item',
              source: 'physical_vision'
            });
            voiceEngine.speak(dialogue);
          }
        }
      } catch (e) {
        // Quiet
      } finally {
        clearTimeout(timeoutId);
        isAnalyzingRef.current = false;
      }
    }, 900);

    // 3. Periodic Proactive Life & Interest Engagement Loop (Natural ~6-8 minutes of idle focus)
    const proactiveInterval = setInterval(() => {
      if (privacyState?.is_paused) return;
      const now = Date.now();
      if (now - lastSpeechTimeRef.current > 360000) { // 6 minutes natural threshold
        const name = userProfile?.name?.split(' ')[0] || 'there';
        const hours = new Date().getHours();
        
        // Random interesting conversation starters & topics based on user preferences and time of day
        const interestingIdeas = [
          `Hey ${name}, did you know that neutron stars rotate up to 700 times per second? Space physics always blows my mind!`,
          `Hey ${name}, I was just thinking about AI and quantum computing. If you could build any futuristic device today, what would it be?`,
          `Hey ${name}, if you're taking a short break later, ask me for a mind-bending sci-fi movie or book recommendation!`,
          `Hey ${name}, fun fact: small daily habits compound exponentially over time. What cool goal are we conquering today?`,
          `Hey ${name}, remembering to stretch your back and take a deep breath makes a huge difference in focus!`,
          `Hey ${name}, what kind of music or movies are you in the mood for today? I have some great suggestions ready!`,
          `Hey ${name}, if you ever want to brainstorm a creative project idea or design something on the canvas, I'm right here!`
        ];

        // Tailor check-in based on time of day
        if (hours >= 12 && hours <= 14) {
          interestingIdeas.push(`Hey ${name}, mid-day check-in! Did you get a chance to eat lunch or grab good food today?`);
        } else if (hours >= 19 || hours <= 23) {
          interestingIdeas.push(`Hey ${name}, evening time! How was your day? Ready to relax with a movie or a good book?`);
        }

        const proactivePrompt = interestingIdeas[Math.floor(Math.random() * interestingIdeas.length)];
        lastSpeechTimeRef.current = now;

        setCompanionThought({
          id: `interest_${now}`,
          timestamp: now / 1000,
          mood: 'friendly',
          thought: proactivePrompt,
          detail: 'Natural Companion Interaction',
          action_suggestion: 'Talk to Nori',
          source: 'proactive_companion'
        });
        voiceEngine.speak(proactivePrompt);
      }
    }, 360000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(proactiveInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [privacyState, activeView, userProfile]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="hidden"
      style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}
    />
  );
};
