import { prisma } from "@/lib/prisma";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = { title: "Notifications — ILLUMYNAT Admin" };

export default async function AdminNotificationsPage() {
  const [raw, customers] = await Promise.all([
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.profile.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Serialize Prisma JSON fields to plain objects
  const notifications = JSON.parse(JSON.stringify(raw));

  return <NotificationsClient notifications={notifications} customers={customers} />;
}
