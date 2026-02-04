'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PropertyForm } from '@/components/PropertyForm';
import { PeriodPricingManager } from '@/components/PeriodPricingManager';

export default function EditPropertyPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/properties/${id}`).then(r => r.json()).then(d => setProperty(d.property));
  }, [id]);

  if (!property) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editează proprietate</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PropertyForm initialData={property} propertyId={id as string} />
        </div>
        <div>
          <PeriodPricingManager
            propertyId={id as string}
            initialPricings={property.periodPricings?.map((p: any) => ({
              id: p.id,
              name: p.name,
              startDate: p.startDate,
              endDate: p.endDate,
              pricePerNight: p.pricePerNight,
            })) || []}
            defaultPrice={property.pricePerNight}
          />
        </div>
      </div>
    </div>
  );
}
