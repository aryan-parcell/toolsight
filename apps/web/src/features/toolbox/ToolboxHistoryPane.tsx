import type { ToolBox } from "@shared/types";
import { useToolboxHistory } from "@/hooks/useToolboxHistory";

interface ToolboxHistoryPaneProps {
    toolbox: ToolBox;
}

export function ToolboxHistoryPane({ toolbox }: ToolboxHistoryPaneProps) {
    const { checkouts, audits, loading, error } = useToolboxHistory(toolbox.id);

    return (
        <div className="h-full flex flex-col space-y-4">
            <h3 className="text-lg font-bold dark:text-white">Toolbox History</h3>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                        Loading history...
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
                        Error loading history: {error.message}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-center space-y-2 text-gray-500">
                            <p className="font-medium">History View Placeholder</p>
                            <p className="text-sm italic">
                                Found {checkouts.length} checkouts and {audits.length} audits.
                                <br />
                                Timeline implementation TBD.
                            </p>
                        </div>

                        {/* Temporary debug list */}
                        {checkouts.map(c => (
                            <div key={c.id} className="text-xs text-gray-400 border-l-2 border-gray-700 pl-3 py-1">
                                Checkout {c.id} by User {c.userId}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
