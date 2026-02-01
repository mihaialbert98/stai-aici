import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
}) {
  try {
    await prisma.notification.create({ data });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
