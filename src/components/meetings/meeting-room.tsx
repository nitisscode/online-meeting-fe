"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { loadMeetingRoom } from "@/app/actions/meetings";
import { MeetingChat } from "@/components/meetings/meeting-chat";
import { CameraIcon, ChatIcon, HandIcon, LeaveIcon, MicIcon, PeopleIcon, ShareIcon, SpeakerIcon } from "@/components/meetings/room-icons";
import { PARTICIPANT_ROLE_LABEL } from "@/constants/meetings";
import { ROUTES } from "@/constants/routes";
import { displayName, formatElapsed } from "@/lib/format";

type RoomUser = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
};

type RoomParticipant = {
  id: string;
  user: RoomUser;
  role: number;
};

export type RoomData = {
  id: string;
  title: string;
  meeting_code: string;
  started_at: string | null;
  settings: {
    allow_chat: boolean;
    allow_screen_share: boolean;
    allow_raise_hand: boolean;
  };
  participants: RoomParticipant[];
};

type Panel = "people" | "chat" | null;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function MeetingRoom({ room: initialRoom }: { room: RoomData }) {
  const [room, setRoom] = useState(initialRoom);
  const [panel, setPanel] = useState<Panel>(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [status, setStatus] = useState<string | undefined>();
  const [elapsed, setElapsed] = useState("00:00:00");
  const [panelWidth, setPanelWidth] = useState(320);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopStream(cameraRef.current);
      stopStream(screenRef.current);
    };
  }, []);

  useEffect(() => {
    const started = room.started_at ? new Date(room.started_at).getTime() : Date.now();
    const origin = Number.isNaN(started) ? Date.now() : started;

    function tick() {
      setElapsed(formatElapsed(Date.now() - origin));
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [room.started_at]);

  function resizePanel(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return;
    }
    const next = dragRef.current.startWidth + (dragRef.current.startX - event.clientX);
    setPanelWidth(Math.min(560, Math.max(260, next)));
  }

  function show(stream: MediaStream | null) {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }

  async function ensureCamera(withAudio: boolean, withVideo: boolean) {
    const current = cameraRef.current;
    const hasAudio = current?.getAudioTracks().some((track) => track.readyState === "live");
    const hasVideo = current?.getVideoTracks().some((track) => track.readyState === "live");
    if (current && (!withAudio || hasAudio) && (!withVideo || hasVideo)) {
      return current;
    }

    stopStream(current);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: withAudio, video: withVideo });
    cameraRef.current = stream;
    return stream;
  }

  async function toggleMic() {
    try {
      if (micOn) {
        cameraRef.current?.getAudioTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
        setMicOn(false);
        return;
      }
      const stream = await ensureCamera(true, cameraOn);
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setMicOn(true);
      setStatus(undefined);
    } catch {
      setStatus("The microphone is not available.");
    }
  }

  async function toggleCamera() {
    try {
      if (cameraOn) {
        cameraRef.current?.getVideoTracks().forEach((track) => track.stop());
        setCameraOn(false);
        if (!sharing) {
          show(null);
        }
        return;
      }
      const stream = await ensureCamera(micOn, true);
      setCameraOn(true);
      if (!sharing) {
        show(stream);
      }
      setStatus(undefined);
    } catch {
      setStatus("The camera is not available.");
    }
  }

  async function toggleShare() {
    if (!room.settings.allow_screen_share) {
      return;
    }
    if (sharing) {
      stopStream(screenRef.current);
      screenRef.current = null;
      setSharing(false);
      show(cameraOn ? cameraRef.current : null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenRef.current = stream;
      const [track] = stream.getVideoTracks();
      track?.addEventListener("ended", () => {
        screenRef.current = null;
        setSharing(false);
        show(cameraOn ? cameraRef.current : null);
      });
      setSharing(true);
      show(stream);
      setStatus(undefined);
    } catch {
      setStatus("Screen share was not started.");
    }
  }

  async function openPeople() {
    setPanel((current) => (current === "people" ? null : "people"));
    const result = await loadMeetingRoom(room.id);
    if (result.room) {
      setRoom(result.room);
      setStatus(undefined);
      return;
    }
    if (result.message) {
      setStatus(result.message);
    }
  }

  function controlClass(active: boolean, muted = false) {
    if (muted) {
      return "bg-danger-fill text-foam";
    }
    return active ? "bg-pine text-foam" : "bg-sand text-ink";
  }

  function controlButtonClass(tone: string) {
    return `inline-flex h-11 w-11 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${tone}`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-pine uppercase">Live</p>
          <h1 className="font-display text-2xl text-ink">{room.title}</h1>
        </div>
        <p className="font-mono text-lg tabular-nums text-ink" aria-label="Meeting time">
          {elapsed}
        </p>
        <p className="font-mono text-sm tracking-widest text-ink-soft">{room.meeting_code}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative m-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-ink">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-contain ${cameraOn || sharing ? "block" : "hidden"}`}
            />
            {cameraOn || sharing ? null : (
              <div className="px-6 text-center">
                <p className="font-display text-3xl text-foam">{room.title}</p>
                <p className="mt-2 text-sm text-foam/70">You are in the meeting.</p>
              </div>
            )}
          </div>
          {status ? <p className="px-4 pb-2 text-sm text-danger">{status}</p> : null}
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-4 pb-4">
            <button type="button" title={micOn ? "Mic on" : "Mic off"} aria-label={micOn ? "Mic on" : "Mic off"} aria-pressed={micOn} onClick={toggleMic} className={controlButtonClass(controlClass(micOn, !micOn))}>
              <MicIcon off={!micOn} />
            </button>
            <button type="button" title={cameraOn ? "Camera on" : "Camera off"} aria-label={cameraOn ? "Camera on" : "Camera off"} aria-pressed={cameraOn} onClick={toggleCamera} className={controlButtonClass(controlClass(cameraOn, !cameraOn))}>
              <CameraIcon off={!cameraOn} />
            </button>
            <button
              type="button"
              title={speakerOn ? "Speaker on" : "Speaker off"}
              aria-label={speakerOn ? "Speaker on" : "Speaker off"}
              aria-pressed={speakerOn}
              onClick={() => setSpeakerOn((on) => !on)}
              className={controlButtonClass(controlClass(speakerOn, !speakerOn))}
            >
              <SpeakerIcon off={!speakerOn} />
            </button>
            <button
              type="button"
              title={sharing ? "Stop share" : "Share screen"}
              aria-label={sharing ? "Stop share" : "Share screen"}
              aria-pressed={sharing}
              disabled={!room.settings.allow_screen_share}
              onClick={toggleShare}
              className={controlButtonClass(controlClass(sharing))}
            >
              <ShareIcon />
            </button>
            {room.settings.allow_raise_hand ? (
              <button
                type="button"
                title={handRaised ? "Hand raised" : "Raise hand"}
                aria-label={handRaised ? "Hand raised" : "Raise hand"}
                aria-pressed={handRaised}
                onClick={() => setHandRaised((raised) => !raised)}
                className={controlButtonClass(controlClass(handRaised))}
              >
                <HandIcon />
              </button>
            ) : null}
            <button type="button" title="People" aria-label="People" aria-pressed={panel === "people"} onClick={openPeople} className={controlButtonClass(controlClass(panel === "people"))}>
              <PeopleIcon />
            </button>
            <button
              type="button"
              title="Chat"
              aria-label="Chat"
              aria-pressed={panel === "chat"}
              disabled={!room.settings.allow_chat}
              onClick={() => setPanel((current) => (current === "chat" ? null : "chat"))}
              className={controlButtonClass(controlClass(panel === "chat"))}
            >
              <ChatIcon />
            </button>
            <Link href={ROUTES.dashboard} title="Leave" aria-label="Leave" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-danger-fill text-foam">
              <LeaveIcon />
            </Link>
          </div>
        </div>

        {panel ? (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize side panel"
              className="hidden w-1.5 shrink-0 cursor-col-resize bg-line lg:block"
              onPointerDown={(event) => {
                dragRef.current = { startX: event.clientX, startWidth: panelWidth };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={resizePanel}
              onPointerUp={() => {
                dragRef.current = null;
              }}
            />
            <aside
              className="flex max-h-[42%] min-h-0 w-full flex-col overflow-hidden border-t border-line bg-sand p-4 lg:max-h-none lg:shrink-0 lg:border-t-0 lg:border-l lg:w-[var(--panel-width)]"
              style={{ "--panel-width": `${panelWidth}px` } as React.CSSProperties}
            >
              <div className="flex min-h-0 flex-1 flex-col">
                {panel === "people" ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    <h2 className="font-display text-xl text-ink">People</h2>
                    <ul className="flex flex-col gap-2 overflow-y-auto">
                      {room.participants.map((participant) => (
                        <li key={participant.id} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2">
                          <span className="text-sm text-ink">{displayName(participant.user)}</span>
                          <span className="text-xs text-ink-soft">{PARTICIPANT_ROLE_LABEL[participant.role] ?? "Participant"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <MeetingChat meetingId={room.id} />
                )}
              </div>
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
