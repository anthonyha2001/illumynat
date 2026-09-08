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

export default async function PackingSlipPage({ params }: Props) {
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
      profile: { select: { email: true } },
      items: {
        select: { name: true, sku: true, price: true, quantity: true, subtotal: true },
        orderBy: { name: "asc" },
      },
      shipment: { select: { carrier: true, trackingNumber: true, estimatedDelivery: true } },
    },
  });

  if (!order) notFound();

  const email = order.profile?.email ?? order.guestEmail ?? "";

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { margin: 20mm; size: A4; }
      `}</style>

      {/* Print / close bar — hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-text text-text-inverse px-6 py-3 flex items-center justify-between">
        <span className="font-body text-[11px] tracking-[0.15em] uppercase">
          Packing Slip — {order.orderNumber}
        </span>
        <div className="flex gap-4">
          <button
            onClick={() => window.print()}
            className="font-body text-[11px] tracking-[0.12em] uppercase bg-accent text-text-on-gold px-4 py-1.5 hover:opacity-90 transition-opacity"
          >
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="font-body text-[11px] tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Slip content */}
      <div className="max-w-2xl mx-auto px-8 pt-20 pb-12 font-body text-sm text-gray-800 no-print:pt-20" style={{ fontFamily: "Georgia, serif" }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-10 pb-6 border-b border-gray-300">
          <div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 300, fontStyle: "italic", letterSpacing: "0.05em" }}>
              ILLUMYNAT
            </p>
            <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", marginTop: 2 }}>
              Handcrafted Candles
            </p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888" }}>Packing Slip</p>
            <p style={{ fontSize: 18, fontWeight: 300, marginTop: 2 }}>{order.orderNumber}</p>
            <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Ship to + tracking */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Ship To</p>
            <p style={{ fontWeight: 500 }}>{order.shippingFirstName} {order.shippingLastName}</p>
            {email && <p style={{ color: "#555", fontSize: 12 }}>{email}</p>}
            <p style={{ marginTop: 4 }}>{order.shippingAddressLine1}</p>
            {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
            <p>{order.shippingCity}, {order.shippingState} {order.shippingZipCode}</p>
            <p>{order.shippingCountry}</p>
          </div>
          {order.shipment && (
            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Tracking</p>
              {order.shipment.carrier && <p style={{ fontWeight: 500 }}>{order.shipment.carrier}</p>}
              {order.shipment.trackingNumber && (
                <p style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: "0.05em" }}>
                  {order.shipment.trackingNumber}
                </p>
              )}
              {order.shipment.estimatedDelivery && (
                <p style={{ color: "#555", fontSize: 12, marginTop: 4 }}>
                  Est. {new Date(order.shipment.estimatedDelivery).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #222" }}>
              {["Item", "SKU", "Qty", "Unit Price", "Subtotal"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "6px 8px",
                    textAlign: h === "Qty" || h === "Unit Price" || h === "Subtotal" ? "right" : "left",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#555",
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.sku + i} style={{ borderBottom: "1px solid #e5e5e5" }}>
                <td style={{ padding: "10px 8px", fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: "10px 8px", fontFamily: "monospace", fontSize: 11, color: "#666" }}>{item.sku}</td>
                <td style={{ padding: "10px 8px", textAlign: "right" }}>{item.quantity}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", color: "#555" }}>${toNum(item.price).toFixed(2)}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 500 }}>${toNum(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 220 }}>
            {[
              { label: "Subtotal",  value: `$${toNum(order.subtotal).toFixed(2)}` },
              ...(toNum(order.discountAmount) > 0 ? [{ label: "Discount", value: `-$${toNum(order.discountAmount).toFixed(2)}` }] : []),
              { label: "Tax",       value: `$${toNum(order.taxAmount).toFixed(2)}` },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#555", fontSize: 12 }}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", borderTop: "2px solid #222", fontWeight: 600, fontSize: 15, marginTop: 4 }}>
              <span>Total</span>
              <span>${toNum(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer notes */}
        {order.customerNotes && (
          <div style={{ marginTop: 32, padding: 14, backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5" }}>
            <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Customer Note</p>
            <p style={{ fontSize: 13, color: "#444", fontStyle: "italic" }}>{order.customerNotes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: "center", color: "#aaa", fontSize: 10, letterSpacing: "0.15em" }}>
          <p>Thank you for your order · illumynat.com</p>
        </div>
      </div>
    </>
  );
}
