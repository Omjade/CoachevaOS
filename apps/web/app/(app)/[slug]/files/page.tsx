"use client";

import { useEffect, useState } from "react";
import { api, DocumentData } from "@/lib/api";
import { Card } from "@/components/ui";
import DocumentList from "@/components/DocumentList";

export default function ClientFilesPage() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);

  function refresh() {
    api.listMyDocuments().then(setDocuments).catch(() => {});
  }

  useEffect(refresh, []);

  return (
    <div>
      <h1 className="font-heading mb-6 text-[26px] font-semibold tracking-tight text-neutral-900">
        Files
      </h1>
      <Card>
        <DocumentList
          documents={documents}
          onUpload={async (file) => {
            await api.uploadMyDocument(file);
            refresh();
          }}
        />
      </Card>
    </div>
  );
}
