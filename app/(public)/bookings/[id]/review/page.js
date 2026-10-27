import { Suspense } from "react";
import ReviewClient from "./ReviewClient";

export const instant = false;

export const metadata = {
  title: "Review Your Rental | Sheggar Wheels",
  description: "Share feedback on your completed car rental in Addis Ababa.",
};

export default async function ReviewPage({ params }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center" }}>Loading review portal…</div>}>
      <ReviewClient id={id} />
    </Suspense>
  );
}
