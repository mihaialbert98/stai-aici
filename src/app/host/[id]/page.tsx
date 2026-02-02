'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Star, Home, Calendar, MapPin } from 'lucide-react';
import { formatRON } from '@/lib/utils';

interface HostData {
  id: string;
  name: string;
  memberSince: string;
  totalProperties: number;
  totalReviews: number;
}

interface PropertyData {
  id: string;
  title: string;
  city: string;
  pricePerNight: number;
  maxGuests: number;
  image: string | null;
  avgRating: number | null;
  reviewCount: number;
}

export default function HostProfilePage() {
  const { id } = useParams();
  const [host, setHost] = useState<HostData | null>(null);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/hosts/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setHost(data.host);
          setProperties(data.properties);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Eroare la încărcare');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-gray-500 text-center py-20">Se încarcă...</p>;
  if (error || !host) return <p className="text-red-500 text-center py-20">{error || 'Gazda nu a fost găsită'}</p>;

  const initials = host.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Host header */}
      <div className="card mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary-600">{initials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{host.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Calendar size={13} />
              Membru din {format(new Date(host.memberSince), 'MMMM yyyy', { locale: ro })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{host.totalProperties}</p>
            <p className="text-xs text-gray-500">{host.totalProperties === 1 ? 'Proprietate' : 'Proprietăți'}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{host.totalReviews}</p>
            <p className="text-xs text-gray-500">{host.totalReviews === 1 ? 'Recenzie' : 'Recenzii'}</p>
          </div>
        </div>
      </div>

      {/* Properties */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Home size={18} /> Proprietățile gazdei
      </h2>

      {properties.length === 0 ? (
        <p className="text-gray-500 text-sm">Această gazdă nu are proprietăți active.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <Link key={p.id} href={`/property/${p.id}`} className="card hover:shadow-lg transition-shadow overflow-hidden group">
              <div className="aspect-[4/3] bg-gray-200 -mx-6 -mt-6 mb-4 overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Home size={32} />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-sm truncate">{p.title}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin size={11} /> {p.city}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-sm">{formatRON(p.pricePerNight)} <span className="font-normal text-gray-500">/ noapte</span></span>
                {p.avgRating !== null && (
                  <span className="text-xs text-gray-600 flex items-center gap-0.5">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    {p.avgRating.toFixed(1)}
                    <span className="text-gray-400">({p.reviewCount})</span>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
