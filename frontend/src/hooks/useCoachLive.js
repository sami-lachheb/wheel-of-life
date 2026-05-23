import { useCallback, useEffect, useRef, useState } from 'react';
import { getCoachLiveWsUrl } from '../utils/apiConfig.js';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const MIN_AUDIO_BYTES = 200;

function float32ToInt16(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function resampleTo16k(float32, inputRate) {
  if (inputRate === INPUT_SAMPLE_RATE) return float32;
  const ratio = inputRate / INPUT_SAMPLE_RATE;
  const length = Math.floor(float32.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = float32[Math.floor(i * ratio)] || 0;
  }
  return out;
}

function int16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToUint8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function ensurePlaybackContext(playbackCtxRef) {
  if (!playbackCtxRef.current) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    playbackCtxRef.current = new Ctx({ sampleRate: OUTPUT_SAMPLE_RATE });
  }
  const ctx = playbackCtxRef.current;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
}

function useLatestRef(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * Real-time Hayat coach session via backend Gemini Live WebSocket proxy.
 */
export function useCoachLive({
  enabled = true,
  isMuted = false,
  isHeld = false,
  onUserTranscript,
  onAssistantTranscript,
  onSpeakingChange,
  onReady,
  onError,
  onTurnComplete,
  onNeedsAudioUnlock,
}) {
  const [status, setStatus] = useState('idle');
  const wsRef = useRef(null);
  const captureCtxRef = useRef(null);
  const playbackCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef([]);
  const isMutedRef = useRef(isMuted);
  const isHeldRef = useRef(isHeld);
  const isSpeakingRef = useRef(false);
  const sessionIdRef = useRef(0);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);

  const callbacksRef = useLatestRef({
    onUserTranscript,
    onAssistantTranscript,
    onSpeakingChange,
    onReady,
    onError,
    onTurnComplete,
    onNeedsAudioUnlock,
  });

  isMutedRef.current = isMuted;
  isHeldRef.current = isHeld;

  const stopPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    isSpeakingRef.current = false;
    callbacksRef.current.onSpeakingChange?.(false);
  }, [callbacksRef]);

  const schedulePcmChunk = useCallback(
    async (bytes) => {
      if (isHeldRef.current) return;
      if (!bytes?.byteLength || bytes.byteLength < MIN_AUDIO_BYTES) return;

      try {
        const ctx = await ensurePlaybackContext(playbackCtxRef);
        if (!mountedRef.current) return;

        const int16 = new Int16Array(
          bytes.buffer,
          bytes.byteOffset,
          bytes.byteLength / 2
        );
        const floats = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          floats[i] = int16[i] / 32768;
        }

        const buffer = ctx.createBuffer(1, floats.length, OUTPUT_SAMPLE_RATE);
        buffer.getChannelData(0).set(floats);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
          if (activeSourcesRef.current.length === 0) {
            isSpeakingRef.current = false;
            callbacksRef.current.onSpeakingChange?.(false);
          }
        };

        const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
        source.start(startAt);
        nextPlayTimeRef.current = startAt + buffer.duration;
        activeSourcesRef.current.push(source);
        isSpeakingRef.current = true;
        callbacksRef.current.onSpeakingChange?.(true);
      } catch (err) {
        console.warn('Playback failed:', err);
        callbacksRef.current.onNeedsAudioUnlock?.(true);
      }
    },
    [callbacksRef]
  );

  const teardownAudio = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (captureCtxRef.current) {
      captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
    }
    stopPlayback();
  }, [stopPlayback]);

  const disconnect = useCallback(() => {
    sessionIdRef.current += 1;
    connectingRef.current = false;
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'close' }));
        } catch {
          /* ignore */
        }
      }
      wsRef.current.close();
    }
    wsRef.current = null;
    teardownAudio();
    if (mountedRef.current) {
      setStatus('idle');
    }
  }, [teardownAudio]);

  const startMicCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1,
      },
    });
    mediaStreamRef.current = stream;

    const ctx = new AudioContext();
    captureCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    const muteGain = ctx.createGain();
    muteGain.gain.value = 0;

    processor.onaudioprocess = (event) => {
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        isMutedRef.current ||
        isHeldRef.current ||
        isSpeakingRef.current
      ) {
        return;
      }

      const input = event.inputBuffer.getChannelData(0);
      const resampled = resampleTo16k(input, ctx.sampleRate);
      const pcm = float32ToInt16(resampled);
      if (pcm.length === 0) return;

      wsRef.current.send(
        JSON.stringify({
          type: 'audio',
          data: int16ToBase64(pcm),
        })
      );
    };

    source.connect(processor);
    processor.connect(muteGain);
    muteGain.connect(ctx.destination);
  }, []);


  const sendText = useCallback((text) => {
    if (!text?.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'text', text: text.trim() }));
  }, []);

  const unlockAudio = useCallback(async () => {
    try {
      await ensurePlaybackContext(playbackCtxRef);
      callbacksRef.current.onNeedsAudioUnlock?.(false);
    } catch (err) {
      callbacksRef.current.onError?.(err.message || 'Could not enable audio');
    }
  }, [callbacksRef]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Connect once on mount — do not depend on callback identities (prevents reconnect loops).
  useEffect(() => {
    if (!enabled) {
      disconnect();
      return undefined;
    }
    const connect = async () => {
      if (connectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('error');
        callbacksRef.current.onError?.('Not logged in');
        return;
      }

      connectingRef.current = true;
      const mySession = ++sessionIdRef.current;
      setStatus('connecting');

      try {
        await ensurePlaybackContext(playbackCtxRef);
      } catch {
        callbacksRef.current.onNeedsAudioUnlock?.(true);
      }

      const ws = new WebSocket(getCoachLiveWsUrl());
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        if (mySession !== sessionIdRef.current) return;

        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        const cb = callbacksRef.current;

        if (msg.type === 'ready') {
          try {
            const ctx = await ensurePlaybackContext(playbackCtxRef);
            if (ctx.state === 'suspended') {
              cb.onNeedsAudioUnlock?.(true);
            }
            ws.send(JSON.stringify({ type: 'client_ready' }));
          } catch {
            cb.onNeedsAudioUnlock?.(true);
          }
          return;
        }

        if (msg.type === 'session_started') {
          try {
            await startMicCapture();
            connectingRef.current = false;
            setStatus('ready');
            cb.onReady?.();
          } catch (err) {
            connectingRef.current = false;
            setStatus('error');
            cb.onError?.(err.message || 'Microphone access denied');
          }
          return;
        }

        if (msg.type === 'error') {
          connectingRef.current = false;
          setStatus('error');
          cb.onError?.(msg.message || 'Coach session error');
          return;
        }

        if (msg.type === 'transcript') {
          if (msg.role === 'user') {
            cb.onUserTranscript?.(msg.text, msg.finished);
          } else if (msg.role === 'assistant') {
            cb.onAssistantTranscript?.(msg.text, msg.finished);
          }
          return;
        }

        if (msg.type === 'audio' && msg.data) {
          await schedulePcmChunk(base64ToUint8(msg.data));
          return;
        }

        if (msg.type === 'turn_complete') {
          cb.onTurnComplete?.();
        }
      };

      ws.onerror = () => {
        if (mySession !== sessionIdRef.current) return;
        connectingRef.current = false;
        setStatus('error');
        callbacksRef.current.onError?.('WebSocket connection failed');
      };

      ws.onclose = () => {
        if (mySession !== sessionIdRef.current) return;
        connectingRef.current = false;
        teardownAudio();
        setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
      };
    };

    connect();
    return () => disconnect();
  }, [enabled, disconnect, teardownAudio, schedulePcmChunk, startMicCapture]);

  useEffect(() => {
    if (isHeld && playbackCtxRef.current) {
      playbackCtxRef.current.suspend();
      stopPlayback();
    } else if (!isHeld && playbackCtxRef.current?.state === 'suspended') {
      playbackCtxRef.current.resume();
    }
  }, [isHeld, stopPlayback]);

  return {
    status,
    sendText,
    disconnect,
    stopPlayback,
    unlockAudio,
    isLive: status === 'ready' || status === 'connecting',
  };
}
