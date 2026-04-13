import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useFunctions } from "@/hooks/useFunctions";
import { Building, Copy } from "lucide-react";
import { useEffect } from "react";

export default function Settings() {
    const { organization } = useAuth();
    const { createPortalSession, loading: loadingPortal, error: portalError } = useFunctions();

    useEffect(() => {
        if (portalError) alert(`Could not connect to billing portal: ${portalError}`);
    }, [portalError]);

    const handleManageSubscription = async () => {
        if (!organization?.id) return;
        const data = await createPortalSession(organization.id);

        if (data?.url) window.location.href = data.url; // Redirect to Stripe Portal
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-axiom-headingLight dark:text-white">Settings</h2>
                    <p className="text-axiom-textLight dark:text-axiom-textDark">Edit app and billing preferences.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Organization Information</CardTitle>
                    <CardDescription>View key information regarding the organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-5">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div className="font-semibold text-gray-900 dark:text-white">Organization Name</div>
                            <div className="text-sm text-gray-500">{organization?.name}</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Organization ID</div>
                                <div className="text-sm text-gray-500">Used by maintainer during registration</div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-500">{organization?.id}</div>
                                <Button
                                    variant="outline"
                                    onClick={() => navigator.clipboard.writeText(organization?.id || "")}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">ToolSight Subscription (Active)</div>
                                <div className="text-sm text-gray-500">Billed securely via Stripe</div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleManageSubscription}
                                disabled={loadingPortal}
                            >
                                {loadingPortal ? "Connecting..." : "Manage Subscription"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}