"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Users } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  exchangeVoiceSignal, getVoiceSignals, heartbeatVoiceCall, joinVoiceCall, leaveVoiceCall,
} from "@/server-functions/chat";

type Participant = { userId: string };
type Signal = { from: string; type: "offer" | "answer" | "candidate"; payload: any };

export default function VoiceCall({ chatId, currentUserId }: { chatId: string; currentUserId: string }) {
  const [joined, setJoined] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());

  const closePeer = (id: string) => {
    peers.current.get(id)?.close();
    peers.current.delete(id);
    audioRefs.current.get(id)?.remove();
    audioRefs.current.delete(id);
  };

  const signal = async (to: string, type: Signal["type"], payload: any) => {
    await exchangeVoiceSignal({ chatId, to, type, payload });
  };

  const createPeer = (remoteId: string) => {
    const existing = peers.current.get(remoteId);
    if (existing) return existing;
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    streamRef.current?.getTracks().forEach((track) => peer.addTrack(track, streamRef.current!));
    peer.onicecandidate = (event) => {
      if (event.candidate) void signal(remoteId, "candidate", event.candidate.toJSON());
    };
    peer.ontrack = (event) => {
      let audio = audioRefs.current.get(remoteId);
      if (!audio) {
        audio = document.createElement("audio");
        audio.autoplay = true;
        audio.setAttribute("aria-label", `Voice call participant ${remoteId}`);
        document.body.appendChild(audio);
        audioRefs.current.set(remoteId, audio);
      }
      audio.srcObject = event.streams[0];
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) closePeer(remoteId);
    };
    peers.current.set(remoteId, peer);
    return peer;
  };

  const processSignal = async (item: Signal) => {
    const peer = createPeer(item.from);
    if (item.type === "offer") {
      await peer.setRemoteDescription(item.payload);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await signal(item.from, "answer", answer);
    } else if (item.type === "answer") {
      await peer.setRemoteDescription(item.payload);
    } else {
      await peer.addIceCandidate(item.payload);
    }
  };

  useEffect(() => {
    if (!joined) return;
    const timer = window.setInterval(async () => {
      const result = await getVoiceSignals(chatId);
      if ("error" in result) return;
      setParticipants(result.participants);
      await Promise.all(result.signals.map(processSignal));
      const activeIds = new Set(result.participants.map((item: Participant) => item.userId));
      peers.current.forEach((_, id) => { if (!activeIds.has(id)) closePeer(id); });
      await heartbeatVoiceCall(chatId);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [chatId, joined]);

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(() => { void join(); }, 2500);
    return () => window.clearInterval(timer);
  }, [waiting]);

  useEffect(() => () => {
    if (joined) void leaveVoiceCall(chatId);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peers.current.forEach((peer) => peer.close());
    audioRefs.current.forEach((audio) => audio.remove());
  }, [chatId, joined]);

  const join = async () => {
    let reserved = false;
    let stream: MediaStream | null = null;
    try {
      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        throw new Error("Voice calls require HTTPS. Open the secure site URL and try again.");
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support microphone calls.");
      }
      // Request permission directly from the user gesture before reserving a
      // call seat, so the browser can show its microphone prompt on click.
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const result = await joinVoiceCall(chatId);
      if ("error" in result) throw new Error(result.error);
      if ("waiting" in result && result.waiting) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
        setWaiting(true);
        return;
      }
      reserved = true;
      streamRef.current = stream;
      stream = null;
      setParticipants(result.participants);
      setWaiting(false);
      setJoined(true);
      for (const participant of result.participants) {
        if (participant.userId !== currentUserId && currentUserId < participant.userId) {
          const peer = createPeer(participant.userId);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          await signal(participant.userId, "offer", offer);
        }
      }
    } catch (error) {
      if (reserved) void leaveVoiceCall(chatId);
      stream?.getTracks().forEach((track) => track.stop());
      const name = error instanceof DOMException ? error.name : "";
      const message = name === "NotAllowedError" || name === "PermissionDeniedError"
        ? "Microphone permission was denied. Allow microphone access in your browser address-bar settings, then try again."
        : name === "NotFoundError"
          ? "No microphone was found. Connect or select a microphone in Windows sound settings, then try again."
          : name === "NotReadableError" || name === "AbortError"
            ? "The microphone is busy or unavailable. Close apps using it (Recorder, Teams, OBS), select another input device, and try again."
            : name === "OverconstrainedError"
              ? "The selected microphone does not support this call. Choose another input device and try again."
              : name === "SecurityError"
                ? "The browser blocked microphone access. Use HTTPS or localhost and check Chrome site permissions."
          : error instanceof Error ? error.message : "Microphone permission is required";
      toast.error(`${message}${name ? ` (${name})` : ""}`);
    }
  };

  const leave = async () => {
    await leaveVoiceCall(chatId);
    setJoined(false);
    setWaiting(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    peers.current.forEach((peer) => peer.close());
    peers.current.clear();
  };

  return (
    <div className="flex items-center gap-1">
      {joined ? (
        <>
          <span className="hidden items-center gap-1 text-[10px] text-emerald-500 sm:flex"><Users size={13} /> {participants.length}/5</span>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => {
            const tracks = streamRef.current?.getAudioTracks() || [];
            tracks.forEach((track) => { track.enabled = muted; });
            setMuted(!muted);
          }} aria-label={muted ? "Unmute microphone" : "Mute microphone"}>{muted ? <MicOff size={17} /> : <Mic size={17} />}</Button>
          <Button type="button" variant="destructive" size="icon" className="h-9 w-9 rounded-full" onClick={() => void leave()} aria-label="Leave voice call"><PhoneOff size={16} /></Button>
        </>
      ) : (
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => void join()} aria-label="Join voice call" title={waiting ? "Waiting for a free voice slot" : "Join voice call"}><Phone size={17} /></Button>
      )}
      {waiting ? <span className="text-[10px] text-amber-600">Waiting for slot</span> : null}
    </div>
  );
}
