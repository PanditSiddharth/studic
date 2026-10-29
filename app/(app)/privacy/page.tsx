import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/informative/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Studic",
  description: "Read how Studic collects, uses and protects account, payment and usage information.",
  alternates: { canonical: "/privacy" },
};

const sections: LegalSection[] = [
  { id: "collection", title: "Information we collect", body: "We may collect your name, email address, account details, learning activity, support messages and transaction details. We may also receive technical information such as device, browser, approximate location and IP address when you use the website." },
  { id: "use", title: "How we use information", body: "We use information to create and secure accounts, provide courses and digital products, process payments, deliver support, improve the platform, prevent misuse and communicate important service updates." },
  { id: "providers", title: "Payments and service providers", body: "Payments are processed through third-party payment providers. We do not intentionally store complete card or banking credentials. We may use trusted providers for authentication, hosting, email, analytics, file storage and media delivery." },
  { id: "cookies", title: "Cookies and analytics", body: "Studic may use essential cookies for authentication and preferences. With analytics or advertising tools enabled, similar technologies may help us understand visits and improve the service. You can control cookies through your browser settings." },
  { id: "retention", title: "Sharing and retention", body: "We do not sell personal information. Information may be shared with service providers, authorities when legally required, or to protect users and the platform. We retain information only as reasonably necessary for the stated purpose, legal obligations and dispute resolution." },
  { id: "choices", title: "Your choices", body: "You may request access, correction or deletion of eligible personal information, or contact us about marketing preferences. Some records may need to be retained for security, accounting or legal reasons." },
];

export default function PrivacyPolicy() {
  return <LegalPage eyebrow="Privacy & security" title="Your information, handled responsibly." description="This policy explains what information Studic uses, why we use it and the choices available to you when you use our learning platform." sections={sections} note="For privacy questions or requests, email us and include the email address connected to your account." />;
}
