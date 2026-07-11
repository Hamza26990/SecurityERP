import Link from "next/link";

import { APP_ROUTES } from "@/constants/routes";

export default function ForgotPasswordPage() {
  return (
    <div className="card card-body">
      <h1 className="page-title">Forgot password</h1>
      <p className="page-description">
        Password recovery module placeholder.
      </p>
      <Link href={APP_ROUTES.login} className="btn btn-ghost mt-6 px-0">
        Back to sign in
      </Link>
    </div>
  );
}
