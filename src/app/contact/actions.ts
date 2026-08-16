"use server";

import { sendContactEnquiryEmail } from "@/lib/email";

export type ContactFormState = {
  status: "idle" | "sent" | "error";
  error?: string;
};

const SUBJECTS = [
  "General enquiry",
  "Pass & pricing",
  "Partner with us",
  "Booking support",
];

const MAX = { name: 120, email: 200, message: 4000 };

/** Deliberately loose — this only rejects obvious nonsense, the real check is the reply bouncing. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Handles a submission from the contact form. Server-side validation is the
 * real gate — the `required` attributes in the markup are only a convenience,
 * since a form can be POSTed directly.
 */
export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot: a hidden field no human ever fills in, but most bots do.
  if (typeof formData.get("company") === "string" && formData.get("company") !== "") {
    // Report success so the bot doesn't retry with a different shape.
    return { status: "sent" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subjectRaw = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", error: "Please fill in your name, email and message." };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: "error", error: "That email address doesn't look right." };
  }
  if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
    return { status: "error", error: "That message is too long — please shorten it and try again." };
  }

  // Anything not in the list is a tampered POST; fall back rather than trusting it.
  const subject = SUBJECTS.includes(subjectRaw) ? subjectRaw : SUBJECTS[0];

  const delivered = await sendContactEnquiryEmail({ name, email, subject, message });

  if (!delivered) {
    return {
      status: "error",
      error:
        "We couldn't send your message just now. Please email hello@traveloop.my or message us on WhatsApp.",
    };
  }

  return { status: "sent" };
}
