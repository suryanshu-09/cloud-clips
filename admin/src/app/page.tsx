import { redirect } from "next/navigation";

/**
 * Root page redirects to the users management section.
 */
export default function Home() {
  redirect("/users");
}
