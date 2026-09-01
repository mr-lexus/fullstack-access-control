"use client";

import { useEffect, useState } from "react";

type Client = { id: string; name: string; company: string; email: string; country: string; status: string; createdAt: string };
export function ClientDetail({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void fetch(`/api/clients/${id}`, { cache: "no-store" }).then(async (response) => { const payload = await response.json(); if (!response.ok) { setError(payload.error?.message ?? "Could not load client."); return; } setClient(payload.client); }); }, [id]);
  if (error) return <div className="panel"><p className="error">{error}</p></div>;
  if (!client) return <p>Loading client…</p>;
  return <div className="panel"><h1>{client.name}</h1><dl><dt>Company</dt><dd>{client.company}</dd><dt>Email</dt><dd>{client.email}</dd><dt>Country</dt><dd>{client.country}</dd><dt>Status</dt><dd>{client.status}</dd><dt>Created</dt><dd>{client.createdAt}</dd></dl></div>;
}
