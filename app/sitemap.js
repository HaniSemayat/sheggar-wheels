/**
 * Sheggar Wheels - Sitemap Generator
 * Automatically enumerates public marketplace pages and seeded vehicle detail URLs.
 * Fulfills 43-concept checklist item #23.
 */

import { demoCars } from "../data/cars";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sheggar-wheels.demo";

  const publicRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cars`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic car listing URLs
  const carRoutes = demoCars.map((car) => ({
    url: `${baseUrl}/cars/${car.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...publicRoutes, ...carRoutes];
}
