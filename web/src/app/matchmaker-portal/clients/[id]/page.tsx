"use client";

import { ClientDetail } from "@/components/matchmaker/ClientDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ClientDetail clientId={id} />;
}
