function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function Slash() {
  return <path d="M4 4l16 16" />;
}

export function MicIcon({ off }: { off: boolean }) {
  return (
    <Glyph>
      <path d="M12 3.5a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0V6A2.5 2.5 0 0 0 12 3.5z" />
      <path d="M7 11a5 5 0 0 0 10 0" />
      <path d="M12 16v3.5M9 19.5h6" />
      {off ? <Slash /> : null}
    </Glyph>
  );
}

export function CameraIcon({ off }: { off: boolean }) {
  return (
    <Glyph>
      <rect x="2.5" y="7" width="12" height="10" rx="2" />
      <path d="M14.5 10.5 20.5 8v8l-6-2.5z" />
      {off ? <Slash /> : null}
    </Glyph>
  );
}

export function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <Glyph>
      <path d="M4 9.5h3.2L11 6v12l-3.8-3.5H4z" />
      {off ? (
        <Slash />
      ) : (
        <>
          <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M17.2 7.2a6.5 6.5 0 0 1 0 9.6" />
        </>
      )}
    </Glyph>
  );
}

export function ShareIcon() {
  return (
    <Glyph>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M12 13V8" />
      <path d="m9.5 10.5 2.5-2.5 2.5 2.5" />
      <path d="M12 16v4M8 20h8" />
    </Glyph>
  );
}

export function HandIcon() {
  return (
    <Glyph>
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </Glyph>
  );
}

export function PeopleIcon() {
  return (
    <Glyph>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Glyph>
  );
}

export function ChatIcon() {
  return (
    <Glyph>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Glyph>
  );
}

export function LeaveIcon() {
  return (
    <Glyph>
      <g transform="rotate(135 12 12)">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </g>
    </Glyph>
  );
}
