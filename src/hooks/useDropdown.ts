// Manages open/close state for a dropdown with outside-click dismissal.
// Usage:
//   const { open, setOpen, ref } = useDropdown();
//   <div ref={ref}> ... </div>

import { useEffect, useRef, useState } from 'react';

export function useDropdown(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return { open, setOpen, ref };
}
