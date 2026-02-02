'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { ROMANIAN_CITIES } from '@/lib/cities';
import { removeDiacritics } from '@/lib/utils';
import styles from './CityPicker.module.scss';

interface Props {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

export function CityPicker({ value, onChange, placeholder = 'ex. Brașov' }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // If the typed query doesn't match a city, revert to last valid value
        if (!ROMANIAN_CITIES.some(c => removeDiacritics(c).toLowerCase() === removeDiacritics(query).toLowerCase())) {
          setQuery(value);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [query, value]);

  const POPULAR_CITIES = ['București', 'Brașov', 'Cluj-Napoca', 'Sibiu', 'Constanța', 'Timișoara', 'Baia Mare', 'Iași'];

  const filtered = query
    ? ROMANIAN_CITIES.filter(c => removeDiacritics(c).toLowerCase().includes(removeDiacritics(query).toLowerCase()))
    : [...POPULAR_CITIES, ...ROMANIAN_CITIES.filter(c => !POPULAR_CITIES.includes(c))];

  const select = (city: string) => {
    setQuery(city);
    onChange(city);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) {
        select(filtered[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <div className={styles.inputWrapper}>
        <MapPin size={18} className={styles.icon} />
        <input
          className={styles.input}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(''); // clear selected value while typing
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && (
        <div className={styles.dropdown} ref={listRef}>
          {filtered.length === 0 ? (
            <div className={styles.noResults}>Niciun oraș găsit</div>
          ) : (
            filtered.slice(0, 20).map((city, i) => (
              <div
                key={city}
                className={i === activeIdx ? styles.optionActive : styles.option}
                onClick={() => select(city)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                {city}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
