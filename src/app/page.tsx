import Link from "next/link";

import { APP_ROUTES } from "@/constants/routes";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="max-w-xl text-center">
        <h1 className="text-display text-foreground">
          Security Services ERP
        </h1>
        <p className="mt-3 text-secondary">
          Foundation scaffold for workforce, client, and site operations
          management.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href={APP_ROUTES.login} className="btn btn-primary">
          Sign in
        </Link>
        <Link href={APP_ROUTES.dashboard} className="btn btn-secondary">
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
