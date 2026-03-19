const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success",
  closing: "bg-warning/10 text-warning",
  closed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "진행중",
  closing: "마감임박",
  closed: "마감",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status] || statusStyles.active}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {type}
    </span>
  );
}
