"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Compass, CalendarHeart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CTASection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };

    checkAuth();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {isAuthenticated ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Continue Your Journey?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Your next meaningful connection is waiting. Jump back into the app to discover new profiles, check your messages, or join an upcoming event.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/discover"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-primary shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                <Compass className="w-5 h-5" />
                Enter App
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <CalendarHeart className="w-5 h-5" />
                View Events
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Find Your Real Connection?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Join thousands of singles who have found meaningful relationships through Real Singles. Your perfect match is waiting.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-primary shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Create Free Account
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
