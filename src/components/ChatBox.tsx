'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ChatBox.module.scss';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  role: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface Props {
  bookingId: string;
  currentUserId: string;
}

export function ChatBox({ bookingId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages?bookingId=${bookingId}`);
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, content: text.trim() }),
    });
    setText('');
    setSending(false);
    fetchMessages();
  };

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map((m) => {
          const isOwn = m.sender.id === currentUserId;
          const isSupport = m.role === 'ADMIN';
          return (
            <div key={m.id} className={`${styles.messageBubble} ${isSupport ? styles.support : isOwn ? styles.own : styles.other}`}>
              <p className={styles.senderName}>
                {m.sender.name}
                {isSupport && <span className={styles.supportLabel}> — Suport</span>}
              </p>
              <p>{m.content}</p>
              <p className={styles.time}>{format(new Date(m.createdAt), 'HH:mm, d MMM')}</p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className={styles.inputArea}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Scrie un mesaj..."
        />
        <button onClick={send} disabled={sending} className={styles.sendBtn}>Trimite</button>
      </div>
    </div>
  );
}
