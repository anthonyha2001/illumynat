interface GiftCardIssuedData {
  recipientName?: string;
  senderName?: string;
  code: string;
  amount: number;
  expiresAt?: Date | null;
}

export function giftCardIssuedHtml(d: GiftCardIssuedData): string {
  const greeting = d.recipientName ? `Hi ${d.recipientName},` : "Hello,";
  const fromLine = d.senderName ? `<p style="margin:0 0 24px;font-size:14px;color:#8A5A62;font-family:sans-serif;">A gift from <strong style="color:#2D0A12;">${d.senderName}</strong>.</p>` : "";
  const expiry = d.expiresAt
    ? `<p style="margin:8px 0 0;font-family:sans-serif;font-size:11px;color:#8A5A62;">Valid until ${new Date(d.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your LUMYNAT Gift Card</title></head>
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
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8972A;font-family:sans-serif;">A Gift for You</p>
            <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;font-style:italic;color:#2D0A12;">Your gift card is here</h1>
            <p style="margin:0 0 8px;font-size:14px;color:#8A5A62;font-family:sans-serif;">${greeting}</p>
            ${fromLine}

            <!-- Gift card display -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;background:#2D0A12;padding:32px;text-align:center;">
              <tr><td>
                <p style="margin:0 0 12px;font-family:sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8972A;">Gift Card</p>
                <p style="margin:0 0 8px;font-size:32px;font-weight:300;font-style:italic;color:#FDFAF6;">$${d.amount.toFixed(2)}</p>
                <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;letter-spacing:0.15em;color:#B8972A;">${d.code}</p>
                ${expiry}
              </td></tr>
            </table>

            <p style="margin:0 0 32px;font-size:14px;color:#8A5A62;font-family:sans-serif;text-align:center;">Enter this code at checkout on lumynat.com to redeem your gift.</p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumynat.com"}/shop" style="display:inline-block;padding:14px 32px;background:#B8972A;color:#2D0A12;font-family:sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
                    Shop Now
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

export function giftCardIssuedText(d: GiftCardIssuedData): string {
  const from = d.senderName ? `A gift from ${d.senderName}.\n\n` : "";
  return `Your LUMYNAT Gift Card\n\n${from}Your $${d.amount.toFixed(2)} gift card code is:\n\n${d.code}\n\nUse it at checkout on lumynat.com.\n\n— LUMYNAT`;
}
