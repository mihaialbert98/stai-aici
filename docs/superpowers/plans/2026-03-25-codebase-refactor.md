# Codebase Refactor — Full Option C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate code duplication, centralise shared logic, and improve maintainability across the entire StayViara codebase without adding new features or breaking existing functionality.

**Architecture:** Six sequential phases — each independently buildable and verifiable with `npm run build && npm run lint`. Phases 1–3 lay foundations (types, hooks, UI primitives); Phase 4 centralises API concerns; Phase 5 decomposes the monster calendar page; Phase 6 does a TypeScript strictness pass.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma, Tailwind CSS, Zod, sonner (toasts), date-fns, lucide-react.

---

## File Map — What Gets Created / Modified

### New files
| File | Purpose |
|------|---------|
| `src/types/index.ts` | Central type definitions shared across pages and API routes |
| `src/lib/api-helpers.ts` | Shared API utilities: `getHostProperty`, `unauthorized`, `forbidden`, `notFound`, `internalError` |
| `src/lib/api-client.ts` | Client-side fetch wrapper with typed methods and centralised error handling |
| `src/hooks/useDropdown.ts` | Reusable dropdown open/close + outside-click hook |
| `src/hooks/usePagination.ts` | Reusable pagination state hook |
| `src/hooks/useConfirmModal.ts` | Reusable confirm-modal state hook |
| `src/components/Modal.tsx` | Reusable modal component (built with frontend-design plugin) |
| `src/components/Dropdown.tsx` | Reusable dropdown component (built with frontend-design plugin) |
| `src/app/dashboard/host/calendar/CalendarGrid.tsx` | Calendar grid rendering extracted from calendar/page.tsx |
| `src/app/dashboard/host/calendar/CalendarSidebar.tsx` | Sidebar / detail panel extracted from calendar/page.tsx |
| `src/app/dashboard/host/calendar/useCalendarData.ts` | Data fetching hook extracted from calendar/page.tsx |
| `src/app/dashboard/host/calendar/useCalendarState.ts` | UI state hook extracted from calendar/page.tsx |

### Modified files
| File | Change |
|------|--------|
| `src/lib/utils.ts` | Add `statusBadgeClass()` merging 3 duplicate status color maps; add `hexToRgba()` utility |
| `src/app/api/properties/[id]/checkin-link/route.ts` | Replace inline `getHostProperty` with import from `api-helpers.ts` |
| `src/app/api/properties/[id]/guest-form-link/route.ts` | Replace inline `getHostProperty` with import from `api-helpers.ts` |
| `src/app/dashboard/host/calendar/page.tsx` | Reduce from 1,885 lines to ~200 by delegating to extracted components/hooks |
| `src/app/dashboard/host/reservations/page.tsx` | Replace inline `hexToRgba` and dropdown logic with shared utilities |
| `src/app/dashboard/host/tasks/page.tsx` | Replace inline confirm modal with `useConfirmModal` hook |
| `src/app/api/host/tasks/route.ts` | Replace `console.error` with `logger.error`; use `api-helpers` error responses |
| `src/app/api/host/tasks/[id]/route.ts` | Replace `console.error` with `logger.error`; use `api-helpers` error responses |

---

## Phase 1 — Shared Types & API Utilities
*No UI changes. Purely additive. Safe to run first.*

### Task 1.1: Create `src/types/index.ts`

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/index.ts
// Central type definitions — import from here instead of defining inline in pages

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type UserRole = 'GUEST' | 'HOST' | 'ADMIN';

export interface PropertySummary {
  id: string;
  title: string;
}

export interface BookingData {
  id: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
  guests: number;
  guest: { id: string; name: string; email: string };
  property: { id: string; title: string; images: { url: string }[] };
}

export interface ManualReservationData {
  id: string;
  propertyId: string;
  guestName: string | null;
  checkIn: string;
  checkOut: string;
  revenue: number;
  source: string | null;
  notes: string | null;
  blockCalendar: boolean;
}

export interface SyncedReservationData {
  id: string;
  propertyId: string;
  source: string;
  checkIn: string;
  checkOut: string;
  guestName: string | null;
  revenue: number;
  notes: string | null;
  isBlock: boolean;
  isBlockManual: boolean | null;
  summary: string | null;
}

export interface Reservation {
  id: string;
  type: 'platform' | 'manual' | 'synced';
  propertyId: string;
  propertyTitle: string;
  guestName: string;
  guestEmail: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  revenue: number;
  source: string | null;
  status: string;
  notes: string | null;
  bookingId: string | null;
  blockCalendar?: boolean;
  isBlockManual?: boolean | null;
  color?: string;
}

export interface PeriodPricing {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
}

export interface CalendarSync {
  id: string;
  platform: string;
  icalUrl: string;
  color: string | null;
  lastSynced: string | null;
}

export interface Task {
  id: string;
  propertyId: string;
  title: string;
  done: boolean;
  createdAt: string;
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

Expected: No errors related to the new file.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add central type definitions in src/types/index.ts"
```

---

### Task 1.2: Add shared utilities to `src/lib/utils.ts`

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Add `statusBadgeClass` and `hexToRgba` to utils.ts**

Append to the end of `src/lib/utils.ts`:

```typescript
/**
 * Returns Tailwind classes for a booking/reservation status badge.
 * Single source of truth — replaces STATUS_STYLE / statusColor duplicates.
 */
export function statusBadgeClass(status: string): string {
  // Shades deliberately match the original statusColor() values to avoid visual regressions
  const map: Record<string, string> = {
    PENDING:   'bg-yellow-100 text-yellow-800',
    ACCEPTED:  'bg-green-100 text-green-800',
    REJECTED:  'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    MANUAL:    'bg-blue-100 text-blue-800',
    SYNCED:    'bg-indigo-100 text-indigo-800',
    BLOCKED:   'bg-gray-100 text-gray-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

/**
 * Convert a hex color string to rgba(...).
 * Falls back to indigo (#6366f1) if hex is invalid.
 */
export function hexToRgba(hex: string | undefined | null, alpha: number): string {
  const safe = (hex && /^#[0-9a-f]{6}$/i.test(hex)) ? hex : '#6366f1';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

- [ ] **Step 2: Update existing `statusColor` in `utils.ts` to delegate to `statusBadgeClass`**

Replace the old `statusColor` function body so it delegates (keeps backward compatibility):

```typescript
export function statusColor(status: string): string {
  return statusBadgeClass(status);
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run test:run
```

Expected: All existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add statusBadgeClass and hexToRgba to utils.ts — single source of truth"
```

---

### Task 1.3: Create `src/lib/api-helpers.ts`

**Files:**
- Create: `src/lib/api-helpers.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/api-helpers.ts
// Shared utilities for API route handlers.
// Import from here instead of duplicating in individual routes.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ─── Standard error responses ────────────────────────────────────────────────

export const unauthorized = () =>
  NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: 'Acces interzis' }, { status: 403 });

export const notFound = (entity = 'Resursa') =>
  NextResponse.json({ error: `${entity} negăsită` }, { status: 404 });

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export const internalError = (err: unknown, context?: string) => {
  logger.error(context ?? 'API error', err);
  const isZod = (err as any)?.name === 'ZodError';
  return NextResponse.json(
    { error: isZod ? (err as any).message : 'Eroare internă' },
    { status: isZod ? 400 : 500 }
  );
};

// ─── Ownership helpers ────────────────────────────────────────────────────────

/**
 * Returns the property if it belongs to `userId`, null otherwise.
 * Used in all /api/properties/[id]/* routes.
 */
export async function getHostProperty(propertyId: string, userId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, hostId: userId },
    select: { id: true },
  });
}
```

- [ ] **Step 2: Update `src/app/api/properties/[id]/checkin-link/route.ts`**

Replace the inline `getHostProperty` function at the top of the file with an import:

```typescript
// Remove this:
async function getHostProperty(propertyId: string, userId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, hostId: userId },
    select: { id: true },
  });
}

// Add this import at the top of the file:
import { getHostProperty } from '@/lib/api-helpers';
```

- [ ] **Step 3: Update `src/app/api/properties/[id]/guest-form-link/route.ts`**

Same change — remove inline `getHostProperty`, add import:

```typescript
import { getHostProperty } from '@/lib/api-helpers';
```

- [ ] **Step 4: Update tasks routes to use logger instead of console.error**

In `src/app/api/host/tasks/route.ts`, replace:
```typescript
console.error('[tasks GET]', err);
// and
console.error('[tasks POST]', err);
```
With:
```typescript
import { logger } from '@/lib/logger';
// ...
logger.error('[tasks GET]', err);
// and
logger.error('[tasks POST]', err);
```

In `src/app/api/host/tasks/[id]/route.ts`, replace:
```typescript
console.error('[tasks PUT]', err);
console.error('[tasks DELETE]', err);
```
With:
```typescript
import { logger } from '@/lib/logger';
// ...
logger.error('[tasks PUT]', err);
logger.error('[tasks DELETE]', err);
```

- [ ] **Step 5: Build to verify**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api-helpers.ts \
        src/app/api/properties/[id]/checkin-link/route.ts \
        src/app/api/properties/[id]/guest-form-link/route.ts \
        src/app/api/host/tasks/route.ts \
        src/app/api/host/tasks/[id]/route.ts
git commit -m "refactor: extract getHostProperty to api-helpers.ts, use logger in tasks routes"
```

---

## Phase 2 — Shared React Hooks
*Additive only. Existing components keep working; new hooks are used gradually.*

### Task 2.1: Create `src/hooks/useDropdown.ts`

**Files:**
- Create: `src/hooks/useDropdown.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useDropdown.ts
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
```

- [ ] **Step 2: Replace dropdown logic in `src/app/dashboard/host/reservations/page.tsx`**

Find the inline dropdown code (prop selector + type dropdown). Remove:
```typescript
const [propOpen, setPropOpen] = useState(false);
const propDropdownRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (propDropdownRef.current && !propDropdownRef.current.contains(e.target as Node)) {
      setPropOpen(false);
    }
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);

// and similarly for typeDropdownRef / typeOpen
```

Replace with:
```typescript
import { useDropdown } from '@/hooks/useDropdown';
// ...
const { open: propOpen, setOpen: setPropOpen, ref: propDropdownRef } = useDropdown();
const { open: typeOpen, setOpen: setTypeOpen, ref: typeDropdownRef } = useDropdown();
```

- [ ] **Step 3: Replace dropdown logic in `src/app/dashboard/host/tasks/page.tsx`**

Same pattern — replace inline dropdown boilerplate with `useDropdown()`.

- [ ] **Step 4: Replace dropdown logic in `src/app/dashboard/host/calendar/page.tsx`**

Same pattern for property selector dropdown.

- [ ] **Step 5: Lint**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run lint 2>&1 | grep -E "error|warning" | head -20
```

Expected: No new errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDropdown.ts \
        src/app/dashboard/host/reservations/page.tsx \
        src/app/dashboard/host/tasks/page.tsx \
        src/app/dashboard/host/calendar/page.tsx
git commit -m "refactor: extract useDropdown hook, remove 3 copies of dropdown boilerplate"
```

---

### Task 2.2: Create `src/hooks/usePagination.ts`

**Files:**
- Create: `src/hooks/usePagination.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/usePagination.ts
// Manages page, totalPages state and provides helpers.
// Usage:
//   const { page, totalPages, total, setPage, setPaginationData } = usePagination();
//   // In your fetch callback:
//   setPaginationData({ total: data.total, totalPages: data.totalPages, page: data.page });

import { useState } from 'react';

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  function setPaginationData(data: { total: number; totalPages: number; page: number }) {
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setPage(data.page);
  }

  function resetPage() {
    setPage(1);
  }

  return { page, totalPages, total, setPage, setPaginationData, resetPage };
}
```

- [ ] **Step 2: Use `usePagination` in `src/app/dashboard/host/reservations/page.tsx`**

Replace the four inline pagination state variables:
```typescript
// Remove:
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const [totalPages, setTotalPages] = useState(1);

// Add:
import { usePagination } from '@/hooks/usePagination';
const { page, totalPages, total, setPage, setPaginationData, resetPage } = usePagination();
// Call setPaginationData() where you previously called setTotal/setTotalPages/setPage together
// Call resetPage() where you previously called setPage(1) on filter changes
```

- [ ] **Step 3: Build**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -10
```

Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePagination.ts src/app/dashboard/host/reservations/page.tsx
git commit -m "refactor: extract usePagination hook, use in reservations page"
```

---

### Task 2.3: Create `src/hooks/useConfirmModal.ts`

**Files:**
- Create: `src/hooks/useConfirmModal.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useConfirmModal.ts
// Manages a confirm modal with async onConfirm callback.
// Usage:
//   const { modal, openModal, closeModal, runConfirm, confirming } = useConfirmModal();
//   openModal({ message: 'Sure?', onConfirm: async () => { ... } });

import { useState } from 'react';

interface ModalState {
  message: string;
  onConfirm: () => Promise<void>;
}

export function useConfirmModal() {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [confirming, setConfirming] = useState(false);

  function openModal(state: ModalState) {
    setModal(state);
  }

  function closeModal() {
    setModal(null);
  }

  async function runConfirm() {
    if (!modal) return;
    setConfirming(true);
    try {
      await modal.onConfirm();
    } finally {
      setConfirming(false);
      setModal(null);
    }
  }

  return { modal, openModal, closeModal, runConfirm, confirming };
}
```

- [ ] **Step 2: Use `useConfirmModal` in `src/app/dashboard/host/tasks/page.tsx`**

Replace the inline confirm modal state:
```typescript
// Remove:
const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
const [confirming, setConfirming] = useState(false);
const runConfirm = async () => { ... };

// Add:
import { useConfirmModal } from '@/hooks/useConfirmModal';
const { modal: confirmModal, openModal, closeModal: setConfirmModal, runConfirm, confirming } = useConfirmModal();
// Replace setConfirmModal({ ... }) calls with openModal({ ... })
// Replace setConfirmModal(null) calls with setConfirmModal() (closeModal)
```

- [ ] **Step 3: Build & lint**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -10 && npm run lint 2>&1 | grep error | head -10
```

Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useConfirmModal.ts src/app/dashboard/host/tasks/page.tsx
git commit -m "refactor: extract useConfirmModal hook, use in tasks page"
```

---

## Phase 3 — Shared UI Components
*Build new Modal and Dropdown components using the frontend-design plugin.*

### Task 3.1: Create `src/components/Modal.tsx`

**Files:**
- Create: `src/components/Modal.tsx`

- [ ] **Step 1: Invoke frontend-design plugin to build the Modal component**

Use `/frontend-design:frontend-design` with this prompt:

> Build a reusable `Modal` component for a Next.js 14 + Tailwind CSS app.
> Requirements:
> - Props: `open: boolean`, `onClose: () => void`, `title: string`, `children: React.ReactNode`, `footer?: React.ReactNode`
> - Backdrop: semi-transparent black overlay, click outside closes
> - Animated entry (fade + slight scale up)
> - Uses existing Tailwind classes from the project (rounded-2xl, shadow-xl, border-gray-100)
> - Close button (X icon from lucide-react) in top right
> - Must work with `confirming` disabled state for confirm modals
> Save to: `src/components/Modal.tsx`

- [ ] **Step 2: Replace inline confirm modal in `src/app/dashboard/host/tasks/page.tsx` with `<Modal>`**

The tasks page renders its own confirm modal div — replace with:
```tsx
import { Modal } from '@/components/Modal';
// ...
{confirmModal && (
  <Modal
    open={!!confirmModal}
    onClose={() => setConfirmModal(null)}
    title={lang === 'ro' ? 'Confirmare' : 'Confirm'}
    footer={
      <>
        <button onClick={() => setConfirmModal(null)} className="...">
          {lang === 'ro' ? 'Anulează' : 'Cancel'}
        </button>
        <button onClick={runConfirm} disabled={confirming} className="...">
          {confirming && <Loader2 size={13} className="animate-spin" />}
          {lang === 'ro' ? 'Șterge' : 'Delete'}
        </button>
      </>
    }
  >
    <p className="text-sm text-gray-700">{confirmModal.message}</p>
  </Modal>
)}
```

- [ ] **Step 3: Build**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -10
```

Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/Modal.tsx src/app/dashboard/host/tasks/page.tsx
git commit -m "feat: add reusable Modal component, use in tasks page"
```

---

### Task 3.2: Create `src/components/Dropdown.tsx`

**Files:**
- Create: `src/components/Dropdown.tsx`

- [ ] **Step 1: Invoke frontend-design plugin to build the Dropdown component**

Use `/frontend-design:frontend-design` with this prompt:

> Build a reusable `Dropdown` component for a Next.js 14 + Tailwind CSS app.
> Requirements:
> - Props: `trigger: React.ReactNode`, `children: React.ReactNode`, `open: boolean`, `onToggle: () => void`, `align?: 'left' | 'right'`
> - Renders a button trigger + absolutely positioned menu panel
> - Menu: white bg, border-gray-200, rounded-xl, shadow-lg, z-20
> - Outside click handled by parent (via useDropdown hook)
> - No extra dependencies — pure Tailwind + React
> Save to: `src/components/Dropdown.tsx`

- [ ] **Step 2: Use `<Dropdown>` in `src/app/dashboard/host/reservations/page.tsx`**

Replace the custom property selector and type filter dropdowns with the new `<Dropdown>` component + `useDropdown` hook.

- [ ] **Step 3: Build & lint**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Dropdown.tsx src/app/dashboard/host/reservations/page.tsx
git commit -m "feat: add reusable Dropdown component, use in reservations page"
```

---

## Phase 4 — API Client Layer

### Task 4.1: Create `src/lib/api-client.ts`

**Files:**
- Create: `src/lib/api-client.ts`

- [ ] **Step 1: Create the API client**

```typescript
// src/lib/api-client.ts
// Client-side fetch wrapper.
// Centralises base headers, JSON parsing, and 401 redirect.
// Usage:
//   const data = await api.get<{ tasks: Task[] }>('/api/host/tasks?propertyId=xxx');
//   const result = await api.post('/api/host/tasks', { propertyId, title });

import { toast } from 'sonner';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    toast.error('Sesiunea a expirat. Te rugăm să te autentifici din nou.');
    window.location.href = '/auth/login';
    return Promise.reject(new Error('Unauthorized'));
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string, body?: unknown) => request<T>('DELETE', url, body),
};
```

- [ ] **Step 2: Migrate `src/app/dashboard/host/tasks/page.tsx` to use `api` client**

Replace all raw `fetch(...)` calls:

```typescript
// Before:
const data = await fetch(`/api/host/tasks?propertyId=${selectedPropId}`).then(r => r.json());
setTasks(data.tasks || []);

// After:
import { api } from '@/lib/api-client';
import { Task } from '@/types';
// ...
const data = await api.get<{ tasks: Task[] }>(`/api/host/tasks?propertyId=${selectedPropId}`);
setTasks(data.tasks);
```

Apply the same pattern for POST (addTask), PUT (toggleDone, saveEdit), DELETE (deleteTask).

- [ ] **Step 3: Build**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -10
```

Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api-client.ts src/app/dashboard/host/tasks/page.tsx
git commit -m "feat: add api-client.ts, migrate tasks page to use typed fetch wrapper"
```

---

### Task 4.2: Migrate `reservations/page.tsx` to api-client

**Files:**
- Modify: `src/app/dashboard/host/reservations/page.tsx`

- [ ] **Step 1: Replace all raw fetch calls in reservations page**

```typescript
import { api } from '@/lib/api-client';
import { Reservation } from '@/types';

// Replace the main fetch:
const data = await api.get<{
  reservations: Reservation[];
  total: number;
  totalPages: number;
  page: number;
  totalRevenue: number;
  platforms: { source: string; color: string }[];
}>(`/api/host/reservations?...`);
```

- [ ] **Step 2: Replace inline `hexToRgba` with import from utils**

```typescript
// Remove inline function definition
// Add import:
import { hexToRgba } from '@/lib/utils';
```

- [ ] **Step 3: Replace inline `STATUS_STYLE` map with `statusBadgeClass`**

```typescript
// Remove STATUS_STYLE constant
// Add import:
import { statusBadgeClass } from '@/lib/utils';
// Replace: className={STATUS_STYLE[r.status] || '...'}
// With:    className={statusBadgeClass(r.status)}
```

- [ ] **Step 4: Build & lint**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/host/reservations/page.tsx
git commit -m "refactor: reservations page — use api-client, shared hexToRgba, statusBadgeClass"
```

---

## Phase 5 — Calendar Page Decomposition

> The calendar page is 1,885 lines with 40 useState calls. This phase splits it into focused units.
> **Important:** Work incrementally. Extract one piece at a time. Build after each extraction.

### Task 5.1: Extract `useCalendarState.ts` hook

**Files:**
- Create: `src/app/dashboard/host/calendar/useCalendarState.ts`
- Modify: `src/app/dashboard/host/calendar/page.tsx`

- [ ] **Step 1: Identify all UI state in calendar/page.tsx**

Look for all `useState` calls related to UI (not data): selected dates, modal open/close, active view, property selector open, editing state, hover state etc.

- [ ] **Step 2: Create the hook**

```typescript
// src/app/dashboard/host/calendar/useCalendarState.ts
'use client';
import { useState } from 'react';
import { startOfMonth } from 'date-fns';

export function useCalendarState() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [activePropId, setActivePropId] = useState<string>('all');
  const [propSelectorOpen, setPropSelectorOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [selectedManual, setSelectedManual] = useState<string | null>(null);
  const [selectedSynced, setSelectedSynced] = useState<string | null>(null);
  // ... add all other UI state variables found in the page

  return {
    currentMonth, setCurrentMonth,
    activePropId, setActivePropId,
    propSelectorOpen, setPropSelectorOpen,
    selectedBooking, setSelectedBooking,
    selectedManual, setSelectedManual,
    selectedSynced, setSelectedSynced,
    // ... all other state
  };
}
```

- [ ] **Step 3: Import and use in calendar/page.tsx**

```typescript
import { useCalendarState } from './useCalendarState';
// Remove all extracted useState calls
const calendarState = useCalendarState();
// Destructure as needed
```

- [ ] **Step 4: Build**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/host/calendar/useCalendarState.ts \
        src/app/dashboard/host/calendar/page.tsx
git commit -m "refactor: extract useCalendarState hook from calendar page"
```

---

### Task 5.2: Extract `useCalendarData.ts` hook

**Files:**
- Create: `src/app/dashboard/host/calendar/useCalendarData.ts`
- Modify: `src/app/dashboard/host/calendar/page.tsx`

- [ ] **Step 1: Identify all data fetching state and effects**

Look for: `properties`, `bookings`, `manualReservations`, `syncedReservations`, `periodPricings`, `calendarSyncs`, loading states, and the `useEffect`/`useCallback` that fetch them.

- [ ] **Step 2: Create the hook**

```typescript
// src/app/dashboard/host/calendar/useCalendarData.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { BookingData, ManualReservationData, SyncedReservationData, PeriodPricing, CalendarSync } from '@/types';

export function useCalendarData(activePropId: string) {
  const [properties, setProperties] = useState<{ id: string; title: string }[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [manualReservations, setManualReservations] = useState<ManualReservationData[]>([]);
  const [syncedReservations, setSyncedReservations] = useState<SyncedReservationData[]>([]);
  const [periodPricings, setPeriodPricings] = useState<Record<string, PeriodPricing[]>>({});
  const [calendarSyncs, setCalendarSyncs] = useState<CalendarSync[]>([]);
  const [loading, setLoading] = useState(true);

  // Move all fetch logic here using api.get()
  const fetchCalendarData = useCallback(async () => {
    // ... extracted fetch logic
  }, [activePropId]);

  useEffect(() => { fetchCalendarData(); }, [fetchCalendarData]);

  return {
    properties, bookings, manualReservations,
    syncedReservations, periodPricings, calendarSyncs,
    loading, refetch: fetchCalendarData,
  };
}
```

- [ ] **Step 3: Update calendar/page.tsx to use the hook**

```typescript
import { useCalendarData } from './useCalendarData';
const {
  properties, bookings, manualReservations,
  syncedReservations, periodPricings, calendarSyncs,
  loading, refetch,
} = useCalendarData(activePropId);
```

- [ ] **Step 4: Build**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/host/calendar/useCalendarData.ts \
        src/app/dashboard/host/calendar/page.tsx
git commit -m "refactor: extract useCalendarData hook from calendar page"
```

---

### Task 5.3: Extract `CalendarGrid.tsx` component

**Files:**
- Create: `src/app/dashboard/host/calendar/CalendarGrid.tsx`
- Modify: `src/app/dashboard/host/calendar/page.tsx`

- [ ] **Step 1: Identify the calendar grid render block**

Find the JSX that renders the month grid (day headers + day cells). This is typically the largest JSX block in the file.

- [ ] **Step 2: Create CalendarGrid.tsx**

```tsx
// src/app/dashboard/host/calendar/CalendarGrid.tsx
'use client';
import { BookingData, ManualReservationData, SyncedReservationData } from '@/types';
// Import needed date-fns functions, hexToRgba, etc.

interface Props {
  days: Date[];
  bookings: BookingData[];
  manualReservations: ManualReservationData[];
  syncedReservations: SyncedReservationData[];
  activePropId: string;
  onDayClick: (date: Date) => void;
  onBookingClick: (id: string) => void;
  onManualClick: (id: string) => void;
  onSyncedClick: (id: string) => void;
  // ... other needed callbacks and config
}

export function CalendarGrid(props: Props) {
  // Move extracted JSX here
  return ( /* ... */ );
}
```

- [ ] **Step 3: Import and use in page.tsx**

```tsx
import { CalendarGrid } from './CalendarGrid';
// Replace extracted JSX with:
<CalendarGrid
  days={days}
  bookings={bookings}
  // ... pass all props
/>
```

- [ ] **Step 4: Build**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/host/calendar/CalendarGrid.tsx \
        src/app/dashboard/host/calendar/page.tsx
git commit -m "refactor: extract CalendarGrid component from calendar page"
```

---

### Task 5.4: Extract `CalendarSidebar.tsx` component

**Files:**
- Create: `src/app/dashboard/host/calendar/CalendarSidebar.tsx`
- Modify: `src/app/dashboard/host/calendar/page.tsx`

- [ ] **Step 1: Identify the detail/sidebar panel JSX**

The right-side panel or bottom detail area that shows booking details, manual reservation forms, synced reservation info when a day/event is clicked.

- [ ] **Step 2: Create CalendarSidebar.tsx**

```tsx
// src/app/dashboard/host/calendar/CalendarSidebar.tsx
'use client';
import { BookingData, ManualReservationData, SyncedReservationData } from '@/types';
// Extract the sidebar JSX into a focused component

interface Props {
  selectedBooking: BookingData | null;
  selectedManual: ManualReservationData | null;
  selectedSynced: SyncedReservationData | null;
  onClose: () => void;
  onRefetch: () => void;
  // ... other needed props
}

export function CalendarSidebar(props: Props) {
  return ( /* extracted JSX */ );
}
```

- [ ] **Step 3: Use in page.tsx**

```tsx
import { CalendarSidebar } from './CalendarSidebar';
<CalendarSidebar
  selectedBooking={...}
  // ...
/>
```

- [ ] **Step 4: Build & verify page.tsx is now under 400 lines**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build 2>&1 | tail -15
wc -l src/app/dashboard/host/calendar/page.tsx
```

Expected: Build clean, page.tsx under 400 lines.

- [ ] **Step 5: Also replace inline `hexToRgba` in calendar page with import from utils**

```typescript
// Remove inline hexToRgba function
import { hexToRgba } from '@/lib/utils';
```

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/host/calendar/CalendarSidebar.tsx \
        src/app/dashboard/host/calendar/page.tsx
git commit -m "refactor: extract CalendarSidebar, remove inline hexToRgba — calendar page now <400 lines"
```

---

## Phase 6 — TypeScript Strictness Pass

### Task 6.1: Replace `any` types in components with proper types from `src/types/index.ts`

**Files:**
- Modify: `src/components/PropertyDetail.tsx`
- Modify: `src/components/PropertyForm.tsx`
- Modify: `src/components/BookingDetail.tsx`
- Modify: `src/components/BookingCard.tsx`

- [ ] **Step 1: Audit `any` usage**

```bash
cd /Users/mihaialbert/Projects/stai-aici && grep -rn ": any" src/components/ src/app/dashboard/
```

- [ ] **Step 2: Replace each `any` with proper type from `src/types/index.ts` or a local interface**

For each occurrence:
- If the type matches one in `src/types/index.ts`, import and use it.
- If it's component-specific, define a local interface in the same file.

- [ ] **Step 3: Fix any resulting TypeScript errors**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -40
```

Fix errors one by one. Do NOT use `as any` to silence — find the correct type.

- [ ] **Step 4: Run full lint**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run lint
```

Expected: Zero errors (warnings acceptable).

- [ ] **Step 5: Final build**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run build
```

Expected: Clean build, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: replace any types with proper TypeScript types from src/types/index.ts"
```

---

## Phase 7 — Final Verification

### Task 7.1: Full verification pass

- [ ] **Step 1: Run all tests**

```bash
cd /Users/mihaialbert/Projects/stai-aici && npm run test:run
```

Expected: All tests pass.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: Zero errors.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 4: Smoke test manually**

Start dev server and verify these pages work:
1. `/dashboard/host/calendar` — calendar loads, events show, clicking a day works
2. `/dashboard/host/reservations` — list loads, dropdowns work, pagination works
3. `/dashboard/host/tasks` — add/edit/delete tasks work, confirm modal works
4. `/dashboard/host/properties` — create/edit property works
5. `/checkin/[any-token]` — public check-in page loads
6. `/form/[any-token]` — guest form loads and submits

```bash
npm run dev
```

- [ ] **Step 5: Final commit summary**

```bash
git log --oneline -20
```

Review: verify each phase has its own commits, nothing is missing.

---

## Summary of Changes

| Phase | What Changes | Risk |
|-------|-------------|------|
| 1 — Types & API Helpers | New files only + 2 route deduplication fixes | Very Low |
| 2 — Hooks | New hooks + 3 pages simplified | Low |
| 3 — UI Components | 2 new components + 2 pages updated | Low-Medium |
| 4 — API Client | New client + 2 pages migrated | Medium |
| 5 — Calendar Decomposition | 1 page → 4 files | Medium-High |
| 6 — TypeScript Strictness | Component type fixes | Low |

**Total new files:** 13
**Total modified files:** ~12
**No new features. No schema changes. No dependency additions.**
