import { useEffect, useMemo, useState } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import vendorsData from "@/data/vendors.json";
import { Badge } from "@/components/ui/badge";

// shadcn dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import apiClient  from "@/services/api";

function CreateRFP() {
  const [text, setText] = useState("");
  const [rfp, setRfp] = useState(null); // created rfp object from backend (or mock)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // vendors & selection
  const [vendors, setVendors] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Modal state (for preview)
  const [openPreview, setOpenPreview] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  useEffect(() => {
    // load static vendors (replace later with API)
    setVendors(vendorsData || []);
  }, []);

  // convenience derived state
  const selectedCount = selectedVendorIds.size;
  const canSend = rfp && selectedCount > 0 && !sending;

  // Generate a sample email subject & body from the RFP object
  function generateEmailTemplate(rfpObj) {
    if (!rfpObj) {
      return {
        subject: "Request for Proposal",
        body: "Hello,\n\nPlease find our request for proposal attached.\n\nRegards",
      };
    }

    const title = rfpObj.title || "Procurement Request";
    const items = (rfpObj.items || [])
      .map((it) => `${it.qty || 1} x ${it.name}${it.specs ? ` (${JSON.stringify(it.specs)})` : ""}`)
      .join(", ");

    const budget = rfpObj.budget ? `Budget: ₹${rfpObj.budget}` : "";
    const delivery = rfpObj.delivery_days ? `Delivery: within ${rfpObj.delivery_days} days` : "";
    const payment = rfpObj.payment_terms ? `Payment: ${rfpObj.payment_terms}` : "";
    const warranty = rfpObj.warranty_required ? `Warranty: ${rfpObj.warranty_required}` : "";

    const subject = `RFP: ${title}`;
    const body = `Hello,\n\nWe are looking to procure: ${items}.\n${budget}\n${delivery}\n${payment}\n${warranty}\n\nPlease reply with your best quote, lead-time, warranty and payment terms.\n\nRegards,\nProcurement Team`;

    return { subject, body };
  }

  async function handleGenerate() {
    if (!text.trim()) {
      setError("Please enter the requirement in the textbox.");
      return;
    }
    setLoading(true);
    setError(null);
    setRfp(null);
    setSendResult(null);
    try {
      // TODO: Replace this mock with a real API call:
      const res = await apiClient({url:"/rfps",method:'POST',data:{ text }});
      const data = res.data?.data ?? res.data ?? null;
      setRfp(data);

      // reset vendor selection
      setSelectedVendorIds(new Set());
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        "Failed to generate RFP";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function toggleVendor(id) {
    setSelectedVendorIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function selectAllVisible() {
    setSelectedVendorIds(new Set(vendors.map((v) => v.id)));
  }

  function clearSelection() {
    setSelectedVendorIds(new Set());
  }

  // Open preview and populate subject/body from RFP
  function openPreviewModal() {
    if (!rfp) {
      setError("Generate the RFP first before previewing the email.");
      return;
    }
    const tpl = generateEmailTemplate(rfp);
    setEmailSubject(tpl.subject);
    setEmailBody(tpl.body);
    setOpenPreview(true);
  }

  async function handleConfirmSend() {
    if (!canSend) return;
    setSending(true);
    setSendResult(null);
    setError(null);

    const selectedVendors = vendors.filter((v) => selectedVendorIds.has(v.id));
    const vendorEmails = selectedVendors.map((v) => v.email);

    try {
      await apiClient({url:`/rfps/${rfp._id}/send`,method:'POST',data:{ vendorEmails: Array.from(vendorEmails), body:emailBody }});


      setSendResult({
        ok: true,
        sentTo: vendorEmails,
        subject: emailSubject,
        body: emailBody,
      });

      // close preview modal
      setOpenPreview(false);
    } catch (err) {
      console.error(err);
      setError("Failed to send RFP (mock).");
    } finally {
      setSending(false);
    }
  }

  function handleClear() {
    setText("");
    setRfp(null);
    setError(null);
    setSendResult(null);
    setSelectedVendorIds(new Set());
  }

  function handleCopyJson() {
    if (!rfp) return;
    const json = JSON.stringify(rfp, null, 2);
    navigator.clipboard
      .writeText(json)
      .then(() => {
        console.log("Copied JSON to clipboard");
      })
      .catch((e) => console.error("Copy failed", e));
  }

  const vendorList = useMemo(() => vendors, [vendors]);

  return (
    <section className="relative p-4 w-full min-h-[70vh]">
      {/* Sidebar trigger (top-left) */}
      <span className="absolute top-4 left-4">
        <SidebarTrigger />
      </span>

      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Create New RFP</h1>
          <p className="text-sm text-muted-foreground">
            Paste your requirement in natural language and generate a structured
            RFP.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: NL input */}
          <Card className="p-4">
            <Label className="mb-2">Describe requirement</Label>
            <Textarea
              placeholder="E.g. I need 20 laptops with 16GB RAM and 15 monitors 27-inch. Budget $50,000. Delivery within 30 days. Payment terms: net 30. Warranty 1 year."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="w-full"
            />

            <div className="mt-4 flex gap-3 justify-end">
              <Button onClick={handleClear} variant="ghost" disabled={loading || sending}>
                Clear
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? "Generating..." : "Generate Structured RFP"}
              </Button>
            </div>

            {error && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-red-600">{error}</p>
              </>
            )}
          </Card>

          {/* Right: JSON preview + vendor selection */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <Label className="text-sm">Structured RFP (Preview)</Label>
                <p className="text-xs text-muted-foreground">
                  This JSON is the result returned by the LLM and saved to the DB.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopyJson} disabled={!rfp} variant="outline" size="sm">
                  Copy JSON
                </Button>
                <Button
                  onClick={openPreviewModal}
                  disabled={!rfp || selectedCount === 0}
                  size="sm"
                >
                  Preview Email
                </Button>
              </div>
            </div>

            <div className="mt-2 mb-4">
              {rfp ? (
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-auto text-sm max-h-[28vh]">
                  {JSON.stringify(rfp, null, 2)}
                </pre>
              ) : (
                <div className="text-sm text-gray-500">
                  No structured RFP yet. After you click &quot;Generate&quot; the
                  extracted RFP will appear here.
                </div>
              )}
            </div>

            <Separator />

            {/* Vendor selection */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Select vendors to send</Label>
                  <Badge variant="secondary">{selectedCount}</Badge>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={selectAllVisible}>
                    Select All
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="max-h-[24vh] overflow-auto border rounded-md p-2">
                {vendorList.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4">No vendors available</div>
                ) : (
                  vendorList.map((v) => {
                    const checked = selectedVendorIds.has(v.id);
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-3 px-2 py-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleVendor(v.id)}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{v.name}</span>
                            <span className="text-xs text-muted-foreground">{v.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-xs text-muted-foreground">{v.role}</div>
                          <Badge variant="outline">{v.projects?.map(p => p.name).join(", ")}</Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <Button
                  onClick={() => openPreviewModal()}
                  disabled={!canSend}
                >
                  {sending ? "Sending..." : `Preview & Send (${selectedCount})`}
                </Button>
              </div>

              {sendResult && (
                <div className="mt-3 text-sm text-green-600">
                  RFP sent successfully to {sendResult.sentTo?.length ?? 0} vendors.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview Email</DialogTitle>
            <DialogDescription>
              Review and edit the email content before sending to selected vendors.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-sm mb-1">To</Label>
              <div className="text-sm mb-2">
                {vendors
                  .filter((v) => selectedVendorIds.has(v.id))
                  .map((v) => v.email)
                  .join(", ")}
              </div>

              <Label className="text-sm mb-1">Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mb-3"
              />

              <Label className="text-sm mb-1">Body</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={10}
                className="mb-2"
              />
            </div>

          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {sending ? "Sending..." : "Ready to send"}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setOpenPreview(false)} disabled={sending}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmSend} disabled={!canSend || sending}>
                  {sending ? "Sending..." : "Confirm & Send"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default CreateRFP;
