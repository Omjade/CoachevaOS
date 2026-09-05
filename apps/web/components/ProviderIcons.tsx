// Real brand marks for the calendar/video integrations, in place of generic
// Phosphor icons — used only on the Integrations card so each provider is
// instantly recognizable, matching how every other app renders "Connect
// with X" rows.

export function GoogleMeetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#00832d" d="M17 24v10.5h-6.5A3.5 3.5 0 0 1 7 31V24z" />
      <path fill="#0066da" d="M17 13.5V24H7v-7A3.5 3.5 0 0 1 10.5 13.5z" />
      <path fill="#e94235" d="M17 13.5h11L22 7H10.5A3.5 3.5 0 0 0 7 10.5v3z" />
      <path fill="#2684fc" d="M35 13.5V24l6-4.5v-3A3.5 3.5 0 0 0 37.5 13z" />
      <path fill="#00ac47" d="M35 34.5V24l6 4.5v3A3.5 3.5 0 0 1 37.5 35z" />
      <path fill="#ffba00" d="M28 7h-11v6.5h18L28 7z" />
      <path fill="#4285f4" d="M17 24h18v10.5H17z" />
    </svg>
  );
}

export function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#2D8CFF" />
      <path
        fill="#fff"
        d="M13 17.5A2.5 2.5 0 0 1 15.5 15h11A2.5 2.5 0 0 1 29 17.5v7A2.5 2.5 0 0 1 26.5 27h-11A2.5 2.5 0 0 1 13 24.5z"
      />
      <path fill="#fff" d="M30.5 20.2 36 16.8v14.4l-5.5-3.4z" />
    </svg>
  );
}

export function CalendlyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#006BFF" />
      <path
        fill="#fff"
        d="M24 12a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"
        opacity=".18"
      />
      <path
        fill="#fff"
        d="M31 21.2 22.4 29.8l-4.4-4.4 1.4-1.4 3 3 7.2-7.2z"
      />
      <path fill="#fff" d="M17 15h2v4h-2zm12 0h2v4h-2z" opacity=".85" />
    </svg>
  );
}

export function CalDotComIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#161618" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M28 21a5 5 0 1 0 0 6" fill="none" stroke="#161618" strokeWidth="0" />
      <path
        d="M29.2 20.4a6 6 0 1 0 0 7.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
