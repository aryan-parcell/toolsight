import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFunctions } from '@/hooks/useFunctions';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentGate() {
    const { organization } = useAuth();
    const { createCheckoutSession, loading, error } = useFunctions();

    useEffect(() => {
        if (error) alert(`Could not connect to checkout session: ${error}`);
    }, [error]);

    const handleSubscribe = async () => {
        const data = await createCheckoutSession(organization!.id);

        if (data?.url) window.location.href = data.url; // Redirect to Stripe
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-lg">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ToolSight!</h1>
                <p className="text-gray-600 mb-6">
                    To start managing toolboxes for <strong>{organization?.name}</strong>, please activate your organization's subscription.
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full text-lg h-12"
                >
                    {loading ? 'Connecting securely to Stripe...' : 'Subscribe Now'}
                </Button>

                <p className="text-xs text-gray-400 mt-4">
                    Secure billing powered by Stripe. You can cancel anytime.
                </p>
            </Card>
        </div>
    );
};
