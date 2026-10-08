type Params = { params: Promise<{ slug: string }> };

export default async function JudgesPage({ params }: Params) {
  const { slug } = await params;
  return <main>Judges for {slug}.</main>;
}
