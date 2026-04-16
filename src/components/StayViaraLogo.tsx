interface Props {
  className?: string;
  iconOnly?: boolean;
}

export function StayViaraLogo({ className = '', iconOnly = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Rounded square background */}
        <rect width="32" height="32" rx="8" fill="currentColor" />

        {/* Bird in flight — geometric swift silhouette, white on teal */}
        {/* Body: elongated teardrop angled upward-right */}
        <ellipse
          cx="16.5"
          cy="15.5"
          rx="4.5"
          ry="2"
          transform="rotate(-18 16.5 15.5)"
          fill="white"
        />
        {/* Left wing — sweeping back-left arc */}
        <path
          d="M14.5 15.8 C11.5 13.5 8 14.5 6 13 C7.5 15.5 10.5 16.5 14 16.5Z"
          fill="white"
        />
        {/* Right wing — sweeping forward-right arc */}
        <path
          d="M18.5 14.8 C21 12.5 24.5 12.5 26.5 11 C25.5 14 22 15.5 18.5 15.5Z"
          fill="white"
        />
        {/* Tail — forked swallow tail */}
        <path
          d="M13.5 16.8 C12 19 10 20.5 9 22 C11 21 12.5 19.5 14 18Z"
          fill="white"
        />
        <path
          d="M14.5 17.2 C14 20 13 22 12.5 24 C14 22.5 15 20.5 15.5 18Z"
          fill="white"
        />
        {/* Head — small circle at front */}
        <circle cx="20.5" cy="14.5" r="1.5" fill="white" />
      </svg>

      {!iconOnly && (
        <span className="font-semibold text-xl tracking-tight">StayBird</span>
      )}
    </span>
  );
}
