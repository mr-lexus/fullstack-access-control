"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Client = { id: string; name: string; company: string; country: string; status: string };
type Page = { items: Client[]; page: number; limit: number; total: number };

export function ClientTable() {
  const [data, setData] = useState<Page | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => { setData(null); void fetch(`/api/clients?page=${page}&limit=25`, { cache: "no-store" }).then(async (response) => { const payload = await response.json(); if (!response.ok) { setError(payload.error?.message ?? "Could not load clients."); return; } setData(payload); }); }, [page]);
  if (error) return <p className="notice notice-error" role="alert">{error}</p>;
  if (!data) return <div className="panel loading-state">Loading clients…</div>;
  const pageCount = Math.ceil(data.total / data.limit);
  return <section className="panel table-panel"><div className="section-heading"><div><h2>Clients</h2><p className="muted">{data.total.toLocaleString()} total clients</p></div><p className="pagination-summary">Page {data.page} of {pageCount}</p></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Country</th><th>Status</th></tr></thead><tbody>{data.items.map((client) => <tr key={client.id}><td><Link className="table-link" href={`/content/client/${client.id}`}>{client.name}</Link></td><td>{client.company}</td><td>{client.country}</td><td><span className={client.status === "active" ? "status status-active" : "status status-neutral"}>{client.status === "active" ? "Active" : "Churned"}</span></td></tr>)}</tbody></table></div><div className="pagination"><button className="button button-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="button button-secondary" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</button></div></section>;
}
