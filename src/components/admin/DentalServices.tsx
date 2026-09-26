import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoBadge } from '../common/NeoBadge';
import { DentalService } from '../../types';

interface DentalServicesProps {
  services: DentalService[];
  onAddService: (service: Omit<DentalService, 'id'>) => void;
  onUpdateService: (id: string, updates: Partial<DentalService>) => void;
}

export const DentalServices: React.FC<DentalServicesProps> = ({
  services,
  onAddService,
  onUpdateService
}) => {
  const [isAddingService, setIsAddingService] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<number>(150);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(45);
  const [newServiceCategory, setNewServiceCategory] = useState<string>('General');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    onAddService({
      name: newServiceName.trim(),
      category: newServiceCategory,
      durationMinutes: Number(newServiceDuration),
      price: Number(newServicePrice),
      description: newServiceDesc.trim() || 'Professional dental care treatment.',
      active: true
    });

    setIsAddingService(false);
    setNewServiceName('');
    setNewServiceDesc('');
  };

  return (
    <NeoCard className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-300/40 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Clinic Dental Services & Pricing</h3>
          <p className="text-xs text-slate-500">Manage dental catalog, procedure duration, and fees.</p>
        </div>
        <NeoButton size="sm" variant="primary" onClick={() => setIsAddingService(!isAddingService)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add New Service
        </NeoButton>
      </div>

      {isAddingService && (
        <form onSubmit={handleCreateService} className="p-5 rounded-2xl neo-inset space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Procedure Form</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NeoInput
              label="Service Name *"
              placeholder="e.g. Dental Veneers"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              required
            />
            <NeoInput
              label="Standard Fee (₱) *"
              type="number"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(Number(e.target.value))}
              required
            />
            <NeoInput
              label="Duration (Minutes) *"
              type="number"
              step={15}
              value={newServiceDuration}
              onChange={(e) => setNewServiceDuration(Number(e.target.value))}
              required
            />
          </div>
          <NeoInput
            label="Category (e.g. Preventative, Restorative, Cosmetic)"
            value={newServiceCategory}
            onChange={(e) => setNewServiceCategory(e.target.value)}
          />
          <NeoInput
            label="Clinical Description"
            placeholder="Description of clinical protocol and materials..."
            value={newServiceDesc}
            onChange={(e) => setNewServiceDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <NeoButton type="button" size="sm" variant="default" onClick={() => setIsAddingService(false)}>
              Cancel
            </NeoButton>
            <NeoButton type="submit" size="sm" variant="primary">
              Save Service
            </NeoButton>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc) => (
          <div key={svc.id} className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-bold text-slate-800 text-sm">{svc.name}</h5>
                <NeoBadge variant={svc.active ? 'success' : 'neutral'} size="sm">
                  {svc.active ? 'Active' : 'Disabled'}
                </NeoBadge>
              </div>
              <span className="text-[11px] font-semibold text-blue-700">{svc.category}</span>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{svc.description}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-extrabold text-slate-800">₱{svc.price}</span>
              <span className="text-[10px] text-slate-400 block">{svc.durationMinutes} mins</span>
              <button
                onClick={() => onUpdateService(svc.id, { active: !svc.active })}
                className="text-[11px] text-blue-600 hover:underline mt-2 block font-semibold cursor-pointer"
              >
                {svc.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </NeoCard>
  );
};
