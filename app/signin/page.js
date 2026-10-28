import { Suspense } from "react";
import AccountForm from "../../components/AccountForm";

export const metadata = {
  title: "Sign In | Sheggar Wheels",
  description: "Sign in to your Sheggar Wheels account.",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center" }}>Loading sign in…</div>}>
      <AccountForm mode="signin" />
    </Suspense>
  );
}
