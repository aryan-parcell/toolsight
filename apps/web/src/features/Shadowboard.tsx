import React, { useMemo, useState } from "react";
import { Layers, Database, Box, Wrench, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/SectionTitle";
import { TRAY_LIBRARY, DRAWER_RULES } from "@/data/mock-data";

export function ShadowboardSetup() {
    const [boxType, setBoxType] = useState<string>("26 Pro");
    const [filter, setFilter] = useState<string>("all");
    const [slotsTop, setSlotsTop] = useState<(any | null)[]>([null, null]);
    const [slotsBottom, setSlotsBottom] = useState<(any | null)[]>([null, null, null, null]);

    function onDropTemplate(e: React.DragEvent<HTMLDivElement>, index: number, region: "top" | "bottom") {
        const payload = e.dataTransfer.getData("text/json");
        if (!payload) return;
        const tray = JSON.parse(payload);
        const rules = DRAWER_RULES[boxType];
        const allow = region === "top" ? rules.top : rules.bottom;
        const valid = allow.includes(tray.type);

        if (!valid) {
            e.currentTarget.animate(
                [{ boxShadow: "0 0 0 0 rgba(239,68,68,0)" }, { boxShadow: "0 0 0 6px rgba(239,68,68,0.45)" }, { boxShadow: "0 0 0 0 rgba(239,68,68,0)" }],
                { duration: 600 }
            );
            return;
        }

        if (region === "top") {
            setSlotsTop((prev) => {
                const next = [...prev];
                if (tray.type === "TTX4" && index < next.length - 1) {
                    next[index] = tray; next[index + 1] = { ...tray, _span: true };
                } else {
                    next[index] = tray;
                }
                return next;
            });
        } else {
            setSlotsBottom((prev) => {
                const next = [...prev];
                if (tray.type === "TT2" && index < next.length - 1) {
                    next[index] = tray; next[index + 1] = { ...tray, _span: true };
                } else {
                    next[index] = tray;
                }
                return next;
            });
        }
    }

    function onDragStart(e: React.DragEvent, item: any) {
        e.dataTransfer.setData("text/json", JSON.stringify(item));
    }

    function clearSlot(region: "top" | "bottom", index: number) {
        if (region === "top") {
            setSlotsTop((prev) => {
                const next = [...prev];
                next[index] = null;
                return next;
            });
        } else {
            setSlotsBottom((prev) => {
                const next = [...prev];
                next[index] = null;
                return next;
            });
        }
    }

    const filteredLibrary = useMemo(() => TRAY_LIBRARY.filter((t) => filter === "all" || t.type === filter), [filter]);

    return (
        // FIXED: Standardized 3-column grid
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Digital Shadowboard</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                        <Label className="text-xs">Toolbox</Label>
                        <Select value={boxType} onValueChange={setBoxType}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="26 Pro">26 Pro</SelectItem>
                                <SelectItem value="37 Pro">37 Pro</SelectItem>
                                <SelectItem value="53 Pro">53 Pro</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="secondary" size="sm"><Database className="h-4 w-4 mr-2" /> Save Layout</Button>
                    </div>

                    <SectionTitle icon={Box} title="Top Row" />
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {slotsTop.map((slot, i) => (
                            <div
                                key={i}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDropTemplate(e, i, "top")}
                                className={cn(
                                    "relative h-28 rounded-2xl border-2 border-dashed flex items-center justify-center bg-zinc-50 dark:bg-zinc-900",
                                    slot ? "border-green-500" : "border-zinc-300 dark:border-zinc-700"
                                )}
                            >
                                {slot ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Wrench className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">{slot.name}</div>
                                            <div className="text-xs text-zinc-500">{slot.sku}</div>
                                        </div>
                                        {!slot._span && (
                                            <Button variant="ghost" size="icon" className="ml-2" onClick={() => clearSlot("top", i)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-xs text-zinc-500">Drop TTX2 or TTX4</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <SectionTitle icon={Box} title="Bottom Row" />
                    <div className="grid grid-cols-4 gap-3">
                        {slotsBottom.map((slot, i) => (
                            <div
                                key={i}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDropTemplate(e, i, "bottom")}
                                className={cn(
                                    "relative h-24 rounded-2xl border-2 border-dashed flex items-center justify-center bg-zinc-50 dark:bg-zinc-900",
                                    slot ? "border-green-500" : "border-zinc-300 dark:border-zinc-700"
                                )}
                            >
                                {slot ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Wrench className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">{slot.name}</div>
                                            <div className="text-xs text-zinc-500">{slot.sku}</div>
                                        </div>
                                        {!slot._span && (
                                            <Button variant="ghost" size="icon" className="ml-2" onClick={() => clearSlot("bottom", i)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-xs text-zinc-500">Drop TT1 or TT2</span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Tray Library</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Type filter" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                <SelectItem value="TT1">TT1</SelectItem>
                                <SelectItem value="TT2">TT2</SelectItem>
                                <SelectItem value="TTX2">TTX2</SelectItem>
                                <SelectItem value="TTX4">TTX4</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="Search by SKU or name" />
                    </div>
                    <div className="space-y-2">
                        {filteredLibrary.map((t) => (
                            <div key={t.sku} draggable onDragStart={(e) => onDragStart(e, t)} className="flex items-center justify-between rounded-xl border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-grab">
                                <div>
                                    <div className="text-sm font-medium">{t.name}</div>
                                    <div className="text-xs text-zinc-500">{t.sku} • {t.type}</div>
                                </div>
                                <Button size="sm" variant="secondary">Details</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}