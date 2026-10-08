type Params = { params: Promise<{ slug: string }> };

export default async function RegistrationsPage({ params }: Params) {
  const { slug } = await params;
  return <main>Registrations for {slug}.</main>;
}
