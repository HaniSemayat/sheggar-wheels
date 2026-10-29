/**
 * Sheggar Wheels - Robots Configuration
 * Guides search engine crawlers and disallows indexing of private authenticated areas.
 * Fulfills 43-concept checklist item #24.
 */

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sheggar-wheels.demo";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cars", "/cars/*", "/signin", "/signup"],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/bookings",
          "/bookings/*",
          "/my-bookings",
          "/my-bookings/*",
          "/owner",
          "/owner/*",
          "/admin",
          "/admin/*",
          "/checkout",
          "/profile",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
