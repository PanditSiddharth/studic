import Link from "next/link";
import { getAdminOverview } from "@/server-functions/admin-overview";
import {
  Activity, ArrowUpRight, BookOpen, Boxes, CircleDollarSign, FileText,
  GraduationCap, MessageSquare, Package, ShoppingCart, Star, Users,
} from "lucide-react";

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(value || 0);

export default async function AdminHomePage() {
  const result = await getAdminOverview();

  if ("error" in result) {
    return <main className="p-8"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2 text-muted-foreground">An administrator account is required to view this dashboard.</p></main>;
  }

  const s = result.stats;
  const stats = [
    { label: "Total users", value: s.users, note: `${s.sellers} sellers`, icon: Users, href: "/admin/users" },
    { label: "Courses", value: s.courses, note: "All course records", icon: GraduationCap, href: "/admin/courses" },
    { label: "Articles", value: s.articles, note: "Reusable learning content", icon: FileText, href: "/admin/blogs" },
    { label: "Products", value: s.products, note: "Digital products", icon: Package, href: "/admin/products" },
    { label: "Monthly revenue", value: money(s.monthlyRevenue), note: "Paid orders this month", icon: CircleDollarSign, href: "/admin/orders" },
    { label: "Orders", value: s.orders, note: "All order records", icon: ShoppingCart, href: "/admin/orders" },
    { label: "Active enrollments", value: s.activeEnrollments, note: "Current course access", icon: BookOpen, href: "/admin/enrollments" },
    { label: "Needs attention", value: s.pendingReviews + s.openQueries, note: `${s.pendingReviews} reviews · ${s.openQueries} support queries`, icon: Activity, href: "/admin/queries" },
  ];

  return (
    <main className="min-h-screen space-y-8 p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">STUDIC CONTROL CENTER</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">A live overview of your learning platform.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted" href="/admin/add-course"><GraduationCap size={16}/> New course</Link>
          <Link className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90" href="/admin/add-blog"><FileText size={16}/> New article</Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group rounded-2xl border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon size={18} className="text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div className="mt-4 text-3xl font-semibold tracking-tight">{stat.value}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{stat.note}</span><ArrowUpRight size={14} />
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b p-5">
            <div><h2 className="font-semibold">Recently updated courses</h2><p className="mt-1 text-sm text-muted-foreground">Latest course changes from the database</p></div>
            <Link href="/admin/courses" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {result.recentCourses.length ? <div className="divide-y">{result.recentCourses.map((course: { _id: string; title: string; slug: string; status: string; accessType?: string; price?: number }) => (
            <Link key={course._id} href={`/admin/add-course?slug=${encodeURIComponent(course.slug)}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{course.title}</p><p className="mt-1 text-xs text-muted-foreground">{course.slug}</p></div>
              <div className="shrink-0 text-right"><span className="rounded-full border px-2 py-1 text-xs capitalize">{course.status}</span><p className="mt-2 text-xs text-muted-foreground">{course.accessType === "paid" ? money(course.price || 0) : "Free"}</p></div>
            </Link>
          ))}</div> : <p className="p-5 text-sm text-muted-foreground">No courses have been created yet.</p>}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b p-5">
            <div><h2 className="font-semibold">Recent orders</h2><p className="mt-1 text-sm text-muted-foreground">Latest order activity</p></div>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {result.recentOrders.length ? <div className="divide-y">{result.recentOrders.map((order: { _id: string; orderId: string; status: string; amount: number; currency?: string; itemType?: string; createdOn?: string }) => (
            <div key={order._id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{order.orderId}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{order.itemType || "Order"}{order.createdOn ? ` · ${new Date(order.createdOn).toLocaleDateString("en-IN")}` : ""}</p></div>
              <div className="shrink-0 text-right"><p className="text-sm font-medium">{money(order.amount || 0)}</p><span className="text-xs capitalize text-muted-foreground">{order.status.replaceAll("_", " ")}</span></div>
            </div>
          ))}</div> : <p className="p-5 text-sm text-muted-foreground">No orders have been recorded yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Manage Studic</h2>
        <p className="mt-1 text-sm text-muted-foreground">Jump into a content or platform workflow.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Articles & products", detail: "Edit learning content and attached downloads", href: "/admin/blogs", icon: FileText },
            { label: "Users & sellers", detail: "Review accounts and roles", href: "/admin/users", icon: Users },
            { label: "Reviews", detail: "Moderate community feedback", href: "/admin/reviews", icon: Star },
            { label: "Support queries", detail: "Respond to submitted questions", href: "/admin/queries", icon: MessageSquare },
          ].map((item) => <Link key={item.label} href={item.href} className="rounded-xl border p-4 hover:border-primary/50 hover:bg-muted/30"><item.icon size={18} className="mb-3 text-primary"/><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p></Link>)}
        </div>
      </section>
    </main>
  );
}
