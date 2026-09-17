import React, { useState } from 'react';
import { Clock, CalendarX, Plus } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { NeoBadge } from '../common/NeoBadge';
import { Dentist, DentistSchedule, BlockedSchedule } from '../../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DentistSchedulesProps {
  schedules: DentistSchedule[];
  blockedSchedules: BlockedSchedule[];
  dentists: Dentist[];
  onAddBlockedSchedule: (blocked: Omit<BlockedSchedule, 'id'>) => void;
  onRemoveBlockedSchedule: (id: string) => void;
}

export const DentistSchedules: React.FC<DentistSchedulesProps> = ({
  schedules,
  blockedSchedules,
  dentists,
  onAddBlockedSchedule,
  onRemoveBlockedSchedule
}) => {
  const [showBlockedForm, setShowBlockedForm] = useState(false);
  const [blockedDate, setBlockedDate] = useState('');
  const [blockedReason, setBlockedReason] = useState('');
  const [blockedAllDay, setBlockedAllDay] = useState(true);
  const [blockedStart, setBlockedStart] = useState('09:00');
  const [blockedEnd, setBlockedEnd] = useState('17:00');
  const [selectedDentistId, setSelectedDentistId] = useState('');
  const [blockedDentistOnly, setBlockedDentistOnly] = useState(false);

  const handleAddBlocked = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedDate || !blockedReason.trim()) return;

    onAddBlockedSchedule({
      dentistId: blockedDentistOnly ? selectedDentistId : undefined,
      date: blockedDate,
      startTime: blockedAllDay ? undefined : blockedStart,
      endTime: blockedAllDay ? undefined : blockedEnd,
      reason: blockedReason.trim(),
      isAllDay: blockedAllDay
    });

    setShowBlockedForm(false);
    setBlockedDate('');
    setBlockedReason('');
    setBlockedAllDay(true);
  };

  const handleRemoveBlocked = (id: string) => {
    onRemoveBlockedSchedule(id);
  };

  const getDentistName = (dentistId?: string) => {
    if (!dentistId) return 'Whole Clinic';
    const d = dentists.find((x) => x.id === dentistId);
    return d?.fullName || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <NeoCard className="space-y-4">
        <div className="border-b border-slate-300/40 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Dentist Weekly Schedules</h3>
            <p className="text-xs text-slate-500">Active operating hours per practitioner. Use this to verify coverage before accepting bookings.</p>
          </div>
          <NeoButton size="sm" variant="primary" onClick={() => setShowBlockedForm(!showBlockedForm)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Block Date / Time
          </NeoButton>
        </div>

        {showBlockedForm && (
          <form onSubmit={handleAddBlocked} className="p-5 rounded-2xl neo-inset space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Block Schedule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NeoInput
                label="Date (YYYY-MM-DD)"
                type="date"
                value={blockedDate}
                onChange={(e) => setBlockedDate(e.target.value)}
                required
              />
              <NeoInput
                label="Reason"
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="blockedDentistOnly"
                checked={blockedDentistOnly}
                onChange={(e) => setBlockedDentistOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="blockedDentistOnly" className="text-xs text-slate-700">Apply to specific dentist only</label>
            </div>
            {blockedDentistOnly && (
              <NeoSelect
                label="Dentist"
                value={selectedDentistId}
                onChange={(e) => setSelectedDentistId(e.target.value)}
              >
                <option value="">Select dentist...</option>
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>{d.fullName}</option>
                ))}
              </NeoSelect>
            )}
            {!blockedAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <NeoInput
                  label="Start Time"
                  type="time"
                  value={blockedStart}
                  onChange={(e) => setBlockedStart(e.target.value)}
                />
                <NeoInput
                  label="End Time"
                  type="time"
                  value={blockedEnd}
                  onChange={(e) => setBlockedEnd(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <NeoButton type="button" size="sm" variant="default" onClick={() => setShowBlockedForm(false)}>
                Cancel
              </NeoButton>
              <NeoButton type="submit" size="sm" variant="primary">
                Save Block
              </NeoButton>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dentists.map((d) => {
            const dentistSchedules = schedules.filter((s) => s.dentistId === d.id);
            return (
              <div key={d.id} className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{d.fullName}</h5>
                    <span className="text-[11px] text-slate-500">{d.specialization}</span>
                  </div>
                  <NeoBadge variant="info" size="sm">{dentistSchedules.length} active days</NeoBadge>
                </div>
                <div className="space-y-2">
                  {dentistSchedules.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-xl neo-inset">
                      <span className="font-semibold text-slate-700">{DAYS[s.dayOfWeek]}</span>
                      <span className="text-slate-600">{s.startTime} - {s.endTime}</span>
                      <span className="text-[10px] text-slate-400">Break: {s.breakStart}-{s.breakEnd}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </NeoCard>

      <NeoCard className="space-y-4">
        <div className="border-b border-slate-300/40 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Blocked Dates & Exceptions</h3>
            <p className="text-xs text-slate-500">Clinic-wide and per-dentist blocked times.</p>
          </div>
          <NeoBadge variant="warning">{blockedSchedules.length} blocks</NeoBadge>
        </div>

        <div className="space-y-3">
          {blockedSchedules.length === 0 ? (
            <div className="p-6 neo-inset rounded-2xl text-center text-xs text-slate-400">
              No blocked dates configured.
            </div>
          ) : (
            blockedSchedules.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CalendarX className="w-5 h-5 text-rose-600" />
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{b.date}</span>
                    {!b.isAllDay && (
                      <span className="text-xs text-slate-600 ml-2">{b.startTime} - {b.endTime}</span>
                    )}
                    <p className="text-xs text-slate-600">{b.reason}</p>
                    <span className="text-[10px] text-slate-400">{getDentistName(b.dentistId)}</span>
                  </div>
                </div>
                <NeoButton size="sm" variant="default" onClick={() => handleRemoveBlocked(b.id)}>
                  Remove
                </NeoButton>
              </div>
            ))
          )}
        </div>
      </NeoCard>
    </div>
  );
};
