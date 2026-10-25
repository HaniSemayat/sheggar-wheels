import AccountForm from "../../components/AccountForm";

export const metadata = {
  title: "Sign In | Sheggar Wheels",
  description: "Sign in to your Sheggar Wheels account.",
};

export default function SignInPage() {
  return <AccountForm mode="signin" />;
}
