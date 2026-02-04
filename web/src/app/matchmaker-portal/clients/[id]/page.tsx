"use client";

import { use } from "react";
import { ClientDetail } from "@/components/matchmaker/ClientDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return <ClientDetail clientId={id} />;
}
