import { useState } from "react";
import type { ToolBox, Audit } from "@shared/types";
import { useToolboxHistory } from "@/hooks/useToolboxHistory";
import { useUsers } from "../../hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { CheckoutTimeline } from "./CheckoutTimeline";
import { AuditDetailView } from "./AuditDetailView";

interface ToolboxHistoryPaneProps {
    toolbox: ToolBox;
}

export function ToolboxHistoryPane({ toolbox }: ToolboxHistoryPaneProps) {
    const { organization } = useAuth();
    const { checkouts, audits, loading: historyLoading, error: historyError } = useToolboxHistory(toolbox.id);
    const { users, loading: usersLoading, error: usersError } = useUsers(organization?.id);

    const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

    const loading = historyLoading || usersLoading;

    return (
        <div className="h-full flex flex-col min-h-0">
            {selectedAudit ? (
                <AuditDetailView
                    audit={selectedAudit}
                    toolbox={toolbox}
                    onBack={() => setSelectedAudit(null)}
                />
            ) : (
                <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-300">
                    <h3 className="text-lg font-black dark:text-white mb-6">Toolbox History</h3>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-4">
                                <div className="w-8 h-8 border-4 border-axiom-cyan border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm font-medium">Synchronizing history...</p>
                            </div>
                        ) : historyError ? (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                                <strong>Error Loading History:</strong> {historyError}
                            </div>
                        ) : usersError ? (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                                <strong>Error Loading Users:</strong> {usersError}
                            </div>
                        ) : (
                            <CheckoutTimeline
                                checkouts={checkouts}
                                audits={audits}
                                users={users}
                                onSelectAudit={setSelectedAudit}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
