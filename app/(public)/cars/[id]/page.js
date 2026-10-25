import CarDetailsClient from "./CarDetailsClient";
import { demoCars } from "../../../../data/cars";
export const instant = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const car = demoCars.find((item) => item.id === id);

  return {
    title: car
      ? `${car.year} ${car.make} ${car.model} | Sheggar Wheels`
      : "Car Details | Sheggar Wheels",
    description: car?.description ?? "Explore car rentals in Addis Ababa.",
  };
}

export default async function CarDetailsPage({ params }) {
  const { id } = await params;
  return <CarDetailsClient id={id} />;
}

