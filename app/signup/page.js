import AccountForm from "../../components/AccountForm";

export const metadata = {
  title: "Create Account | Sheggar Wheels",
  description: "Join Sheggar Wheels to rent or list a car.",
};

export default function SignUpPage() {
  return <AccountForm mode="signup" />;
}
