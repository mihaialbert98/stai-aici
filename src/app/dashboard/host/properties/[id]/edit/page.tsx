'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PropertyForm } from '@/components/PropertyForm';

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
      <PropertyForm initialData={property} propertyId={id as string} />
    </div>
  );
}
