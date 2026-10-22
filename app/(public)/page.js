
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="container" style={{ paddingBlock: "88px" }}>
      <p style={{ color: "var(--color-brand)", fontWeight: 700 }}>
        YOUR NEXT RIDE STARTS HERE
      </p>

      <h1 style={{ maxWidth: "680px", fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
        Find your perfect ride in Addis Ababa.
      </h1>

      <p style={{ maxWidth: "560px", color: "var(--color-text-muted)" }}>
        Discover cars, compare your options, and explore a simpler way to rent
        a car in Ethiopia.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <Link href="/cars" className="button button-primary">
          Browse cars
        </Link>

        <Link href="/owner/cars/new" className="button button-secondary">
          List your car
        </Link>
      </div>
    </section>
  );
}
