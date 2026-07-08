// Public contact form endpoint — emails the founder directly instead of
// requiring a support inbox/ticketing system before there's real support
// volume to justify one.
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const FOUNDER_EMAIL = "admin@oilstrikeai.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body.name as string | undefined)?.trim();
    const email = (body.email as string | undefined)?.trim();
    const message = (body.message as string | undefined)?.trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and a message are all required." }, { status: 400 });
    }

    const result = await sendEmail({
      to: FOUNDER_EMAIL,
      subject: `Contact form: ${name}`,
      html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, "<br>")}</p>`,
    });

    if (!result.sent) {
      return NextResponse.json({ error: "Could not send your message right now. Please try emailing us directly." }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[/api/contact] failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
