import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import BlogComposer from "@/components/platform/BlogComposer";
import { getDashboardData } from "@/lib/platform/actions";

export default async function PlatformBlogPage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  return (
    <PlatformAppShell requireAdmin>
      <BlogComposer posts={data.blogDrafts} />
    </PlatformAppShell>
  );
}
