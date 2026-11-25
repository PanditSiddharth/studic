"use client";

type CheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: CheckoutResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

async function loadRazorpayScript() {
  if (window.Razorpay) return;
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Razorpay checkout"));
      document.body.appendChild(script);
    }).catch((error: unknown) => {
      scriptPromise = null;
      throw error;
    });
  }
  await scriptPromise;
  if (!window.Razorpay) throw new Error("Razorpay checkout did not initialize");
}

export async function openRazorpayCheckout(itemType: "product" | "course", itemId: string) {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!key) throw new Error("Razorpay checkout is not configured");

  const orderResponse = await fetch("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemType, itemId }),
  });
  const order = await orderResponse.json();
  if (!orderResponse.ok) {
    throw new Error(order.error || "Could not start checkout");
  }

  await loadRazorpayScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Razorpay checkout did not initialize");

  return new Promise<boolean>((resolve, reject) => {
    let settled = false;
    const finish = (paid: boolean) => {
      if (settled) return;
      settled = true;
      resolve(paid);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const checkout = new Razorpay({
      key,
      amount: order.amount,
      currency: order.currency,
      name: "Studic",
      description: "Secure payment",
      order_id: order.order_id,
      handler: async (payment) => {
        try {
          const response = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Payment verification failed");
          finish(true);
        } catch (error) {
          fail(error instanceof Error ? error : new Error("Payment verification failed"));
        }
      },
      modal: { ondismiss: () => finish(false) },
    });
    checkout.on("payment.failed", (response) => {
      fail(new Error(response.error?.description || "Payment failed. Please try again."));
    });
    checkout.open();
  });
}
