import { CalendarClock, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AUDITS } from "@/data/mock-data";
import { Pill } from "@/components/Pill";

export function AuditScheduling() {
    return (
        // FIXED: Standardized 3-column grid
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Main form: spans 2 of 3 columns */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Audit Scheduling</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Label className="w-36">Frequency</Label>
                            <Select defaultValue="daily">
                                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3x">3x per shift</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="disabled">Disabled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="w-36">Notify</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2"><Checkbox id="push" defaultChecked /><Label htmlFor="push">Push</Label></div>
                                <div className="flex items-center gap-2"><Checkbox id="email" /><Label htmlFor="email">Email</Label></div>
                                <div className="flex items-center gap-2"><Checkbox id="teams" /><Label htmlFor="teams">Teams</Label></div>
                                <div className="flex items-center gap-2"><Checkbox id="slack" /><Label htmlFor="slack">Slack</Label></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="w-36">Escalation</Label>
                            <Select defaultValue="24h">
                                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1h">1 hour</SelectItem>
                                    <SelectItem value="4h">4 hours</SelectItem>
                                    <SelectItem value="24h">24 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button><BadgeCheck className="h-4 w-4 mr-2" /> Save Policy</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Upcoming Audits</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {AUDITS.map((a) => (
                            <Card key={a.id} className="border-l-4" style={{ borderLeftColor: a.status === "Due" ? "#f59e0b" : "#a1a1aa" }}>
                                <CardContent className="pt-4">
                                    <div className="text-sm font-semibold">{a.box}</div>
                                    <div className="text-xs text-zinc-500">{a.freq} • due {a.due}</div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <Pill color={a.status === "Due" ? "amber" : "zinc"}>{a.status}</Pill>
                                        <Button size="sm" variant="secondary">Assign</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}