import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Mail, Radar, Sparkles, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import { getAccountDetail } from "@/lib/queries/accounts";

type AccountDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params;
  const account = await getAccountDetail(id);

  if (!account) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/accounts"
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-panel px-3 text-sm font-medium text-muted-foreground hover:bg-panel-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to accounts
        </Link>
        <Badge tone="accent">{account.segment}</Badge>
        <Badge tone={account.score >= 80 ? "positive" : account.score >= 65 ? "warning" : "neutral"}>
          {account.status}
        </Badge>
      </div>

      <PageHeader
        eyebrow="Account detail"
        title={account.name}
        description={`${account.domain} · ${account.industry} · ${account.lifecycleStage}. This page combines seeded signals, tasks, contacts, and audit context into a single recruiter-friendly view.`}
        actions={
          <div className="rounded-[28px] border border-border bg-panel px-5 py-4 shadow-[var(--shadow-sm)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Overall score
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold text-foreground">{account.score}</p>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ownership
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">{account.owner}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{account.ownerRole}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-[280px]">
              <Attribute label="Tier" value={account.tier} />
              <Attribute label="Fit score" value={String(account.fitScore)} />
              <Attribute label="Employees" value={account.employeeCount} />
              <Attribute label="Revenue" value={account.revenueBand} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Attribute label="Geography" value={account.geography} />
            <Attribute label="Lifecycle" value={account.lifecycleStage} />
            <Attribute label="Domain" value={account.domain} />
            <Attribute label="Industry" value={account.industry} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl border border-accent/15 bg-accent-muted p-2 text-accent">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                AI-ready summary
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                Deterministic briefing card
              </h2>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-foreground">{account.summary}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl border border-border bg-panel-muted p-2 text-foreground">
                <Radar className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Signal timeline
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Recent account activity
                </h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {account.timeline.map((event) => (
                <div key={event.id} className="rounded-2xl border border-border bg-panel-muted/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{event.title}</p>
                    <Badge tone={event.status === "Unmatched" ? "warning" : "accent"}>{event.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {event.sourceSystem} · {event.occurredAt}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground">{event.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl border border-border bg-panel-muted p-2 text-foreground">
                <UsersRound className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Contacts
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Active buying committee
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {account.contacts.map((contact) => (
                <div key={contact.id} className="rounded-2xl border border-border bg-panel-muted/70 p-4">
                  <p className="font-semibold text-foreground">{contact.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{contact.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{contact.department}</p>
                  <div className="mt-4 space-y-2 text-sm text-foreground">
                    <p className="inline-flex items-center gap-2">
                      <Mail className="size-4 text-accent" />
                      {contact.email}
                    </p>
                    {contact.phone ? <p>{contact.phone}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl border border-border bg-panel-muted p-2 text-foreground">
                <BriefcaseBusiness className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Open tasks
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Operator follow-up
                </h2>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {account.openTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-border bg-panel-muted/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{task.title}</p>
                    <Badge tone={task.priority === "Urgent" ? "danger" : task.priority === "High" ? "warning" : "neutral"}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                  <p className="mt-3 text-sm text-foreground">
                    {task.owner} · due {task.dueAt}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Score breakdown
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Why the score moved</h2>
            <div className="mt-6 space-y-3">
              {account.scoreBreakdown.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-panel-muted/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <span className="font-mono text-lg font-semibold text-foreground">+{item.value}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reasonCode}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Audit log
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Recent system decisions</h2>
            <div className="mt-6 space-y-3">
              {account.auditLog.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-border bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{entry.title}</p>
                    <span className="text-xs font-medium text-muted-foreground">{entry.createdAt}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-foreground">{entry.explanation}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Actor · {entry.actorName}
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

function Attribute({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-panel-muted/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
