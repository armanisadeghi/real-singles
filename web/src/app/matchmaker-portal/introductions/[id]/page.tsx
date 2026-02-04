"use client";

import { OutcomeTracker } from "@/components/matchmaker/OutcomeTracker";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IntroductionDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <OutcomeTracker introId={id} />;
}
