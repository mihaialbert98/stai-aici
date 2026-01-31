interface Props {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function ActiveBadge({ isActive, activeLabel = 'Activă', inactiveLabel = 'Inactivă' }: Props) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}
