'use client';

import { MessagesList } from '@/components/MessagesList';

export default function GuestMessagesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mesaje</h1>
      <MessagesList role="guest" />
    </div>
  );
}
