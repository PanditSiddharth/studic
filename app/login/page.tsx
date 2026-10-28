import { redirect } from "next/navigation";

/** Legacy login URL. The real auth screen lives at /auth. */
export default function LoginRedirect() {
  redirect("/auth");
}
