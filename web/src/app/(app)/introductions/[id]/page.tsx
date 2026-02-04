"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Sparkles,
  Check,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IntroductionDetailPage({ params }: PageProps) {
  const [introId, setIntroId] = useState<string>("");
  const [intro, setIntro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      setIntroId(id);
      fetchIntroduction(id);
    });
  }, []);

  const fetchIntroduction = async (id: string) => {
    // TODO: Implement API call to fetch introduction details
    setLoading(false);
  };

  const handleResponse = async (action: "accept" | "decline") => {
    setResponding(true);

    // TODO: Implement API call
    setTimeout(() => {
      setResponding(false);
      router.push("/introductions");
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!intro) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Introduction not found</p>
          <Link
            href="/introductions"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Back to Introductions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
        {/* Back Button */}
        <Link
          href="/introductions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Introductions
        </Link>

        {/* Placeholder - detailed view will be implemented */}
        <div className="bg-card rounded-xl border border-border/40 p-8 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-purple-500" />
          <p className="text-muted-foreground">
            Introduction detail view coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
