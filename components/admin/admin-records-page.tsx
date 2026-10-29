import { getAdminRecords, type AdminRecordKind } from "@/server-functions/admin-records";
import OrderActions from "@/components/admin/order-actions";
import { ClipboardList, Inbox, Star } from "lucide-react";
import RecordStatusControl from "@/components/admin/record-status-control";

const config: Record<AdminRecordKind, { title: string; description: string; columns: { key: string; label: string }[] }> = {
  orders: { title: "Orders", description: "Payment and purchase records from the order model.", columns: [
    { key: "orderId", label: "Order ID" }, { key: "buyer.name", label: "Buyer" }, { key: "item", label: "Item" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "createdOn", label: "Created" }, { key: "actions", label: "Actions" },
  ]},
  enrollments: { title: "Enrollments", description: "Course access, progress and completion records.", columns: [
    { key: "user.name", label: "Student" }, { key: "course.title", label: "Course" }, { key: "status", label: "Status" }, { key: "progressPercent", label: "Progress" }, { key: "enrolledAt", label: "Enrolled" },
  ]},
  reviews: { title: "Reviews", description: "Moderation queue and feedback attached to courses or products.", columns: [
    { key: "user.name", label: "Reviewer" }, { key: "item", label: "For" }, { key: "rating", label: "Rating" }, { key: "comment", label: "Comment" }, { key: "status", label: "Status" }, { key: "createdOn", label: "Created" },
  ]},
  queries: { title: "Support queries", description: "Incoming support requests and their current status.", columns: [
    { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "description", label: "Message" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "createdOn", label: "Received" },
  ]},
};

function valueAt(row: Record<string, unknown>, path: string) {
  const nested = (value: unknown, key: string) =>
    value !== null && typeof value === "object" && key in value
      ? (value as Record<string, unknown>)[key]
      : undefined;
  if (path === "item") {
    const course = nested(row.course, "title");
    const product = nested(row.product, "title");
    const blog = nested(row.blog, "title");
    return String(course || product || blog || row.itemType || "—");
  }
  const value = path.split(".").reduce(nested, row as unknown);
  if (value == null || value === "") return "—";
  if (path === "amount") return new Intl.NumberFormat("en-IN", { style: "currency", currency: String(row.currency || "INR"), maximumFractionDigits: 2 }).format(Number(value));
  if (path === "createdOn" || path === "enrolledAt") {
    const dateValue = value instanceof Date || typeof value === "string" || typeof value === "number" ? value : String(value);
    return new Date(dateValue).toLocaleString("en-IN", { dateStyle: "medium" });
  }
  if (path === "progressPercent") return `${value}%`;
  if (path === "rating") return `${value}/5`;
  return String(value).replaceAll("_", " ");
}

export default async function AdminRecordsPage({ kind }: { kind: AdminRecordKind }) {
  const result = await getAdminRecords(kind);
  const page = config[kind];
  if ("error" in result) return <main className="p-8"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2 text-sm text-muted-foreground">An administrator account is required.</p></main>;

  const Icon = kind === "reviews" ? Star : kind === "queries" ? Inbox : ClipboardList;
  return <main className="min-h-screen space-y-6 p-4 sm:p-8">
    <div className="flex flex-col gap-5 rounded-3xl border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <div><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={21}/></div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Platform management</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{page.title}</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">{page.description}</p></div>
      <div className="rounded-2xl bg-muted/60 px-5 py-3"><p className="text-2xl font-semibold">{result.records.length}</p><p className="text-xs text-muted-foreground">recent records</p></div>
    </div>
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="font-semibold">Latest records</p><p className="mt-1 text-xs text-muted-foreground">Showing up to 100 most recent records</p></div><span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{result.records.length} loaded</span></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{page.columns.map((column) => <th key={column.key} className="whitespace-nowrap px-5 py-3 font-semibold">{column.label}</th>)}</tr></thead>
          <tbody className="divide-y">{result.records.map((record: any, index: number) => <tr key={record._id || index} className="align-top transition-colors hover:bg-primary/[0.03]">{page.columns.map((column) => <td key={column.key} className="max-w-[280px] px-5 py-4">{column.key === "actions" ? <OrderActions orderId={record.orderId} status={record.status} /> : column.key === "status" && kind !== "orders" ? <RecordStatusControl kind={kind} id={String(record._id)} status={String(record.status || (kind === "reviews" ? "pending" : kind === "queries" ? "open" : "active"))} /> : <span className={column.key === "status" ? "inline-flex rounded-full border bg-muted px-2.5 py-1 text-xs font-medium capitalize" : "block whitespace-normal"}>{valueAt(record, column.key)}</span>}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {result.records.length === 0 && <div className="flex flex-col items-center px-6 py-16 text-center"><Icon className="text-muted-foreground/40" size={32}/><p className="mt-3 text-sm font-medium">Nothing here yet</p><p className="mt-1 text-sm text-muted-foreground">Records will appear when users interact with Studic.</p></div>}
    </div>
    <p className="px-1 text-xs text-muted-foreground">Read-only view · Data is sorted by most recent activity.</p>
  </main>;
}
