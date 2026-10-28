"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, BookOpen, Clock3, Eye, FileText, Globe2, ImageIcon,
  Loader2, Package, Search, Sparkles, Tag, TriangleAlert,
} from "lucide-react";
import { ZodBlogSchema } from "@/modals/zod";
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
import { blogFilter } from "@/helpers";
import { addOrUpdateBlog } from "@/server-functions/blog";
import { MyField } from "../myField";
import MyEditor from "../editor";
import { generateSlug, getActionError, getBlogDefaults, isValidSlug, toIdList } from "../helpers";

type BlogFormValues = z.infer<typeof ZodBlogSchema>;

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted (link only)" },
  { value: "free", label: "Free (legacy access)" },
  { value: "paid", label: "Paid (legacy access)" },
];

export default function AddBlogForm({
  initialValue,
  loadError,
  productOptions = [],
}: {
  initialValue?: Partial<IBlog>;
  loadError?: string;
  productOptions?: ProductOption[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isEditing = Boolean(initialValue?._id);
  const [slugLocked, setSlugLocked] = useState(Boolean(initialValue?.slug));

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(ZodBlogSchema),
    defaultValues: getBlogDefaults(initialValue),
    mode: "onBlur",
  });

  const title = form.watch("title") || "";
  const slug = form.watch("slug") || "";
  const description = form.watch("description") || "";
  const seoTitle = form.watch("seoTitle") || "";
  const seoDescription = form.watch("seoDescription") || "";
  const status = form.watch("status") || "draft";

  const previewTitle = seoTitle || title || "Article title";
  const previewDescription = seoDescription || description || "Add a short description so readers know what this article covers.";
  const categories = form.watch("category") || [];
  const firstCategory = categories[0];
  const publicPath = useMemo(
    () => `/t/${firstCategory || "category"}/${slug || "your-article-slug"}`,
    [firstCategory, slug]
  );
  const previewHref = initialValue?.slug
    ? firstCategory
      ? `/t/${firstCategory}/${initialValue.slug}`
      : `/t/${initialValue.slug}`
    : null;

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert size={18} />
            </span>
            <div>
              <h1 className="text-lg font-semibold">This article could not be loaded</h1>
              <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/admin/blogs"><ArrowLeft size={15} /> Back to articles</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const onInvalid = (errors: FieldErrors<BlogFormValues>) => {
    const first = Object.values(errors).find(Boolean) as { message?: string } | undefined;
    toast.error(first?.message || "Please review the highlighted fields.");
  };

  const onSubmit = async (data: BlogFormValues) => {
    if (!isValidSlug(data.slug)) {
      form.setError("slug", { message: "Use lowercase letters, numbers and single hyphens only" });
      return;
    }
    if (data.status === "public" && !(data.category || []).length) {
      form.setError("category", { message: "Add a category — it is part of the public article URL" });
      toast.error("Add a category before publishing this article.");
      return;
    }

    try {
      const publishedAt = data.status === "public" ? (data.publishedAt ?? new Date()) : data.publishedAt;
      const payload = blogFilter({
        ...data,
        _id: isEditing ? initialValue?._id : undefined,
        products: toIdList(data.products),
        author: data.author || session?.user?._id,
        publishedAt,
      });

      const result = await addOrUpdateBlog(payload);
      const failure = getActionError(result);
      if (failure) {
        toast.error(failure);
        return;
      }

      toast.success(isEditing ? "Article updated" : "Article created");
      router.push("/admin/blogs");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not save this article. Please try again.");
    }
  };

  const saveLabel = isEditing ? "Save changes" : "Create article";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="mx-auto w-full max-w-6xl px-5 pb-10 pt-6 sm:px-8">
        <FormPageHeader
          eyebrow={isEditing ? "Edit article" : "New article"}
          title={title || (isEditing ? "Edit article" : "Untitled article")}
          status={status}
          description={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><Globe2 size={13} />{publicPath}</span>
              <span className="text-muted-foreground/70">Articles are reusable across courses.</span>
            </span>
          }
          actions={
            <>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/blogs"><ArrowLeft size={15} /> All articles</Link>
              </Button>
              {previewHref ? (
                <Button asChild type="button" variant="outline">
                  <Link href={previewHref} target="_blank"><Eye size={15} /> Preview</Link>
                </Button>
              ) : null}
            </>
          }
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_336px]">
          <div className="space-y-6">
            <FormSection
              title="Article details"
              description="The headline, URL and summary readers see first."
              icon={FileText}
            >
              <MyField
                form={form}
                name="title"
                label="Title"
                required
                placeholder="e.g. Building a study routine that actually works"
                description={
                  <span className="flex items-center justify-between gap-3">
                    <span>Keep it specific and human.</span>
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
                    <span className="flex shrink-0 items-center border-r bg-muted/40 px-2.5 text-xs text-muted-foreground">/t/{firstCategory || "category"}/</span>
                    <input
                      {...field}
                      value={field.value ?? ""}
                      maxLength={180}
                      placeholder="your-article-slug"
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
                label="Short description"
                description={
                  <span className="flex items-center justify-between gap-3">
                    <span>Used on cards, search results and previews.</span>
                    <span className="tabular-nums">{description.length}/10000</span>
                  </span>
                }
                input={(field) => (
                  <Textarea
                    {...field}
                    rows={4}
                    maxLength={10000}
                    className="resize-none"
                    placeholder="Summarise the article in a sentence or two…"
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Content"
              description="Write in Markdown. Use the toolbar to format text and insert images."
              icon={BookOpen}
              contentClassName="px-0 py-0 sm:px-0"
            >
              <MyField
                form={form}
                name="content"
                className="space-y-0"
                input={(field) => (
                  <MyEditor
                    onChange={field.onChange}
                    value={field.value}
                    height={520}
                    placeholder="Start writing your article…"
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Search appearance"
              description="Optional overrides for how this article appears in search engines."
              icon={Search}
            >
              <MyField
                form={form}
                name="seoTitle"
                label="SEO title"
                placeholder={title || "Defaults to the article title"}
                description={
                  <span className="flex items-center justify-between gap-3">
                    <span>Leave blank to use the article title.</span>
                    <span className="tabular-nums">{seoTitle.length}/160</span>
                  </span>
                }
                fields={{ maxLength: 160 }}
              />
              <MyField
                form={form}
                name="seoDescription"
                label="SEO description"
                description={
                  <span className="flex items-center justify-between gap-3">
                    <span>Leave blank to use the short description.</span>
                    <span className="tabular-nums">{seoDescription.length}/320</span>
                  </span>
                }
                input={(field) => (
                  <Textarea {...field} rows={3} maxLength={320} className="resize-none" placeholder="A concise summary for search engines…" />
                )}
              />

              <div className="rounded-xl border bg-background p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles size={13} /> Search preview</p>
                <p className="mt-2 truncate text-xs text-emerald-600 dark:text-emerald-400">studic.example › t › {firstCategory || "category"} › {slug || "your-article-slug"}</p>
                <p className="mt-1 line-clamp-2 text-base font-medium text-sky-700 dark:text-sky-400">{previewTitle}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{previewDescription}</p>
              </div>
            </FormSection>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <FormSection title="Publishing" description="Control who can see this article." icon={Globe2}>
              <MyField
                form={form}
                name="status"
                label="Visibility"
                description="Public articles appear in the library and search."
                input={(field) => (
                  <StatusSelect value={field.value} onChange={field.onChange} options={statusOptions} />
                )}
              />

              <MyField
                form={form}
                name="thumbnail"
                label="Cover image"
                description="Used on cards and at the top of the article."
                input={(field) => <ImageUpload onChange={field.onChange} img_src={field.value} />}
              />
            </FormSection>

            <FormSection title="Organisation" description="Help readers find this article." icon={Tag}>
              <MyField
                form={form}
                name="category"
                label="Categories"
                description="Press Enter to add. The first category becomes the public URL segment."
                input={(field) => (
                  <TagInput
                    value={field.value ?? []}
                    onChange={(value) => {
                      field.onChange(value);
                      form.clearErrors("category");
                    }}
                    placeholder="e.g. Study skills"
                    addLabel="Add"
                  />
                )}
              />
              <MyField
                form={form}
                name="tags"
                label="Tags"
                description="Short keywords used in search and recommendations."
                input={(field) => (
                  <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="e.g. productivity" addLabel="Add" />
                )}
              />
              <MyField
                form={form}
                name="estimatedMinutes"
                label="Reading time"
                description="Optional. Helps readers plan their time."
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
            </FormSection>

            <FormSection
              title="Related products"
              description="Offer products alongside this article."
              icon={Package}
            >
              <MyField
                form={form}
                name="products"
                label="Products"
                description="Shown under the article. Draft products stay hidden until published."
                input={(field) => (
                  <ProductPicker
                    value={toIdList(field.value)}
                    onChange={field.onChange}
                    options={productOptions}
                  />
                )}
              />
            </FormSection>

            <div className="rounded-2xl border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ImageIcon size={14} /> Tip</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Add a 16:9 cover image and a clear description — both are used wherever this article is shared.
              </p>
            </div>
          </aside>
        </div>

        <FormActionsBar
          hint={form.formState.isDirty ? "You have unsaved changes." : isEditing ? "Editing an existing article." : "Nothing saved yet."}
        >
          <Button asChild type="button" variant="outline">
            <Link href="/admin/blogs">Cancel</Link>
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? "Saving…" : saveLabel}
          </Button>
        </FormActionsBar>
      </form>
    </Form>
  );
}
