"use client";

import { use } from "react";
import { api } from "@/lib/api";
import ProgressCard from "@/components/ProgressCard";
import GoalsAndProgress from "@/components/GoalsAndProgress";
import CustomFieldsCard from "@/components/CustomFieldsCard";
import MetricsCard from "@/components/MetricsCard";
import SessionsCard from "@/components/SessionsCard";
import TimelineCard from "@/components/TimelineCard";
import ChurnTrend from "@/components/ChurnTrend";
import ClientSnapshotCard from "@/components/ClientSnapshotCard";
import { useViewerRole } from "@/lib/useViewerRole";

export default function ClientProgressPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { clientId } = use(params);
  const role = useViewerRole();
  if (role === null) return null;

  const title = role === "coach" ? "Progress" : "Your Progress";

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
        {title}
      </h1>
      {role === "coach" ? (
        <>
          <ChurnTrend clientId={clientId} />
          <ClientSnapshotCard clientId={clientId} />
          <ProgressCard fetchInsight={() => api.getClientProgressInsight(clientId)} />
          <CustomFieldsCard
            fetchFields={() => api.getClientCustomFields(clientId)}
            onSetValue={(defId, value) => api.setClientCustomFieldValue(clientId, defId, value)}
            editable
          />
          <MetricsCard
            listDefinitions={() => api.listMetricDefinitions()}
            listEntries={(defId) => api.listClientMetricEntries(clientId, defId)}
            createEntry={(defId, body) => api.createClientMetricEntry(clientId, defId, body)}
          />
          <SessionsCard
            listSessions={() => api.listClientSessions(clientId)}
            createSession={(body) => api.createClientSession(clientId, body)}
            deleteSession={(noteId) => api.deleteClientSession(clientId, noteId)}
          />
          <TimelineCard fetchTimeline={() => api.getClientTimeline(clientId)} />
          <GoalsAndProgress
            listGoals={() => api.listClientGoals(clientId)}
            createGoal={(body) => api.createClientGoal(clientId, body)}
            updateGoal={(goalId, body) => api.updateClientGoal(clientId, goalId, body)}
            deleteGoal={(goalId) => api.deleteClientGoal(clientId, goalId)}
            listProgress={() => api.listClientProgress(clientId)}
            createProgress={(note, entryDate, file) =>
              api.createClientProgress(clientId, note, entryDate, file)
            }
          />
        </>
      ) : (
        <>
          <ProgressCard fetchInsight={api.getMyProgressInsight} summaryLabel="Your coach's AI summary" />
          <CustomFieldsCard fetchFields={api.getMyCustomFields} editable={false} />
          <MetricsCard
            listDefinitions={api.listMyMetricDefinitions}
            listEntries={api.listMyMetricEntries}
            createEntry={api.createMyMetricEntry}
          />
          <SessionsCard listSessions={api.listMySessions} />
          <TimelineCard fetchTimeline={api.getMyTimeline} />
          <GoalsAndProgress
            listGoals={api.listMyGoals}
            createGoal={api.createMyGoal}
            updateGoal={api.updateMyGoal}
            deleteGoal={api.deleteMyGoal}
            listProgress={api.listMyProgress}
            createProgress={api.createMyProgress}
          />
        </>
      )}
    </div>
  );
}
