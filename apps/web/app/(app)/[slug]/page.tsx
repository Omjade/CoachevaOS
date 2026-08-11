import { redirect } from "next/navigation";

export default async function ClientPortalIndex({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/dashboard`);
}
