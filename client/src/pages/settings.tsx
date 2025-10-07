import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon, Key, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Settings() {
  const { toast } = useToast();
  const [apolloApiKey, setApolloApiKey] = useState("");

  const { data: userInfo, isLoading } = useQuery<{
    has_apollo_key: boolean;
    has_mailersend_key: boolean;
    has_openai_key: boolean;
  }>({
    queryKey: [`${apiUrl}/users/me`],
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: async (data: { apollo_api_key: string }) => {
      const res = await apiRequest("PUT", `${apiUrl}/users/me/api-keys`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to update API key");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Apollo API key saved successfully",
        variant: "default",
      });
      setApolloApiKey("");
      queryClient.invalidateQueries({ queryKey: [`${apiUrl}/users/me`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveApolloKey = () => {
    if (!apolloApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an Apollo API key",
        variant: "destructive",
      });
      return;
    }
    updateApiKeyMutation.mutate({ apollo_api_key: apolloApiKey });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
              <p className="text-slate-600">Configure your API keys and integrations</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  Apollo.io API Key
                </CardTitle>
                <CardDescription>
                  Configure your Apollo.io API key to enable lead scraping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  {userInfo?.has_apollo_key ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        Apollo API key is configured
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">
                        No Apollo API key configured
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>📋</span> How to get your Apollo.io API key:
                  </h3>
                  <ol className="space-y-2 text-sm text-slate-600">
                    <li className="flex gap-2">
                      <span className="font-semibold text-blue-600">1.</span>
                      <span>
                        Go to{" "}
                        <a
                          href="https://app.apollo.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          data-testid="link-apollo-website"
                        >
                          Apollo.io
                          <ExternalLink className="h-3 w-3" />
                        </a>{" "}
                        and log in to your account
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-blue-600">2.</span>
                      <span>Click on your profile icon in the top right corner</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-blue-600">3.</span>
                      <span>Navigate to Settings → API</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-blue-600">4.</span>
                      <span>
                        Click "Create New Key" or copy your existing API key
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-blue-600">5.</span>
                      <span>Paste the API key below and click "Save"</span>
                    </li> 
                    <li className="flex gap-2">
                      <span className="font-semibold text-blue-600">6.</span>
                      <span>Make sure you are on upgraded plan on Apollo.io</span>
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apollo-api-key">Apollo.io API Key</Label>
                  <Input
                    id="apollo-api-key"
                    type="password"
                    placeholder="Enter your Apollo.io API key"
                    value={apolloApiKey}
                    onChange={(e) => setApolloApiKey(e.target.value)}
                    className="font-mono"
                    data-testid="input-apollo-api-key"
                  />
                  <p className="text-xs text-slate-500">
                    Your API key is stored securely and used only for lead scraping
                  </p>
                </div>

                <Button
                  onClick={handleSaveApolloKey}
                  disabled={updateApiKeyMutation.isPending || !apolloApiKey.trim()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  data-testid="button-save-apollo-key"
                >
                  {updateApiKeyMutation.isPending ? "Saving..." : "Save API Key"}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">Need Help?</CardTitle>
                <CardDescription>
                  Having trouble configuring your API keys?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  If you need assistance setting up your Apollo.io API key or have any questions about lead scraping, please contact our support team.
                </p>
                <Button variant="outline" className="border-slate-300" data-testid="button-contact-support">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
