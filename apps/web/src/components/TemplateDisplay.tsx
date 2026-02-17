import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Detection, Template } from '@shared/types';
import ToolDetection from './ToolDetection';

interface TemplateDisplayProps {
    templateId: string;
}

export default function TemplateDisplay({ templateId }: TemplateDisplayProps) {
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                setLoading(true);
                const snap = await getDoc(doc(db, 'templates', templateId));
                if (snap.exists()) {
                    setTemplate({ id: snap.id, ...snap.data() } as Template);
                } else {
                    setError("Template reference not found (Deleted?)");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load template visual.");
            } finally {
                setLoading(false);
            }
        };

        if (templateId) fetchTemplate();
    }, [templateId]);

    if (loading) return <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin text-axiom-cyan" /></div>;

    if (error || !template) return (
        <div className="flex items-center gap-2 p-4 border border-yellow-700/50 bg-yellow-900/20 rounded-lg text-yellow-200 text-sm">
            <AlertTriangle size={16} /> {error || "Template unavailable"}
        </div>
    );

    return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
            <img
                src={template.imageUrl}
                alt="Template Master"
                className="w-full h-full object-contain select-none pointer-events-none opacity-80"
            />

            <ToolDetection
                toolPositions={template.tools.map(tool => {
                    return {
                        ...tool,
                        name: tool.toolName,
                        toolId: '',
                        status: 'present',
                        confidence: 1,
                    } as Detection;
                })}
                isEditMode={false}
            />
        </div>
    );
};
