type Params = { params: Promise<{ slug: string }> };

export default async function AdminWinnersPage({ params }: Params) {
  const { slug } = await params;
  return <main>Winners for {slug}.</main>;
}
