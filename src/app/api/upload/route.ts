import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/upload — upload one or more images
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const formData = await req.formData();
  const files = formData.getAll('files') as File[];

  if (!files.length) {
    return NextResponse.json({ error: 'Niciun fișier selectat' }, { status: 400 });
  }

  const results: { url: string }[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Tip de fișier neacceptat: ${file.type}. Acceptăm JPEG, PNG, WebP.` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Fișierul ${file.name} depășește limita de 5MB.` }, { status: 400 });
    }

    const blob = await put(`properties/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    results.push({ url: blob.url });
  }

  return NextResponse.json({ images: results });
}

// DELETE /api/upload — remove an image from blob storage
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL necesar' }, { status: 400 });

  // Check if this image belongs to another user's property
  const image = await prisma.propertyImage.findFirst({
    where: { url },
    include: { property: { select: { hostId: true } } },
  });
  if (image && image.property.hostId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nu ai permisiunea să ștergi această imagine' }, { status: 403 });
  }

  try {
    await del(url);
  } catch {
    // Blob may already be deleted, ignore
  }

  return NextResponse.json({ ok: true });
}
