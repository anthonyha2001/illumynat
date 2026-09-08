interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  orderUrl: string;
}

export function orderConfirmationHtml(d: OrderConfirmationData): string {
  const itemRows = d.items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EDE9E3;">
        <p style="margin:0;font-size:14px;color:#2D0A12;">${item.name}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#8A5A62;">SKU: ${item.sku} &nbsp;·&nbsp; Qty: ${item.quantity}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #EDE9E3;text-align:right;font-size:14px;color:#2D0A12;">
        $${item.subtotal.toFixed(2)}
      </td>
    </tr>
  `).join("");

  const discountRow = d.discountAmount > 0 ? `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#6B7280;">Discount</td>
      <td style="padding:6px 0;text-align:right;font-size:13px;color:#16A34A;">-$${d.discountAmount.toFixed(2)}</td>
    </tr>
  ` : "";

  const addr = d.shippingAddress;
  const addrLine2 = addr.line2 ? `<br>${addr.line2}` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order Confirmed — ILLUMYNAT</title></head>
<body style="margin:0;padding:0;background:#F7F4EF;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EF;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FDFAF6;border:1px solid #EDE9E3;">

        <!-- Header -->
        <tr>
          <td style="background:#2D0A12;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:24px;font-style:italic;font-weight:300;color:#B8972A;letter-spacing:0.05em;">ILLUMYNAT</p>
            <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8972A;opacity:0.7;font-family:sans-serif;">Luxury Candles</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8972A;font-family:sans-serif;">Order Confirmed</p>
            <h1 style="margin:0 0 4px;font-size:28px;font-weight:300;font-style:italic;color:#2D0A12;">${d.orderNumber}</h1>
            <p style="margin:0 0 32px;font-size:14px;color:#8A5A62;font-family:sans-serif;">Thank you, ${d.customerName}. We've received your order and will begin preparing it shortly.</p>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <thead>
                <tr>
                  <th style="text-align:left;font-family:sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8A5A62;padding-bottom:10px;border-bottom:1px solid #EDE9E3;">Item</th>
                  <th style="text-align:right;font-family:sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8A5A62;padding-bottom:10px;border-bottom:1px solid #EDE9E3;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#8A5A62;font-family:sans-serif;">Subtotal</td>
                <td style="padding:6px 0;text-align:right;font-size:13px;color:#8A5A62;font-family:sans-serif;">$${d.subtotal.toFixed(2)}</td>
              </tr>
              ${discountRow}
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#8A5A62;font-family:sans-serif;">Tax</td>
                <td style="padding:6px 0;text-align:right;font-size:13px;color:#8A5A62;font-family:sans-serif;">$${d.taxAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;font-size:16px;color:#2D0A12;border-top:1px solid #EDE9E3;font-style:italic;">Total</td>
                <td style="padding:12px 0 0;text-align:right;font-size:20px;font-weight:300;font-style:italic;color:#2D0A12;border-top:1px solid #EDE9E3;">$${d.total.toFixed(2)}</td>
              </tr>
            </table>

            <!-- Shipping address -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;background:#F7F4EF;padding:20px;">
              <tr>
                <td>
                  <p style="margin:0 0 8px;font-family:sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8A5A62;">Ship To</p>
                  <p style="margin:0;font-size:14px;color:#2D0A12;line-height:1.6;">
                    ${addr.line1}${addrLine2}<br>
                    ${addr.city}, ${addr.state} ${addr.zip}<br>
                    ${addr.country}
                  </p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${d.orderUrl}" style="display:inline-block;padding:14px 32px;background:#B8972A;color:#2D0A12;font-family:sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
                    View Your Order
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #EDE9E3;text-align:center;">
            <p style="margin:0;font-family:sans-serif;font-size:11px;color:#8A5A62;">Questions? Reply to this email or visit illumynat.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function orderConfirmationText(d: OrderConfirmationData): string {
  const items = d.items.map((i) => `  ${i.name} (×${i.quantity}) — $${i.subtotal.toFixed(2)}`).join("\n");
  return `Order Confirmed — ILLUMYNAT\n\nHi ${d.customerName},\n\nThank you for your order! Here's your summary:\n\nOrder: ${d.orderNumber}\n\nItems:\n${items}\n\nSubtotal: $${d.subtotal.toFixed(2)}\nTax: $${d.taxAmount.toFixed(2)}\nTotal: $${d.total.toFixed(2)}\n\nShipping to:\n${d.shippingAddress.line1}\n${d.shippingAddress.city}, ${d.shippingAddress.state} ${d.shippingAddress.zip}\n\nTrack your order: ${d.orderUrl}\n\n— ILLUMYNAT`;
}
