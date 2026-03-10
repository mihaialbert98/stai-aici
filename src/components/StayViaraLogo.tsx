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
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <text
          x="16"
          y="24"
          fontFamily="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
          fontSize="22"
          fontWeight="700"
          fill="white"
          textAnchor="middle"
        >{'S'}</text>
      </svg>

      {!iconOnly && (
        <span className="font-semibold text-xl tracking-tight">StayViara</span>
      )}
    </span>
  );
}
