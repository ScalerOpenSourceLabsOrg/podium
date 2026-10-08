type Params = { params: Promise<{ slug: string; submissionId: string }> };

export default async function ScoreSubmissionPage({ params }: Params) {
  const { submissionId } = await params;
  return <main>Scoring {submissionId}.</main>;
}
