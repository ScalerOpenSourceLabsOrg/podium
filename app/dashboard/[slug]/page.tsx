type Params = { params: Promise<{ slug: string }> };

export default async function RegistrationStatusPage({ params }: Params) {
  const { slug } = await params;
  return <main>Registration status for {slug}.</main>;
}
