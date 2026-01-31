import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  message: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon: Icon, message, action }: Props) {
  return (
    <div className="card text-center py-12">
      <Icon size={40} className="mx-auto text-gray-300 mb-3" />
      <p className="text-gray-500">{message}</p>
      {action && (
        <Link href={action.href} className="btn-primary inline-block mt-4">{action.label}</Link>
      )}
    </div>
  );
}
