"use client";

import { use, useEffect, useState } from "react";
import { api, DocumentData } from "@/lib/api";
import { Card } from "@/components/ui";
import DocumentList from "@/components/DocumentList";
import { useViewerRole } from "@/lib/useViewerRole";

export default function ClientFilesPage({
  params,
}: {
  params: Promise<{ slug: string; clientId: string }>;
}) {
  const { clientId } = use(params);
  const role = useViewerRole();
  const [documents, setDocuments] = useState<DocumentData[]>([]);

  function refresh() {
    if (role === "coach") api.listClientDocuments(clientId).then(setDocuments).catch(() => {});
    else if (role === "client") api.listMyDocuments().then(setDocuments).catch(() => {});
  }

  useEffect(refresh, [role, clientId]);

  if (role === null) return null;

  return (
    <div className="animate-fade-up">
      <h1 className="font-heading mb-6 text-[26px] font-semibold tracking-tight text-neutral-900">
        Files
      </h1>
      <Card>
        <DocumentList
          documents={documents}
          onUpload={async (file) => {
            if (role === "coach") await api.uploadClientDocument(clientId, file);
            else await api.uploadMyDocument(file);
            refresh();
          }}
        />
      </Card>
    </div>
  );
}
