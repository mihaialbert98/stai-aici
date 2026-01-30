'use client';

import { PropertyForm } from '@/components/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Adaugă proprietate</h1>
      <PropertyForm />
    </div>
  );
}
