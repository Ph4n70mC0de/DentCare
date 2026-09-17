import React, { useState } from 'react';
import { Clock, Plus, Sparkles, BellRing, Info, ChevronRight } from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';
import { WaitlistEntry } from '../../types';
import { JoinWaitlistModal } from './JoinWaitlistModal';

interface MyWaitlistProps {
  onStartBooking: () => void;
  onSelectTab: (tab: string) => void;
  isWaitlistModalOpen: boolean;
  setIsWaitlistModalOpen: (open: boolean) => void;
  onJoinWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'createdAt'>) => void;
}

export const MyWaitlist: React.FC<MyWaitlistProps> = ({
  onStartBooking,
  onSelectTab,
  isWaitlistModalOpen,
  setIsWaitlistModalOpen,
  onJoinWaitlist
}) => {
  const {
    currentPatient,
    dentists,
    services,
    waitlist,
    cancelWaitlistEntry,
    sendNotification,
    activeUser
  } = useDentalStore();

  const [simulatedMatchMsg, setSimulatedMatchMsg] = useState('');

  const myWaitlist = waitlist.filter((w) => w.patientId === currentPatient.id);

  const handleSimulateWaitlistMatch = (entry: WaitlistEntry) => {
    const srv = services.find((s) => s.id === entry.serviceId);
    const dnt = dentists.find((d) => d.id === entry.preferredDentistId) || dentists[0];

    sendNotification({
      userId: activeUser.id,
      patientId: currentPatient.id,
      type: 'waitlist_slot_available',
      title: '🎉 Early Cancellation Opening Found!',
      message: `Great news! An earlier slot opened for ${srv?.name || 'Dental Treatment'} with ${dnt?.fullName || 'Dentist'} on ${entry.preferredDate} at 2:00 PM. Claim your seat now!`,
      channel: 'in_app'
    });

    setSimulatedMatchMsg(`Match simulated! An alert has been dispatched to your notification center for ${srv?.name}.`);
    setTimeout(() => setSimulatedMatchMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              My Cancellation Waitlist
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated seat recovery: When earlier appointment slots open due to cancellations, queued patients are alerted first.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NeoButton
            variant="primary"
            size="md"
            onClick={() => setIsWaitlistModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Join Cancellation Waitlist
          </NeoButton>
        </div>
      </div>

      {/* Feedback messages */}
      {simulatedMatchMsg && (
        <div className="neo-raised p-4 rounded-2xl border-l-4 border-emerald-500 bg-emerald-50/80 text-xs text-emerald-900 flex items-center gap-3">
          <BellRing className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{simulatedMatchMsg}</span>
        </div>
      )}

      {/* Active Waitlists List */}
      <NeoCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-300/40 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            My Queued Waitlist Entries ({myWaitlist.length})
          </h3>
          <span className="text-xs text-slate-500">Priority Dispatch Active</span>
        </div>

        {myWaitlist.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No active waitlist requests</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Want an earlier appointment or a slot on a fully booked day? Join our cancellation waitlist and our engine will notify you the moment a chair becomes available.
            </p>
            <NeoButton
              variant="primary"
              size="sm"
              onClick={() => setIsWaitlistModalOpen(true)}
            >
              Join Waitlist Now
            </NeoButton>
          </div>
        ) : (
          <div className="space-y-3">
            {myWaitlist.map((w) => {
              const srv = services.find((s) => s.id === w.serviceId);
              const dnt = dentists.find((d) => d.id === w.preferredDentistId);

              return (
                <div
                  key={w.id}
                  className="neo-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-base text-slate-800">
                        {srv?.name}
                      </span>
                      <NeoBadge
                        variant={
                          w.status === 'notified'
                            ? 'warning'
                            : w.status === 'booked'
                            ? 'success'
                            : 'info'
                        }
                        size="sm"
                      >
                        {w.status.toUpperCase()}
                      </NeoBadge>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                        Priority: {w.priority}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span>
                        <strong>Target Date:</strong> {w.preferredDate}
                      </span>
                      <span>
                        <strong>Time Window:</strong>{' '}
                        {w.preferredTimeRange === 'morning'
                          ? 'Morning (08:00 - 12:00)'
                          : w.preferredTimeRange === 'afternoon'
                          ? 'Afternoon (13:00 - 17:00)'
                          : 'Any Available Time'}
                      </span>
                      <span>
                        <strong>Dentist:</strong> {dnt?.fullName || 'First Available Dentist'}
                      </span>
                    </div>

                    {w.notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Notes: "{w.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Simulation demo button to test real-time alert */}
                    <button
                      onClick={() => handleSimulateWaitlistMatch(w)}
                      className="neo-btn px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5 cursor-pointer"
                      title="Simulate opening detection"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Simulate Match</span>
                    </button>

                    <button
                      onClick={() => cancelWaitlistEntry(w.id)}
                      className="neo-btn px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      Leave Waitlist
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </NeoCard>

      {/* Educational panel on how waitlist auto-recovery works */}
      <NeoCard className="p-6 space-y-3 bg-[#E8EEF5]">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" /> How Our Priority Waitlist Engine Works
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 pt-1">
          <div className="p-3 rounded-xl neo-inset bg-[#EFF4FA] space-y-1">
            <span className="font-extrabold text-blue-700 block">1. Cancellation Detected</span>
            <p className="text-[11px]">
              When another patient cancels or reschedules, our system identifies the open operatory chair immediately.
            </p>
          </div>

          <div className="p-3 rounded-xl neo-inset bg-[#EFF4FA] space-y-1">
            <span className="font-extrabold text-blue-700 block">2. Smart Priority Match</span>
            <p className="text-[11px]">
              Waitlisted patients matching the procedure duration and time window are automatically prioritized.
            </p>
          </div>

          <div className="p-3 rounded-xl neo-inset bg-[#EFF4FA] space-y-1">
            <span className="font-extrabold text-blue-700 block">3. One-Click Reservation</span>
            <p className="text-[11px]">
              An immediate notification is sent to your notification center so you can claim the earlier slot before it fills.
            </p>
          </div>
        </div>
      </NeoCard>

      <JoinWaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        services={services}
        dentists={dentists}
        currentPatientId={currentPatient.id}
        onJoinWaitlist={onJoinWaitlist}
      />
    </div>
  );
};
