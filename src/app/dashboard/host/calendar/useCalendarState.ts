'use client';
import { useState } from 'react';
import { BookingData, ManualReservationData, SyncedReservationData } from '@/types';

export function useCalendarState() {
  // Property selector
  const [activePropId, setActivePropId] = useState<string>('all');

  // Calendar navigation
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Responsive
  const [isMobile, setIsMobile] = useState(false);

  // Tooltips
  const [tooltip, setTooltip] = useState<{ booking: BookingData; x: number; y: number } | null>(null);
  const [overflowTooltip, setOverflowTooltip] = useState<{ bookings: BookingData[]; x: number; y: number } | null>(null);
  const [blockedTooltip, setBlockedTooltip] = useState<{ properties: string[]; x: number; y: number } | null>(null);

  // Edit manual reservation modal
  const [editingManual, setEditingManual] = useState<ManualReservationData | null>(null);
  const [editManualForm, setEditManualForm] = useState({ guestName: '', checkIn: '', checkOut: '', revenue: '', source: '', notes: '' });
  const [savingManualEdit, setSavingManualEdit] = useState(false);

  // Edit synced reservation modal
  const [editingSynced, setEditingSynced] = useState<SyncedReservationData | null>(null);
  const [editSyncedForm, setEditSyncedForm] = useState({ guestName: '', revenue: '', notes: '', isBlockManual: null as boolean | null });
  const [showSyncedBlockWarn, setShowSyncedBlockWarn] = useState(false);
  const [savingSyncedEdit, setSavingSyncedEdit] = useState(false);

  // Range selection
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  // Sync form
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [syncPlatform, setSyncPlatform] = useState('booking');
  const [syncUrl, setSyncUrl] = useState('');
  const [syncColor, setSyncColor] = useState('#6366f1');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Period pricing modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceForm, setPriceForm] = useState({ name: '', pricePerNight: 0 });
  const [savingPrice, setSavingPrice] = useState(false);

  // Manual reservation modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    propertyId: '', guestName: '', checkIn: '', checkOut: '',
    revenue: '', source: '', notes: '', blockCalendar: true,
  });
  const [savingManual, setSavingManual] = useState(false);

  return {
    activePropId, setActivePropId,
    currentMonth, setCurrentMonth,
    isMobile, setIsMobile,
    tooltip, setTooltip,
    overflowTooltip, setOverflowTooltip,
    blockedTooltip, setBlockedTooltip,
    editingManual, setEditingManual,
    editManualForm, setEditManualForm,
    savingManualEdit, setSavingManualEdit,
    editingSynced, setEditingSynced,
    editSyncedForm, setEditSyncedForm,
    showSyncedBlockWarn, setShowSyncedBlockWarn,
    savingSyncedEdit, setSavingSyncedEdit,
    rangeStart, setRangeStart,
    rangeEnd, setRangeEnd,
    hoverDate, setHoverDate,
    blocking, setBlocking,
    conflictMsg, setConflictMsg,
    showSyncForm, setShowSyncForm,
    syncPlatform, setSyncPlatform,
    syncUrl, setSyncUrl,
    syncColor, setSyncColor,
    syncingId, setSyncingId,
    showPriceModal, setShowPriceModal,
    priceForm, setPriceForm,
    savingPrice, setSavingPrice,
    showManualModal, setShowManualModal,
    manualForm, setManualForm,
    savingManual, setSavingManual,
  };
}
