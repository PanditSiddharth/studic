"use client";

import { Search, Sparkles } from "lucide-react";
import { useWatch } from "react-hook-form";
import { ImageUpload } from "@/components/product/image-upload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MyField } from "@/app/admin/(add)/myField";
import { TagInput } from "@/components/admin/tag-input";
import { FormSection } from "@/components/admin/form-ui";

type Props = {
  form: any;
  title: string;
  description: string;
  canonicalPath: string;
};

export default function SeoFields({ form, title, description, canonicalPath }: Props) {
  const values = useWatch({ control: form.control });
  const seoTitle = String(values.seoTitle || "");
  const seoDescription = String(values.seoDescription || "");
  const resolvedTitle = seoTitle || title || "Page title";
  const resolvedDescription = seoDescription || description || "Add a clear summary for search results.";
  return (
    <FormSection
      title="Search & social appearance"
      description="Automatic metadata uses the page title and description when an override is blank."
      icon={Search}
    >
      <MyField
        form={form}
        name="seoTitle"
        label="SEO title"
        description={<span className="flex items-center justify-between gap-3"><span>Leave blank to use the page title.</span><span className="tabular-nums">{seoTitle.length}/160</span></span>}
        fields={{ maxLength: 160 }}
      />
      <MyField
        form={form}
        name="seoDescription"
        label="SEO description"
        description={<span className="flex items-center justify-between gap-3"><span>Leave blank to use the page description.</span><span className="tabular-nums">{seoDescription.length}/320</span></span>}
        input={(field: any) => <Textarea {...field} value={field.value ?? ""} rows={3} maxLength={320} className="resize-none" placeholder="A concise, accurate summary…" />}
      />
      <MyField
        form={form}
        name="seoKeywords"
        label="Focus and related keywords"
        description="Optional editorial notes used as page metadata. Add only relevant terms."
        input={(field: any) => <TagInput value={field.value ?? []} onChange={field.onChange} max={12} placeholder="Add a relevant keyword" addLabel="Add" />}
      />
      <MyField
        form={form}
        name="ogImage"
        label="Social share image"
        description="Optional custom Open Graph/Twitter image. The cover image is used if this is blank."
        input={(field: any) => <ImageUpload onChange={field.onChange} img_src={field.value ?? ""} aspectRatio={1200 / 630} />}
      />
      <MyField
        form={form}
        name="canonicalUrl"
        label="Canonical URL (optional)"
        description="Use a same-site path such as /course/my-course. Leave blank for the current page URL."
        input={(field: any) => <Input {...field} value={field.value ?? ""} placeholder={canonicalPath} maxLength={2048} />}
      />
      <MyField
        form={form}
        name="noindex"
        label="Indexing"
        input={(field: any) => (
          <label className="flex items-start gap-2 text-sm font-normal">
            <input
              type="checkbox"
              checked={Boolean(field.value)}
              onChange={(event) => field.onChange(event.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span>Ask search engines not to index this page.</span>
          </label>
        )}
      />
      <div className="rounded-xl border bg-background p-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles size={13} /> Google snippet preview</p>
        <p className="mt-2 truncate text-xs text-emerald-600 dark:text-emerald-400">studic.in › {canonicalPath.replace(/^\/+/, "")}</p>
        <p className="mt-1 line-clamp-2 text-base font-medium text-sky-700 dark:text-sky-400">{resolvedTitle}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{resolvedDescription}</p>
      </div>
    </FormSection>
  );
}
