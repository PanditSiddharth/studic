"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  ArrowDown, ArrowLeft, ArrowUp, BookOpen, Clock3, Eye, Globe2, GraduationCap,
  ImageIcon, IndianRupee, Languages, ListVideo, Loader2, Package, Plus, Tags,
  Trash2, TriangleAlert,
} from "lucide-react";
import { ZodCourseSchema } from "@/modals/zod";
import type { ICourse } from "@/modals/course.model";
import type { IBlog } from "@/modals/blog.model";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/product/image-upload";
import { FormActionsBar, FormPageHeader, FormSection, StatusSelect } from "@/components/admin/form-ui";
import { TagInput } from "@/components/admin/tag-input";
import { ProductPicker } from "@/components/admin/product-picker";
import type { ProductOption } from "@/server-functions/product";
import { courseFilter } from "@/helpers";
import { addOrUpdateCourse } from "@/server-functions/course";
import { MyField } from "../myField";
import { generateSlug, getActionError, getCourseDefault, isValidSlug, toIdList } from "../helpers";
import BlogPicker from "./blogs-update";

type CourseFormValues = z.infer<typeof ZodCourseSchema>;

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "private", label: "Private" },
  { value: "published", label: "Published" },
  { value: "unlisted", label: "Unlisted (link only)" },
  { value: "archived", label: "Archived" },
];

const levelOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all-levels", label: "All levels" },
];

const PLACEHOLDER = "/placeholder.png";

export default function AddCourseForm({
  initialValue,
  initialPlaylist = [],
  productOptions = [],
  loadError,
}: {
  initialValue?: Partial<ICourse>;
  initialPlaylist?: IBlog[];
  productOptions?: ProductOption[];
  loadError?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isEditing = Boolean(initialValue?._id);
  const [slugLocked, setSlugLocked] = useState(Boolean(initialValue?.slug));
  const [playlist, setPlaylist] = useState<IBlog[]>(initialPlaylist);
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(ZodCourseSchema),
    defaultValues: getCourseDefault(initialValue),
    mode: "onBlur",
  });

  const title = form.watch("title") || "";
  const slug = form.watch("slug") || "";
  const description = form.watch("description") || "";
  const status = form.watch("status") || "draft";
  const accessType = form.watch("accessType");

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert size={18} />
            </span>
            <div>
              <h1 className="text-lg font-semibold">This course could not be loaded</h1>
              <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/admin/courses"><ArrowLeft size={15} /> Back to courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const syncPlaylist = (blogs: IBlog[]) => {
    setPlaylist(blogs);
    form.setValue("content", blogs.map((blog) => String(blog._id ?? "")).filter(Boolean), { shouldDirty: true });
  };

  const moveArticle = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= playlist.length) return;
    const next = [...playlist];
    [next[index], next[target]] = [next[target], next[index]];
    syncPlaylist(next);
  };

  const removeArticle = (index: number) => {
    syncPlaylist(playlist.filter((_, i) => i !== index));
  };

  const onInvalid = (errors: FieldErrors<CourseFormValues>) => {
    const first = Object.values(errors).find(Boolean) as { message?: string } | undefined;
    toast.error(first?.message || "Please review the highlighted fields.");
  };

  const onSubmit = async (data: CourseFormValues) => {
    if (!isValidSlug(data.slug)) {
      form.setError("slug", { message: "Use lowercase letters, numbers and single hyphens only" });
      return;
    }
    if (data.accessType === "paid" && (data.price ?? 0) <= 0) {
      form.setError("price", { message: "Add a price, or switch the course to free" });
      return;
    }
    if (data.status === "published" && !toIdList(data.content).length) {
      toast.error("Add at least one article before publishing this course.");
      return;
    }

    try {
      const publishedAt = data.status === "published" ? (data.publishedAt ?? new Date()) : data.publishedAt;
      const payload = courseFilter({
        ...data,
        _id: isEditing ? initialValue?._id : undefined,
        author: data.author || session?.user?._id,
        price: data.accessType === "paid" ? data.price : 0,
        content: toIdList(data.content),
        products: toIdList(data.products),
        publishedAt,
      });

      const result = await addOrUpdateCourse(payload);
      const failure = getActionError(result);
      if (failure) {
        toast.error(failure);
        return;
      }

      toast.success(isEditing ? "Course updated" : "Course created");
      router.push("/admin/courses");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not save this course. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="mx-auto w-full max-w-6xl px-5 pb-10 pt-6 sm:px-8">
        <FormPageHeader
          eyebrow={isEditing ? "Edit course" : "New course"}
          title={title || (isEditing ? "Edit course" : "Untitled course")}
          status={status}
          description={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><Globe2 size={13} />/course/{slug || "your-course-slug"}</span>
              <span className="inline-flex items-center gap-1.5"><ListVideo size={13} />{playlist.length} article{playlist.length === 1 ? "" : "s"}</span>
            </span>
          }
          actions={
            <>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/courses"><ArrowLeft size={15} /> All courses</Link>
              </Button>
              {isEditing && initialValue?.slug ? (
                <Button asChild type="button" variant="outline">
                  <Link href={`/course/${initialValue.slug}`} target="_blank"><Eye size={15} /> Preview</Link>
                </Button>
              ) : null}
            </>
          }
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_336px]">
          <div className="space-y-6">
            <FormSection title="Course details" description="The essentials students see on the course page." icon={GraduationCap}>
              <MyField
                form={form}
                name="title"
                label="Title"
                required
                placeholder="e.g. Complete guide to campus placements"
                description={
                  <span className="flex items-center justify-between gap-3">
                    <span>Make the outcome clear.</span>
                    <span className="tabular-nums">{title.length}/160</span>
                  </span>
                }
                fields={{
                  maxLength: 160,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    const value = event.target.value;
                    form.setValue("title", value, { shouldDirty: true });
                    if (!slugLocked) form.setValue("slug", generateSlug(value), { shouldDirty: true });
                  },
                }}
              />

              <MyField
                form={form}
                name="slug"
                label="URL slug"
                required
                description="Lowercase letters, numbers and hyphens only."
                input={(field) => (
                  <div className="flex overflow-hidden rounded-md border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring">
                    <span className="flex shrink-0 items-center border-r bg-muted/40 px-2.5 text-xs text-muted-foreground">/course/</span>
                    <input
                      {...field}
                      value={field.value ?? ""}
                      maxLength={180}
                      placeholder="your-course-slug"
                      onChange={(event) => {
                        setSlugLocked(true);
                        field.onChange(generateSlug(event.target.value));
                      }}
                      className="h-9 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSlugLocked(true);
                        form.setValue("slug", generateSlug(form.getValues("title")), { shouldDirty: true, shouldValidate: true });
                      }}
                      className="shrink-0 border-l px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Generate
                    </button>
                  </div>
                )}
              />

              <MyField
                form={form}
                name="description"
                label="Description"
                required
                description={
                  <span className="flex items-center justify-between gap-3">
                    <span>Explain what students will learn.</span>
                    <span className="tabular-nums">{description.length}/10000</span>
                  </span>
                }
                input={(field) => (
                  <Textarea
                    {...field}
                    rows={5}
                    maxLength={10000}
                    className="resize-none"
                    placeholder="What will students walk away with?"
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Curriculum"
              description="Choose the articles in this course. Students work through them in this order."
              icon={ListVideo}
              footer={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">{playlist.length ? "Drag-free ordering — use the arrows to reorder." : "No articles yet."}</p>
                  <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                    <Plus size={15} /> {playlist.length ? "Manage articles" : "Add articles"}
                  </Button>
                </div>
              }
            >
              {playlist.length ? (
                <ol className="space-y-2">
                  {playlist.map((article, index) => (
                    <li key={`${article._id ?? article.slug}-${index}`} className="flex items-center gap-3 rounded-xl border bg-background p-2.5">
                      <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">{index + 1}</span>
                      <span className="relative block aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={article.thumbnail || PLACEHOLDER}
                          alt={article.title || "Article cover"}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{article.title || "(Untitled)"}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">/{article.slug}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          aria-label="Move article up"
                          disabled={index === 0}
                          onClick={() => moveArticle(index, -1)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move article down"
                          disabled={index === playlist.length - 1}
                          onClick={() => moveArticle(index, 1)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${article.title}`}
                          onClick={() => removeArticle(index)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 size={15} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 px-4 py-10 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpen size={20} />
                  </span>
                  <span className="text-sm font-medium">Build your curriculum</span>
                  <span className="text-xs text-muted-foreground">Add existing articles from your library — nothing is duplicated.</span>
                </button>
              )}
            </FormSection>

            <FormSection
              title="Included downloads"
              description="Attach products such as PDFs, notes or templates. Enrolled students can download them from the course page."
              icon={Package}
            >
              <MyField
                form={form}
                name="products"
                label="Products"
                description="Paid products stay locked until a student enrolls or buys them separately."
                input={(field) => (
                  <ProductPicker
                    value={toIdList(field.value)}
                    onChange={field.onChange}
                    options={productOptions}
                    placeholder="Search products to include…"
                  />
                )}
              />
            </FormSection>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <FormSection title="Publishing" description="Control who can see this course." icon={Globe2}>
              <MyField
                form={form}
                name="status"
                label="Visibility"
                description="Published courses appear in the catalogue."
                input={(field) => <StatusSelect value={field.value} onChange={field.onChange} options={statusOptions} />}
              />
              <MyField
                form={form}
                name="thumbnail"
                label="Cover image"
                required
                description="Shown on course cards and at the top of the course."
                input={(field) => <ImageUpload onChange={field.onChange} img_src={field.value} />}
              />
            </FormSection>

            <FormSection title="Access & pricing" description="How students unlock this course." icon={IndianRupee}>
              <MyField form={form} name="accessType" label="Access type" input={(field) => (
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "free", label: "Free", hint: "Open to everyone" },
                      { value: "paid", label: "Paid", hint: "One-time purchase" },
                    ] as const).map((option) => {
                      const active = field.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            field.onChange(option.value);
                            if (option.value === "free") form.setValue("price", 0, { shouldDirty: true });
                          }}
                          className={`rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/40"}`}
                        >
                          <span className="block text-sm font-medium">{option.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              {accessType === "paid" ? (
                <MyField
                  form={form}
                  name="price"
                  label="Price (INR)"
                  required
                  input={(field) => (
                    <div className="flex overflow-hidden rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring">
                      <span className="flex items-center border-r bg-muted/40 px-2.5 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        value={field.value ? field.value : ""}
                        onChange={(event) => field.onChange(event.target.value === "" ? 0 : Number(event.target.value))}
                        className="h-9 rounded-none border-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  )}
                />
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <MyField
                  form={form}
                  name="level"
                  label="Level"
                  input={(field) => <StatusSelect value={field.value} onChange={field.onChange} options={levelOptions} />}
                />
                <MyField
                  form={form}
                  name="language"
                  label="Language"
                  placeholder="e.g. English"
                  input={(field) => (
                    <div className="relative">
                      <Languages size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input {...field} value={field.value ?? ""} className="pl-8" placeholder="English" maxLength={40} />
                    </div>
                  )}
                />
              </div>

              <MyField
                form={form}
                name="estimatedMinutes"
                label="Estimated duration"
                description="Optional. Total time to complete the course."
                input={(field) => (
                  <div className="flex overflow-hidden rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring">
                    <span className="flex items-center gap-1.5 border-r bg-muted/40 px-2.5 text-xs text-muted-foreground"><Clock3 size={13} /> min</span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={field.value ? field.value : ""}
                      onChange={(event) => field.onChange(event.target.value === "" ? 0 : Number(event.target.value))}
                      className="h-9 rounded-none border-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                )}
              />

              <MyField
                form={form}
                name="landingPage"
                label="Landing page"
                description="Optional custom URL for this course."
                placeholder="https://…"
                fields={{ type: "url" }}
              />
            </FormSection>

            <FormSection title="Organisation" description="Help students discover and prepare for this course." icon={Tags}>
              <MyField
                form={form}
                name="tags"
                label="Tags"
                description="Short keywords used in search and recommendations."
                input={(field) => (
                  <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="e.g. placements" addLabel="Add" />
                )}
              />
              <MyField
                form={form}
                name="prerequisites"
                label="Prerequisites"
                description="Optional. What should students know first?"
                input={(field) => (
                  <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="e.g. Basic JavaScript" addLabel="Add" />
                )}
              />
            </FormSection>

            <div className="rounded-2xl border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ImageIcon size={14} /> Tip</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                A clear outline and a 16:9 cover help students decide whether this course is right for them.
              </p>
            </div>
          </aside>
        </div>

        <FormActionsBar
          hint={form.formState.isDirty ? "You have unsaved changes." : isEditing ? "Editing an existing course." : "Nothing saved yet."}
        >
          <Button asChild type="button" variant="outline">
            <Link href="/admin/courses">Cancel</Link>
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create course"}
          </Button>
        </FormActionsBar>

        <BlogPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          initialSelected={playlist}
          onConfirm={syncPlaylist}
        />
      </form>
    </Form>
  );
}
