import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getOrdersByProfile } from "@/lib/data/orders";
import { signOut } from "@/lib/actions/auth";
import { awardSignupBonus } from "@/lib/data/loyalty";

export const metadata = { title: "Account — ILLUMYNAT" };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID:       "text-success",
    PENDING:    "text-warning",
    PROCESSING: "text-accent",
    FULFILLED:  "text-success",
    SHIPPED:    "text-success",
    CANCELLED:  "text-error",
  };
  return (
    <span className={`font-body text-[10px] tracking-widest uppercase ${map[status] ?? "text-text-muted"}`}>
      {status}
    </span>
  );
}

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile, recentOrders, loyaltyAccount] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    }),
    getOrdersByProfile(user.id),
    prisma.loyaltyAccount.findUnique({
      where: { profileId: user.id },
      select: { totalPoints: true, lifetimePoints: true, tier: true },
    }),
  ]);

  // Bootstrap loyalty account + signup bonus on first visit
  if (!loyaltyAccount) {
    try { await awardSignupBonus(user.id); } catch {}
  }

  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : user.email;

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-12 md:py-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10 md:mb-14">
          <div>
            <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-2">
              My Account
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-light italic text-text">
              Welcome back{profile ? `, ${profile.firstName}` : ""}.
            </h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted hover:text-text transition-colors duration-200 mt-2"
            >
              Sign Out
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-3 gap-10 md:gap-14">
          {/* Left — profile */}
          <div className="space-y-8">
            {/* Profile card */}
            <div className="bg-surface border border-border-subtle p-6">
              <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted mb-4">
                Profile
              </p>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="font-display text-lg font-light text-text-on-gold">
                    {profile?.firstName?.[0] ?? user.email?.[0]?.toUpperCase() ?? "M"}
                  </span>
                </div>
                <div>
                  <p className="font-display text-lg font-light text-text leading-tight">{displayName}</p>
                  <p className="font-body text-xs text-text-muted">{profile?.email ?? user.email}</p>
                </div>
              </div>
              {profile?.phone && (
                <p className="font-body text-sm text-text-muted">{profile.phone}</p>
              )}
              <p className="font-body text-[11px] text-text-faint mt-3">
                Member since {new Date(profile?.createdAt ?? user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Loyalty points card */}
            {loyaltyAccount && (
              <div className="bg-surface border border-border-subtle p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted">
                    Loyalty Points
                  </p>
                  <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                    loyaltyAccount.tier === "GOLD"   ? "bg-accent text-text-on-gold" :
                    loyaltyAccount.tier === "SILVER" ? "bg-border text-text" :
                                                       "bg-bg-subtle text-text-muted"
                  }`}>
                    {loyaltyAccount.tier}
                  </span>
                </div>
                <p className="font-display text-4xl font-light text-accent">
                  {loyaltyAccount.totalPoints.toLocaleString()}
                </p>
                <p className="font-body text-xs text-text-muted mt-1">
                  points available · {loyaltyAccount.lifetimePoints.toLocaleString()} lifetime
                </p>
                {loyaltyAccount.tier !== "GOLD" && (
                  <p className="font-body text-[11px] text-text-faint mt-2">
                    {loyaltyAccount.tier === "BRONZE"
                      ? `${500 - loyaltyAccount.lifetimePoints} pts to Silver`
                      : `${2000 - loyaltyAccount.lifetimePoints} pts to Gold`}
                  </p>
                )}
              </div>
            )}

            {/* Quick links */}
            <div className="bg-surface border border-border-subtle p-6 space-y-3">
              <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted mb-4">
                Quick Links
              </p>
              {[
                { label: "All Orders",    href: "/account/orders" },
                { label: "Messages",      href: "/account/messages" },
                { label: "Notifications", href: "/account/notifications" },
                { label: "Wishlist",      href: "/account/wishlist" },
                { label: "Addresses",     href: "/account/addresses" },
                { label: "Edit Profile",  href: "/account/profile" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block font-body text-sm text-text-subtle hover:text-accent transition-colors duration-200 py-1 border-b border-border-subtle last:border-0"
                >
                  {link.label} →
                </Link>
              ))}
            </div>
          </div>

          {/* Right — recent orders */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle">
                Recent Orders
              </p>
              {recentOrders.length > 0 && (
                <Link href="/account/orders" className="font-body text-[11px] tracking-wider uppercase text-text-muted hover:text-accent transition-colors duration-200">
                  View All
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="bg-surface border border-border-subtle p-12 text-center space-y-4">
                <p className="font-display text-2xl font-light text-text">No orders yet</p>
                <p className="font-body text-sm text-text-muted">When you place an order it will appear here.</p>
                <Button href="/shop" variant="secondary" size="md" className="mt-4">Shop Collection</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => {
                  const thumbUrl = order.items[0]?.product?.images[0]?.url;
                  return (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="flex items-center gap-4 bg-surface border border-border-subtle p-4 hover:border-accent transition-colors duration-200 group"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-14 h-16 bg-bg-subtle shrink-0 overflow-hidden">
                        {thumbUrl ? (
                          <Image src={thumbUrl} alt={order.items[0].name} fill sizes="56px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-display text-xl italic text-text-faint">I</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-base font-light text-text leading-tight group-hover:text-accent transition-colors duration-200">
                          {order.orderNumber}
                        </p>
                        <p className="font-body text-[11px] text-text-muted mt-0.5">
                          {order._count.items} {order._count.items === 1 ? "item" : "items"} ·{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>

                      {/* Total */}
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg font-light text-text">${order.total.toFixed(2)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
