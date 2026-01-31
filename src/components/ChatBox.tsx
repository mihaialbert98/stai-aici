'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './ChatBox.module.scss';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  role: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface OptimisticMessage {
  _optimistic: true;
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
  role: string;
}

type DisplayMessage = Message | OptimisticMessage;

function isOptimistic(m: DisplayMessage): m is OptimisticMessage {
  return '_optimistic' in m;
}

interface Props {
  bookingId: string;
  currentUserId: string;
}

const POLL_FAST = 1500;
const POLL_SLOW = 10000;

export function ChatBox({ bookingId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimistic, setOptimistic] = useState<OptimisticMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?bookingId=${bookingId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        // Remove optimistic messages that now exist on the server
        setOptimistic(prev =>
          prev.filter(o => !data.messages.some((m: Message) => m.content === o.content && m.sender.id === o.sender.id))
        );
      }
    } catch { /* silently retry on next poll */ }
  }, [bookingId]);

  // Adaptive polling: fast when visible, slow when hidden
  const startPolling = useCallback((interval: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchMessages, interval);
  }, [fetchMessages]);

  useEffect(() => {
    fetchMessages();
    startPolling(POLL_FAST);

    const handleVisibility = () => {
      if (document.hidden) {
        startPolling(POLL_SLOW);
      } else {
        fetchMessages();
        startPolling(POLL_FAST);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchMessages, startPolling]);

  // Smart auto-scroll: only scroll down if user is already at the bottom
  const checkIfAtBottom = () => {
    const el = messagesRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const allMessages: DisplayMessage[] = [...messages, ...optimistic];

  useEffect(() => {
    if (isAtBottomRef.current && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [allMessages.length]);

  const send = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();

    // Optimistic: show immediately
    const tempMsg: OptimisticMessage = {
      _optimistic: true,
      id: `opt-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: '' },
      role: 'GUEST',
    };
    setOptimistic(prev => [...prev, tempMsg]);
    setText('');
    isAtBottomRef.current = true; // Force scroll for own message

    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, content }),
      });
      await fetchMessages();
    } catch { /* optimistic msg stays until next successful fetch */ }
    setSending(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.messages} ref={messagesRef} onScroll={checkIfAtBottom}>
        {allMessages.map((m) => {
          const isPending = isOptimistic(m);
          const isOwn = m.sender.id === currentUserId;
          const isSupport = m.role === 'ADMIN';
          return (
            <div
              key={m.id}
              className={`${styles.messageBubble} ${isSupport ? styles.support : isOwn ? styles.own : styles.other} ${isPending ? styles.pending : ''}`}
            >
              {!isPending && (
                <p className={styles.senderName}>
                  {m.sender.name}
                  {isSupport && <span className={styles.supportLabel}> — Suport</span>}
                </p>
              )}
              <p>{m.content}</p>
              <p className={styles.time}>
                {isPending ? 'Se trimite...' : format(new Date(m.createdAt), 'HH:mm, d MMM')}
              </p>
            </div>
          );
        })}
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
