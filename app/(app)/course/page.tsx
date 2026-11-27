import { permanentRedirect } from "next/navigation";

export default function CourseIndexRedirect() {
  permanentRedirect("/courses");
}