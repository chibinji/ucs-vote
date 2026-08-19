import { Resend } from "resend";

export async function sendOtpEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "UCS Election <noreply@localhost>";

  if (!apiKey) {
    console.log(`[UCS-VOTE DEV OTP] ${to}: ${code}`);
    return { delivered: false, preview: true };
  }

  if (from.includes("localhost")) {
    throw new Error(
      "EMAIL_FROM must be a real address on a verified domain, e.g. UCS Election <noreply@yourdomain.com>",
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Your UCS election verification code",
    text: `Your one-time UCS election code is ${code}. It expires in 10 minutes. If you did not request this, ignore the email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#454B4C">
        <h2 style="color:#2C8992">UNZA Computer Society</h2>
        <p>Use this code to vote. It expires in 10 minutes.</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;color:#111">${code}</p>
        <p style="font-size:13px">If you did not request this, you can ignore the email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { delivered: true, preview: false };
}
