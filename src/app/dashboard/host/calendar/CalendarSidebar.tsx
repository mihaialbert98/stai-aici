'use client';

import { format, parseISO, addDays, isBefore } from 'date-fns';
import { X, Lock, Unlock, RefreshCw, Trash2, Copy, Plus, DollarSign, Loader2 } from 'lucide-react';
import { formatRON } from '@/lib/utils';
import { toast } from 'sonner';
import { ManualReservationData, SyncedReservationData, CalendarSync } from '@/types';
import { dashboardT } from '@/lib/i18n';
import { Locale } from 'date-fns';

const SYNC_COLOR_PALETTE = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#6366f1','#8b5cf6','#ec4899','#64748b'];

interface PropertySummary {
  id: string;
  title: string;
  pricePerNight: number;
}

interface CalendarSidebarProps {
  // Active property info
  activePropId: string;
  activeProp: PropertySummary | undefined;
  isAllView: boolean;
  properties: PropertySummary[];

  // Range selection state
  rangeStart: string | null;
  rangeEnd: string | null;
  rangeCount: number;
  blocking: boolean;
  allBlocked: boolean;
  hasAnyBlocked: () => boolean;

  // Sync management state
  calendarSyncs: Record<string, CalendarSync[]>;
  syncingId: string | null;
  setSyncingId: (id: string | null) => void;
  setCalendarSyncs: (updater: (prev: Record<string, CalendarSync[]>) => Record<string, CalendarSync[]>) => void;
  setSyncedDates: (updater: (prev: Record<string, Record<string, string>>) => Record<string, Record<string, string>>) => void;
  setBlockedDates: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void;
  syncedDates: Record<string, Record<string, string>>;

  showSyncForm: boolean;
  setShowSyncForm: (v: boolean) => void;
  syncPlatform: string;
  setSyncPlatform: (v: string) => void;
  syncUrl: string;
  setSyncUrl: (v: string) => void;
  syncColor: string;
  setSyncColor: (v: string) => void;

  // Range action bar callbacks
  confirmBlock: (block: boolean) => void;
  clearSelection: () => void;

  // Manual reservation modal from range selection
  setManualForm: (updater: (f: {
    propertyId: string; guestName: string; checkIn: string; checkOut: string;
    revenue: string; source: string; notes: string; blockCalendar: boolean;
  }) => {
    propertyId: string; guestName: string; checkIn: string; checkOut: string;
    revenue: string; source: string; notes: string; blockCalendar: boolean;
  }) => void;
  setShowManualModal: (v: boolean) => void;

  // Price modal
  showPriceModal: boolean;
  setShowPriceModal: (v: boolean) => void;
  priceForm: { name: string; pricePerNight: number };
  setPriceForm: (updater: (f: { name: string; pricePerNight: number }) => { name: string; pricePerNight: number }) => void;
  savingPrice: boolean;
  savePeriodPricing: () => void;

  // Manual reservation modal (standalone)
  showManualModal: boolean;
  manualForm: {
    propertyId: string; guestName: string; checkIn: string; checkOut: string;
    revenue: string; source: string; notes: string; blockCalendar: boolean;
  };
  savingManual: boolean;
  saveManualReservation: () => void;

  // Edit synced reservation modal
  editingSynced: SyncedReservationData | null;
  setEditingSynced: (v: SyncedReservationData | null) => void;
  editSyncedForm: { guestName: string; revenue: string; notes: string; isBlockManual: boolean | null };
  setEditSyncedForm: (updater: (f: { guestName: string; revenue: string; notes: string; isBlockManual: boolean | null }) => { guestName: string; revenue: string; notes: string; isBlockManual: boolean | null }) => void;
  showSyncedBlockWarn: boolean;
  setShowSyncedBlockWarn: (v: boolean) => void;
  savingSyncedEdit: boolean;
  saveSyncedEdit: () => void;

  // Edit manual reservation modal
  editingManual: ManualReservationData | null;
  setEditingManual: (v: ManualReservationData | null) => void;
  editManualForm: { guestName: string; checkIn: string; checkOut: string; revenue: string; source: string; notes: string };
  setEditManualForm: (updater: (f: { guestName: string; checkIn: string; checkOut: string; revenue: string; source: string; notes: string }) => { guestName: string; checkIn: string; checkOut: string; revenue: string; source: string; notes: string }) => void;
  savingManualEdit: boolean;
  saveManualEdit: () => void;
  deleteManualEdit: () => void;

  // i18n
  lang: string;
  dateFnsLocale: Locale;
  t: typeof dashboardT['ro']['calendar'];
  tm: typeof dashboardT['ro']['manualReservation'];

  // Refresh
  refreshCalendarData: () => Promise<void>;
}

export function CalendarSidebar({
  activePropId,
  activeProp,
  isAllView,
  properties,
  rangeStart,
  rangeEnd,
  rangeCount,
  blocking,
  allBlocked,
  hasAnyBlocked,
  calendarSyncs,
  syncingId,
  setSyncingId,
  setCalendarSyncs,
  setSyncedDates,
  setBlockedDates,
  syncedDates,
  showSyncForm,
  setShowSyncForm,
  syncPlatform,
  setSyncPlatform,
  syncUrl,
  setSyncUrl,
  syncColor,
  setSyncColor,
  confirmBlock,
  clearSelection,
  setManualForm,
  setShowManualModal,
  showPriceModal,
  setShowPriceModal,
  priceForm,
  setPriceForm,
  savingPrice,
  savePeriodPricing,
  showManualModal,
  manualForm,
  savingManual,
  saveManualReservation,
  editingSynced,
  setEditingSynced,
  editSyncedForm,
  setEditSyncedForm,
  showSyncedBlockWarn,
  setShowSyncedBlockWarn,
  savingSyncedEdit,
  saveSyncedEdit,
  editingManual,
  setEditingManual,
  editManualForm,
  setEditManualForm,
  savingManualEdit,
  saveManualEdit,
  deleteManualEdit,
  lang,
  dateFnsLocale,
  t,
  tm,
  refreshCalendarData,
}: CalendarSidebarProps) {
  return (
    <>
      {/* Calendar sync management */}
      {!isAllView && activePropId && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <RefreshCw size={16} /> {t.syncTitle}
            </h3>
          </div>

          {/* Export URL */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{t.exportLinkDesc}</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/properties/${activePropId}/calendar.ics`}
                className="input text-xs flex-1 bg-white"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/properties/${activePropId}/calendar.ics`);
                  toast.success(t.linkCopied);
                }}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
              >
                <Copy size={13} /> {t.copy}
              </button>
            </div>
          </div>

          {/* Existing syncs */}
          {(calendarSyncs[activePropId] || []).length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-gray-500">{t.connectedCalendars}</p>
              {(calendarSyncs[activePropId] || []).map((sync: CalendarSync) => (
                <div key={sync.id} className="flex flex-col gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sync.color || '#6366f1' }} />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium capitalize">{sync.platform}</span>
                      <p className="text-xs text-gray-500 truncate">{sync.icalUrl}</p>
                      {sync.lastSynced && (
                        <p className="text-[10px] text-gray-400">{t.lastSynced} {format(new Date(sync.lastSynced), 'd MMM HH:mm', { locale: dateFnsLocale })}</p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        setSyncingId(sync.id);
                        try {
                          const res = await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ syncId: sync.id }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            await refreshCalendarData();
                            toast.success(t.syncSuccess(sync.platform, data.dates));
                          } else {
                            toast.error(data.error || t.syncError);
                          }
                        } catch {
                          toast.error(t.syncError);
                        }
                        setSyncingId(null);
                      }}
                      disabled={syncingId === sync.id}
                      className="text-violet-500 hover:text-violet-700 flex-shrink-0 p-1"
                      title={t.syncNow}
                    >
                      <RefreshCw size={14} className={syncingId === sync.id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ syncId: sync.id }),
                        });
                        setCalendarSyncs(prev => ({
                          ...prev,
                          [activePropId]: (prev[activePropId] || []).filter((s: CalendarSync) => s.id !== sync.id),
                        }));
                        // Remove synced blocked dates for this platform from local state
                        setSyncedDates(prev => {
                          const propDates = { ...prev[activePropId] };
                          Object.keys(propDates).forEach(d => {
                            if (propDates[d] === sync.platform) delete propDates[d];
                          });
                          return { ...prev, [activePropId]: propDates };
                        });
                        setBlockedDates(prev => {
                          const propBlocked = (prev[activePropId] || []).filter(d => syncedDates[activePropId]?.[d] !== sync.platform);
                          return { ...prev, [activePropId]: propBlocked };
                        });
                        toast.success(t.syncDisconnected(sync.platform));
                      }}
                      className="text-red-400 hover:text-red-600 flex-shrink-0 p-1"
                      title="Șterge"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Color picker row */}
                  <div className="flex items-center gap-1.5 pl-6">
                    <span className="text-[10px] text-gray-400 mr-0.5">{lang === 'ro' ? 'Culoare:' : 'Color:'}</span>
                    {SYNC_COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ syncId: sync.id, color: c }),
                          });
                          setCalendarSyncs(prev => ({
                            ...prev,
                            [activePropId]: (prev[activePropId] || []).map((s: CalendarSync) =>
                              s.id === sync.id ? { ...s, color: c } : s
                            ),
                          }));
                        }}
                        className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                        style={{ backgroundColor: c, outline: (sync.color || '#6366f1') === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add sync form */}
          {showSyncForm ? (
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{t.platform}</label>
                  <select value={syncPlatform} onChange={e => setSyncPlatform(e.target.value)} className="input text-sm">
                    <option value="booking">Booking.com</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="other">{t.otherPlatform}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{t.icalUrl}</label>
                  <input
                    value={syncUrl}
                    onChange={e => setSyncUrl(e.target.value)}
                    placeholder="https://..."
                    className="input text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">{lang === 'ro' ? 'Culoare calendar' : 'Calendar color'}</label>
                <div className="flex gap-1.5 flex-wrap">
                  {SYNC_COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSyncColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: syncColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!syncUrl.trim()) return;
                    const res = await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ platform: syncPlatform, icalUrl: syncUrl.trim(), color: syncColor }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setCalendarSyncs(prev => ({
                        ...prev,
                        [activePropId]: [...(prev[activePropId] || []), data.sync],
                      }));
                      setSyncUrl('');
                      setSyncColor('#6366f1');
                      setShowSyncForm(false);
                      toast.success(t.syncConnected(syncPlatform));
                    } else {
                      toast.error(data.error || t.addError);
                    }
                  }}
                  className="btn-primary text-xs px-4 py-2"
                >
                  {t.add}
                </button>
                <button onClick={() => { setShowSyncForm(false); setSyncUrl(''); }} className="btn-secondary text-xs px-4 py-2">
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowSyncForm(true)} className="btn-secondary text-sm flex items-center gap-2">
              <Plus size={14} /> {t.addExternalCalendar}
            </button>
          )}
        </div>
      )}

      {/* Action bar for range confirmation — fixed at bottom */}
      {rangeStart && !isAllView && !showPriceModal && (
        <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-lg bg-white border-t md:border md:rounded-xl shadow-xl p-4 z-50">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm min-w-0">
              <p className="font-medium truncate">{activeProp?.title}</p>
              <p className="text-gray-500 text-xs">
                {t.daysSelected(rangeCount)}
                {!rangeEnd && rangeStart && ` ${t.clickForRange}`}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {/* TODO: uncomment when period pricing is enabled
              <button onClick={openPriceModal}
                className="px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1.5">
                <DollarSign size={13} /> {t.setPrice}
              </button>
              */}
              <button onClick={() => {
                const end = rangeEnd || rangeStart;
                const [start, finish] = isBefore(parseISO(rangeStart!), parseISO(end!))
                  ? [rangeStart!, end!]
                  : [end!, rangeStart!];
                setManualForm(f => ({
                  ...f,
                  propertyId: activePropId || (properties[0]?.id || ''),
                  guestName: '', checkIn: start, checkOut: finish,
                  revenue: '', source: '', notes: '', blockCalendar: false,
                }));
                setShowManualModal(true);
              }}
                className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition flex items-center gap-1.5">
                <Plus size={13} /> {lang === 'ro' ? 'Rezervare manuală' : 'Manual reservation'}
              </button>
              {!allBlocked && (
                <button onClick={() => confirmBlock(true)} disabled={blocking}
                  className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                  <Lock size={13} /> {t.block}
                </button>
              )}
              {hasAnyBlocked() && (
                <button onClick={() => confirmBlock(false)} disabled={blocking}
                  className="px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5">
                  <Unlock size={13} /> {t.unblock}
                </button>
              )}
              <button onClick={clearSelection}
                className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <X size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price setting modal */}
      {showPriceModal && rangeStart && !isAllView && (
        <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-md bg-white border-t md:border md:rounded-xl shadow-xl p-4 z-50">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">{t.priceModalTitle}</h4>
              <button onClick={() => setShowPriceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {format(parseISO(rangeStart), 'd MMM', { locale: dateFnsLocale })}
              {rangeEnd && rangeEnd !== rangeStart && ` — ${format(parseISO(rangeEnd), 'd MMM yyyy', { locale: dateFnsLocale })}`}
              {!rangeEnd && ` — ${format(parseISO(rangeStart), 'yyyy', { locale: dateFnsLocale })}`}
              {' '}({rangeCount} {rangeCount === 1 ? t.dayUnit : t.daysUnit})
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{t.periodNameLabel}</label>
              <input
                type="text"
                className="input text-sm"
                placeholder={t.periodNamePh}
                value={priceForm.name}
                onChange={e => setPriceForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{t.pricePerNightLabel}</label>
              <input
                type="number"
                className="input text-sm"
                placeholder="ex. 350"
                value={priceForm.pricePerNight}
                onChange={e => setPriceForm(f => ({ ...f, pricePerNight: Number(e.target.value) }))}
                min={1}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {t.standardPrice(formatRON(activeProp?.pricePerNight || 0))}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={savePeriodPricing}
              disabled={savingPrice}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              {savingPrice ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> {t.saving}
                </>
              ) : (
                <>
                  <DollarSign size={13} /> {t.save}
                </>
              )}
            </button>
            <button
              onClick={() => setShowPriceModal(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Manual reservation modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-base">{tm.newEntryTitle}</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">{tm.property}</label>
                  <select
                    className="input"
                    value={manualForm.propertyId}
                    onChange={e => setManualForm(f => ({ ...f, propertyId: e.target.value }))}
                  >
                    <option value="">{tm.selectProperty}</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{tm.guestName}</label>
                  <input className="input" placeholder={tm.guestNamePlaceholder} value={manualForm.guestName}
                    onChange={e => setManualForm(f => ({ ...f, guestName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.source}</label>
                  <input className="input" placeholder={tm.sourcePlaceholder} value={manualForm.source}
                    onChange={e => setManualForm(f => ({ ...f, source: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkIn}</label>
                  <input type="date" className="input" value={manualForm.checkIn}
                    onChange={e => setManualForm(f => ({ ...f, checkIn: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkOut}</label>
                  <input type="date" className="input" value={manualForm.checkOut}
                    onChange={e => setManualForm(f => ({ ...f, checkOut: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.revenue}</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                    value={manualForm.revenue} onChange={e => setManualForm(f => ({ ...f, revenue: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.notes}</label>
                  <textarea className="input min-h-[60px] resize-none" placeholder={tm.notesPlaceholder}
                    value={manualForm.notes} onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={saveManualReservation}
                disabled={savingManual || !manualForm.propertyId || !manualForm.checkIn || !manualForm.checkOut || !manualForm.revenue}
                className="btn-primary disabled:opacity-50 flex items-center gap-2"
              >
                {savingManual ? tm.saving : tm.save}
              </button>
              <button onClick={() => setShowManualModal(false)} className="btn-secondary">{tm.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit synced reservation modal (read-only dates/source, editable guest/revenue/notes) */}
      {editingSynced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-base">
                  {lang === 'ro' ? 'Rezervare sincronizată' : 'Synced reservation'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{editingSynced.source}</p>
              </div>
              <button onClick={() => setEditingSynced(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Read-only dates */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{tm.checkIn}</p>
                  <p className="text-sm font-medium">{format(parseISO(editingSynced.checkIn), 'd MMM yyyy', { locale: dateFnsLocale })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{tm.checkOut}</p>
                  <p className="text-sm font-medium">{format(addDays(parseISO(editingSynced.checkOut), 1), 'd MMM yyyy', { locale: dateFnsLocale })}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">{tm.guestName}</label>
                  <input className="input" placeholder={tm.guestNamePlaceholder} value={editSyncedForm.guestName}
                    onChange={e => setEditSyncedForm(f => ({ ...f, guestName: e.target.value }))} />
                </div>
                {editSyncedForm.isBlockManual !== true && (
                  <div className="sm:col-span-2">
                    <label className="label">{tm.revenue}</label>
                    <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                      value={editSyncedForm.revenue} onChange={e => setEditSyncedForm(f => ({ ...f, revenue: e.target.value }))} />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="label">{tm.notes}</label>
                  <textarea className="input min-h-[60px] resize-none" placeholder={tm.notesPlaceholder}
                    value={editSyncedForm.notes} onChange={e => setEditSyncedForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              {/* Block / Reservation toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {lang === 'ro' ? 'Tip eveniment' : 'Event type'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === 'ro'
                      ? 'Suprascrie detectarea automată'
                      : 'Override automatic detection'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setEditSyncedForm(f => ({ ...f, isBlockManual: false }))}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      editSyncedForm.isBlockManual === false
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {lang === 'ro' ? 'Rezervare' : 'Reservation'}
                  </button>
                  <button
                    onClick={() => {
                      if (parseFloat(editSyncedForm.revenue) > 0) {
                        setShowSyncedBlockWarn(true);
                      } else {
                        setEditSyncedForm(f => ({ ...f, isBlockManual: true }));
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      editSyncedForm.isBlockManual === true
                        ? 'bg-gray-200 text-gray-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {lang === 'ro' ? 'Blocat' : 'Block'}
                  </button>
                  {editSyncedForm.isBlockManual !== null && (
                    <button
                      onClick={() => setEditSyncedForm(f => ({ ...f, isBlockManual: null }))}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
                      title={lang === 'ro' ? 'Resetează la automat' : 'Reset to automatic'}
                    >
                      ↺
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {lang === 'ro'
                  ? 'Datele și sursa sunt controlate de calendarul sincronizat și nu pot fi modificate.'
                  : 'Dates and source are controlled by the synced calendar and cannot be changed.'}
              </p>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setEditingSynced(null)} className="btn-secondary">{tm.cancel}</button>
              <button onClick={saveSyncedEdit} disabled={savingSyncedEdit}
                className="btn-primary disabled:opacity-50 flex items-center gap-2">
                {savingSyncedEdit ? <><Loader2 size={14} className="animate-spin" /> {tm.saving}</> : tm.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue removal warning modal */}
      {showSyncedBlockWarn && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-base mb-2">
              {lang === 'ro' ? 'Elimini venitul?' : 'Remove revenue?'}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {lang === 'ro'
                ? `Dacă marchezi aceste date ca blocate, venitul de ${formatRON(parseFloat(editSyncedForm.revenue))} va fi eliminat și nu va fi inclus în rapoarte.`
                : `Marking this as blocked will remove the revenue of ${formatRON(parseFloat(editSyncedForm.revenue))} and exclude it from reports.`}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSyncedBlockWarn(false)} className="btn-secondary text-sm">
                {tm.cancel}
              </button>
              <button
                onClick={() => {
                  setEditSyncedForm(f => ({ ...f, isBlockManual: true, revenue: '0' }));
                  setShowSyncedBlockWarn(false);
                }}
                className="btn-primary text-sm"
              >
                {lang === 'ro' ? 'Confirmă' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit manual reservation modal */}
      {editingManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-base">{tm.editEntryTitle}</h3>
              <button onClick={() => setEditingManual(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{tm.guestName}</label>
                  <input className="input" placeholder={tm.guestNamePlaceholder} value={editManualForm.guestName}
                    onChange={e => setEditManualForm(f => ({ ...f, guestName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.source}</label>
                  <input className="input" placeholder={tm.sourcePlaceholder} value={editManualForm.source}
                    onChange={e => setEditManualForm(f => ({ ...f, source: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkIn}</label>
                  <input type="date" className="input" value={editManualForm.checkIn}
                    onChange={e => setEditManualForm(f => ({ ...f, checkIn: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkOut}</label>
                  <input type="date" className="input" value={editManualForm.checkOut}
                    onChange={e => setEditManualForm(f => ({ ...f, checkOut: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.revenue}</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                    value={editManualForm.revenue} onChange={e => setEditManualForm(f => ({ ...f, revenue: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.notes}</label>
                  <textarea className="input min-h-[60px] resize-none" placeholder={tm.notesPlaceholder}
                    value={editManualForm.notes} onChange={e => setEditManualForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-5 border-t border-gray-100">
              <button onClick={deleteManualEdit} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition">
                <Trash2 size={14} /> {tm.deleteEntry}
              </button>
              <div className="flex gap-3">
                <button onClick={() => setEditingManual(null)} className="btn-secondary">{tm.cancel}</button>
                <button onClick={saveManualEdit} disabled={savingManualEdit || !editManualForm.checkIn || !editManualForm.checkOut}
                  className="btn-primary disabled:opacity-50">
                  {savingManualEdit ? tm.saving : tm.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
