import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { PropertyDetail } from '@/components/PropertyDetail';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      description: true,
      city: true,
      address: true,
      pricePerNight: true,
      maxGuests: true,
      images: { orderBy: { order: 'asc' }, take: 3, select: { url: true } },
      reviews: { select: { rating: true } },
    },
  });

  if (!property) {
    return { title: 'Proprietate negăsită – StaiAici' };
  }

  const avgRating = property.reviews.length > 0
    ? (property.reviews.reduce((s, r) => s + r.rating, 0) / property.reviews.length).toFixed(1)
    : null;

  const title = `${property.title} – Cazare ${property.city} | StaiAici`;
  const description = `${property.description.slice(0, 150)}${property.description.length > 150 ? '...' : ''} ✓ De la ${Math.round(property.pricePerNight)} RON/noapte ✓ Max ${property.maxGuests} oaspeți${avgRating ? ` ✓ Rating ${avgRating}/5` : ''} – ${property.city}, ${property.address}`;

  const images = property.images.map(img => ({
    url: img.url,
    alt: `${property.title} – cazare ${property.city} – StaiAici`,
  }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://staiaici.ro';

  return {
    title,
    description,
    keywords: [
      `cazare ${property.city}`,
      `cazări ${property.city}`,
      `apartament ${property.city}`,
      `închiriere ${property.city}`,
      'cazare România',
      'cazări România',
      property.title,
      property.city,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${appUrl}/property/${params.id}`,
      images,
      siteName: 'StaiAici',
      locale: 'ro_RO',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map(i => i.url),
    },
    alternates: {
      canonical: `${appUrl}/property/${params.id}`,
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      description: true,
      city: true,
      address: true,
      pricePerNight: true,
      maxGuests: true,
      images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
      reviews: { select: { rating: true } },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://staiaici.ro';

  const jsonLd = property ? {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.title,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
      streetAddress: property.address,
      addressCountry: 'RO',
    },
    image: property.images[0]?.url,
    url: `${appUrl}/property/${params.id}`,
    priceRange: `${Math.round(property.pricePerNight)} RON`,
    ...(property.reviews.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: (property.reviews.reduce((s, r) => s + r.rating, 0) / property.reviews.length).toFixed(1),
        reviewCount: property.reviews.length,
        bestRating: 5,
      },
    }),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PropertyDetail />
    </>
  );
}
