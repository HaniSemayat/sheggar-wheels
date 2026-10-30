import { Suspense } from "react";
import AccountForm from "../../components/AccountForm";

export const metadata = {
  title: "Sign Up | Sheggar Wheels",
  description: "Create an account on Sheggar Wheels.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center" }}>Loading registration…</div>}>
      <AccountForm mode="signup" />
    </Suspense>
  );
}
