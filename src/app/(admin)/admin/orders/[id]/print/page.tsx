import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props { params: Promise<{ id: string }> }

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function fmt(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      orderNumber: true,
      createdAt: true,
      status: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
      giftCardAmount: true,
      customerNotes: true,
      shippingFirstName: true,
      shippingLastName: true,
      shippingAddressLine1: true,
      shippingAddressLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingZipCode: true,
      shippingCountry: true,
      guestEmail: true,
      guestPhone: true,
      profile: { select: { firstName: true, lastName: true, email: true, phone: true } },
      items: {
        select: {
          name: true, sku: true, price: true,
          quantity: true, subtotal: true,
          customizations: { select: { label: true, value: true, priceModifier: true } },
        },
        orderBy: { name: "asc" },
      },
      payments: { select: { method: true, status: true, amount: true, confirmedAt: true } },
      shipment: { select: { carrier: true, trackingNumber: true, estimatedDelivery: true } },
    },
  });

  if (!order) notFound();

  const customerName  = order.profile
    ? `${order.profile.firstName} ${order.profile.lastName}`
    : `${order.shippingFirstName} ${order.shippingLastName}`;
  const customerEmail = order.profile?.email ?? order.guestEmail ?? "";
  const customerPhone = order.profile?.phone ?? order.guestPhone ?? "";
  const confirmedPayment = order.payments.find((p) => p.status === "COMPLETED");

  const s: Record<string, string | number> = {
    // base typography
    fontFamily:   "'Georgia', 'Times New Roman', serif",
    fontSize:     13,
    lineHeight:   1.6,
    color:        "#1a1a1a",
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page {
          size: A4;
          margin: 18mm 18mm 22mm 18mm;
        }
      `}</style>

      {/* ── Toolbar (screen only) ── */}
      <div className="no-print" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "#1a0008", padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 12, letterSpacing: "0.2em", color: "#e8d5a0", textTransform: "uppercase" }}>
          Invoice — {order.orderNumber}
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => window.print()}
            style={{
              background: "#b8972a", color: "#1a0008",
              border: "none", padding: "8px 20px",
              fontFamily: "Georgia, serif", fontSize: 11,
              letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Print / Save PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{
              background: "transparent", color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.15)", padding: "8px 16px",
              fontFamily: "Georgia, serif", fontSize: 11,
              letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* ── Invoice document ── */}
      <div style={{
        maxWidth: 780,
        margin: "0 auto",
        padding: "80px 48px 60px",
        ...s,
      }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, paddingBottom: 28, borderBottom: "2px solid #1a0008" }}>
          {/* Brand */}
          <div>
            <div style={{ fontSize: 34, fontWeight: 300, fontStyle: "italic", letterSpacing: "0.12em", color: "#1a0008", lineHeight: 1 }}>
              ILLUMYNAT
            </div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#8a5a62", marginTop: 6 }}>
              Handcrafted Candles
            </div>
          </div>
          {/* Invoice meta */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#8a5a62", marginBottom: 6 }}>Invoice</div>
            <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: "0.05em", color: "#1a0008" }}>{order.orderNumber}</div>
            <div style={{ fontSize: 11, color: "#8a5a62", marginTop: 4 }}>
              Issued: {fmt(order.createdAt)}
            </div>
            {confirmedPayment?.confirmedAt && (
              <div style={{ fontSize: 11, color: "#8a5a62" }}>
                Paid: {fmt(confirmedPayment.confirmedAt)}
              </div>
            )}
            {/* Status badge */}
            <div style={{
              display: "inline-block", marginTop: 8,
              padding: "3px 10px",
              border: "1px solid #b8972a", color: "#b8972a",
              fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
            }}>
              {order.status.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* ── Bill to / Ship to ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 36 }}>
          {/* Bill to */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a5a62", marginBottom: 10 }}>Bill To</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{customerName}</div>
            {customerEmail && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{customerEmail}</div>}
            {customerPhone && <div style={{ fontSize: 12, color: "#555" }}>{customerPhone}</div>}
          </div>
          {/* Ship to */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a5a62", marginBottom: 10 }}>Ship To</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{order.shippingFirstName} {order.shippingLastName}</div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 2, lineHeight: 1.7 }}>
              {order.shippingAddressLine1}<br />
              {order.shippingAddressLine2 && <>{order.shippingAddressLine2}<br /></>}
              {order.shippingCity}, {order.shippingState} {order.shippingZipCode}<br />
              {order.shippingCountry}
            </div>
          </div>
        </div>

        {/* Tracking row */}
        {order.shipment && (order.shipment.carrier || order.shipment.trackingNumber) && (
          <div style={{
            marginBottom: 28, padding: "10px 14px",
            background: "#fdfaf6", border: "1px solid #ead9d0",
            display: "flex", gap: 24, fontSize: 12,
          }}>
            <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a5a62", alignSelf: "center" }}>
              Tracking
            </span>
            {order.shipment.carrier && <span style={{ fontWeight: 600 }}>{order.shipment.carrier}</span>}
            {order.shipment.trackingNumber && (
              <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>{order.shipment.trackingNumber}</span>
            )}
            {order.shipment.estimatedDelivery && (
              <span style={{ color: "#666" }}>Est. {fmt(order.shipment.estimatedDelivery)}</span>
            )}
          </div>
        )}

        {/* ── Items table ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1a0008" }}>
              {[
                { label: "Description", align: "left"  },
                { label: "SKU",         align: "left"  },
                { label: "Qty",         align: "center"},
                { label: "Unit Price",  align: "right" },
                { label: "Total",       align: "right" },
              ].map(({ label, align }) => (
                <th key={label} style={{
                  padding: "8px 10px", textAlign: align as "left" | "right" | "center",
                  fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "#6b1a2a", fontWeight: 700,
                }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <>
                <tr key={item.sku + i} style={{ borderBottom: "1px solid #ead9d0", background: i % 2 === 0 ? "#fff" : "#fdfaf6" }}>
                  <td style={{ padding: "11px 10px", fontWeight: 600, fontSize: 13 }}>{item.name}</td>
                  <td style={{ padding: "11px 10px", fontFamily: "monospace", fontSize: 11, color: "#888" }}>{item.sku}</td>
                  <td style={{ padding: "11px 10px", textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ padding: "11px 10px", textAlign: "right", color: "#555" }}>${toNum(item.price).toFixed(2)}</td>
                  <td style={{ padding: "11px 10px", textAlign: "right", fontWeight: 600 }}>${toNum(item.subtotal).toFixed(2)}</td>
                </tr>
                {item.customizations.map((c) => (
                  <tr key={c.label} style={{ borderBottom: "1px solid #f0e8e4", background: i % 2 === 0 ? "#fff" : "#fdfaf6" }}>
                    <td colSpan={3} style={{ padding: "3px 10px 6px 22px", fontSize: 11, color: "#888", fontStyle: "italic" }}>
                      ↳ {c.label}: {c.value}
                    </td>
                    <td style={{ padding: "3px 10px 6px", textAlign: "right", fontSize: 11, color: "#888" }}>
                      {toNum(c.priceModifier) !== 0 ? `+$${toNum(c.priceModifier).toFixed(2)}` : ""}
                    </td>
                    <td style={{ padding: "3px 10px 6px", textAlign: "right", fontSize: 11, color: "#888" }}>
                      {toNum(c.priceModifier) !== 0 ? `+$${toNum(c.priceModifier).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>

        {/* ── Totals ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 36 }}>
          <div style={{ width: 260 }}>
            {[
              { label: "Subtotal", value: `$${toNum(order.subtotal).toFixed(2)}` },
              ...(toNum(order.discountAmount) > 0 ? [{ label: "Discount", value: `-$${toNum(order.discountAmount).toFixed(2)}`, color: "#4a7c59" }] : []),
              ...(toNum(order.giftCardAmount ?? 0) > 0 ? [{ label: "Gift Card", value: `-$${toNum(order.giftCardAmount ?? 0).toFixed(2)}`, color: "#4a7c59" }] : []),
              { label: "Tax", value: `$${toNum(order.taxAmount).toFixed(2)}` },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0", fontSize: 12, color: (row as { color?: string }).color ?? "#666",
                borderBottom: "1px solid #ead9d0",
              }}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
            {/* Total */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "12px 0 6px", borderTop: "2px solid #1a0008",
              fontSize: 18, fontWeight: 700, color: "#1a0008", marginTop: 2,
            }}>
              <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", alignSelf: "center" }}>Total Due</span>
              <span>${toNum(order.total).toFixed(2)}</span>
            </div>
            {/* Payment method */}
            {confirmedPayment && (
              <div style={{
                marginTop: 8, padding: "8px 12px",
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                display: "flex", justifyContent: "space-between",
                fontSize: 11, color: "#166534",
              }}>
                <span style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Paid via {confirmedPayment.method.toLowerCase()}
                </span>
                <span style={{ fontWeight: 700 }}>${toNum(confirmedPayment.amount).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Customer notes ── */}
        {order.customerNotes && (
          <div style={{
            marginBottom: 36, padding: "14px 16px",
            background: "#fdfaf6", border: "1px solid #ead9d0",
          }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a5a62", marginBottom: 6 }}>
              Customer Note
            </div>
            <p style={{ fontSize: 13, color: "#444", fontStyle: "italic" }}>{order.customerNotes}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          borderTop: "1px solid #ead9d0", paddingTop: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Thank you for your order
          </div>
          <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.1em" }}>
            illumynat.com
          </div>
        </div>
      </div>
    </>
  );
}
