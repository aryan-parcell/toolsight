import { Wrench, Hammer, Settings, TriangleAlert } from "lucide-react";

type TileType = "wrench" | "hammer" | "settings";

interface Tile {
    id: string;
    type: TileType;
    missing?: boolean;
}

const ICONS = {
    wrench: Wrench,
    hammer: Hammer,
    settings: Settings,
};

const generateTiles = (): Tile[] => {
    const baseTypes: TileType[] = ["wrench", "hammer", "settings"];

    return Array.from({ length: 16 }).map((_, index) => {
        const id = `A-${index.toString().padStart(2, "0")}`;

        return {
            id,
            type: baseTypes[index % baseTypes.length],
            missing: ["A-03", "A-06", "A-13"].includes(id),
        };
    });
};

const tiles = generateTiles();

export default function SystemGrid() {
    const missingCount = tiles.filter((t) => t.missing).length;

    return (
        <div className="flex-1">
            <div className="relative w-full max-w-lg mx-auto rounded-2xl bg-slate-900">
                {/* Top Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono text-[10px] text-slate-400">
                            SYSTEM ONLINE
                        </span>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-400">
                        LIVE FEED
                    </span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-4 gap-4 p-6 pt-16 pb-6 h-full w-full relative">
                    {tiles.map((tile) => {
                        const Icon = tile.missing ? TriangleAlert : ICONS[tile.type];

                        return (
                            <div
                                key={tile.id}
                                className={`
                                    aspect-square relative rounded-lg border flex items-center justify-center transition-all duration-500
                                    ${tile.missing ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/10"}
                                `}
                            >
                                <Icon className={`w-6 h-6 ${tile.missing ? "text-red-500 animate-pulse" : "text-slate-400"}`} />

                                <span className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-600">
                                    {tile.id}
                                </span>
                            </div>
                        );
                    })}


                </div>

                {/* Bottom Alert Banner */}
                {missingCount > 0 && (
                    <div className="z-20">
                        <div className="bg-red-500/10 border border-red-500/50 p-2 px-6 rounded-b-2xl rounded-t-none flex items-center gap-3 backdrop-blur-sm">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span className="text-red-400 font-mono text-xs tracking-widest uppercase">
                                {missingCount} Missing Items Detected
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
