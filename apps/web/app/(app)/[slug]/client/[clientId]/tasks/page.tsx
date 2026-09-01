"use client";

import { use, useEffect, useState } from "react";
import { api, TaskData, User } from "@/lib/api";
import { Card } from "@/components/ui";
import TaskList from "@/components/TaskList";
import { useViewerRole } from "@/lib/useViewerRole";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function ClientTasksPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { clientId } = use(params);
  const role = useViewerRole();
  const { user: viewer } = useCurrentUser();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [selfUser, setSelfUser] = useState<User | null>(null);

  function refresh() {
    if (role === "coach") {
      api.listClientTasks(clientId).then(setTasks).catch(() => {});
    } else if (role === "client") {
      api.listMyTasks().then(setTasks).catch(() => {});
    }
  }

  useEffect(() => {
    if (role === "client") api.me().then(setSelfUser).catch(() => {});
  }, [role]);

  useEffect(refresh, [role, clientId]);

  if (role === null) return null;

  return (
    <div className="animate-fade-up">
      <h1 className="font-heading mb-6 text-[26px] font-semibold tracking-tight text-neutral-900">
        Tasks
      </h1>
      <Card>
        <TaskList
          tasks={tasks}
          viewerUserId={(role === "coach" ? viewer?.id : selfUser?.id) ?? null}
          onAdd={async (title, dueDate) => {
            if (role === "coach") await api.addClientTask(clientId, { title, due_date: dueDate });
            else await api.addMyTask({ title, due_date: dueDate });
            refresh();
          }}
          onToggle={async (id) => {
            await api.toggleTaskComplete(id);
            refresh();
          }}
          onEdit={async (id, title, dueDate) => {
            await api.updateTask(id, { title, due_date: dueDate });
            refresh();
          }}
        />
      </Card>
    </div>
  );
}
