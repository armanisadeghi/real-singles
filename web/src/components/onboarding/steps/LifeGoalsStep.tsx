"use client";

/**
 * LifeGoalsStep
 *
 * Step 20: Life Goals (multi-select, max 10)
 */

import { useState, useEffect } from "react";
import { OnboardingStepWrapper, OnboardingChips } from "../OnboardingStepWrapper";

interface LifeGoal {
  id: string;
  name: string;
  category: string;
}

interface LifeGoalsStepProps {
  lifeGoals: string[];
  onChange: (value: string[]) => void;
}

export function LifeGoalsStep({ lifeGoals, onChange }: LifeGoalsStepProps) {
  const [goals, setGoals] = useState<LifeGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch life goals from API
  useEffect(() => {
    fetch("/api/life-goals")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGoals(data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Convert to options format
  const options = goals.map((goal) => ({
    value: goal.id,
    label: goal.name,
  }));

  if (isLoading) {
    return (
      <OnboardingStepWrapper
        title="What are your life goals?"
        subtitle="Select up to 10"
      >
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </OnboardingStepWrapper>
    );
  }

  return (
    <OnboardingStepWrapper
      title="What are your life goals?"
      subtitle="Select up to 10"
    >
      <OnboardingChips
        options={options}
        selected={lifeGoals}
        onChange={onChange}
        maxSelection={10}
      />
    </OnboardingStepWrapper>
  );
}
