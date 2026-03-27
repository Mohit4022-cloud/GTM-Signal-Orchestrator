import { ArrowRight, LayoutPanelTop, Sparkles } from "lucide-react";

import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import type { ModulePlaceholderConfig } from "@/lib/types";

export function ModulePlaceholder({ config }: { config: ModulePlaceholderConfig }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Badge tone="accent">{config.eyebrow}</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {config.title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl border border-accent/15 bg-accent-muted p-2 text-accent">
              <LayoutPanelTop className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Planned capabilities</h2>
              <p className="text-sm text-muted-foreground">
                Scoped for the next product increments.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {config.capabilities.map((capability) => (
              <div
                key={capability}
                className="flex items-start gap-3 rounded-2xl border border-border bg-panel-muted/70 px-4 py-3"
              >
                <ArrowRight className="mt-0.5 size-4 text-accent" />
                <p className="text-sm leading-6 text-foreground">{capability}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl border border-border bg-panel-muted p-2 text-foreground">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Seeded workspace context</h2>
              <p className="text-sm text-muted-foreground">
                Existing demo data already prepared for this module.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-border bg-panel-muted/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {config.teaserLabel}
              </p>
              <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
                {config.teaserValue}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-panel-muted/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {config.secondaryLabel}
              </p>
              <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
                {config.secondaryValue}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
