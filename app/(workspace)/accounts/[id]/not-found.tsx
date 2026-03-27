import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/shared/Card";

export default function AccountNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account detail"
        title="Account record not found"
        description="The requested seeded account ID is not available in the local SQLite workspace. Use the account list to jump into one of the demo records."
      />
      <Card className="max-w-2xl p-6">
        <p className="text-sm leading-7 text-muted-foreground">
          Try one of the seeded detail routes from the account list, or reset the local database if you want to reseed the demo data.
        </p>
        <div className="mt-5">
          <Link
            href="/accounts"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-white hover:opacity-92"
          >
            Return to accounts
          </Link>
        </div>
      </Card>
    </div>
  );
}
