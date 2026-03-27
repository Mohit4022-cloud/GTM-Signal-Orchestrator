import { Activity, AlertTriangle, ArrowRight, Flame, Router, ShieldCheck } from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getSegmentTone } from "@/lib/badgeHelpers";
import { getDashboardData } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operator console"
        title="Demand orchestration at a glance"
        description="Monitor signal intake, routing quality, and SLA pressure across the seeded GTM workspace. All metrics below are driven from local Prisma queries against SQLite."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">Read-only local mode</Badge>
            <Badge tone="neutral">No external services</Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((kpi) => (
          <MetricCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="p-6">
          <SectionHeader
            label="Signal volume"
            title="14-day inbound and matched signal trend"
            badge={
              <Badge tone="accent">
                <Activity className="mr-1 size-3.5" />
                High-intent stream
              </Badge>
            }
          />
          <div className="mt-6">
            <DashboardCharts kind="signals" data={data.signalVolume14d} />
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader
            label="SLA health"
            title="Response coverage by working state"
            badge={
              <Badge tone="neutral">
                <ShieldCheck className="mr-1 size-3.5" />
                Follow-up posture
              </Badge>
            }
          />
          <div className="mt-6">
            <DashboardCharts kind="sla" data={data.slaHealth} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="p-6">
          <SectionHeader
            label="Hot accounts"
            title="Accounts with the strongest activation signals"
            badge={
              <Badge tone="positive">
                <Flame className="mr-1 size-3.5" />
                Prioritize now
              </Badge>
            }
          />
          <div className="mt-6 overflow-hidden rounded-3xl border border-border">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-panel-muted/80">
                <tr>
                  {["Account", "Owner", "Segment", "Score", "Last signal"].map((label) => (
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
                {data.hotAccounts.map((account) => (
                  <tr key={account.id} className="bg-white/60 hover:bg-panel-muted/70">
                    <td className="px-5 py-4 font-semibold text-foreground">{account.name}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{account.owner}</td>
                    <td className="px-5 py-4">
                      <Badge tone={getSegmentTone(account.segment)}>{account.segment}</Badge>
                    </td>
                    <td className="px-5 py-4 font-mono text-lg font-semibold text-foreground">
                      {account.score}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{account.lastSignalAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="p-6">
            <SectionHeader
              label="Unmatched signals"
              title="Ops review queue"
              badge={
                <Badge tone="warning">
                  <AlertTriangle className="mr-1 size-3.5" />
                  Needs review
                </Badge>
              }
            />
            <div className="mt-5 space-y-3">
              {data.unmatchedSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-2xl border border-border bg-panel-muted/70 p-4"
                >
                  <p className="font-semibold text-foreground">{signal.eventType}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {signal.sourceSystem} · {signal.receivedAt}
                  </p>
                  <p className="mt-3 text-sm text-foreground">
                    Recommended queue: <span className="font-medium">{signal.recommendation}</span>
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader
              label="Routing decisions"
              title="Most recent policy outcomes"
              badge={
                <Badge tone="neutral">
                  <Router className="mr-1 size-3.5" />
                  Policy trace
                </Badge>
              }
            />
            <div className="mt-5 space-y-3">
              {data.recentRoutingDecisions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-panel-muted/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.accountName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.decisionType} · {item.ownerName}
                      </p>
                    </div>
                    <Badge tone="accent">{item.queue}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground">{item.explanation}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    {item.createdAt}
                    <ArrowRight className="size-3.5" />
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
