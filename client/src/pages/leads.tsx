import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Filter, Download, Upload, Eye, Edit, Trash2, Globe, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, History, Trash, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  company: string;
  profile_url: string;
  status: string;
  message_text?: string;
  email?: string;
  email_confidence?: number;
  email_verification_status?: string;
  email_verification_score?: number;
  campaign_id?: string | null;
}
export default function Leads() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enrichErrors, setEnrichErrors] = useState<{[leadId: string]: string}>({});
 
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [enrichmentFilter, setEnrichmentFilter] = useState("all");
  // Removed campaignFilter state
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);
  const [scrapeForm, setScrapeForm] = useState({
    keywords: "",
    industry: "",
    location: "",
    currentCompany: "",
    job_title: ""
  });
  // Apollo.io scraping states
  const [apolloModalOpen, setApolloModalOpen] = useState(false);
  const [apolloForm, setApolloForm] = useState({
    person_titles: "",
    person_locations: "",
    q_keywords: "",
    organization_domains: "",
    batch_name: "",
    per_page: 25
  });
  const [apolloScraping, setApolloScraping] = useState(false);
  // Removed web scrape modal and related states
  const [showUnassigned, setShowUnassigned] = useState(false);
  // Removed campaign assignment state per requirement
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [companyFilter, setCompanyFilter] = useState("");
  const [jobTitleFilter, setJobTitleFilter] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState<{[key: string]: any}>({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedLeadHistory, setSelectedLeadHistory] = useState<any[]>([]);
  const [historyLeadId, setHistoryLeadId] = useState<string | null>(null); 
  const [batch, setBatch] = useState<any[]>([]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedLeadForReply, setSelectedLeadForReply] = useState<string | null>(null);
  const [selectedLeadReplies, setSelectedLeadReplies] = useState<any[]>([]);

  
 const deleteBatchMutation = useMutation({
  mutationFn: async (id: string) => {
    const token = localStorage.getItem("access_token"); // or however you store it

    const res = await fetch(`/api/leads/batches/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // add auth header
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete batch");
    }

    return id;
  },
 onSuccess: (deletedId) => {
    // Refresh the batches query automatically
    queryClient.invalidateQueries({ queryKey: ["batches"] });

    // Optional: clear selection if needed
    if (selectedBatchId === deletedId) {
      setSelectedBatchId(null);
    }
  },
});


  // Fetch lead batches for filter buttons
  type LeadBatch = { id: string; name: string; created_at?: string; count?: number };
  const { data: batchesData } = useQuery<{ batches: LeadBatch[] }>({
    queryKey: ["lead-batches"],
    queryFn: async () => {
      // Use stats endpoint for counts
      const res = await apiRequest("GET", `${apiUrl}/api/leads/batches-stats`);
      return await res.json();
    },
  });
  const batches: LeadBatch[] = batchesData?.batches || [];
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showAllBatches, setShowAllBatches] = useState(false);

  // Sync selected batch with URL (?batch_id=)
  useEffect(() => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get("batch_id");
    if (param) {
      setSelectedBatchId(param);
    }
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedBatchId) {
      url.searchParams.set("batch_id", String(selectedBatchId));
    } else {
      url.searchParams.delete("batch_id");
    }
    navigate(`${url.pathname}${url.search}`, { replace: true });
  }, [selectedBatchId, navigate]);
  // Fetch leads with unassigned filter
  const { data: leadsData, isLoading, refetch } = useQuery<{leads: Lead[], total?: number}>({
    queryKey: [
      "leads-list",
      page,
      pageSize,
      showUnassigned,
      statusFilter,
      enrichmentFilter,
      searchTerm,
      companyFilter,
      jobTitleFilter,
      selectedBatchId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("offset", String(page * pageSize));
      params.append("limit", String(pageSize));
      if (showUnassigned) params.append("unassigned", "true");
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (enrichmentFilter === "enriched") params.append("enriched", "true");
      if (enrichmentFilter === "not_enriched") params.append("enriched", "false");
      if (searchTerm) params.append("search", searchTerm);
      if (companyFilter) params.append("company", companyFilter);
      if (jobTitleFilter) params.append("job_title", jobTitleFilter);
      if (selectedBatchId) params.append("batch_id", String(selectedBatchId));
      const res = await apiRequest("GET", `${apiUrl}/api/leads/list?${params.toString()}`);
      return await res.json();
    },
  });
  const leads: Lead[] = leadsData && Array.isArray(leadsData.leads) ? leadsData.leads : [];
  const totalLeads: number = leadsData && typeof leadsData.total === 'number' ? leadsData.total : leads.length;

  const { data: usage } = useQuery<{ current_usage: number; limit: number; tier: string }>({
    queryKey: [`${apiUrl}/api/subscriptions/usage`],
  });

  useEffect(() => {
    if (usage && usage.current_usage > usage.limit) {
      window.location.href = "/pricing";
    }
  }, [usage]);

  // Fetch lead history
  const { data: leadHistory, isLoading: historyLoading } = useQuery<any[]>({
  queryKey: ["lead-history", historyLeadId],
    queryFn: async () => {
      if (!historyLeadId) return [];
  const res = await apiRequest("GET", `${apiUrl}/api/leads/${historyLeadId}/history`);
      return await res.json();
    },
    enabled: !!historyLeadId,
  });

  const updateLeadMutation = useMutation({
  mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
  const res = await apiRequest("PUT", `${apiUrl}/api/leads/${leadId}`, { status });
      return await res.json();
    },
    onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: [`${apiUrl}/api/leads/list`] });
  queryClient.invalidateQueries({ queryKey: [`${apiUrl}/api/subscriptions/usage`] });
      
      if (data.warning === "approaching_limit") {
        toast({
          title: "Approaching Limit",
          description: data.message,
          action: (
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/pricing"}>
              Upgrade Plan
            </Button>
          ),
        });
      } else if (data.warning === "limit_reached") {
        toast({
          title: "Limit Reached",
          description: data.message,
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/pricing"}>
              Upgrade Now
            </Button>
          ),
        });
      } else {
        toast({
          title: "Lead updated",
          description: "Lead status has been updated successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
  mutationFn: async (leadId: string) => {
  const res = await apiRequest("DELETE", `${apiUrl}/api/leads/${leadId}`);
      return await res.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: [`${apiUrl}/api/leads/list`] });
      toast({
        title: "Lead deleted",
        description: "Lead has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

 




  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
  const res = await apiRequest("POST", `${apiUrl}/api/leads/bulk-delete`, { leadIds });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads-list"] });
      toast({ title: "Bulk delete successful", description: data.message });
      setSelectedLeads([]);
    },
    onError: (error: Error) => {
      toast({ title: "Bulk delete failed", description: error.message, variant: "destructive" });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ leadIds, updates }: { leadIds: string[], updates: any }) => {
  const res = await apiRequest("POST", `${apiUrl}/api/leads/bulk-update`, { leadIds, updates });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads-list"] });
      toast({ title: "Bulk update successful", description: data.message });
      setSelectedLeads([]);
    },
    onError: (error: Error) => {
      toast({ title: "Bulk update failed", description: error.message, variant: "destructive" });
    },
  });

  // Export leads as CSV (with auth)
  const handleExport = async () => {
    const token = localStorage.getItem("access_token");
    const url = `${apiUrl}/api/leads/export?unassigned=${showUnassigned}`;
    if (!token) {
      toast({ title: "Not authenticated", description: "Please log in to export leads.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed: " + res.statusText);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "leads.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  };

  // Upload leads from file (CSV)
  const fileInputRef = useState(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    return input;
  })[0];

  // Show upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // Removed uploadCampaign state
  const [uploadBatchName, setUploadBatchName] = useState("");
  const [uploadRowErrors, setUploadRowErrors] = useState<any[]>([]);

  const handleUploadClick = () => {
    if (fileInputRef) {
      fileInputRef.value = '';
      fileInputRef.onchange = (e: any) => handleFileChange(e);
      fileInputRef.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      setPendingFile(input.files[0]);
      setUploadDialogOpen(true);
    }
  };

  // Read CSV and upload to backend
  const handleUploadLeads = async () => {
  if (!pendingFile || !uploadBatchName.trim()) return;
    setUploading(true);
    try {
      const text = await pendingFile.text();
      const res = await apiRequest("POST", `${apiUrl}/api/leads/upload`, {
        csvData: text,
        batch_name: uploadBatchName.trim(),
      });
      const data = await res.json();
      toast({ title: data.message, description: data.warning ? data.warning : undefined });
    setUploadRowErrors(Array.isArray(data.row_errors) ? data.row_errors : []);
    setUploadDialogOpen(false);
    setPendingFile(null);
  // Removed setUploadCampaign
    setUploadBatchName("");
    // Reset filters and pagination so new leads are visible
    setPage(0);
    setStatusFilter("all");
    setEnrichmentFilter("all");
    setSearchTerm("");
    setCompanyFilter("");
    setJobTitleFilter("");
    refetch();
      // Refresh batches after successful upload
      queryClient.invalidateQueries({ queryKey: ["lead-batches"] });
    queryClient.invalidateQueries({ queryKey: [`${apiUrl}/api/subscriptions/usage`] });
      // If backend returned a batch_id, select that batch so user can view it immediately
      if (data && data.batch_id) {
        setSelectedBatchId(String(data.batch_id));
        toast({
          title: `Batch created`,
          description: "Click to view this batch",
          action: (
            <Button size="sm" variant="outline" onClick={() => setSelectedBatchId(String(data.batch_id))}>
              View batch
            </Button>
          ),
        });
      } else {
        // fallback: refresh batches and let user pick
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["lead-batches"] }), 500);
      }
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Apollo.io scraping handler
  const handleApolloScrape = async () => {
    const { person_titles, person_locations, q_keywords, organization_domains, batch_name, per_page } = apolloForm;
    
    // Validate at least one search parameter
    if (!person_titles && !person_locations && !q_keywords && !organization_domains) {
      toast({ 
        title: "Missing search criteria", 
        description: "Please provide at least one search parameter", 
        variant: "destructive" 
      });
      return;
    }
    
    setApolloScraping(true);
    try {
      // Prepare request body
      const requestBody: any = { per_page };
      
      if (person_titles) {
        requestBody.person_titles = person_titles.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (person_locations) {
        requestBody.person_locations = person_locations.split(',').map(l => l.trim()).filter(Boolean);
      }
      if (q_keywords) {
        requestBody.q_keywords = q_keywords.trim();
      }
      if (organization_domains) {
        requestBody.organization_domains = organization_domains.trim();
      }
      if (batch_name) {
        requestBody.batch_name = batch_name.trim();
      }
      
      const res = await apiRequest("POST", `${apiUrl}/api/leads/scrape-apollo`, requestBody);
      const data = await res.json();
      
      // If the backend scheduled a background task, register it so polling can pick it up
      if (data && data.task_id) {
        setBackgroundTasks(prev => ({ ...(prev || {}), [data.task_id]: { status: 'pending', progress: 0, step: 'scheduled' } }));
      }

      toast({ 
        title: data.message, 
        description: data.leads_created > 0 ? `Created ${data.leads_created} leads in batch "${data.batch_name}"` : undefined
      });
      
      // Reset form and close modal
      setApolloModalOpen(false);
      setApolloForm({
        person_titles: "",
        person_locations: "",
        q_keywords: "",
        organization_domains: "",
        batch_name: "",
        per_page: 25
      });
      
      // Refresh data
      refetch();
      queryClient.invalidateQueries({ queryKey: ["lead-batches"] });
      queryClient.invalidateQueries({ queryKey: [`${apiUrl}/api/subscriptions/usage`] });
      
      // Offer to view the batch
      if (data.batch_id) {
        setTimeout(() => {
          toast({
            title: "Leads imported from Apollo.io",
            description: "Click to view the imported batch",
            action: (
              <Button size="sm" variant="outline" onClick={() => setSelectedBatchId(String(data.batch_id))}>
                View batch
              </Button>
            ),
          });
        }, 500);
      }
    } catch (e: any) {
      const errorMessage = e.message || "Failed to scrape leads from Apollo.io";
      
      // Check if it's an API key error
      if (errorMessage.includes("API key") || errorMessage.includes("401")) {
        toast({ 
          title: "Apollo.io API Key Required", 
          description: "Please configure your Apollo.io API key in settings", 
          variant: "destructive",
          action: (
            <Button size="sm" variant="outline" onClick={() => window.location.href = "/settings"}>
              Go to Settings
            </Button>
          ),
        });
      } else {
        toast({ title: "Apollo scraping failed", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setApolloScraping(false);
    }
  };


  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) {
      toast({ title: "No leads selected", description: "Please select leads to delete.", variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) {
      bulkDeleteMutation.mutate(selectedLeads);
    }
  };

  const handleBulkStatusUpdate = (newStatus: string) => {
    if (selectedLeads.length === 0) {
      toast({ title: "No leads selected", description: "Please select leads to update.", variant: "destructive" });
      return;
    }
    bulkUpdateMutation.mutate({ leadIds: selectedLeads, updates: { status: newStatus } });
  };


  const handleViewReplies = async (leadId: string) => {
    setSelectedLeadForReply(leadId);
    setReplyDialogOpen(true);
    try {
      const res = await apiRequest("GET", `${apiUrl}/api/leads/${leadId}/replies`);
      const data = await res.json();
      setSelectedLeadReplies(data.replies || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch replies",
        variant: "destructive",
      });
      setSelectedLeadReplies([]);
    }
  };

  // Poll background task status
  useEffect(() => {
    const pollTasks = () => {
      Object.keys(backgroundTasks).forEach(async (taskId) => {
        if (backgroundTasks[taskId].status === "pending") {
          try {
            const res = await apiRequest("GET", `${apiUrl}/api/leads/task-status/${taskId}`);
            const data = await res.json();
            setBackgroundTasks(prev => ({...prev, [taskId]: data}));
            if (data.status === "done") {
              queryClient.invalidateQueries({ queryKey: ["leads-list"] });
              let desc = "Results are now available.";
              if (data.result) {
                if (data.result.scraped) desc += ` Scraped: ${data.result.scraped.length}`;
                if (data.result.enriched) desc += `, Enriched: ${data.result.enriched.length}`;
                if (data.result.failed) desc += `, Failed: ${data.result.failed.length}`;
              }
              toast({ title: "Background task completed", description: desc });
            } else if (data.status === "error") {
              toast({ title: "Background task failed", description: data.result, variant: "destructive" });
            }
          } catch (e) {
            console.error("Failed to poll task status:", e);
          }
        }
      });
    };
    const interval = setInterval(pollTasks, 2000);
    return () => clearInterval(interval);
  }, [backgroundTasks, queryClient, toast]);

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = 
      lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesEnrichment = enrichmentFilter === "all" || (enrichmentFilter === "enriched" ? !!lead.email : !lead.email);
    return matchesSearch && matchesStatus && matchesEnrichment;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "replied":
        return "bg-green-100 text-green-800";
      case "connected":
        return "bg-purple-100 text-purple-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateLeadMutation.mutate({ leadId, status: newStatus });
  };

  const handleDeleteLead = (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLeadMutation.mutate(leadId);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-grid">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <header className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </header>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Sidebar />
      <main className="main-content ml-0 xl:ml-72 p-4 xl:p-8 min-h-screen animate-fade-in transition-all duration-300">
        {/* Header */}
        <header className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-800" data-testid="text-leads-title">Leads</h1>
                <div className="px-7 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-full shadow-md">
                  {totalLeads} Total
                </div>
              </div>
              <p className="text-slate-600" data-testid="text-leads-description">
                Leads Management
              </p>
            </div>
            {/* Background tasks progress bars */}
            <div className="w-full mt-4">
              {Object.keys(backgroundTasks).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(backgroundTasks).map(([id, t]) => (
                    t && t.status && t.status !== 'done' && t.status !== 'error' ? (
                      <div key={id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="font-medium">Task {id.slice(0,8)}</div>
                            <div className="text-xs text-slate-500">{(t.result && t.result.step) || t.step || t.status}</div>
                          </div>
                          <Progress value={typeof (t.result?.progress ?? t.progress) === 'number' ? (t.result?.progress ?? t.progress) : 0} className="h-2 bg-slate-100" />
                        </div>
                        <div>
                          {t.status !== 'cancelled' && t.status !== 'done' && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              try {
                                const res = await apiRequest('POST', `${apiUrl}/api/leads/cancel-task/${id}`);
                                const data = await res.json();
                                setBackgroundTasks(prev => ({...prev, [id]: { ...(prev[id] || {}), status: 'cancelled', result: data.message }}));
                                toast({ title: 'Cancellation requested', description: data.message });
                              } catch (e: any) {
                                toast({ title: 'Cancel failed', description: e.message || 'Failed to cancel task', variant: 'destructive' });
                              }
                            }}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setApolloModalOpen(true)}
                className="btn-primary-enhanced"
                data-testid="button-apollo-scrape"
              >
                <Globe className="h-4 w-4 mr-2" />
                Apollo.io Scrape
              </Button>
              <Button 
                onClick={handleUploadClick}
                variant="outline"
                className="border-slate-300 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button 
                variant="outline"
                onClick={handleExport}
                className="border-slate-300 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Usage Warning Banner */}
        {usage && usage.current_usage >= usage.limit * 0.8 && (
          <Card className={`mb-6 shadow-sm ${usage.current_usage >= usage.limit ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${usage.current_usage >= usage.limit ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className={`font-medium ${usage.current_usage >= usage.limit ? 'text-red-800' : 'text-yellow-800'}`}>
                      <strong>Usage:</strong> You can generate up to 100 leads per day. For higher limits, set up your Phantombuster API key in <a href="/settings" className="underline text-blue-700">Settings</a>.
                    </p>
                    <p className={`text-sm ${usage.current_usage >= usage.limit ? 'text-red-600' : 'text-yellow-600'}`}>
                      {usage.current_usage}/{usage.limit} leads used on your {usage.tier} plan
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant={usage.current_usage >= usage.limit ? "destructive" : "outline"}
                  onClick={() => window.location.href = "/pricing"}
                >
                  {usage.current_usage >= usage.limit ? 'Upgrade Now' : 'Upgrade Plan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Actions */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center w-full">
              <div className="flex flex-wrap gap-4 w-full">
                <div className="relative flex-grow min-w-[220px] max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    data-testid="input-search-leads"
                  />
                </div>
                <div className="flex-grow min-w-[180px] max-w-xs">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full" data-testid="select-status-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
               
                <Input
                  placeholder="Filter by company"
                  value={companyFilter}
                  onChange={e => setCompanyFilter(e.target.value)}
                  className="w-48"
                  data-testid="input-company-filter"
                />
                <Input
                  placeholder="Filter by job title"
                  value={jobTitleFilter}
                  onChange={e => setJobTitleFilter(e.target.value)}
                  className="w-48"
                  data-testid="input-jobtitle-filter"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Bulk Actions */}
                {selectedLeads.length > 0 && (
                  <>
                   
                    <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending} data-testid="button-bulk-delete">
                      {bulkDeleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Bulk Delete"}
                    </Button>
                    <Select onValueChange={handleBulkStatusUpdate}>
                      <SelectTrigger className="w-40" data-testid="select-bulk-status">
                        <SelectValue placeholder="Bulk Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Set to Pending</SelectItem>
                        <SelectItem value="contacted">Set to Contacted</SelectItem>
                        <SelectItem value="replied">Set to Replied</SelectItem>
                        <SelectItem value="connected">Set to Connected</SelectItem>
                        <SelectItem value="failed">Set to Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
               
                <a
                  href="/csv-template/leads-template.csv"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button size="sm" variant="outline" data-testid="button-download-csv-template">
                    Download Lead Template
                  </Button>
                </a>
               
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Filter Buttons */}
        {batches.length > 0 && (
          <Card className="mb-4 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedBatchId === null ? "default" : "outline"}
                  onClick={() => setSelectedBatchId(null)}
                >
                  All Batches
                </Button>
                
                {(showAllBatches ? batches : batches.slice(0, 6)).map((b) => (
                   <div key={b.id} className="flex items-center gap-1">
                  <Button
                        size="sm"
                         variant={selectedBatchId === b.id ? "default" : "outline"}
                        onClick={() => setSelectedBatchId(b.id)}
                         >
                   {b.name}{typeof b.count === "number" ? ` (${b.count})` : ""}
               </Button>
               <Button
               size="sm"
               variant="ghost"
               className="text-red-600 hover:text-red-800"
                onClick={() => deleteBatchMutation.mutate(b.id)}
                >
                 <Trash className="h-4 w-4" />
                 </Button>
                   </div>
                    ))} 
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle data-testid="text-leads-table-title">Lead Management</CardTitle>
            <CardDescription data-testid="text-leads-table-description">
              {filteredLeads.length} leads found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-muted-foreground text-2xl"></i>
                </div>
                <h3 className="font-medium mb-2" data-testid="text-no-leads-title">No leads found</h3>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-no-leads-description">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Upload leads through campaigns to get started"
                  }
                </p>
                
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onChange={handleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead: Lead) => (
                    <TableRow key={lead.id} data-testid={`lead-row-${lead.id}`}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          data-testid={`checkbox-lead-${lead.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`text-lead-name-${lead.id}`}>
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <a 
                              href={lead.profile_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                              data-testid={`link-lead-profile-${lead.id}`}
                            >
                              View Profile
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-lead-company-${lead.id}`}>
                        {lead.company}
                      </TableCell>
                      <TableCell data-testid={`text-lead-title-${lead.id}`}>
                        {lead.job_title}
                      </TableCell>
                      <TableCell>
                       {lead.email ? (
                         <div className="space-y-1.5">
                           {/* Email address */}
                        <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                       <span className="font-mono text-xs break-all">{lead.email}</span>
                       </div>
      
                        {/* Verification Tag - Simplified to Valid/Invalid only */}
                       {lead.email_verification_status && (
                        <div className="flex items-center gap-1.5">
                         {lead.email_verification_status === 'valid' ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5">
                      <CheckCircle className="h-3 w-3 mr-1" />
                       Verified
                        </Badge>
                       ) : lead.email_verification_status === 'unverified' ? (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs px-2 py-0.5">
                      <Clock className="h-3 w-3 mr-1" />
                       Unverified
                      </Badge>
                       ) : (
                       <Badge className="bg-red-100 text-red-800 border-red-200 text-xs px-2 py-0.5">
                       <XCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </Badge>
                   )}
                     </div>
                      )}
                     </div>
                   ) : (
                    <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">No email</span>
                    </div>
                       )}
                      </TableCell>
                      <TableCell>
                        {lead.status}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {lead.status === "replied" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReplies(lead.id)}
                              data-testid={`button-view-reply-${lead.id}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id)}
                            data-testid={`button-delete-lead-${lead.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {/* Pagination controls */}
        <div className="flex items-center gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span>Page {page + 1} of {Math.max(1, Math.ceil(totalLeads / pageSize))}</span>
          <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * pageSize >= totalLeads}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
          <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-24 ml-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Upload Leads Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={open => { if (!open) { setUploadDialogOpen(false); setUploadBatchName(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import Leads</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Batch Name (required)"
                value={uploadBatchName}
                onChange={e => setUploadBatchName(e.target.value)}
                data-testid="input-batch-name"
              />
              {/* Campaign dropdown removed as per requirements */}
              <div className="text-sm text-muted-foreground">File: {pendingFile?.name}</div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={handleUploadLeads} disabled={uploading || !uploadBatchName.trim()}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload
              </Button>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={uploadRowErrors.length > 0} onOpenChange={open => { if (!open) setUploadRowErrors([]); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Row Errors</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {uploadRowErrors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No errors.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Row</th>
                      <th className="text-left p-2">Reason</th>
                      <th className="text-left p-2">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadRowErrors.map((err, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{err.row}</td>
                        <td className="p-2">{err.reason}</td>
                        <td className="p-2 whitespace-pre-wrap">{JSON.stringify(err.row_data)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        </main>
     
           {/* Lead History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead History</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : leadHistory && leadHistory.length > 0 ? (
              <div className="space-y-4">
                {leadHistory.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{entry.action}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {entry.field && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Field:</span> {entry.field}
                      </div>
                    )}
                    {entry.old_value && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">From:</span> {entry.old_value}
                      </div>
                    )}
                    {entry.new_value && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">To:</span> {entry.new_value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No history available for this lead.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Replies</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedLeadReplies.length > 0 ? (
              <div className="space-y-4">
                {selectedLeadReplies.map((reply: any, index: number) => (
                  <Card key={reply.id || index} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <CardTitle className="text-base">{reply.subject}</CardTitle>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(reply.received_at).toLocaleString()}
                        </span>
                      </div>
                      <CardDescription>From: {reply.sender}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">
                          {reply.body}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No replies found for this lead.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Apollo.io Scraping Dialog */}
      <Dialog open={apolloModalOpen} onOpenChange={setApolloModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scrape Leads from Apollo.io</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Search for prospects on Apollo.io using your API key. At least one search parameter is required.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium" htmlFor="apollo-titles">
                  Job Titles (comma-separated)
                </label>
                <Input
                  id="apollo-titles"
                  data-testid="input-apollo-titles"
                  placeholder="e.g., CEO, Sales Director, VP of Marketing"
                  value={apolloForm.person_titles}
                  onChange={(e) => setApolloForm({...apolloForm, person_titles: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: CEO, Founder, Sales Director
                </p>
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="apollo-locations">
                  Locations (comma-separated)
                </label>
                <Input
                  id="apollo-locations"
                  data-testid="input-apollo-locations"
                  placeholder="e.g., California, US, New York, US"
                  value={apolloForm.person_locations}
                  onChange={(e) => setApolloForm({...apolloForm, person_locations: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: California, US, London, UK
                </p>
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="apollo-keywords">
                  Keywords
                </label>
                <Input
                  id="apollo-keywords"
                  data-testid="input-apollo-keywords"
                  placeholder="e.g., B2B SaaS, AI, fintech"
                  value={apolloForm.q_keywords}
                  onChange={(e) => setApolloForm({...apolloForm, q_keywords: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="apollo-domains">
                  Company Domains
                </label>
                <Input
                  id="apollo-domains"
                  data-testid="input-apollo-domains"
                  placeholder="e.g., salesforce.com"
                  value={apolloForm.organization_domains}
                  onChange={(e) => setApolloForm({...apolloForm, organization_domains: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="apollo-batch">
                  Batch Name
                </label>
                <Input
                  id="apollo-batch"
                  data-testid="input-apollo-batch"
                  placeholder="e.g., Apollo - Tech CEOs"
                  value={apolloForm.batch_name}
                  onChange={(e) => setApolloForm({...apolloForm, batch_name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="apollo-per-page">
                  Number of Leads (max 100)
                </label>
                <Input
                  id="apollo-per-page"
                  data-testid="input-apollo-per-page"
                  type="number"
                  min="1"
                  max="100"
                  value={apolloForm.per_page}
                  onChange={(e) => setApolloForm({...apolloForm, per_page: parseInt(e.target.value) || 25})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApolloModalOpen(false)}
              disabled={apolloScraping}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApolloScrape}
              disabled={apolloScraping}
              data-testid="button-apollo-submit"
            >
              {apolloScraping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Scrape Leads
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
