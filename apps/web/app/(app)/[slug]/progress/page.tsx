"use client";

import { api } from "@/lib/api";
import ProgressCard from "@/components/ProgressCard";
import GoalsAndProgress from "@/components/GoalsAndProgress";

export default function ClientProgressPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        Your Progress
      </h1>
      <ProgressCard fetchInsight={api.getMyProgressInsight} />
      <GoalsAndProgress
        listGoals={api.listMyGoals}
        createGoal={api.createMyGoal}
        updateGoal={api.updateMyGoal}
        deleteGoal={api.deleteMyGoal}
        listProgress={api.listMyProgress}
        createProgress={api.createMyProgress}
      />
    </div>
  );
}
