import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Checkout & TeleBirr Payment | Sheggar Wheels",
  description: "Complete your peer-to-peer car rental reservation in Addis Ababa.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: "64px 24px", textAlign: "center" }}>Loading secure checkout…</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
