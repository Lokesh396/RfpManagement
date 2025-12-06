import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Sparkles,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Mail,
  Phone
} from "lucide-react";

export default function RFPDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rfp, setRfp] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analyzingProposals, setAnalyzingProposals] = useState(false);
  const [closingDeal, setClosingDeal] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [closureNotes, setClosureNotes] = useState("");

  useEffect(() => {
    fetchRFPData();
  }, [id]);

  const fetchRFPData = async () => {
    try {
      setLoading(true);
      const response = await API({
        url: `/rfps/${id}/proposals`,
        method: "GET",
      });

      if (response.data) {
        setRfp(response.data.rfp);
        setProposals(response.data.proposals || []);
      }
    } catch (error) {
      console.error("Error fetching RFP:", error);
      toast.error("Failed to load RFP details");
    } finally {
      setLoading(false);
    }
  };

  const analyzeProposals = async () => {
    if (proposals.length === 0) {
      toast.error("No proposals to analyze");
      return;
    }

    try {
      setAnalyzingProposals(true);
      const response = await API({
        url: `/rfps/${id}/analyze`,
        method: "GET",
      });

      if (response.data) {
        setAnalysis(response.data);
        toast.success("Proposals analyzed successfully!");
      }
    } catch (error) {
      console.error("Error analyzing proposals:", error);
      toast.error("Failed to analyze proposals");
    } finally {
      setAnalyzingProposals(false);
    }
  };

  const handleCloseDeal = async () => {
    if (!selectedProposal) {
      toast.error("Please select a proposal");
      return;
    }

    try {
      setClosingDeal(true);
      await API({
        url: `/rfps/${id}/close`,
        method: "POST",
        data: {
          proposalId: selectedProposal._id,
          notes: closureNotes,
        },
      });

      toast.success("Deal closed successfully!");
      setShowCloseDialog(false);
      fetchRFPData();
    } catch (error) {
      console.error("Error closing deal:", error);
      toast.error("Failed to close deal");
    } finally {
      setClosingDeal(false);
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading RFP details...</p>
        </div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">RFP not found</p>
          <Button onClick={() => navigate("/rfps")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/rfps")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{rfp.title}</h1>
            <p className="text-gray-500">
              Created on {new Date(rfp.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant={rfp.status === "closed" ? "secondary" : "default"}>
          {rfp.status}
        </Badge>
      </div>

      {/* RFP Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>RFP Requirements</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rfp.budget && (
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-lg font-semibold">₹{rfp.budget.toLocaleString()}</p>
            </div>
          )}
          {rfp.delivery_days && (
            <div>
              <p className="text-sm text-gray-500">Delivery</p>
              <p className="text-lg font-semibold">{rfp.delivery_days} days</p>
            </div>
          )}
          {rfp.payment_terms && (
            <div>
              <p className="text-sm text-gray-500">Payment Terms</p>
              <p className="text-lg font-semibold">{rfp.payment_terms}</p>
            </div>
          )}
          {rfp.warranty_required && (
            <div>
              <p className="text-sm text-gray-500">Warranty</p>
              <p className="text-lg font-semibold">{rfp.warranty_required}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposals Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Vendor Proposals ({proposals.length})</h2>
        {proposals.length > 0 && rfp.status !== "closed" && (
          <Button
            onClick={analyzeProposals}
            disabled={analyzingProposals}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {analyzingProposals ? "Analyzing..." : "Analyze with AI"}
          </Button>
        )}
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No proposals received yet. Vendors will submit their proposals via email.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* AI Analysis */}
          {analysis && (
            <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  AI-Powered Analysis
                </CardTitle>
                <CardDescription>{analysis.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Recommendation */}
                {analysis.recommendation && (
                  <div className="mb-6 p-4 bg-white rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-green-600" />
                      <h3 className="font-bold text-lg">Recommended Vendor</h3>
                      <Badge className="bg-green-100 text-green-800">
                        {analysis.recommendation.confidence_level} confidence
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-green-700 mb-2">
                      {analysis.recommendation.recommended_vendor}
                    </p>
                    <p className="text-gray-700 mb-3">{analysis.recommendation.reasoning}</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommendation.key_factors?.map((factor, idx) => (
                        <Badge key={idx} variant="outline">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vendor Comparison */}
                {analysis.comparison && (
                  <div className="space-y-4">
                    {analysis.comparison.map((vendor, idx) => (
                      <div key={idx} className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-lg">{vendor.vendor_name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Score:</span>
                            <Badge className={getScoreBadge(vendor.score)}>
                              {vendor.score}/100
                            </Badge>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold text-green-700 mb-1 flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Strengths
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {vendor.strengths?.map((strength, i) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              Weaknesses
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {vendor.weaknesses?.map((weakness, i) => (
                                <li key={i}>{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Proposals Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow
                      key={proposal._id}
                      className={`border-l-4 ${
                        proposal.accepted ? 'border-green-600 bg-green-50' : 'border-transparent'
                      }`}
                    >

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{proposal.vendor_name}</p>
                            <p className="text-sm text-gray-500">{proposal.vendorEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">
                            {proposal.total_price
                              ? `₹${proposal.total_price.toLocaleString()}`
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {proposal.delivery_days ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {proposal.delivery_days} days
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {proposal.payment_terms || "N/A"}
                      </TableCell>
                      <TableCell>{proposal.warranty || "N/A"}</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {proposal.contact_person && (
                            <p className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {proposal.contact_person}
                            </p>
                          )}
                          {proposal.contact_email && (
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {proposal.contact_email}
                            </p>
                          )}
                          {proposal.contact_phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {proposal.contact_phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rfp.status !== "closed" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowCloseDialog(true);
                            }}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Select
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Close Deal Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Deal</DialogTitle>
            <DialogDescription>
              You are about to select {selectedProposal?.vendor_name} as the winning vendor for
              this RFP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Selected Proposal Details:</p>
              <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                <p>
                  <span className="font-semibold">Vendor:</span> {selectedProposal?.vendor_name}
                </p>
                <p>
                  <span className="font-semibold">Total Price:</span> ₹
                  {selectedProposal?.total_price?.toLocaleString()}
                </p>
                <p>
                  <span className="font-semibold">Delivery:</span>{" "}
                  {selectedProposal?.delivery_days} days
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Closure Notes (optional)
              </label>
              <Textarea
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                placeholder="Add any notes about this deal closure..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseDeal} disabled={closingDeal}>
              {closingDeal ? "Closing..." : "Confirm & Close Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
