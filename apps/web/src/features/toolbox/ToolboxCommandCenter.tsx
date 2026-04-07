import { DialogTitle } from '@/components/ui/dialog';
import type { ToolBox } from '@shared/types';
import { ToolboxEditPane } from './ToolboxEditPane';
import { ToolboxHistoryPane } from './ToolboxHistoryPane';

interface ToolboxCommandCenterProps {
    toolbox: ToolBox;
    updateToolbox: (id: string, data: Partial<ToolBox>) => Promise<void>;
    deleteToolbox: (id: string) => Promise<void>;
}

export function ToolboxCommandCenter({ toolbox, updateToolbox, deleteToolbox }: ToolboxCommandCenterProps) {
    return (
        <div className="flex flex-col h-full max-h-[85vh]">
            <DialogTitle className="text-2xl font-black dark:text-white mb-6">
                {toolbox.name} 
                <span className="text-axiom-cyan/50 font-mono text-sm ml-2">[{toolbox.id}]</span>
            </DialogTitle>

            <div className="flex flex-1 gap-8 min-h-0">
                {/* Left Pane: Configuration */}
                <div className="flex-1 min-w-0 border-r border-gray-200 dark:border-gray-800 pr-2">
                    <ToolboxEditPane
                        toolbox={toolbox}
                        updateToolbox={updateToolbox}
                        deleteToolbox={deleteToolbox}
                    />
                </div>

                {/* Right Pane: History */}
                <div className="flex-1 min-w-0">
                    <ToolboxHistoryPane toolbox={toolbox} />
                </div>
            </div>
        </div>
    );
}
