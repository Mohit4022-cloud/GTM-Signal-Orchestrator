import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import type { AccountListRow } from "@/lib/types";

export function AccountsTable({ rows }: { rows: AccountListRow[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left">
          <thead className="bg-panel-muted/80">
            <tr>
              {[
                "Account",
                "Domain",
                "Segment",
                "Owner",
                "Overall score",
                "Status",
                "Last signal",
              ].map((label) => (
                <th
                  key={label}
                  className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="bg-white/70 hover:bg-panel-muted/70">
                <td className="px-5 py-4">
                  <Link href={`/accounts/${row.id}`} className="group inline-flex items-center gap-2">
                    <span className="font-semibold text-foreground">{row.name}</span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{row.geography}</p>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{row.domain}</td>
                <td className="px-5 py-4 text-sm text-foreground">{row.segment}</td>
                <td className="px-5 py-4 text-sm text-foreground">{row.owner}</td>
                <td className="px-5 py-4">
                  <span className="font-mono text-lg font-semibold text-foreground">{row.score}</span>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={row.score >= 80 ? "positive" : row.score >= 65 ? "warning" : "neutral"}>
                    {row.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{row.lastSignalAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
