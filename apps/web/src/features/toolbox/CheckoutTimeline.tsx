import type { Audit, Checkout, User } from '@shared/types';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, User as LucideUser } from 'lucide-react';

interface CheckoutTimelineProps {
    checkouts: Checkout[];
    audits: Audit[];
    users: User[];
    onSelectAudit: (audit: Audit) => void;
}

export function CheckoutTimeline({ checkouts, audits, users, onSelectAudit }: CheckoutTimelineProps) {
    const getUserName = (userId: string) => {
        const user = users.find(u => u.id === userId || u.email === userId);
        return user?.displayName || user?.email || userId;
    };

    // Convert Firestore timestamps to Date objects
    const convertToDate = (timestamp: any) => {
        if (!timestamp) return null;
        return timestamp instanceof Date ? timestamp : timestamp.toDate?.() || new Date(timestamp);
    }

    // Format timestamps for display
    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'PRESENT';

        const d = convertToDate(timestamp);
        return format(d, 'MMM d, h:mm a');
    };

    const getAuditsForCheckout = (checkoutId: string) => {
        return audits.filter(a => a.checkoutId === checkoutId)
            .sort((a, b) => {
                const aTime = convertToDate(a.startTime)?.getTime() || 0;
                const bTime = convertToDate(b.startTime)?.getTime() || 0;
                return bTime - aTime;
            });
    };

    if (checkouts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p>No checkout history found for this toolbox.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 relative before:absolute before:h-full before:ml-5 before:-translate-x-px before:w-0.5 before:bg-gradient-to-b before:from-axiom-cyan/50 before:via-gray-300 dark:before:via-gray-700">
            {checkouts.map((checkout) => {
                const checkoutAudits = getAuditsForCheckout(checkout.id!);
                const isActive = checkout.status === 'active';

                return (
                    <div key={checkout.id} className="relative pl-12 group">
                        {/* Timeline Node */}
                        <div className={`absolute left-0 w-10 h-10 rounded-full border-4 border-axiom-surfaceLight dark:border-axiom-surfaceDark flex items-center justify-center z-10 transition-colors ${isActive ? 'bg-axiom-cyan text-black' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                            <LucideUser size={18} />
                        </div>

                        {/* Checkout Card */}
                        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-all space-y-4">
                            <div>
                                <h4 className="font-bold dark:text-white flex items-center gap-2">
                                    {getUserName(checkout.userId)}
                                    {isActive && (
                                        <span className="text-xs bg-axiom-cyan/20 text-axiom-cyan px-2 py-0.5 rounded-full">
                                            ACTIVE
                                        </span>
                                    )}
                                </h4>

                                <p className="text-xs text-gray-500 font-mono">
                                    {formatTimestamp(checkout.checkoutTime)} → {formatTimestamp(checkout.returnTime)}
                                </p>
                            </div>

                            {/* Nested Audits */}
                            {checkoutAudits.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Audits Performed</p>
                                    {checkoutAudits.map((audit) => {
                                        const isComplete = !!audit.endTime;
                                        return (
                                            <button
                                                key={audit.id}
                                                onClick={() => onSelectAudit(audit)}
                                                className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-axiom-cyan/10 dark:hover:bg-axiom-cyan/10 transition-colors group/audit"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isComplete ? (
                                                        <CheckCircle2 className="text-green-500" size={16} />
                                                    ) : (
                                                        <AlertCircle className="text-yellow-500" size={16} />
                                                    )}
                                                    <div className="text-left">
                                                        <p className="text-sm font-medium dark:text-gray-200">
                                                            Audit at {formatTimestamp(audit.startTime)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500">
                                                            {isComplete ? 'Completed' : 'In Progress'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-gray-400 group-hover/audit:text-axiom-cyan transition-colors" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
