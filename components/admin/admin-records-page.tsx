import { getAdminRecords, type AdminRecordKind } from "@/server-functions/admin-records";
import OrderActions from "@/components/admin/order-actions";

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
    return String(course || product || row.itemType || "—");
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

  return <main className="min-h-screen space-y-6 p-5 sm:p-8">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Platform management</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{page.title}</h1><p className="mt-2 text-sm text-muted-foreground">{page.description}</p></div>
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-4"><div><p className="font-medium">Latest records</p><p className="mt-1 text-xs text-muted-foreground">Showing up to 100 most recent records</p></div><span className="rounded-full border px-3 py-1 text-xs">{result.records.length} records</span></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{page.columns.map((column) => <th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">{column.label}</th>)}</tr></thead>
          <tbody className="divide-y">{result.records.map((record: any, index: number) => <tr key={record._id || index} className="align-top hover:bg-muted/20">{page.columns.map((column) => <td key={column.key} className="max-w-[280px] px-4 py-3">{column.key === "actions" ? <OrderActions orderId={record.orderId} status={record.status} /> : <span className={column.key === "status" ? "inline-flex rounded-full border px-2 py-1 text-xs capitalize" : "block whitespace-normal"}>{valueAt(record, column.key)}</span>}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {result.records.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nothing here yet. Records will appear when users interact with Studic.</p>}
    </div>
    <p className="text-xs text-muted-foreground">This view is read-only for now. Status changes and moderation actions should be wired to validated admin-only server actions before being enabled.</p>
  </main>;
}
