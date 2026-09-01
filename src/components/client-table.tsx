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
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading clients…</p>;
  const pageCount = Math.ceil(data.total / data.limit);
  return <div className="panel"><p>Showing page {data.page} of {pageCount} ({data.total} total clients).</p><table><thead><tr><th>Name</th><th>Company</th><th>Country</th><th>Status</th></tr></thead><tbody>{data.items.map((client) => <tr key={client.id}><td><Link href={`/content/client/${client.id}`}>{client.name}</Link></td><td>{client.company}</td><td>{client.country}</td><td>{client.status}</td></tr>)}</tbody></table><div className="actions" style={{ marginTop: 16 }}><button className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="secondary" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</button></div></div>;
}
