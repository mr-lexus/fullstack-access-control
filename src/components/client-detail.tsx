"use client";

import { useEffect, useState } from "react";

type Client = { id: string; name: string; company: string; email: string; country: string; status: string; createdAt: string };
export function ClientDetail({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void fetch(`/api/clients/${id}`, { cache: "no-store" }).then(async (response) => { const payload = await response.json(); if (!response.ok) { setError(payload.error?.message ?? "Could not load client."); return; } setClient(payload.client); }); }, [id]);
  if (error) return <div className="panel"><p className="notice notice-error" role="alert">{error}</p></div>;
  if (!client) return <div className="panel loading-state">Loading client…</div>;
  return <section className="panel detail-card"><div className="detail-heading"><div><p className="eyebrow">Client record</p><h1>{client.name}</h1></div><span className={client.status === "active" ? "status status-active" : "status status-neutral"}>{client.status === "active" ? "Active" : "Churned"}</span></div><dl className="detail-list"><div><dt>Company</dt><dd>{client.company}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${client.email}`}>{client.email}</a></dd></div><div><dt>Country</dt><dd>{client.country}</dd></div><div><dt>Created</dt><dd>{new Date(client.createdAt).toLocaleDateString("en", { dateStyle: "medium" })}</dd></div></dl></section>;
}
