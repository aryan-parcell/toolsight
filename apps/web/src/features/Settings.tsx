import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFunctions } from "@/hooks/useFunctions";

export default function Settings() {
    const { organization } = useAuth();
    const { createPortalSession, loading: loadingPortal, error: portalError } = useFunctions();

    useEffect(() => {
        if (portalError) alert(`Could not connect to billing portal: ${portalError}`);
    }, [portalError]);

    const handleManageSubscription = async () => {
        const data = await createPortalSession(organization!.id);

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

            {/* Billing Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Billing & Subscription</CardTitle>
                    <CardDescription>Manage your ToolSight Pro plan, payment methods, and invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
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
                </CardContent>
            </Card>
        </div>
    );
}