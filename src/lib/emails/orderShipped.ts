interface OrderShippedData {
  orderNumber: string;
  customerName: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: Date | null;
  orderUrl: string;
}

export function orderShippedHtml(d: OrderShippedData): string {
  const trackingSection = d.trackingNumber ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;background:#F7F4EF;padding:20px;">
      <tr><td>
        <p style="margin:0 0 8px;font-family:sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8A5A62;">Tracking</p>
        ${d.carrier ? `<p style="margin:0 0 4px;font-size:13px;color:#8A5A62;font-family:sans-serif;">${d.carrier}</p>` : ""}
        <p style="margin:0;font-size:14px;color:#2D0A12;font-family:'Courier New',monospace;letter-spacing:0.05em;">${d.trackingNumber}</p>
        ${d.estimatedDelivery ? `<p style="margin:8px 0 0;font-family:sans-serif;font-size:12px;color:#8A5A62;">Est. delivery: ${new Date(d.estimatedDelivery).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>` : ""}
      </td></tr>
    </table>
  ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Order Has Shipped — LUMYNAT</title></head>
<body style="margin:0;padding:0;background:#F7F4EF;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EF;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FDFAF6;border:1px solid #EDE9E3;">

        <tr>
          <td style="background:#2D0A12;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:24px;font-style:italic;font-weight:300;color:#B8972A;letter-spacing:0.05em;">LUMYNAT</p>
            <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8972A;opacity:0.7;font-family:sans-serif;">Luxury Candles</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8972A;font-family:sans-serif;">On Its Way</p>
            <h1 style="margin:0 0 4px;font-size:28px;font-weight:300;font-style:italic;color:#2D0A12;">Your order has shipped</h1>
            <p style="margin:0 0 32px;font-size:14px;color:#8A5A62;font-family:sans-serif;">Good news, ${d.customerName} — your LUMYNAT order <strong style="color:#2D0A12;">${d.orderNumber}</strong> is on its way.</p>

            ${trackingSection}

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${d.orderUrl}" style="display:inline-block;padding:14px 32px;background:#B8972A;color:#2D0A12;font-family:sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
                    View Order
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px;border-top:1px solid #EDE9E3;text-align:center;">
            <p style="margin:0;font-family:sans-serif;font-size:11px;color:#8A5A62;">Questions? Reply to this email or visit lumynat.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function orderShippedText(d: OrderShippedData): string {
  const tracking = d.trackingNumber
    ? `\nTracking: ${d.carrier ? `${d.carrier} — ` : ""}${d.trackingNumber}${d.estimatedDelivery ? `\nEst. delivery: ${new Date(d.estimatedDelivery).toLocaleDateString()}` : ""}\n`
    : "";
  return `Your Order Has Shipped — LUMYNAT\n\nHi ${d.customerName},\n\nYour order ${d.orderNumber} is on its way!${tracking}\nView order: ${d.orderUrl}\n\n— LUMYNAT`;
}
