import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Crown, Zap, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Plan {
  name: string;
  price: number;
  currency: string;
  leads_limit: number;
  description: string;
}

interface Subscription {
  tier: string;
  status: string;
}

interface Usage {
  current_usage: number;
  limit: number;
  tier: string;
  remaining: number;
}

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Pricing() {
  const { toast } = useToast();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);

  // Toast for payment status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const cancel = urlParams.get('cancel');
    
    if (success === 'true') {
      toast({
        title: "Payment Successful",
        description: "Your subscription is now active!",
        variant: "default",
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (cancel === 'true') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. Please try again.",
        variant: "destructive",
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Queries with proper error handling
  const { data: plans, isLoading: plansLoading, error: plansError } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${apiUrl}/api/subscriptions/plans`);
      if (!res.ok) {
        throw new Error('Failed to fetch plans');
      }
      return await res.json();
    },
    retry: 2,
  });

  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<Subscription>({
    queryKey: ["currentSubscription"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${apiUrl}/api/subscriptions/current`);
      if (!res.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return await res.json();
    },
    retry: 2,
  });

  const { data: usage, isLoading: usageLoading } = useQuery<Usage>({
    queryKey: ["usage-widget"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${apiUrl}/api/subscriptions/usage`);
      if (!res.ok) {
        throw new Error('Failed to fetch usage');
      }
      return await res.json();
    },
    retry: 2,
    refetchInterval: 10000, // auto-refresh every 10s for real-time updates
  });

  // Mutation for checkout
  const createPaymentMutation = useMutation({
    mutationFn: async (planTier: string) => {
      const res = await apiRequest("POST", `${apiUrl}/api/subscriptions/create-payment`, {
        plan_tier: planTier,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(null);
    },
  });

  const handleUpgrade = async (planTier: string) => {
    if (loading) return; // Prevent double clicks
    
    setLoading(planTier);
    try {
      await createPaymentMutation.mutateAsync(planTier);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(null);
    }
  };

  // UI helpers
  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return <Zap className="h-6 w-6 text-gray-600" />;
      case "pro":
        return <Crown className="h-6 w-6 text-blue-600" />;
      case "enterprise":
        return <Building className="h-6 w-6 text-purple-600" />;
      default:
        return <Zap className="h-6 w-6 text-gray-600" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return "border-gray-200";
      case "pro":
        return "border-blue-500 ring-2 ring-blue-100";
      case "enterprise":
        return "border-purple-500 ring-2 ring-purple-100";
      default:
        return "border-gray-200";
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    if (currency === 'NGN' || currency === 'naira') {
      return `₦${amount.toLocaleString()}`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (plansError) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-72 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl">
            <h2 className="text-red-800 font-semibold">Error Loading Plans</h2>
            <p className="text-red-600">Unable to load pricing plans. Please try again later.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-72 p-6 max-w-full">
        <header className="mb-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Pricing Plans</h1>
          <p className="text-gray-600">
            Choose the perfect plan for your lead generation needs
          </p>
        </header>

        {/* Current Usage - always visible, auto-updating */}
        <Card className="mb-8 max-w-8xl">
          <CardHeader>
            <CardTitle className="text-lg">Current Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {usage ? `${usage.current_usage.toLocaleString()} / ${usage.limit.toLocaleString()} leads used` : "- / - leads used"}
                </span>
                <Badge variant={usage ? (usage.current_usage > usage.limit ? "destructive" : "secondary") : "secondary"}>
                  {usage ? usage.tier.toUpperCase() : "-"}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    usage ? (
                      usage.current_usage > usage.limit
                        ? "bg-red-500"
                        : usage.current_usage >= usage.limit * 0.8
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    ) : "bg-gray-300"
                  }`}
                  style={{ 
                    width: usage ? `${Math.min(100, (usage.current_usage / usage.limit) * 100)}%` : "0%" 
                  }}
                />
              </div>
              {usage ? (
                usage.current_usage > usage.limit ? (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ You have exceeded your monthly credit limit by {usage.current_usage - usage.limit} leads!
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {usage.remaining.toLocaleString()} leads remaining this month
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-400">Loading usage...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {plansLoading && (
          <div className="flex justify-center items-center py-12 max-w-4xl">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading plans...</span>
          </div>
        )}

        {/* Pricing Cards */}
        {plans && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 max-w-8xl">
            {plans.map((plan) => {
              const isCurrentPlan = currentSubscription?.tier === plan.name.toLowerCase();
              const isPopular = plan.name.toLowerCase() === "pro";
              const isLoading = loading === plan.name.toLowerCase();
              
              return (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    isPopular ? "border-2 border-blue-500 shadow-lg scale-105" : ""
                  } ${getPlanColor(plan.name)}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-blue-600 text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      {getPlanIcon(plan.name)}
                    </div>
                    <CardTitle className="text-xl font-bold capitalize">
                      {plan.name}
                    </CardTitle>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(plan.price, plan.currency)}
                      {plan.price > 0 && (
                        <span className="text-sm text-gray-500 font-normal">/month</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {plan.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>{plan.leads_limit.toLocaleString()} leads per month</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>LinkedIn automation</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>Email campaigns</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>Lead management</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>Analytics & reporting</span>
                      </li>
                      {plan.name.toLowerCase() !== "free" && (
                        <li className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span>Priority support</span>
                        </li>
                      )}
                    </ul>
                    
                    <Button
                      className={`w-full ${
                        isCurrentPlan
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100"
                          : isPopular
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : ""
                      }`}
                      variant={isPopular ? "default" : "outline"}
                      disabled={isCurrentPlan || isLoading || createPaymentMutation.isPending}
                      onClick={() => handleUpgrade(plan.name.toLowerCase())}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : plan.price === 0 ? (
                        "Get Started"
                      ) : (
                        "Upgrade Now"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Comparison Table */}
        {plans && plans.length > 0 && (
          <Card className="max-w-8xl">
            <CardHeader>
              <CardTitle>Compare Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Feature</th>
                      {plans.map((plan) => (
                        <th key={`header-${plan.name}`} className="text-center p-3 font-semibold capitalize">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Leads per month</td>
                      {plans.map((plan) => (
                        <td key={`leads-${plan.name}`} className="text-center p-3">
                          {plan.leads_limit.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">LinkedIn automation</td>
                      {plans.map((plan) => (
                        <td key={`linkedin-${plan.name}`} className="text-center p-3 text-green-600">
                          <Check className="h-4 w-4 mx-auto" />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Email campaigns</td>
                      {plans.map((plan) => (
                        <td key={`email-${plan.name}`} className="text-center p-3 text-green-600">
                          <Check className="h-4 w-4 mx-auto" />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Lead management</td>
                      {plans.map((plan) => (
                        <td key={`leadmgmt-${plan.name}`} className="text-center p-3 text-green-600">
                          <Check className="h-4 w-4 mx-auto" />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Analytics & reporting</td>
                      {plans.map((plan) => (
                        <td key={`analytics-${plan.name}`} className="text-center p-3 text-green-600">
                          <Check className="h-4 w-4 mx-auto" />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Priority support</td>
                      {plans.map((plan) => (
                        <td key={`priority-${plan.name}`} className="text-center p-3">
                          {plan.name.toLowerCase() !== "free" ? (
                            <Check className="h-4 w-4 mx-auto text-green-600" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}