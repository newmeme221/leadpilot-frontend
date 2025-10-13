import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge"; 
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast"; 
import { apiRequest } from "../lib/queryClient";
import { Loader2, Search, Filter, Download, Upload, Eye, Edit, Globe, Sparkles, Plus, Edit3, Trash2, Mail, Clock, Zap, Target, MessageCircle, Settings, CheckCircle, XCircle, AlertCircle, Activity, MousePointerClick, Users} from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;
 
export default function EmailCampaigns() { 
  const [followUps, setFollowUps] = useState<{ subject: string; body: string; delay_days: number }[]>([]);
  const [editingFollowUpIdx, setEditingFollowUpIdx] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [activeTab, setActiveTab] = useState("basic"); 
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const dialogRef = useRef(null);

  // MailerSend status
  const [mailersendStatus, setMailersendStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);





  const handleGenerateAiMessage = async () => {
    setAiLoading(true);
    setAiMessage("");
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/api/generate-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          leadInfo: `Subject: ${form.subject}, Body: ${form.body}`,
          ...aiPrompt,
          type: "email"
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setAiMessage(data.message);
        } else {
          setAiMessage(generateMockMessage());
        }
      } else {
        setAiMessage(generateMockMessage());
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setAiMessage(generateMockMessage());
    } finally {
      setAiLoading(false);
    }
  };

  const generateMockMessage = () => {
    const mockMessages = [
      "Subject: Exploring Partnership Opportunities\n\nHi [First Name],\n\nI hope this email finds you well. I came across [Company] and was impressed by your recent work in [Industry]. I believe there might be some exciting partnership opportunities we could explore together.\n\nWould you be open to a brief 15-minute call next week to discuss how we might collaborate?\n\nBest regards,\n[Your Name]",
      "Subject: Quick Question About [Company]\n\nHi [First Name],\n\nI've been following [Company]'s growth and wanted to reach out with a quick question. We're working on some innovative solutions in [Industry] that might align with your goals.\n\nWould you have 10 minutes for a brief chat this week?\n\nThanks,\n[Your Name]",
      "Subject: Introduction and Potential Collaboration\n\nHello [First Name],\n\nI hope you're having a great week! I noticed your work at [Company] and thought there might be some synergies with what we're doing.\n\nI'd love to share how we're helping companies like yours achieve [specific benefit]. Are you available for a quick call?\n\nBest,\n[Your Name]"
    ];
    return mockMessages[Math.floor(Math.random() * mockMessages.length)];
  };

  const addFollowUp = () => {
    if (!followUpDraft.subject.trim() || !followUpDraft.body.trim()) return;
    if (editingFollowUpIdx !== null) {
      setFollowUps(followUps.map((fu, i) => i === editingFollowUpIdx ? followUpDraft : fu));
      setEditingFollowUpIdx(null);
    } else {
      setFollowUps([...followUps, followUpDraft]);
    }
    setFollowUpDraft({ subject: "", body: "", delay_days: 1 });
  };

  const editFollowUp = (index: number) => {
    setFollowUpDraft(followUps[index]);
    setEditingFollowUpIdx(index);
  };

  const deleteFollowUp = (index: number) => {
    setFollowUps(followUps.filter((_, i) => i !== index));
  };

  const applyAiMessage = () => {
    const lines = aiMessage.split('\n');
    const subjectLine = lines.find(line => line.startsWith('Subject:'));
    if (subjectLine) {
      setForm(f => ({ ...f, subject: subjectLine.replace('Subject:', '').trim() }));
    }
    const bodyLines = lines.filter(line => !line.startsWith('Subject:'));
    setForm(f => ({ ...f, body: bodyLines.join('\n').trim() }));
  };

  const tabs = [
    { id: "basic", label: "Campaign Details", icon: Mail },
    { id: "ai", label: "AI Assistant", icon: Sparkles },
    { id: "followup", label: "Follow-up Sequence", icon: Clock },
  ];

  // Chart data state and API calls
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["email-campaigns-performance"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/api/email-campaigns/performance`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const mockChartData = [
    { date: "2025-09-01", sent: 10, responses: 2 },
    { date: "2025-09-02", sent: 15, responses: 3 },
    { date: "2025-09-03", sent: 20, responses: 5 },
    { date: "2025-09-04", sent: 18, responses: 4 },
    { date: "2025-09-05", sent: 25, responses: 7 }
  ];

  function getStatusColor(status: string) {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  } 

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `${apiUrl}/api/email-campaigns/${id}`, { status });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast.toast({ title: "Status Changed", description: `Campaign status changed to ${data.status}` });
    },
    onError: (error: any) => {
      toast.toast({ title: "Status Change Failed", description: error.message, variant: "destructive" });
    },
  });

  function handleStatusChange(id: number, newStatus: string) {
    statusMutation.mutate({ id, status: newStatus });
  }

  const [aiSubject, setAiSubject] = useState("");
  const [aiBody, setAiBody] = useState("");
  const [aiPrompt, setAiPrompt] = useState({ goal: "email", tone: "friendly", personalization: "", cta: "", length: 300 });
  const [editingDraft, setEditingDraft] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", subject: "", body: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
 
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "paused" | "completed">("all");

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editForm }) => {
      const res = await apiRequest("PUT", `${apiUrl}/api/email-campaigns/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      setEditingDraft(null);
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast.toast({ title: "Draft updated", description: "Draft email campaign updated successfully." });
    },
    onError: (error: any) => {
      toast.toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `${apiUrl}/api/email-campaigns/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast.toast({ title: "Draft deleted", description: "Draft email campaign deleted successfully." });
    },
    onError: (error: any) => {
      toast.toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const handleEditDraft = (c: any) => {
    setEditingDraft(c);
    setEditForm({ name: c.name, subject: c.subject, body: c.body });
  };

  const handleEditSave = () => {
    if (!editingDraft) return;
    if (!editForm.name.trim() || !editForm.subject.trim() || !editForm.body.trim()) {
      toast.toast({ title: "Validation error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    setEditLoading(true);
    updateMutation.mutate({ id: editingDraft.id, data: editForm });
    setEditLoading(false);
  };

  const handleDeleteDraft = (c: any) => {
    if (!window.confirm("Are you sure you want to delete this email campaign? This action cannot be undone.")) return;
    setDeleteLoadingId(c.id);
    deleteMutation.mutate(c.id, {
      onSettled: () => setDeleteLoadingId(null),
    });
  };

   const { data: campaigns, isLoading } = useQuery<any[]>({
    // use the environment API URL so production doesn't point to localhost
    queryKey: [`${apiUrl}/api/email-campaigns`],
  });

   const { data: campaignStats, isLoading: statsLoading } = useQuery({
    queryKey: ["campaigns-stats"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/api/campaigns/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch campaign stats");
      return await res.json();
    },
    staleTime: 60 * 1000,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", body: "" });
  const [followUpDraft, setFollowUpDraft] = useState({ subject: "", body: "", delay_days: 1 });
  
  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = { 
        ...data,
        follow_ups: followUps.length > 0 ? followUps : undefined
      };
      const res = await apiRequest("POST", `${apiUrl}/api/email-campaigns`, payload);
      return await res.json();
    },
    onSuccess: () => {
      setShowCreate(false);
      setForm({ name: "", subject: "", body: ""});
      setFollowUps([]);
      setFollowUpDraft({ subject: "", body: "", delay_days: 1 });
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast.toast({ title: "Campaign Created", description: "Your email campaign has been created successfully." });
    },
  });

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendCampaign, setSendCampaign] = useState<any>(null);
  const [sendLeads, setSendLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [personalization, setPersonalization] = useState<{ [leadId: string]: { first_name: string; company: string } }>({});
  const [sending, setSending] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  
  // Send configuration
  const [sendConfig, setSendConfig] = useState({
    batchSize: 10,
    minDelay: 5,
    maxDelay: 30,
    batchDelay: 300
  });

  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logsCampaign, setLogsCampaign] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (sendDialogOpen) {
      (async () => {
        const res = await apiRequest("GET", `${apiUrl}/api/leads/batches`);
        const data = await res.json();
        setBatches(data.batches || []);
        setSelectedBatchId("");
        setSendLeads([]);
        setSelectedLeadIds([]);
      })();
    }
  }, [sendDialogOpen]);

  useEffect(() => {
    if (sendDialogOpen && selectedBatchId) {
      (async () => {
        const res = await apiRequest("GET", `${apiUrl}/api/leads/list?batch_id=${selectedBatchId}`);
        const data = await res.json();
        setSendLeads(data.leads || []);
        setPersonalization(
          Object.fromEntries((data.leads || []).map((l: any) => [l.id, { first_name: l.first_name, company: l.company }]))
        );
        setSelectedLeadIds((data.leads || []).map((l: any) => l.id));
      })();
    } else {
      setSendLeads([]);
      setSelectedLeadIds([]);
    }
  }, [sendDialogOpen, selectedBatchId]);

  useEffect(() => {
    if (logsDialogOpen && logsCampaign) {
      setLogsLoading(true);
      apiRequest("GET", `${apiUrl}/api/email-campaigns/${logsCampaign.id}/logs`)
        .then(res => res.json())
        .then(data => setLogs(data))
        .finally(() => setLogsLoading(false));
    }
  }, [logsDialogOpen, logsCampaign]);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await apiRequest("POST", `${apiUrl}/api/email-campaigns/${sendCampaign.id}/send`, {
        leadIds: selectedLeadIds,
        personalization,
        ...sendConfig
      });
      const data = await res.json();
      toast.toast({ 
        title: "Campaign Sent", 
        description: `${data.sent} emails sent successfully via MailerSend. ${data.failed > 0 ? `${data.failed} failed.` : ''}` 
      });
      setSendDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    } catch (e: any) {
      toast.toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

 const filteredCampaigns = (campaigns || []).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "opened":
        return <Eye className="h-4 w-4 text-blue-600" />;
      case "clicked":
        return <MousePointerClick className="h-4 w-4 text-purple-600" />;
      case "bounced":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "complained":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Sidebar />
      <main className="main-content ml-0 xl:ml-72 p-4 xl:p-8 min-h-screen animate-fade-in transition-all duration-300">
        {/* Header */}
        <header className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-800">Email Campaigns</h1>
                <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-medium rounded-full shadow-md">
                  {filteredCampaigns.length} Active
                </div>
              </div>
              <p className="text-slate-600">Create, manage, and track your email outreach campaigns via MailerSend</p>
            </div>
            
           
                           
              <Button 
                onClick={() => setShowCreate(true)}
                className="btn-primary-enhanced"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>   
        </header>

        {/* Performance Chart */}
        <div className="mb-6">
          <div className="font-semibold text-lg mb-2">Performance Over Time</div>
          <Card className="w-full shadow-sm">
            <CardContent className="p-4">
              <div className="h-40">
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading chart...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.isArray(chartData) && chartData.length > 0 ? chartData : mockChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sent" stroke="#2563eb" name="Sent" />
                      <Line type="monotone" dataKey="responses" stroke="#10b981" name="Responses" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search email campaigns..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Grid */}
         {filteredCampaigns.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-envelope text-muted-foreground text-2xl"></i>
                </div>
                <h3 className="font-medium mb-2">No email campaigns found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first email campaign to start organizing your outreach efforts"
                  }
                </p>
                </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((c) => (
              <Card key={c.id} className="shadow-md border border-blue-200 hover:shadow-lg transition-all duration-200 bg-white">
                <CardHeader className="pb-2 border-b border-blue-100 bg-blue-50 rounded-t">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-blue-800">{c.name}</CardTitle>
                      <div className="text-sm text-muted-foreground">{c.subject}</div>
                    </div>
                    <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats - KPIs from campaignStats */}
                    <div className="grid grid-cols-5 gap-4 text-center mb-2">
                      <div>
                        <div className="text-2xl font-bold text-indigo-700">
                          {(campaignStats?.sent ?? 0) + (campaignStats?.accepted ?? 0) + (campaignStats?.replied ?? 0) + (campaignStats?.failed ?? 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Leads</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-700">{campaignStats?.sent ?? 0}</div>
                        <div className="text-xs text-muted-foreground">Sent</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-700">{campaignStats?.accepted ?? 0}</div>
                        <div className="text-xs text-muted-foreground">Accepted</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{campaignStats?.replied ?? 0}</div>
                        <div className="text-xs text-muted-foreground">Replied</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{campaignStats?.failed ?? 0}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 justify-end mt-2">
                      <Button
                        variant={c.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        className={c.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                        onClick={() => handleStatusChange(c.id, c.status === "active" ? "paused" : "active")}
                        data-testid={`button-campaign-status-${c.id}`}
                      >
                        {c.status === "active" ? "Pause" : "Activate"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleEditDraft(c)}
                        data-testid={`button-campaign-edit-${c.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleDeleteDraft(c)}
                        disabled={deleteLoadingId === c.id}
                        data-testid={`button-campaign-delete-${c.id}`}
                      >
                        {deleteLoadingId === c.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Delete
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => { setSendCampaign(c); setSendDialogOpen(true); }}
                        data-testid={`button-campaign-send-${c.id}`}
                      >
                        Send Emails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Email Logs Dialog */}
        <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Campaign Email Logs - {logsCampaign?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto max-h-[60vh]">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading logs...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No email logs found for this campaign
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, idx) => (
                    <Card key={idx} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getLogStatusIcon(log.status)}
                              <span className="font-medium">{log.lead_name || 'Unknown Lead'}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Email: {log.to_email}</div>
                              {log.sent_at && (
                                <div>Sent: {new Date(log.sent_at).toLocaleString()}</div>
                              )}
                              {log.opened_at && (
                                <div className="text-blue-600">
                                  <Eye className="h-3 w-3 inline mr-1" />
                                  Opened: {new Date(log.opened_at).toLocaleString()}
                                </div>
                              )}
                              {log.clicked_at && (
                                <div className="text-purple-600">
                                  <MousePointerClick className="h-3 w-3 inline mr-1" />
                                  Clicked: {new Date(log.clicked_at).toLocaleString()}
                                </div>
                              )}
                              {log.message_id && (
                                <div className="text-xs text-gray-500">
                                  Message ID: {log.message_id}
                                </div>
                              )}
                              {log.error && (
                                <div className="text-red-600 text-xs mt-1">
                                  <AlertCircle className="h-3 w-3 inline mr-1" />
                                  Error: {log.error}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Emails Dialog */}
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Campaign via MailerSend</DialogTitle>
              <p className="text-sm text-muted-foreground">Configure and send your email campaign with smart throttling</p>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Lead Selection */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Recipients
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Lead Batch</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={selectedBatchId}
                        onChange={e => setSelectedBatchId(e.target.value)}
                      >
                        <option value="">-- Select Batch --</option>
                        {batches.map((batch: any) => (
                          <option key={batch.id} value={batch.id}>{batch.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedBatchId && (
                      <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
                        {sendLeads.length === 0 ? (
                          <div className="text-center text-muted-foreground py-4">
                            No leads available in this batch
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {sendLeads.map((lead: any) => (
                              <label key={lead.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedLeadIds.includes(lead.id)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedLeadIds(ids => [...ids, lead.id]);
                                    } else {
                                      setSelectedLeadIds(ids => ids.filter(id => id !== lead.id));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="font-medium">{lead.first_name} {lead.last_name}</span>
                                <span className="text-xs text-muted-foreground">({lead.email})</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-sm text-blue-600 font-medium">
                      {selectedLeadIds.length} recipient(s) selected
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Send Configuration */}
              <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Throttling & Anti-Spam Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Batch Size</label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={sendConfig.batchSize}
                        onChange={e => setSendConfig(c => ({ ...c, batchSize: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Emails per batch</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Batch Delay (seconds)</label>
                      <Input
                        type="number"
                        min={60}
                        max={3600}
                        value={sendConfig.batchDelay}
                        onChange={e => setSendConfig(c => ({ ...c, batchDelay: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Wait time between batches</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Min Delay (seconds)</label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={sendConfig.minDelay}
                        onChange={e => setSendConfig(c => ({ ...c, minDelay: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Min wait between emails</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Delay (seconds)</label>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={sendConfig.maxDelay}
                        onChange={e => setSendConfig(c => ({ ...c, maxDelay: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Max wait between emails</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Estimated Time:</strong> {Math.ceil(
                      (selectedLeadIds.length * (sendConfig.minDelay + sendConfig.maxDelay) / 2 + 
                      Math.floor(selectedLeadIds.length / sendConfig.batchSize) * sendConfig.batchDelay) / 60
                    )} minutes
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || selectedLeadIds.length === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending via MailerSend...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send {selectedLeadIds.length} Emails
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Dialog */}
        <Dialog open={!!editingDraft} onOpenChange={open => { if (!open) setEditingDraft(null); }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Name</label>
                <Input
                  placeholder="Campaign Name"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input
                  placeholder="Subject"
                  value={editForm.subject}
                  onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Body</label>
                <ReactQuill
                  theme="snow"
                  value={editForm.body}
                  onChange={(value: string) => setEditForm(f => ({ ...f, body: value }))}
                  className="bg-white border rounded"
                  style={{ height: "300px", marginBottom: "50px" }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDraft(null)}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={editLoading}>
                {editLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Email Campaign Modal */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
      <DialogContent 
            className="max-w-5xl w-full h-[90vh] p-0 overflow-hidden"
          >
        <DialogHeader className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Mail className="h-6 w-6" />
            </div>
                Create Email Campaign
              </DialogTitle>
              <p className="text-blue-100 mt-2">Design your email campaign with AI assistance and automated follow-ups via MailerSend</p>
            </DialogHeader>

            {/* Tab Navigation */}
            <div className="px-8 pt-6 pb-0">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:text-blue-700 hover:bg-white/50'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 flex-1 overflow-y-auto">
              {/* Basic Campaign Details Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <Card className="border-blue-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Settings className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Campaign Configuration</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                          <Input
                            placeholder="e.g., Q4 Partnership Outreach"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="border-blue-200 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                          <Input
                            placeholder="e.g., Partnership opportunity with [Company]"
                            value={form.subject}
                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            className="border-blue-200 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                          <ReactQuill
                            theme="snow"
                            value={form.body}
                            onChange={(value: string) => setForm(f => ({ ...f, body: value }))}
                            className="bg-white border-blue-200 rounded"
                            style={{ height: "300px", marginBottom: "50px" }}
                            placeholder="Write your email content here... Use placeholders like [First Name], [Company], etc."
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Tip: Use personalization tokens like [First Name], [Company], [Industry] for better engagement
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI Assistant Tab */}
              {activeTab === "ai" && (
                <div className="space-y-6">
                  <Card className="border-purple-200 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">AI Message Generator</h3>
                        <Badge className="bg-purple-100 text-purple-700 ml-auto">Powered by AI</Badge>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Target className="h-4 w-4 inline mr-1" />
                              Personalization Context
                            </label>
                            <Input
                              placeholder="e.g., shared interests, company news"
                              value={aiPrompt.personalization}
                              onChange={e => setAiPrompt(p => ({ ...p, personalization: e.target.value }))}
                              className="border-purple-200 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Zap className="h-4 w-4 inline mr-1" />
                              Call to Action
                            </label>
                            <Input
                              placeholder="e.g., schedule a call, book a demo"
                              value={aiPrompt.cta}
                              onChange={e => setAiPrompt(p => ({ ...p, cta: e.target.value }))}
                              className="border-purple-200 focus:border-purple-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MessageCircle className="h-4 w-4 inline mr-1" />
                            Tone of Voice
                          </label>
                          <select 
                            value={aiPrompt.tone} 
                            onChange={e => setAiPrompt(p => ({ ...p, tone: e.target.value }))} 
                            className="w-full border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500"
                          >
                            <option value="professional">Professional & Formal</option>
                            <option value="friendly">Friendly & Approachable</option>
                            <option value="casual">Casual & Conversational</option>
                          </select>
                        </div>
                        
                        <Button 
                          onClick={handleGenerateAiMessage} 
                          disabled={aiLoading}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
                        >
                          {aiLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating with AI...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate AI Message
                            </>
                          )}
                        </Button>
                        
                        {aiMessage && (
                          <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-green-800">AI Generated Content</h4>
                                <Button 
                                  size="sm" 
                                  onClick={applyAiMessage}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Apply to Campaign
                                </Button>
                              </div>
                              <div className="text-sm text-green-900 whitespace-pre-line bg-white p-3 rounded border border-green-200">
                                {aiMessage}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Follow-up Sequence Tab */}
              {activeTab === "followup" && (
                <div className="space-y-6">
                  <Card className="border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-yellow-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Automated Follow-up Sequence</h3>
                        <Badge className="bg-orange-100 text-orange-700 ml-auto">
                          {followUps.length} follow-ups
                        </Badge>
                      </div>
                      
                      {followUps.length > 0 && (
                        <div className="space-y-3 mb-6">
                          <h4 className="text-sm font-medium text-gray-700">Your Follow-up Sequence:</h4>
                          {followUps.map((fu, idx) => (
                            <Card key={idx} className="border-orange-200 bg-white">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className="bg-orange-100 text-orange-700 text-xs">
                                        Day {fu.delay_days}
                                      </Badge>
                                      <span className="font-medium text-gray-900">{fu.subject}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{fu.body.replace(/<[^>]*>/g, '')}</p>
                                  </div>
                                  <div className="flex gap-1 ml-4">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => editFollowUp(idx)}
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => deleteFollowUp(idx)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                      
                      <Card className="border-dashed border-2 border-orange-300 bg-white/50">
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {editingFollowUpIdx !== null ? 'Edit Follow-up' : 'Add New Follow-up'}
                          </h4>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Days after previous email</label>
                              <Input
                                type="number"
                                min={1}
                                placeholder="3"
                                value={followUpDraft.delay_days}
                                onChange={e => setFollowUpDraft(f => ({ ...f, delay_days: Number(e.target.value) }))}
                                className="w-24"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                              <Input
                                placeholder="Follow-up: Partnership opportunity"
                                value={followUpDraft.subject}
                                onChange={e => setFollowUpDraft(f => ({ ...f, subject: e.target.value }))}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
                              <ReactQuill
                                theme="snow"
                                value={followUpDraft.body}
                                onChange={(value: string) => setFollowUpDraft(f => ({ ...f, body: value }))}
                                className="bg-white rounded"
                                style={{ height: "200px", marginBottom: "50px" }}
                                placeholder="Hi [First Name], I wanted to follow up..."
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={addFollowUp}
                                disabled={!followUpDraft.subject.trim() || !followUpDraft.body.trim()}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                {editingFollowUpIdx !== null ? 'Update Follow-up' : 'Add Follow-up'}
                              </Button>
                              
                              {editingFollowUpIdx !== null && (
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setFollowUpDraft({ subject: "", body: "", delay_days: 1 });
                                    setEditingFollowUpIdx(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="px-8 py-6 bg-white border-t border-gray-200 rounded-b-lg">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-gray-500">
                  {form.name && (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Campaign: {form.name}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createMutation.mutate(form)}
                    disabled={
                      createMutation.status === "pending" ||
                      !form.name.trim() ||
                      !form.subject.trim() ||
                      !form.body.trim()
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
                  >
                    {createMutation.status === "pending" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Create Campaign
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}