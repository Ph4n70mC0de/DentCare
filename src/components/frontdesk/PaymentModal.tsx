import React, { useState } from 'react';
import { CreditCard, CheckCircle2, Receipt, ShieldCheck, Printer, CalendarPlus, Download } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { useDentalStore } from '../../services/useDentalStore';
import { Appointment, Payment, PaymentMethod } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: (payment: Payment) => void;
  onScheduleFollowUp?: (appointment: Appointment) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
  onScheduleFollowUp
}) => {
  const { patients, dentists, services, processPayment, consultations, settings } = useDentalStore();

  if (!appointment) return null;

  const patient = patients.find((p) => p.id === appointment.patientId);
  const dentist = dentists.find((d) => d.id === appointment.dentistId);
  const service = services.find((s) => s.id === appointment.serviceId);
  const consultation = consultations.find((c) => c.appointmentId === appointment.id);

  // Billing State
  const basePrice = service ? service.price : 120;
  const [subtotal, setSubtotal] = useState<number>(basePrice);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [insuranceCoveragePercent, setInsuranceCoveragePercent] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [insuranceProvider, setInsuranceProvider] = useState<string>('Delta Dental PPO');
  const [claimNumber, setClaimNumber] = useState<string>(
    patient?.identificationReference ? `CLM-${patient.identificationReference}` : 'CLM-98234-DD'
  );

  const [paymentResult, setPaymentResult] = useState<Payment | null>(null);

  // Calculations
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const insuranceAmount = Number(((afterDiscount * insuranceCoveragePercent) / 100).toFixed(2));
  const patientBalance = Number((afterDiscount - insuranceAmount).toFixed(2));

  const handlePay = () => {
    const record = processPayment({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      subtotal,
      discount: discountAmount,
      insuranceCoverage: insuranceAmount,
      insuranceProvider: insuranceAmount > 0 ? insuranceProvider : undefined,
      insurancePolicyNumber: insuranceAmount > 0 ? claimNumber : undefined,
      amountPaid: patientBalance,
      balance: 0,
      paymentMethod,
      paymentStatus: 'Paid',
      notes: `Settled at front desk reception for ${service?.name}`
    });

    setPaymentResult(record);
    if (onSuccess) onSuccess(record);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleClose = () => {
    setPaymentResult(null);
    onClose();
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <CreditCard className="w-5 h-5" />
          <span>Billing & Payment Settlement</span>
        </div>
      }
      subtitle={`Patient: ${patient?.fullName} • Appointment: #${appointment.appointmentNumber}`}
      maxWidth="lg"
    >
      {paymentResult ? (
        <div className="space-y-5 py-2">
          {/* Success Banner */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl neo-raised mx-auto flex items-center justify-center text-emerald-600 bg-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-800">Payment Successfully Processed</h4>
            <p className="text-xs text-slate-500">
              Official Receipt <strong>#{paymentResult.receiptNumber}</strong> generated and recorded in audit log.
            </p>
          </div>

          {/* Receipt Summary Card */}
          <div className="p-5 rounded-2xl neo-raised bg-[#E8EEF5] space-y-3 text-xs border border-slate-300/40">
            <div className="flex items-center justify-between border-b border-slate-300/40 pb-2">
              <div>
                <span className="font-extrabold text-sm text-slate-800">{settings.clinicName}</span>
                <p className="text-[10px] text-slate-500">{settings.clinicAddress}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700 block">{paymentResult.receiptNumber}</span>
                <span className="text-[10px] text-slate-400">{new Date(paymentResult.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1.5 py-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Procedure: {service?.name}</span>
                <span className="font-semibold text-slate-800">₱{paymentResult.subtotal.toFixed(2)}</span>
              </div>
              {paymentResult.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Courtesy Discount / Voucher</span>
                  <span>-₱{paymentResult.discount.toFixed(2)}</span>
                </div>
              )}
              {paymentResult.insuranceCoverage > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Insurance PPO Benefit Claim</span>
                  <span>-₱{paymentResult.insuranceCoverage.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-slate-300/40 text-slate-900">
                <span>Amount Paid by Patient</span>
                <span className="text-blue-700">₱{paymentResult.amountPaid.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>Payment Method: <strong>{paymentResult.paymentMethod}</strong></span>
              <span>Status: <strong className="text-emerald-700 uppercase">Paid In Full</strong></span>
            </div>
          </div>

          {/* Follow-up banner if dentist recommended follow-up */}
          {consultation?.followUpRecommendation?.required && onScheduleFollowUp && (
            <div className="p-4 rounded-2xl neo-raised bg-blue-50/60 border-l-4 border-blue-600 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                  <CalendarPlus className="w-4 h-4 text-blue-600" />
                  <span>Dentist Recommended Follow-Up Appointment</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Interval: <strong>{consultation.followUpRecommendation.timeframeWeeks} weeks</strong> ({consultation.followUpRecommendation.notes || 'Routine checkup'})
                </p>
              </div>
              <NeoButton
                size="sm"
                variant="primary"
                onClick={() => onScheduleFollowUp(appointment)}
              >
                Schedule Follow-Up Now
              </NeoButton>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <NeoButton variant="default" size="sm" onClick={handlePrintReceipt}>
              <Printer className="w-4 h-4 mr-1.5" /> Print Receipt
            </NeoButton>
            <NeoButton variant="primary" onClick={handleClose}>
              Complete & Close
            </NeoButton>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl neo-inset space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Service Rendered:</span>
              <span className="font-bold text-slate-800">{service?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Attending Dentist:</span>
              <span className="font-bold text-slate-800">{dentist?.fullName}</span>
            </div>
            {patient?.identificationReference && (
              <div className="flex justify-between text-emerald-700">
                <span className="font-semibold">Registered ID / Policy:</span>
                <span className="font-bold">{patient.identificationReference}</span>
              </div>
            )}
          </div>

          {/* Pricing Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NeoInput
              label="Standard Fee (₱)"
              type="number"
              value={subtotal}
              onChange={(e) => setSubtotal(Number(e.target.value))}
            />
            <NeoInput
              label="Discount / Promo (₱)"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
            />
            <NeoInput
              label="Insurance Coverage (%)"
              type="number"
              value={insuranceCoveragePercent}
              onChange={(e) => setInsuranceCoveragePercent(Number(e.target.value))}
            />
          </div>

          {insuranceCoveragePercent > 0 && (
            <div className="p-4 rounded-2xl neo-raised bg-blue-50/50 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Insurance Direct Claim Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NeoInput
                  label="PPO Insurer"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                />
                <NeoInput
                  label="Claim Pre-Auth Ref"
                  value={claimNumber}
                  onChange={(e) => setClaimNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl neo-inset space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold">₱{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Discount Applied:</span>
                <span className="font-bold">-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-blue-600">
              <span>Insurance Covers ({insuranceCoveragePercent}%):</span>
              <span className="font-bold">-₱{insuranceAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-300/40">
              <span>Net Patient Co-Pay Due:</span>
              <span className="text-blue-700">₱{patientBalance.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <NeoSelect
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="Credit Card">Credit Card (Chip / Tap)</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash Currency</option>
              <option value="Insurance">Direct Insurance Settlement</option>
              <option value="Online Banking">Online Portal / Transfer</option>
            </NeoSelect>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={handleClose}>
              Cancel
            </NeoButton>
            <NeoButton variant="primary" onClick={handlePay}>
              Accept ₱{patientBalance.toFixed(2)} & Issue Receipt
            </NeoButton>
          </div>
        </div>
      )}
    </NeoModal>
  );
};
