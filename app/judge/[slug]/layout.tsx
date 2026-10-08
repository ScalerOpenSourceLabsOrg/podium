import { requireJudge } from "@/lib/auth";

export default async function JudgeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireJudge(slug);

  return <>{children}</>;
}
