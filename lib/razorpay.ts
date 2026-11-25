import "server-only";
import Razorpay from "razorpay";

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return {
    client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    keyId,
    keySecret,
  };
}
