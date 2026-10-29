import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/informative/legal-page";

export const metadata: Metadata = { title: "Refund & Cancellation Policy | Studic", description: "Understand cancellations, refunds and support options for Studic courses and digital educational products.", alternates: { canonical: "/refund" } };
const sections: LegalSection[] = [
  { id: "digital", title: "Digital products", body: "Because digital products can be delivered immediately, purchases are generally non-refundable once the file has been delivered or downloaded, except where required by applicable law or where the file is materially defective." },
  { id: "courses", title: "Courses and access", body: "If a course access issue is caused by a technical problem on our side and cannot reasonably be fixed, contact us promptly so we can investigate and provide an appropriate resolution." },
  { id: "duplicate", title: "Duplicate or incorrect payment", body: "If you were charged twice for the same order or a payment was captured without a corresponding order, contact us with the transaction details. We will verify the payment and process an eligible reversal through the original payment method." },
  { id: "request", title: "How to request help", body: "Email mynmss3@gmail.com with your order ID, account email, payment date and a clear description of the issue. Do not send full card numbers, passwords or other sensitive credentials." },
  { id: "processing", title: "Processing time", body: "Approved refunds are initiated through the payment provider. The time taken for the amount to appear depends on the provider and your bank." },
];
export default function RefundPolicy() { return <LegalPage eyebrow="Payments & refunds" title="A straightforward refund process." description="Here is how cancellations, duplicate charges and technical access issues are handled for Studic purchases." sections={sections} note="Keep your order ID and payment details ready so we can resolve eligible requests faster." />; }
