'use client';

import { useEffect, useState } from 'react';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyGridSkeleton } from '@/components/PropertyCardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const favRes = await fetch('/api/favorites').then(r => r.json());
      const ids: string[] = favRes.favoriteIds || [];
      setFavoriteIds(ids);

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      ids.forEach(id => params.append('ids', id));
      const propRes = await fetch(`/api/properties/by-ids?${params}`).then(r => r.json());
      setProperties(propRes.properties || []);
      setLoading(false);
    })();
  }, []);

  const handleToggle = (id: string, fav: boolean) => {
    if (!fav) {
      setFavoriteIds(prev => prev.filter(x => x !== id));
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Favorite</h1>

      {loading ? (
        <PropertyGridSkeleton count={4} />
      ) : properties.length === 0 ? (
        <EmptyState icon={Heart} message="Nu ai nicio proprietate salvată la favorite." action={{ label: 'Caută cazare', href: '/search' }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              isFavorited={favoriteIds.includes(p.id)}
              onToggleFavorite={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
