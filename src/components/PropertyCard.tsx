import Link from 'next/link';
import styles from './PropertyCard.module.scss';
import { formatRON } from '@/lib/utils';
import { Users, Star } from 'lucide-react';

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
}

export function PropertyCard({ property, searchParams }: Props) {
  const image = property.images[0]?.url || '/placeholder.jpg';

  const params = new URLSearchParams();
  if (searchParams?.checkIn) params.set('checkIn', searchParams.checkIn);
  if (searchParams?.checkOut) params.set('checkOut', searchParams.checkOut);
  if (searchParams?.guests) params.set('guests', searchParams.guests);
  const qs = params.toString();
  const href = `/property/${property.id}${qs ? `?${qs}` : ''}`;

  return (
    <Link href={href}>
      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          <img src={image} alt={property.title} className={styles.image} />
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
