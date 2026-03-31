import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FunctionsRepository } from '../repositories/FunctionsRepository';

interface PaymentGateProps {
    orgId: string;
    orgName: string;
}

export const PaymentGate: React.FC<PaymentGateProps> = ({ orgId, orgName }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubscribe = async () => {
        setLoading(true);
        setError('');

        console.log(`Initiating subscription for orgId: ${orgId}`);

        try {
            const data = await FunctionsRepository.createCheckoutSession(orgId);

            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe
            } else {
                setError('Failed to generate checkout link.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred connecting to billing.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-lg">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ToolSight!</h1>
                <p className="text-gray-600 mb-6">
                    To start managing toolboxes for <strong>{orgName}</strong>, please activate your organization's subscription.
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
