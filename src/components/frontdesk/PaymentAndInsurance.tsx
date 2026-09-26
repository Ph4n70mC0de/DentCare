import React, { useState } from 'react';
import {
  CreditCard,
  PhilippinePeso,
  ShieldCheck,
  FileSpreadsheet,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Calendar,
  Building,
  ArrowUpRight,
  Filter,
  Check,
  FileText,
  User,
  Sparkles,
  Download
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';
import { NeoModal } from '../common/NeoModal';
import { Appointment, Payment, PaymentMethod } from '../../types';
import { getTodayDateString } from '../../data/seedData';
import { PaymentModal } from './PaymentModal';

interface PaymentAndInsuranceProps {
  onNavigateToDayFlow?: () => void;
}

export const PaymentAndInsurance: React.FC<PaymentAndInsuranceProps> = ({
  onNavigateToDayFlow
}) => {
  const {
    appointments,
    patients,
    dentists,
    services,
    payments,
    processPayment,
    consultations,
    settings
  } = useDentalStore();

  const today = getTodayDateString();
  const [activeTab, setActiveTab] = useState<'pending' | 'settled' | 'insurance' | 'cashier'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Active payment checkout modal
  const [activeCheckoutApt, setActiveCheckoutApt] = useState<Appointment | null>(null);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Insurance Claim edit/verification state
  const [claimStatusOverrides, setClaimStatusOverrides] = useState<Record<string, string>>({});

  // Cashier Drawer Balance state
  const [drawerStartFloat, setDrawerStartFloat] = useState<number>(200);
  const [countedCash, setCountedCash] = useState<string>('');
  const [shiftReconciled, setShiftReconciled] = useState<boolean>(false);

  // Pending checkout appointments (status === 'Payment-Pending')
  const pendingCheckouts = appointments.filter((a) => a.status === 'Payment-Pending');

  // Filtered payments list
  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
    if (dateFilter === 'today' && !p.createdAt.startsWith(today)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const patient = patients.find((pat) => pat.id === p.patientId);
      return (
        p.receiptNumber.toLowerCase().includes(q) ||
        patient?.fullName.toLowerCase().includes(q) ||
        patient?.patientNumber.toLowerCase().includes(q) ||
        p.insuranceProvider?.toLowerCase().includes(q) ||
        p.insurancePolicyNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Financial KPI calculations
  const todayPayments = payments.filter((p) => p.createdAt.startsWith(today));
  const totalCollectedToday = todayPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalInsuranceToday = todayPayments.reduce((acc, curr) => acc + curr.insuranceCoverage, 0);
  const totalAllTimeRevenue = payments.reduce((acc, curr) => acc + curr.amountPaid, 0);

  // Estimated pending balance
  const estimatedPendingRevenue = pendingCheckouts.reduce((acc, apt) => {
    const srv = services.find((s) => s.id === apt.serviceId);
    return acc + (srv ? srv.price : 100);
  }, 0);

  const cashCollectedToday = todayPayments
    .filter((p) => p.paymentMethod === 'Cash')
    .reduce((acc, curr) => acc + curr.amountPaid, 0);

  const cardCollectedToday = todayPayments
    .filter((p) => p.paymentMethod === 'Credit Card' || p.paymentMethod === 'Debit Card')
    .reduce((acc, curr) => acc + curr.amountPaid, 0);

  // Export Payments CSV
  const exportPaymentsCSV = () => {
    const headers = [
      'Receipt #',
      'Date & Time',
      'Patient Name',
      'Patient ID',
      'Service/Treatment',
      'Subtotal (₱)',
      'Discount (₱)',
      'Insurance Paid (₱)',
      'Insurance Provider',
      'Patient Paid (₱)',
      'Payment Method',
      'Status'
    ];

    const rows = filteredPayments.map((p) => {
      const pat = patients.find((pt) => pt.id === p.patientId);
      const apt = appointments.find((a) => a.id === p.appointmentId);
      const srv = services.find((s) => s.id === apt?.serviceId);

      return [
        p.receiptNumber,
        new Date(p.createdAt).toLocaleString(),
        pat?.fullName || '',
        pat?.patientNumber || '',
        srv?.name || 'General Dental Treatment',
        p.subtotal.toFixed(2),
        p.discount.toFixed(2),
        p.insuranceCoverage.toFixed(2),
        p.insuranceProvider || 'N/A',
        p.amountPaid.toFixed(2),
        p.paymentMethod,
        p.paymentStatus
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DentCare-Payments-Ledger-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Payment & Insurance Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Cashier & Billing Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Cashier checkout desk, insurance claims adjudication, itemized receipts, and daily drawer balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCheckouts.length > 0 && (
            <span className="animate-bounce inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <Clock className="w-3.5 h-3.5" />
              {pendingCheckouts.length} awaiting payment
            </span>
          )}

          <NeoButton
            size="sm"
            variant="default"
            onClick={exportPaymentsCSV}
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Export Ledger (.CSV)
          </NeoButton>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="neo-raised p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Today's Patient Receipts</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-700">₱{totalCollectedToday.toFixed(2)}</span>
            <PhilippinePeso className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">{todayPayments.length} transactions processed</span>
        </div>

        <div className="neo-raised p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-blue-600">Insurance Claims Filed</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-700">₱{totalInsuranceToday.toFixed(2)}</span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Direct billing to carriers</span>
        </div>

        <div className="neo-raised p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-600">Pending At Checkout</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-700">₱{estimatedPendingRevenue.toFixed(2)}</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">{pendingCheckouts.length} patients in checkout queue</span>
        </div>

        <div className="neo-raised p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">Cumulative Revenue</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-800">₱{totalAllTimeRevenue.toFixed(2)}</span>
            <CreditCard className="w-5 h-5 text-slate-500" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">{payments.length} all-time settled invoices</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="neo-flat p-1 rounded-2xl flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pending' ? 'bg-white shadow-xs text-amber-800' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Checkout Queue</span>
          {pendingCheckouts.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {pendingCheckouts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settled')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'settled' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Settled Payments Ledger ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('insurance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'insurance' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Insurance Claims Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('cashier')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cashier' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Daily Cash Drawer Balance</span>
        </button>
      </div>

      {/* TAB 1: PENDING CHECKOUT INVOICES */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Awaiting Counter Settlement & Co-Pay Collection
            </h2>
            <span className="text-xs text-slate-500">
              Patients whose dentist examination is finished and are ready to settle payment.
            </span>
          </div>

          {pendingCheckouts.length === 0 ? (
            <NeoCard className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">All Patient Invoices are Settled!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no patients currently queued for checkout. When dentists complete an operatory examination,
                the appointment transitions here for receipt generation and payment collection.
              </p>
              {onNavigateToDayFlow && (
                <NeoButton
                  size="sm"
                  variant="default"
                  onClick={onNavigateToDayFlow}
                >
                  View Day Flow
                </NeoButton>
              )}
            </NeoCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingCheckouts.map((apt) => {
                const pat = patients.find((p) => p.id === apt.patientId);
                const dent = dentists.find((d) => d.id === apt.dentistId);
                const srv = services.find((s) => s.id === apt.serviceId);
                const consultation = consultations.find((c) => c.appointmentId === apt.id);
                const baseFee = srv?.price || 120;

                return (
                  <div
                    key={apt.id}
                    className="neo-raised p-4 rounded-3xl bg-white border border-amber-200/80 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            {apt.appointmentNumber}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-1">{pat?.fullName}</h3>
                          <p className="text-[11px] text-slate-500 font-mono">{pat?.patientNumber} • {pat?.phone}</p>
                        </div>
                        <span className="text-xs font-black text-amber-800 px-2.5 py-1 rounded-xl bg-amber-100 animate-pulse">
                          Pending Pay
                        </span>
                      </div>

                      <div className="mt-3 bg-slate-50 p-3 rounded-2xl space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Doctor:</span>
                          <span className="font-semibold text-slate-800">{dent?.fullName}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Primary Service:</span>
                          <span className="font-semibold text-slate-800">{srv?.name}</span>
                        </div>
                        {consultation?.proceduresPerformed && consultation.proceduresPerformed.length > 0 && (
                          <div className="pt-1 border-t border-slate-200/70 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-700">Procedures: </span>
                            {consultation.proceduresPerformed.join(', ')}
                          </div>
                        )}
                        <div className="pt-1 border-t border-slate-200/70 flex justify-between font-bold text-slate-800">
                          <span>Total Service Fee:</span>
                          <span className="text-blue-700 font-mono text-sm">₱{baseFee.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Insurance breakdown preview */}
                      <div className="mt-2.5 p-2 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-[11px]">
                        <span className="text-blue-800 font-medium">Policy: {pat?.identificationReference || 'Delta Dental PPO'}</span>
                        <span className="text-blue-600 font-semibold">Eligible for co-pay</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setActiveCheckoutApt(apt)}
                        className="neo-btn-primary flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Process Checkout & Pay</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SETTLED PAYMENTS LEDGER */}
      {activeTab === 'settled' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="neo-raised p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search receipt #, patient, insurance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full neo-flat pl-9 pr-3 py-1.5 text-xs rounded-xl focus:outline-blue-500 text-slate-800"
                />
              </div>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="neo-flat text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="Cash">Cash Only</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Insurance">Insurance Direct</option>
                <option value="Online Banking">Online Banking</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="neo-flat text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredPayments.length}</span> transactions
            </div>
          </div>

          {/* Payments Table */}
          <NeoCard className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/80 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Insurance</th>
                  <th className="py-3 px-4 text-right">Patient Paid</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No payment transactions matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const pat = patients.find((pt) => pt.id === p.patientId);
                    const apt = appointments.find((a) => a.id === p.appointmentId);
                    const srv = services.find((s) => s.id === apt?.serviceId);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          <span className="text-[10px] text-slate-400">
                            {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{pat?.fullName || 'Walk-in Patient'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{pat?.patientNumber}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {srv?.name || 'Dental Treatment'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          ₱{p.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-600 font-semibold">
                          {p.insuranceCoverage > 0 ? `-₱${p.insuranceCoverage.toFixed(2)}` : '₱0.00'}
                          {p.insuranceProvider && (
                            <span className="block text-[9px] text-slate-400">{p.insuranceProvider}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                          ₱{p.amountPaid.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="View / Print Tax Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </NeoCard>
        </div>
      )}

      {/* TAB 3: INSURANCE CLAIMS TRACKER */}
      {activeTab === 'insurance' && (
        <div className="space-y-4">
          <div className="neo-raised p-4 rounded-3xl bg-blue-50/40 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-blue-900">Dental Insurance Claims & Electronic Adjudication</h2>
              <p className="text-xs text-blue-700 mt-0.5">
                Real-time status of claims filed with major dental carriers, patient policy references, and reimbursement tracking.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-blue-800">
                Standard Co-Pay Ratio: <span className="underline">50% - 80%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Major Carriers Summary */}
            <NeoCard className="p-4 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Connected Insurance Payers</h3>
              <div className="space-y-2">
                {[
                  { name: 'Delta Dental PPO', activeClaims: 8, avgTurnaround: '24 hours', status: 'Online EDI' },
                  { name: 'MetLife Dental', activeClaims: 5, avgTurnaround: '48 hours', status: 'Online EDI' },
                  { name: 'Cigna Dental Health', activeClaims: 4, avgTurnaround: 'Instant Pre-Auth', status: 'Online EDI' },
                  { name: 'Guardian Direct', activeClaims: 2, avgTurnaround: '3 days', status: 'Paper / EDI' },
                  { name: 'PhilHealth Dental Care', activeClaims: 6, avgTurnaround: 'Weekly Batch', status: 'Gov Portal' }
                ].map((carrier) => (
                  <div key={carrier.name} className="p-2.5 rounded-xl neo-flat flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{carrier.name}</p>
                      <p className="text-[10px] text-slate-400">{carrier.avgTurnaround} • {carrier.status}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                      {carrier.activeClaims} claims
                    </span>
                  </div>
                ))}
              </div>
            </NeoCard>

            {/* Claims Table */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Recent Insurance Claims Generated</h3>
              <div className="space-y-2.5">
                {payments
                  .filter((p) => p.insuranceCoverage > 0)
                  .map((p) => {
                    const pat = patients.find((pt) => pt.id === p.patientId);
                    const currentStatus = claimStatusOverrides[p.id] || 'Approved';

                    return (
                      <div
                        key={p.id}
                        className="neo-raised p-3.5 rounded-2xl bg-white border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{pat?.fullName}</span>
                            <span className="font-mono text-[10px] text-slate-400">({pat?.patientNumber})</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {p.insuranceProvider || 'Delta Dental'}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            Policy #{p.insurancePolicyNumber || pat?.identificationReference || 'DD-8812903'} •
                            Receipt: <span className="font-mono">{p.receiptNumber}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Claim Amount</span>
                            <span className="text-sm font-black font-mono text-blue-700">
                              ₱{p.insuranceCoverage.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                              currentStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {currentStatus}
                            </span>
                            <button
                              onClick={() => {
                                const next = currentStatus === 'Approved' ? 'Under Review' : 'Approved';
                                setClaimStatusOverrides({ ...claimStatusOverrides, [p.id]: next });
                              }}
                              className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              Toggle
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DAILY CASHIER SHIFT DRAWER BALANCE */}
      {activeTab === 'cashier' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <NeoCard className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-800">Cash Register & Drawer Reconciliation</h2>
                <p className="text-xs text-slate-500">End-of-shift cash verification and drawer balancing</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                Shift Date: {today}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="neo-flat p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Opening Cash Float</span>
                <span className="text-lg font-black text-slate-700 font-mono">₱{drawerStartFloat.toFixed(2)}</span>
              </div>

              <div className="neo-flat p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cash Payments Collected Today</span>
                <span className="text-lg font-black text-emerald-700 font-mono">₱{cashCollectedToday.toFixed(2)}</span>
              </div>

              <div className="neo-flat p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Credit/Debit Card Receipts</span>
                <span className="text-lg font-black text-blue-700 font-mono">₱{cardCollectedToday.toFixed(2)}</span>
              </div>

              <div className="neo-flat p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected Physical Cash in Drawer</span>
                <span className="text-lg font-black text-indigo-700 font-mono">
                  ₱{(drawerStartFloat + cashCollectedToday).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700">
                Physical Cash Counted in Till (₱)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter physical cash count"
                  value={countedCash}
                  onChange={(e) => {
                    setCountedCash(e.target.value);
                    setShiftReconciled(false);
                  }}
                  className="neo-flat px-4 py-2 text-sm font-bold text-slate-800 rounded-xl flex-1 focus:outline-blue-500"
                />
                <NeoButton
                  variant="primary"
                  onClick={() => setShiftReconciled(true)}
                  disabled={!countedCash}
                >
                  Verify Balance
                </NeoButton>
              </div>
            </div>

            {shiftReconciled && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                {(() => {
                  const expected = drawerStartFloat + cashCollectedToday;
                  const counted = parseFloat(countedCash) || 0;
                  const diff = counted - expected;
                  const isBalanced = Math.abs(diff) < 0.01;

                  return (
                    <div>
                      <div className="flex items-center gap-2 font-bold">
                        {isBalanced ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                             <span className="text-emerald-800 text-sm">Drawer Perfectly Balanced! (₱0.00 discrepancy)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <span className="text-rose-800 text-sm">
                              Discrepancy Detected: {diff > 0 ? `+₱${diff.toFixed(2)} Over` : `-₱${Math.abs(diff).toFixed(2)} Short`}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-slate-500 mt-1">
                        Receptionist on duty verified drawer count at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </NeoCard>
        </div>
      )}

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={Boolean(activeCheckoutApt)}
        onClose={() => setActiveCheckoutApt(null)}
        appointment={activeCheckoutApt}
        onSuccess={() => {
          setActiveCheckoutApt(null);
        }}
      />

      {/* Itemized Receipt Modal */}
      {selectedReceipt && (
        <NeoModal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Itemized Tax Receipt & Clinical Statement"
          size="md"
        >
          {(() => {
            const pat = patients.find((p) => p.id === selectedReceipt.patientId);
            const apt = appointments.find((a) => a.id === selectedReceipt.appointmentId);
            const dent = dentists.find((d) => d.id === apt?.dentistId);
            const srv = services.find((s) => s.id === apt?.serviceId);

            return (
              <div className="space-y-4 text-slate-800 print:p-0">
                {/* Clinic Header */}
                <div className="text-center pb-4 border-b border-slate-200">
                  <h2 className="text-xl font-black text-blue-900 tracking-tight">DentCare Dental Clinic</h2>
                  <p className="text-xs text-slate-500">100 Healthcare Boulevard, Suite 400 • (555) 345-6789</p>
                  <p className="text-[10px] text-slate-400 font-mono">Tax ID: 94-8839210-DENT</p>
                </div>

                {/* Receipt Details Header */}
                <div className="grid grid-cols-2 text-xs gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Billed To:</span>
                    <p className="font-bold text-slate-900">{pat?.fullName}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{pat?.patientNumber}</p>
                    <p className="text-slate-500">{pat?.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Receipt Info:</span>
                    <p className="font-mono font-bold text-blue-700">{selectedReceipt.receiptNumber}</p>
                    <p className="text-slate-500">{new Date(selectedReceipt.createdAt).toLocaleDateString()}</p>
                    <p className="text-slate-500">Attending: {dent?.fullName}</p>
                  </div>
                </div>

                {/* Itemized Line Items */}
                <div className="pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                        <th className="py-1">Description</th>
                        <th className="py-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2">
                          <p className="font-bold text-slate-800">{srv?.name || 'Dental Procedure'}</p>
                          <p className="text-[10px] text-slate-400">ADA Dental Procedure Code: D-1110</p>
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-slate-800">
                          ₱{selectedReceipt.subtotal.toFixed(2)}
                        </td>
                      </tr>
                      {selectedReceipt.discount > 0 && (
                        <tr>
                          <td className="py-1.5 text-slate-600">Discounts / Clinic Courtesy</td>
                          <td className="py-1.5 text-right font-mono text-rose-600">
                            -₱{selectedReceipt.discount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {selectedReceipt.insuranceCoverage > 0 && (
                        <tr>
                          <td className="py-1.5 text-blue-700 font-medium">
                            Insurance Co-Pay: {selectedReceipt.insuranceProvider || 'Carrier Direct'}
                          </td>
                          <td className="py-1.5 text-right font-mono text-blue-600 font-semibold">
                            -₱{selectedReceipt.insuranceCoverage.toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total Balance */}
                <div className="pt-3 border-t-2 border-slate-300 flex justify-between items-center text-sm font-black">
                  <span>Total Patient Settle:</span>
                  <span className="text-emerald-700 font-mono text-base">
                    ₱{selectedReceipt.amountPaid.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl text-slate-600">
                  <span>Paid via: <strong className="text-slate-800">{selectedReceipt.paymentMethod}</strong></span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    PAID & SETTLED
                  </span>
                </div>

                {/* Print action */}
                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <NeoButton
                    variant="default"
                    onClick={() => setSelectedReceipt(null)}
                  >
                    Close
                  </NeoButton>
                  <NeoButton
                    variant="primary"
                    onClick={() => window.print()}
                    icon={<Printer className="w-4 h-4" />}
                  >
                    Print Official Receipt
                  </NeoButton>
                </div>
              </div>
            );
          })()}
        </NeoModal>
      )}
    </div>
  );
};
