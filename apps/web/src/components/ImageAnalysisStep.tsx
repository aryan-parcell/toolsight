import { Scan } from "lucide-react";

interface ImageAnalysisStepProps {
    image: string;
    isAnalyzing: boolean;
    onBack: () => void;
    onRunAnalysis: () => void;
}

export default function ImageAnalysisStep({
    image,
    isAnalyzing,
    onBack,
    onRunAnalysis,
}: ImageAnalysisStepProps) {
    return (
        <div className="w-full bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark rounded-xl overflow-hidden">
            <div className="relative w-full">
                <img
                    src={image}
                    alt="Uploaded reference"
                    className="w-full h-auto opacity-30 blur-sm"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 space-y-6">
                    {isAnalyzing ? (
                        <>
                            <div className="w-20 h-20 border-4 border-axiom-cyan border-t-transparent rounded-full animate-spin mb-6" />
                            <h3 className="text-2xl font-bold text-white animate-pulse">
                                Analyzing Image…
                            </h3>
                            <p className="text-gray-300 mt-2">
                                Detecting tools and features via Gemini AI
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-24 h-24 bg-axiom-cyan/20 rounded-full flex items-center justify-center text-axiom-cyan">
                                <Scan size={48} />
                            </div>

                            <h3 className="text-xl font-bold">
                                Image Loaded
                            </h3>

                            <div className="flex gap-4">
                                <button
                                    onClick={onBack}
                                    className="bg-gray-800 text-white border border-gray-700 px-8 py-4 rounded-full font-bold hover:bg-gray-700 transition-colors shadow-lg flex items-center gap-2"
                                >
                                    Back
                                </button>

                                <button
                                    onClick={onRunAnalysis}
                                    className="bg-axiom-cyan text-black px-8 py-4 rounded-full font-bold hover:bg-[#00ccff] transition-colors shadow-lg hover:shadow-axiom-cyan/20 flex items-center gap-2"
                                >
                                    Run AI Detection
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
