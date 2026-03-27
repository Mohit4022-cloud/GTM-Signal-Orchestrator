export default function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-5 w-28 rounded-full bg-panel-muted" />
        <div className="h-10 w-72 rounded-2xl bg-panel-muted" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-panel-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 rounded-[28px] border border-border bg-panel" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="h-[320px] rounded-[28px] border border-border bg-panel" />
        <div className="h-[320px] rounded-[28px] border border-border bg-panel" />
      </div>
    </div>
  );
}
