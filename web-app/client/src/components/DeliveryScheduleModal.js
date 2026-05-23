import React, { useEffect, useMemo, useState } from 'react';
import {
  updateDeliverySchedule,
  setVacationMode,
  clearVacationMode,
  skipDeliveryDate,
  pauseSubscription,
  resumeSubscription
} from '../services/api';

const dayOptions = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' }
];

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function DeliveryScheduleModal({
  open,
  onClose,
  subscription,
  isDarkMode,
  onUpdated
}) {
  const [busy, setBusy] = useState(false);
  const schedule = subscription?.deliverySchedule || {};

  const [frequency, setFrequency] = useState(schedule.frequency || 'daily');
  const [timeSlot, setTimeSlot] = useState(schedule.timeSlot || '6-7am');
  const [daysOfWeek, setDaysOfWeek] = useState(Array.isArray(schedule.daysOfWeek) ? schedule.daysOfWeek : []);
  const [vacFrom, setVacFrom] = useState(toDateInput(subscription?.vacation?.from));
  const [vacTo, setVacTo] = useState(toDateInput(subscription?.vacation?.to));
  const [skipDate, setSkipDate] = useState('');

  useEffect(() => {
    if (!open) return;
    setFrequency(schedule.frequency || 'daily');
    setTimeSlot(schedule.timeSlot || '6-7am');
    setDaysOfWeek(Array.isArray(schedule.daysOfWeek) ? schedule.daysOfWeek : []);
    setVacFrom(toDateInput(subscription?.vacation?.from));
    setVacTo(toDateInput(subscription?.vacation?.to));
    setSkipDate('');
  }, [open, subscription?._id]);

  const canEdit = Boolean(subscription?._id) && subscription?.type === 'delivery';

  const weeklyEnabled = useMemo(() => frequency === 'weekly', [frequency]);

  if (!open) return null;

  const toggleDay = (key) => {
    setDaysOfWeek((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleSaveSchedule = async () => {
    if (!canEdit) return;
    try {
      setBusy(true);
      const res = await updateDeliverySchedule(subscription._id, {
        frequency,
        timeSlot,
        daysOfWeek: weeklyEnabled ? daysOfWeek : []
      });
      onUpdated?.(res.data.subscription || res.data);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Failed to update schedule');
    } finally {
      setBusy(false);
    }
  };

  const handleSetVacation = async () => {
    if (!canEdit) return;
    if (!vacFrom || !vacTo) {
      alert('Please select both vacation dates');
      return;
    }
    try {
      setBusy(true);
      const res = await setVacationMode(subscription._id, vacFrom, vacTo);
      onUpdated?.(res.data.subscription || res.data);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Failed to set vacation');
    } finally {
      setBusy(false);
    }
  };

  const handleClearVacation = async () => {
    if (!canEdit) return;
    try {
      setBusy(true);
      const res = await clearVacationMode(subscription._id);
      onUpdated?.(res.data.subscription || res.data);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Failed to clear vacation');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    if (!canEdit) return;
    if (!skipDate) {
      alert('Select a date to skip');
      return;
    }
    try {
      setBusy(true);
      const res = await skipDeliveryDate(subscription._id, skipDate);
      onUpdated?.(res.data.subscription || res.data);
      setSkipDate('');
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Failed to skip date');
    } finally {
      setBusy(false);
    }
  };

  const handlePauseResume = async () => {
    if (!subscription?._id) return;
    try {
      setBusy(true);
      const res =
        subscription.status === 'paused'
          ? await resumeSubscription(subscription._id)
          : await pauseSubscription(subscription._id, { pauseReason: 'Paused by user' });
      onUpdated?.(res.data.subscription || res.data);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Delivery Settings
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Time slot, pause/skip, and vacation mode.
              </p>
            </div>
            <button
              type="button"
              onClick={() => !busy && onClose?.()}
              disabled={busy}
              className={`p-2 rounded-xl border ${
                isDarkMode ? 'border-white/10 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              ✕
            </button>
          </div>

          {!canEdit ? (
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              This subscription is not a delivery subscription.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} focus:border-primary-500 focus:outline-none`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} focus:border-primary-500 focus:outline-none`}
                  >
                    <option value="6-7am">6–7am</option>
                    <option value="7-8am">7–8am</option>
                    <option value="8-9am">8–9am</option>
                  </select>
                </div>
              </div>

              {weeklyEnabled && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Days of Week</label>
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map((d) => {
                      const active = daysOfWeek.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => toggleDay(d.key)}
                          className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                            active
                              ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-transparent'
                              : isDarkMode
                                ? 'border-white/10 text-gray-200 hover:bg-gray-800'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handlePauseResume}
                  disabled={busy}
                  className={`px-5 py-3 rounded-xl font-bold border ${
                    isDarkMode ? 'border-white/10 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {subscription.status === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={busy}
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 text-white disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save Schedule'}
                </button>
              </div>

              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Vacation Mode</p>
                  <button
                    type="button"
                    onClick={handleClearVacation}
                    disabled={busy}
                    className={`text-sm font-medium px-3 py-1.5 rounded-xl border ${
                      isDarkMode ? 'border-white/10 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-white'
                    } disabled:opacity-50`}
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={vacFrom}
                    onChange={(e) => setVacFrom(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  />
                  <input
                    type="date"
                    value={vacTo}
                    onChange={(e) => setVacTo(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  />
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={handleSetVacation}
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-50"
                  >
                    Set Vacation
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Skip a Date</p>
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                  <input
                    type="date"
                    value={skipDate}
                    onChange={(e) => setSkipDate(e.target.value)}
                    className={`flex-1 px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  />
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={busy}
                    className="px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white disabled:opacity-50"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

