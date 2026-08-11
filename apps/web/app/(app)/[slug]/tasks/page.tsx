"use client";

import { useEffect, useState } from "react";
import { api, TaskData, User } from "@/lib/api";
import { Card } from "@/components/ui";
import TaskList from "@/components/TaskList";

export default function ClientTasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [user, setUser] = useState<User | null>(null);

  function refresh() {
    api.listMyTasks().then(setTasks).catch(() => {});
  }

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
    refresh();
  }, []);

  return (
    <div>
      <h1 className="font-heading mb-6 text-[26px] font-semibold tracking-tight text-neutral-900">
        Tasks
      </h1>
      <Card>
        <TaskList
          tasks={tasks}
          viewerUserId={user?.id ?? null}
          onAdd={async (title, dueDate) => {
            await api.addMyTask({ title, due_date: dueDate });
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
