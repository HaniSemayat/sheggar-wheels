
import { Suspense } from "react";
import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

export default function PublicLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>

      <Suspense
        fallback={
          <footer
            className="site-footer"
            aria-hidden="true"
            style={{ minHeight: "100px" }}
          />
        }
      >
        <SiteFooter />
      </Suspense>
    </>
  );
}
