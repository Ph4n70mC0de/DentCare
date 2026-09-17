import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { WaitlistEntry } from '../../types';
import { getTodayDateString } from '../../data/seedData';

interface JoinWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: { id: string; name: string; durationMinutes: number; price: number }[];
  dentists: { id: string; fullName: string; specialization: string }[];
  currentPatientId: string;
  onJoinWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'createdAt'>) => void;
  initialServiceId?: string;
}

export const JoinWaitlistModal: React.FC<JoinWaitlistModalProps> = ({
  isOpen,
  onClose,
  services,
  dentists,
  currentPatientId,
  onJoinWaitlist,
  initialServiceId
}) => {
  const [waitlistServiceId, setWaitlistServiceId] = useState(initialServiceId || services[0]?.id || '');
  const [waitlistDentistId, setWaitlistDentistId] = useState('');
  const [waitlistDate, setWaitlistDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [waitlistTimeRange, setWaitlistTimeRange] = useState<'morning' | 'afternoon' | 'any'>('any');
  const [waitlistSuccessMsg, setWaitlistSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistServiceId) return;
    setSubmitting(true);

    onJoinWaitlist({
      patientId: currentPatientId,
      preferredDentistId: waitlistDentistId || undefined,
      serviceId: waitlistServiceId,
      preferredDate: waitlistDate,
      preferredTimeRange: waitlistTimeRange,
      priority: 'normal',
      notes: `Patient requested waitlist via portal on ${getTodayDateString()}`
    });

    setWaitlistSuccessMsg('Successfully joined the cancellation waitlist! You will be notified instantly when a slot opens.');
    setTimeout(() => {
      setWaitlistSuccessMsg('');
      setSubmitting(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <NeoCard className="p-6 rounded-3xl max-w-md w-full space-y-4">
        <div className="flex items-center justify-between border-b border-slate-300/40 pb-3">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" /> Join Cancellation Waitlist
          </h3>
          <button
            onClick={onClose}
            className="neo-btn p-1.5 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {waitlistSuccessMsg ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
            {waitlistSuccessMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dental Treatment / Procedure</label>
              <select
                value={waitlistServiceId}
                onChange={(e) => setWaitlistServiceId(e.target.value)}
                className="w-full p-2.5 rounded-xl neo-inset bg-transparent text-slate-800 outline-none"
                required
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} mins - ₱{s.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Preferred Dentist (Optional)</label>
              <select
                value={waitlistDentistId}
                onChange={(e) => setWaitlistDentistId(e.target.value)}
                className="w-full p-2.5 rounded-xl neo-inset bg-transparent text-slate-800 outline-none"
              >
                <option value="">Any Available Dentist (Fastest)</option>
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Date</label>
                <input
                  type="date"
                  value={waitlistDate}
                  min={getTodayDateString()}
                  onChange={(e) => setWaitlistDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl neo-inset bg-transparent text-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Range</label>
                <select
                  value={waitlistTimeRange}
                  onChange={(e) => setWaitlistTimeRange(e.target.value as 'morning' | 'afternoon' | 'any')}
                  className="w-full p-2.5 rounded-xl neo-inset bg-transparent text-slate-800 outline-none"
                >
                  <option value="any">Any Time</option>
                  <option value="morning">Morning (8am-12pm)</option>
                  <option value="afternoon">Afternoon (1pm-5pm)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
              <NeoButton type="button" variant="default" size="sm" onClick={onClose}>
                Cancel
              </NeoButton>
              <NeoButton type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? 'Joining...' : 'Submit Waitlist Request'}
              </NeoButton>
            </div>
          </form>
        )}
      </NeoCard>
    </div>
  );
};
