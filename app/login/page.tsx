import { permanentRedirect } from "next/navigation";

/** Legacy login URL. The real auth screen lives at /auth. */
export default function LoginRedirect() {
  permanentRedirect("/auth");
}
