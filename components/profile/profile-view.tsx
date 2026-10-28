"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  BadgeCheck, BookOpen, CalendarDays, Check, Clock, Download, FileText, GraduationCap,
  Loader2, Mail, Package, Pencil, ReceiptText, ShoppingBag, Sparkles, UserRound, X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyLibrary, updateMyProfile } from "@/server-functions/library";
import { formatPrice } from "@/components/product/product-card";
import { cn } from "@/modals/utils";

type LibraryUser = {
  _id?: string;
  name: string;
  email: string;
  username?: string;
  image?: string;
  role?: string;
  about?: string;
  phone?: string;
  createdOn?: string;
};

type LibraryCourse = {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  description?: string;
  level?: string;
  estimatedMinutes?: number;
  price?: number;
  currency?: string;
  accessType?: string;
  enrolledAt?: string;
  progressPercent?: number;
  enrollmentStatus?: string;
};

type LibraryProduct = {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  description?: string;
  price?: number;
  currency?: string;
  fileName?: string;
  fileSize?: number;
  orderId?: string;
  ownedAt?: string;
};

type LibraryOrder = {
  _id: string;
  orderId: string;
  status: string;
  itemType?: string;
  amount?: number;
  currency?: string;
  createdOn?: string;
  paidAt?: string;
  title: string;
  slug: string;
  thumbnail?: string;
};

type Library = {
  user: LibraryUser;
  courses: LibraryCourse[];
  products: LibraryProduct[];
  orders: LibraryOrder[];
  stats: { courses: number; products: number; pendingOrders: number; orders: number; spent: number; currency: string };
};

const statusStyles: Record<string, string> = {
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  cancelled: "border-zinc-500/30 bg-zinc-500/10 text-zinc-500",
  refunded: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const initials = (name?: string) =>
  String(name || "S").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

function EmptyState({ icon: Icon, title, text, action }: { icon: typeof BookOpen; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <Icon size={24} className="mx-auto text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export default function ProfileView() {
  const router = useRouter();
  const { status } = useSession();
  const [library, setLibrary] = useState<Library | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", username: "", about: "", phone: "", image: "" });

  const load = useCallback(async () => {
    const result = await getMyLibrary();
    if ("error" in result) {
      if ("requiresAuth" in result && result.requiresAuth) {
        router.replace("/auth?callbackUrl=/profile");
        return;
      }
      setError(result.error);
      setLibrary(null);
      return;
    }
    setLibrary(result as Library);
    setForm({
      name: result.user.name || "",
      username: result.user.username || "",
      about: result.user.about || "",
      phone: String(result.user.phone || ""),
      image: result.user.image || "",
    });
    setError(null);
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?callbackUrl=/profile");
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => { if (!cancelled) setError("Your library could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, load, router]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await updateMyProfile(form);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated");
      setEditing(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!library) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold">Library unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error || "Please sign in again to view your library."}</p>
        <Button asChild className="mt-5"><Link href="/auth?callbackUrl=/profile">Sign in</Link></Button>
      </div>
    );
  }

  const { user, stats } = library;
  const joined = user.createdOn ? new Date(user.createdOn).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="overflow-hidden border">
        <div className="relative h-28 bg-gradient-to-r from-primary/25 via-violet-500/20 to-sky-500/20 sm:h-32">
          <div className="absolute -left-10 -top-14 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
        </div>
        <div className="relative px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{user.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {user.username && <span>@{user.username}</span>}
                  <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 capitalize">
                    {user.role === "admin" ? <BadgeCheck size={11} /> : <UserRound size={11} />} {user.role || "student"}
                  </span>
                  {joined && <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> Joined {joined}</span>}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing((current) => !current)}>
              {editing ? <X size={14} /> : <Pencil size={14} />} {editing ? "Close editor" : "Edit profile"}
            </Button>
          </div>

          {user.about && !editing && <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{user.about}</p>}

          {editing && (
            <form onSubmit={saveProfile} className="mt-5 rounded-2xl border bg-muted/20 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name" className="text-xs">Name</Label>
                  <Input id="profile-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-username" className="text-xs">Username</Label>
                  <Input id="profile-username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-phone" className="text-xs">Phone</Label>
                  <Input id="profile-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="h-10" placeholder="Optional" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-image" className="text-xs">Avatar URL</Label>
                  <Input id="profile-image" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className="h-10" placeholder="https://…" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="profile-about" className="text-xs">About</Label>
                  <textarea
                    id="profile-about"
                    value={form.about}
                    onChange={(event) => setForm({ ...form, about: event.target.value })}
                    rows={3}
                    maxLength={500}
                    placeholder="A line or two about what you are learning."
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><Mail size={12} /> {user.email}</p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save changes
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Courses", value: stats.courses, icon: GraduationCap },
          { label: "Products", value: stats.products, icon: Package },
          { label: "Pending orders", value: stats.pendingOrders, icon: Clock },
          { label: "Total spent", value: formatPrice(stats.spent, stats.currency), icon: ShoppingBag },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card px-4 py-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <stat.icon size={14} className="text-muted-foreground" />
            </div>
            <p className="mt-1.5 text-xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="courses" className="mt-6">
        <TabsList className="h-10 bg-muted/60 p-1">
          <TabsTrigger value="courses" className="gap-1.5 text-xs sm:text-sm"><GraduationCap size={14} /> Courses ({stats.courses})</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5 text-xs sm:text-sm"><Package size={14} /> Products ({stats.products})</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 text-xs sm:text-sm"><ReceiptText size={14} /> Orders ({stats.orders})</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4">
          {library.courses.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No courses yet"
              text="Enrol in a free course or buy one to see it here with your progress."
              action={<Button asChild variant="outline"><Link href="/courses">Browse courses</Link></Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {library.courses.map((course) => (
                <Card key={course._id} className="flex gap-3 overflow-hidden p-3">
                  <Link href={`/course/${course.slug}`} className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground"><BookOpen size={20} /></div>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/course/${course.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">{course.title}</Link>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {course.enrollmentStatus === "completed" ? "Completed" : "Enrolled"}
                      {course.enrolledAt ? ` · ${new Date(course.enrolledAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : ""}
                    </p>
                    <div className="mt-auto pt-2">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Progress</span><span>{course.progressPercent ?? 0}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${course.progressPercent ?? 0}%` }} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          {library.products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products yet"
              text="Free downloads and confirmed purchases appear here with their files."
              action={<Button asChild variant="outline"><Link href="/products">Browse products</Link></Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {library.products.map((product) => (
                <Card key={product._id} className="flex flex-col overflow-hidden">
                  <Link href={`/product/${product.slug}`} className="relative block aspect-[16/9] bg-muted">
                    {product.thumbnail ? (
                      <img src={product.thumbnail} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground"><Package size={22} /></div>
                    )}
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <BadgeCheck size={11} /> Owned
                    </span>
                  </Link>
                  <div className="flex flex-1 flex-col p-3.5">
                    <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">{product.title}</Link>
                    <p className="mt-1 text-[11px] text-muted-foreground">{product.orderId ? `Order ${product.orderId}` : "Free download"}</p>
                    <div className="mt-auto flex gap-2 pt-3">
                      <Button asChild size="sm" className="flex-1 gap-1.5">
                        <a href={`/api/download/${product._id}`}><Download size={13} /> Download</a>
                      </Button>
                      <Button asChild size="sm" variant="outline"><Link href={`/product/${product.slug}`}>Open</Link></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          {library.orders.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No orders yet"
              text="Claims and purchases are recorded here so you always know what you own."
              action={<Button asChild variant="outline"><Link href="/products">Explore products</Link></Button>}
            />
          ) : (
            <Card className="divide-y overflow-hidden">
              {library.orders.map((order) => (
                <div key={order._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    {order.itemType === "course" ? <GraduationCap size={16} /> : order.itemType === "blog" ? <FileText size={16} /> : <Package size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={order.itemType === "course" ? `/course/${order.slug}` : order.itemType === "blog" ? `/t/${order.slug}` : `/product/${order.slug}`}
                      className="line-clamp-1 text-sm font-medium hover:text-primary"
                    >
                      {order.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {order.orderId}
                      {order.createdOn ? ` · ${new Date(order.createdOn).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : ""}
                    </p>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize", statusStyles[order.status] || "bg-muted text-muted-foreground")}>
                    {order.status}
                  </span>
                  <span className="w-20 text-right text-sm font-semibold">{formatPrice(order.amount, order.currency)}</span>
                </div>
              ))}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed bg-muted/20 px-5 py-4 text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-2"><Sparkles size={14} className="text-primary" /> Everything you claim or buy stays linked to {user.email}.</p>
        <Link href="/products" className="font-medium text-primary hover:underline">Find more resources →</Link>
      </div>
    </div>
  );
}
