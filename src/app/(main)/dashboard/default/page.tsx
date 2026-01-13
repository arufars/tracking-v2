import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user role dari table users
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single();

  const role = userProfile?.role || "production";

  // Redirect based on role
  switch (role) {
    case "admin":
      redirect("/dashboard/admin");
    case "production":
      redirect("/dashboard/production");
    case "broadcaster":
      redirect("/dashboard/broadcaster");
    case "investor":
      redirect("/dashboard/investor");
    default:
      redirect("/dashboard/production");
  }
}
