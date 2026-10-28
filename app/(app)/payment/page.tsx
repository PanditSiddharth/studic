"use client";

import React from "react";

type PaymentPageProps = {
  searchParams: Promise<{ url?: string | string[] }>;
};

export default function PaymentPage({ searchParams: searchParamsPromise }: PaymentPageProps) {
  const searchParams = React.use(searchParamsPromise);
  const paymentUrl = Array.isArray(searchParams.url) ? searchParams.url[0] : searchParams.url;

  const proceedToPayment = () => {
    if (!paymentUrl) return;

    try {
      const target = new URL(paymentUrl);
      // Hosted payment gateways must use HTTPS; do not navigate to arbitrary insecure URLs.
      if (target.protocol !== "https:") return;
      window.location.assign(target.toString());
    } catch {
      // Ignore malformed URLs supplied in the query string.
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        type="button"
        onClick={proceedToPayment}
        disabled={!paymentUrl}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        Proceed for Payment
      </button>
    </div>
  );
}
