import Link from "next/link";

import { APP_ROUTES } from "@/constants/routes";

export default function LoginPage() {
  return (
    <div className="card card-body">
      <h1 className="page-title">Sign in</h1>
      <p className="page-description">
        Authentication module placeholder.
      </p>
      <Link href={APP_ROUTES.forgotPassword} className="btn btn-ghost mt-6 px-0">
        Forgot password?
      </Link>
    </div>
  );
}
