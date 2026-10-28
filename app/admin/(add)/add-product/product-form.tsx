"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  ArrowLeft, Download, FileBox, Globe2, ImageIcon, IndianRupee,
  Loader2, Package, Tag,
} from "lucide-react";
import { ZodProductScema } from "@/modals/zod";
import type { IProduct } from "@/modals/product.model";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/product/image-upload";
import { FileUpload } from "@/components/product/file-upload";
import { FormActionsBar, FormPageHeader, FormSection, StatusSelect } from "@/components/admin/form-ui";
import { TagInput } from "@/components/admin/tag-input";
import { productFilter } from "@/helpers";
import { addOrUpdateProducts } from "@/server-functions/product";
import { MyField } from "../myField";
import { generateSlug, getActionError, getProductDefault, isValidSlug } from "../helpers";

type ProductFormValues = z.infer<typeof ZodProductScema>;

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(value || 0);

export default function AddProductForm({ initialValue }: { initialValue?: IProduct }) {
  const router = useRouter();
  const isEditing = Boolean(initialValue?._id);
  const [slugLocked, setSlugLocked] = useState(Boolean(initialValue?.slug));

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ZodProductScema),
    defaultValues: getProductDefault(initialValue),
    mode: "onBlur",
  });

  const title = form.watch("title") || "";
  const slug = form.watch("slug") || "";
  const description = form.watch("description") || "";
  const status = form.watch("status") || "draft";
  const price = form.watch("price") || 0;

  const onInvalid = (errors: FieldErrors<ProductFormValues>) => {
    const first = Object.values(errors).find(Boolean) as { message?: string } | undefined;
    toast.error(first?.message || "Please review the highlighted fields.");
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (!isValidSlug(data.slug)) {
      form.setError("slug", { message: "Use lowercase letters, numbers and single hyphens only" });
      return;
    }

    try {
      const payload = productFilter({
        ...data,
        _id: isEditing ? initialValue?._id : undefined,
        seller: initialValue?.seller,
      });
      const result = await addOrUpdateProducts(payload);
      const failure = getActionError(result);
      if (failure) {
        toast.error(failure);
        return;
      }

      toast.success(isEditing ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not save this product. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="mx-auto w-full max-w-6xl px-5 pb-10 pt-6 sm:px-8">
        <FormPageHeader
          eyebrow={isEditing ? "Edit product" : "New product"}
          title={title || (isEditing ? "Edit product" : "Untitled product")}
          status={status}
          description={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><Globe2 size={13} />/product/{slug || "your-product-slug"}</span>
              <span className="inline-flex items-center gap-1.5"><IndianRupee size={13} />{money(price)}</span>
            </span>
          }
          actions={
            <Button asChild type="button" variant="outline">
              <Link href="/admin/products"><ArrowLeft size={15} /> All products</Link>
            </Button>
          }
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_336px]">
          <div className="space-y-6">
            <FormSection title="Product details" description="What the product is and who it is for." icon={Package}>
              <MyField
                form={form}
                name="title"
                label="Title"
                required
                placeholder="e.g. Placement interview toolkit"
                description={
                  <span className="flex items-center justify-between gap-3">
                    <span>Lead with the outcome.</span>
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
                    <span className="flex shrink-0 items-center border-r bg-muted/40 px-2.5 text-xs text-muted-foreground">/product/</span>
                    <input
                      {...field}
                      value={field.value ?? ""}
                      maxLength={180}
                      placeholder="your-product-slug"
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
                description={
                  <span className="flex items-center justify-between gap-3">
                    <span>Explain what is included and how it helps.</span>
                    <span className="tabular-nums">{description.length}/10000</span>
                  </span>
                }
                input={(field) => (
                  <Textarea
                    {...field}
                    rows={6}
                    maxLength={10000}
                    className="resize-none"
                    placeholder="Describe the product, what is inside, and who it is for…"
                  />
                )}
              />
            </FormSection>

            <FormSection title="Delivery" description="The file buyers receive after purchase." icon={FileBox}>
              <MyField
                form={form}
                name="fileLink"
                label="Downloadable file"
                description="Upload the deliverable to Cloudinary. Buyers receive this secure link."
                input={(field) => (
                  <FileUpload
                    onChange={(src) => {
                      field.onChange(src);
                      const rawName = src.split("/").pop()?.split("?")[0] || "";
                      let fileName = rawName;
                      try { fileName = decodeURIComponent(rawName); } catch { /* keep raw name */ }
                      form.setValue("fileName", fileName, { shouldDirty: true });
                    }}
                    value={field.value}
                  />
                )}
              />
              {form.watch("fileLink") ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Download size={13} /> A file is attached to this product.
                </p>
              ) : null}
            </FormSection>

            <FormSection title="Tags" description="Used in search and recommendations." icon={Tag}>
              <MyField
                form={form}
                name="tags"
                label="Tags"
                description="Press Enter to add a tag."
                input={(field) => (
                  <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="e.g. interview prep" addLabel="Add" />
                )}
              />
            </FormSection>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <FormSection title="Publishing" description="Control where this product appears." icon={Globe2}>
              <MyField
                form={form}
                name="status"
                label="Visibility"
                description="Only published products appear in the store."
                input={(field) => <StatusSelect value={field.value} onChange={field.onChange} options={statusOptions} />}
              />
              <MyField
                form={form}
                name="thumbnail"
                label="Cover image"
                description="Shown on product cards and the product page."
                input={(field) => <ImageUpload onChange={field.onChange} img_src={field.value} />}
              />
            </FormSection>

            <FormSection title="Pricing" description="One-time purchase price in INR." icon={IndianRupee}>
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
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Set the price to <span className="font-medium text-foreground">0</span> to offer the product for free.
              </p>
            </FormSection>

            <div className="rounded-2xl border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ImageIcon size={14} /> Tip</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Add a clear cover and a specific title — products with both convert much better.
              </p>
            </div>
          </aside>
        </div>

        <FormActionsBar
          hint={form.formState.isDirty ? "You have unsaved changes." : isEditing ? "Editing an existing product." : "Nothing saved yet."}
        >
          <Button asChild type="button" variant="outline">
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create product"}
          </Button>
        </FormActionsBar>
      </form>
    </Form>
  );
}
