import { Suspense } from "react";
import BookingDetails from "./BookingDetails";

async function BookingDetailsRoute({ params }) {
  const { id } = await params;
  return <BookingDetails id={id} />;
}

export default function BookingDetailsPage({ params }) {
  return (
    <Suspense fallback={<main style={{ padding: 32 }}>Loading booking details…</main>}>
      <BookingDetailsRoute params={params} />
    </Suspense>
  );
}
