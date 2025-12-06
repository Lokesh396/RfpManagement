import  { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import apiClient from "../services/api";

function formatCurrency(v) {
  if (v === null || v === undefined) return "-";
  // show as integer with commas
  return "₹" + Number(v).toLocaleString();
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function AllRFP() {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // simple client-side pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;

    async function fetchRfps() {
      setLoading(true);
      setError(null);
      try {
       

        const res = await apiClient({url:"/rfps", method:'get'});
        const data = res.data?.data ?? res.data ?? [];
        if (!cancelled) {
          setRfps(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            err?.response?.data?.error ||
              err?.response?.data?.message ||
              err.message ||
              "Failed to load RFPs"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRfps();

    return () => {
      cancelled = true;
    };
  }, []); // fetch once; if you want to refetch on page change or other, add deps

  // pagination helpers (client-side)
  const totalPages = Math.max(1, Math.ceil(rfps.length / PAGE_SIZE));
  const paged = rfps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(id) {
    if (!confirm("Delete this RFP? This action cannot be undone.")) return;
    try {
      await apiClient({url:`/rfps/${id}`, method:'delete'});
      setRfps((prev) => prev.filter((r) => r._id !== id && r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <section className="relative p-4 w-full min-h-[70vh]">
      <span className="absolute top-4 left-4">
        <SidebarTrigger />
      </span>

      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">All RFPs</h1>
          <p className="text-sm text-muted-foreground">
            List of created RFPs. Click a row to view details or manage proposals.
          </p>
        </div>

        <Card className="p-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading RFPs...
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : rfps.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No RFPs found. Create a new RFP from the sidebar.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] table-auto">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Budget</th>
                      <th className="py-2 px-3">Delivery (days)</th>
                      <th className="py-2 px-3">Created</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r) => (
                      <tr
                        key={r._id ?? r.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="py-3 px-3 align-top">
                          <Link
                            to={`/rfps/${r._id ?? r.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {r.title || (r.items ? r.items.map(i => i.name).join(", ") : "Untitled")}
                          </Link>
                          {r.raw_text && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-xl line-clamp-2">
                              {r.raw_text}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top">{formatCurrency(r.budget)}</td>
                        <td className="py-3 px-3 align-top">{r.delivery_days ?? "-"}</td>
                        <td className="py-3 px-3 align-top">{formatDate(r.createdAt)}</td>
                        <td className="py-3 px-3 align-top">
                          <Badge variant="secondary">{r.status ?? "open"}</Badge>
                        </td>
                        <td className="py-3 px-3 align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/rfps/${r._id ?? r.id}`}>
                              <Button size="sm" variant="ghost">
                                View
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(r._id ?? r.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              {/* Pagination controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1} -{" "}
                  {Math.min(page * PAGE_SIZE, rfps.length)} of {rfps.length} RFPs
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {page} / {totalPages}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}

export default AllRFP;
