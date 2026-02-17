import { CheckCircle2, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/Pill";

export const CALIBRATION = [
    { sku: "TORQ-200NM", name: "Torque Wrench 200Nm", due: "2025-10-20", status: "Due Soon", certificateUrl: "#" },
    { sku: "CALIPER-150MM", name: "Digital Caliper 150mm", due: "2026-01-05", status: "Compliant", certificateUrl: "#" },
    { sku: "DIAL-IND-10MM", name: "Dial Indicator 10mm", due: "2025-09-30", status: "Overdue", certificateUrl: "#" },
];

export function CalibrationManagement() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-axiom-headingLight dark:text-white">Calibration</h2>
                    <p className="text-axiom-textLight dark:text-axiom-textDark">Manage calibration certificates.</p>
                </div>
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Calibration Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {CALIBRATION.map((c, i) => (
                            <Card key={i} className="hover:shadow">
                                <CardContent className="pt-4">
                                    <div className="text-sm font-semibold">{c.name}</div>
                                    <div className="text-xs text-zinc-500">{c.sku}</div>
                                    <div className="mt-2 flex items-center justify-between">
                                        {c.status === "Compliant" && <Pill color="green">Compliant</Pill>}
                                        {c.status === "Due Soon" && <Pill color="amber">Due Soon</Pill>}
                                        {c.status === "Overdue" && <Pill color="red">Overdue</Pill>}
                                        <Button variant="ghost" size="sm" className="gap-1">
                                            <FileDown className="h-4 w-4" /> Cert
                                        </Button>
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-1">Due {c.due}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}