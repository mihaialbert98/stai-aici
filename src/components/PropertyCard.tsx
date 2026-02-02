'use client';

import Link from 'next/link';
import styles from './PropertyCard.module.scss';
import { formatRON } from '@/lib/utils';
import { Users, Star, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  property: {
    id: string;
    title: string;
    city: string;
    pricePerNight: number;
    maxGuests: number;
    images: { url: string }[];
    avgRating?: number | null;
    reviewCount?: number;
  };
  searchParams?: { checkIn?: string; checkOut?: string; guests?: string };
  isFavorited?: boolean;
  onToggleFavorite?: (propertyId: string, favorited: boolean) => void;
}

export function PropertyCard({ property, searchParams, isFavorited, onToggleFavorite }: Props) {
  const image = property.images[0]?.url || '/placeholder.jpg';

  const params = new URLSearchParams();
  if (searchParams?.checkIn) params.set('checkIn', searchParams.checkIn);
  if (searchParams?.checkOut) params.set('checkOut', searchParams.checkOut);
  if (searchParams?.guests) params.set('guests', searchParams.guests);
  const qs = params.toString();
  const href = `/property/${property.id}${qs ? `?${qs}` : ''}`;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: property.id }),
    });
    if (res.status === 401) {
      toast.error('Trebuie să fii autentificat pentru a salva favorite.');
      return;
    }
    const data = await res.json();
    onToggleFavorite?.(property.id, data.favorited);
    toast.success(data.favorited ? 'Adăugat la favorite' : 'Eliminat din favorite');
  };

  return (
    <Link href={href}>
      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          <img src={image} alt={property.title} className={styles.image} />
          {onToggleFavorite && (
            <button
              onClick={handleFavorite}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition shadow-sm z-10"
              aria-label={isFavorited ? 'Elimină din favorite' : 'Adaugă la favorite'}
            >
              <Heart
                size={18}
                className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}
              />
            </button>
          )}
        </div>
        <div className={styles.body}>
          <p className={styles.city}>{property.city}</p>
          <h3 className={styles.title}>{property.title}</h3>
          <div className={styles.details}>
            <Users size={14} />
            <span>{property.maxGuests} oaspeți</span>
            {property.avgRating != null ? (
              <>
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span>{property.avgRating} ({property.reviewCount})</span>
              </>
            ) : (
              <span className="text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">Nou</span>
            )}
          </div>
          <p className={styles.price}>
            {formatRON(property.pricePerNight)} <span className={styles.priceUnit}>/ noapte</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
