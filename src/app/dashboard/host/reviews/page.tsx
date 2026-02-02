'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function HostReviewsPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Se încarcă...</p>}>
      <HostReviewsContent />
    </Suspense>
  );
}

function HostReviewsContent() {
  const searchParams = useSearchParams();
  const propertyIds = searchParams.get('propertyIds') || '';
  const [reviews, setReviews] = useState<any[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyIds) params.set('propertyIds', propertyIds);
    fetch(`/api/host/reviews?${params}`)
      .then(r => r.json())
      .then(d => {
        setReviews(d.reviews || []);
        setAverage(d.average || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [propertyIds]);

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  const renderStars = (rating: number, size = 16) => (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
      ))}
    </span>
  );

  return (
    <div>
      <Link href="/dashboard/host" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Înapoi la panou
      </Link>

      <h1 className="text-2xl font-bold mb-6">Recenzii</h1>

      {reviews.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Nu există recenzii pentru selecția curentă.</p>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <div className="flex items-center gap-3">
              {renderStars(Math.round(average || 0), 22)}
              <span className="text-2xl font-bold">{average?.toFixed(1)}</span>
              <span className="text-sm text-gray-500">
                din {reviews.length} {reviews.length === 1 ? 'recenzie' : 'recenzii'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {reviews.map((r: any) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{r.guest?.name || 'Anonim'}</span>
                    {renderStars(r.rating, 14)}
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(r.createdAt), 'd MMM yyyy', { locale: ro })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{r.property?.title}</p>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
