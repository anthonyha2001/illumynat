import { redirect } from "next/navigation";

export default function RecipesRedirect() {
  redirect("/admin/lab?tab=recipes");
}
