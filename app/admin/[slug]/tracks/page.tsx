type Params = { params: Promise<{ slug: string }> };

export default async function TracksPage({ params }: Params) {
  const { slug } = await params;
  return <main>Tracks for {slug}.</main>;
}
