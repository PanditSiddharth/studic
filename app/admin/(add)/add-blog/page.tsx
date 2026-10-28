"use client"
import { useForm } from 'react-hook-form';
import { ZodBlogSchema } from '@/modals/zod';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/product/image-upload';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { toast } from "react-toastify"
// import { addOrUpdateBlog } from '@/server-functions/blog';
import { MyField } from '../myField';

import MyEditor from '../editor';
import { generateSlug, getBlogDefaults } from '../helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { blogFilter } from '@/helpers';
import { useAddProducts, useDataStore } from '@/store';
import { useSession } from 'next-auth/react';
import { addOrUpdateProducts } from '@/server-functions/product';
import { addOrUpdateBlog, getBlog } from '@/server-functions/blog';
import { IProduct } from '@/modals/product.model';
import { IBlog } from '@/modals/blog.model';
// import { useBlogIds } from '@/store';

// when editing intial value requires
const AddBlog = (props: any) => {
  const [tagInput, setTagInput] = useState('')
  const [categoryI, setCategory] = useState('')
  // const { blogIds, setBlogIds } = useBlogIds()
  const { productAdds, setProductAdds } = useAddProducts()
  const { data: session } = useSession()
    const sp = React.use<{ _id: string, slug: string }>(props.searchParams)
  const form = useForm<z.infer<typeof ZodBlogSchema>>({
    resolver: zodResolver(ZodBlogSchema),
    defaultValues: getBlogDefaults({})
  });

  useEffect(() => {
    if (sp && sp._id || sp.slug) {
      const { slug, _id } = sp
      getBlog({ slug, _id })
        .then((blog) => {
          console.log(getBlogDefaults(blog as IBlog))
          if (typeof blog == "object" && "_id" in blog) {
            form.reset(getBlogDefaults(blog as IBlog))
          }
        })
    }
  }, [])
  
  useEffect(() => {
    if (Object.keys(form.formState.errors).length != 0) {
      toast.error("Error in any field data")
    }
    // eslint-disable-next-line
  }, [form.formState.errors])

  const onSubmit = async (data: z.infer<typeof ZodBlogSchema>) => {

    if (!data.slug || !/^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/.test(data.slug)) {
      return form.setError("slug", { message: "Only letters, - and numbers are allowed" });
    }

    const pd = data?.products || await addOrUpdateProducts(JSON.parse(JSON.stringify(productAdds)));
    if ("error" in pd)
      return toast.error((pd as any)?.error)

    const k = blogFilter({ ...data, products: typeof pd[0] == "string" ? pd : pd.map(e => e._id), author: session?.user?._id })
    console.log(k)
    const bg = await addOrUpdateBlog(k)
    if ("error" in bg)
      return toast.error(bg.error)
    setProductAdds([])
    toast.success("Blog Added Successfully")
  }

  const addTag = () => {
    if (tagInput.trim()) {
      form.setValue('tags', [...form.getValues('tags'), tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    const newTags = form.getValues('tags').filter((_, i) => i !== index)
    form.setValue('tags', newTags)
  }

  const addCategory = () => {
    if (categoryI.trim()) {
      form.setValue('category', [...form.getValues('category'), categoryI.trim()])
      setCategory('')
    }
  }

  const removeCategory = (index: number) => {
    const newCategory = form.getValues('category').filter((_: any, i: any) => i !== index)
    form.setValue('category', newCategory)
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full p-4 max-w-4xl mx-auto'>
        <Card>
          <CardHeader>
            <CardTitle>Add Blog</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 grid md:grid-cols-2 grid-cols-1 w-full  justify-center gap-2'>
            <MyField
              form={form}
              name="thumbnail"
              input={(field) => <ImageUpload onChange={field.onChange} img_src={field.value} />}
            />

            <MyField
              form={form}
              name="title"
              label="Blog Title"
              placeholder="Enter Blog Title"
              fields={{
                onChange: (value: { target: { value: string } }) => {
                  form.setValue("title", value.target.value);
                  form.setValue("slug", generateSlug(value.target.value))
                }
              }}
              description="Add a Title for your blog" />

            <MyField
              form={form}
              name="status"
              label="Blog Status"
              description="Select your blog status"
              input={
                (field) => 
                <Select defaultValue={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Publish.." />
                  </SelectTrigger>
                  <SelectContent defaultValue={field.value}>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted (link only)</SelectItem>
                    <SelectItem value="free">Free (legacy access mode)</SelectItem>
                    <SelectItem value="paid">Paid (legacy access mode)</SelectItem>
                  </SelectContent>
                </Select>

              }
            />

            <MyField
              form={form}
              name="slug"
              label="Blog Slug"
              placeholder="Enter Blog Slug"
              description="Slug will create blog link" />

            <MyField
              form={form}
              name="tags"
              label="Blog Tags"
              description="Press Enter or click Add to add a tag"
              input={(field) => <div className="flex flex-wrap gap-2">
                {field.value.map((tag: string, index: number) => (
                  <div key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center">
                    {tag}
                    <button type="button" onClick={() => removeTag(index)} className="ml-2 text-primary/50 hover:text-primary">
                      &times;
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
              </div>}
            />
            <MyField
              form={form}
              name="category"
              label="Blog Category"
              description="Press Enter or click Add to add a Category"
              input={(field) => <div className="flex flex-wrap gap-2">
                {field.value.map((category: string, index: number) => (
                  <div key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center">
                    {category}
                    <button type="button" onClick={() => removeCategory(index)} className="ml-2 text-primary/50 hover:text-primary">
                      &times;
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={categoryI}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Add a Category"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  />
                  <Button type="button" onClick={addCategory}>Add</Button>
                </div>
              </div>}
            />

            <MyField
              form={form}
              name="description"
              label="Blog Description"
              description="Describe your blog"
              input={(field) => <Textarea rows={4} className='resize-none' placeholder='Enter Blog Description' {...field} />}
            />

            <MyField
              form={form}
              className='md:col-span-2 h-full flex'
              name="content"
              input={(field) => <MyEditor onChange={field.onChange} value={field?.value} />}
            />
          </CardContent>
          <CardFooter className='flex justify-center items-center'>

            <Button type="submit" disabled={form.formState.isSubmitting} className='w-full md:max-w-xs'>
              {form.formState.isSubmitting ? "Adding..." : "Add Blog"}</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

export default AddBlog;

