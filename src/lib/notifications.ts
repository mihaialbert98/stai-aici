import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';

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
    logger.error('Failed to create notification', err, { userId: data.userId, type: data.type });
  }
}
