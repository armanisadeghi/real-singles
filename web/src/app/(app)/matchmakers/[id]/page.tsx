"use client";

import { MatchmakerProfilePage } from "@/components/matchmaker/MatchmakerProfilePage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchmakerProfile({ params }: PageProps) {
  const { id } = await params;

  return <MatchmakerProfilePage matchmakerId={id} />;
}
