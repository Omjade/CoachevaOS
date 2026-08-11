"use client";

import { useEffect, useState } from "react";
import { CaretDownIcon as CaretDown } from "@phosphor-icons/react";
import { api, ClientListItem, DocumentData } from "@/lib/api";
import { Card, Eyebrow } from "@/components/ui";
import DocumentList from "@/components/DocumentList";

export default function DocumentsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentData[]>([]);

  useEffect(() => {
    api.listClients().then((list) => {
      setClients(list);
      if (list.length > 0) setSelected(list[0].id);
    });
  }, []);

  function refresh(clientId: string) {
    if (!clientId) return;
    api.listClientDocuments(clientId).then(setDocuments).catch(() => {});
  }

  useEffect(() => {
    if (selected) refresh(selected);
  }, [selected]);

  return (
    <div>
      <div className="mb-6">
        <Eyebrow className="mb-2">Documents</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          Files
        </h1>
      </div>

      {clients.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">Add a client first to share files with them.</p>
        </Card>
      ) : (
        <Card>
          <div className="relative mb-4 inline-block">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="appearance-none rounded-[10px] border border-neutral-200 bg-neutral-50/60 py-2 pr-8 pl-3 text-sm text-neutral-900 outline-none focus:border-accent-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <CaretDown className="pointer-events-none absolute top-1/2 right-3 h-3 w-3 -translate-y-1/2 text-neutral-400" />
          </div>
          <DocumentList
            documents={documents}
            onUpload={async (file) => {
              await api.uploadClientDocument(selected, file);
              refresh(selected);
            }}
          />
        </Card>
      )}
    </div>
  );
}
