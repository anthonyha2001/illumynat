import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!profile || profile.role !== "ADMIN") redirect("/");

  const [pendingReviews, needsAttention] = await Promise.all([
    prisma.productReview.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
  ]);

  const badges = {
    "/admin/reviews": pendingReviews  || undefined,
    "/admin/orders":  needsAttention  || undefined,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-dark">
      <AdminSidebar badges={badges} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 shrink-0 bg-bg border-b border-border-subtle flex items-center justify-end px-6 gap-3">
          <AdminNotificationBell />
        </div>
        <main className="flex-1 bg-bg overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
