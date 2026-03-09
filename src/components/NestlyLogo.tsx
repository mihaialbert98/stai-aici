interface Props {
  className?: string;
  iconOnly?: boolean;
}

export function NestlyLogo({ className = '', iconOnly = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Monogram mark: rounded square + N letterform */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="currentColor" />
        {/* N lettermark — single continuous path */}
        <path
          d="M9 23L9 9L23 23L23 9"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {!iconOnly && (
        <span className="font-semibold text-xl tracking-tight">Nestly</span>
      )}
    </span>
  );
}
