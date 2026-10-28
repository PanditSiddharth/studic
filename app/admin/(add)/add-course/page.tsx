import type { IBlog } from "@/modals/blog.model";
import type { ICourse } from "@/modals/course.model";
import { getCourse } from "@/server-functions/course";
import AddCourseForm from "./course-form";

export default async function AddCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ _id?: string; slug?: string }>;
}) {
  const params = await searchParams;
  let initialValue: Partial<ICourse> | undefined;
  let initialPlaylist: IBlog[] = [];
  let loadError: string | undefined;

  if (params.slug || params._id) {
    const result = await getCourse({ slug: params.slug, _id: params._id, blogs: true });
    if ("error" in result) {
      loadError = result.error;
    } else {
      const populated = Array.isArray(result.content)
        ? (result.content as unknown as IBlog[]).filter((item) => item && typeof item === "object")
        : [];
      initialPlaylist = populated;
      initialValue = {
        ...result,
        content: populated.map((item) => String(item._id ?? "")).filter(Boolean),
      };
    }
  }

  return <AddCourseForm initialValue={initialValue} initialPlaylist={initialPlaylist} loadError={loadError} />;
}
