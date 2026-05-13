import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useFunctions } from "@/hooks/useFunctions";
import { useUsers } from "@/hooks/useUsers";
import { useInvitations } from "@/hooks/useInvitations";
import { Users, Mail, Trash2, FileUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaintainerManagement() {
    const { organization } = useAuth();
    const { users } = useUsers(organization?.id);
    const { invitations, deleteInvitation } = useInvitations(organization?.id);
    const { inviteMaintainers, loading: inviting } = useFunctions();

    const [emailsInput, setEmailsInput] = useState("");
    const [inviteResult, setInviteResult] = useState<{ email: string; success: boolean; error?: string }[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInvite = async (emailsToInvite?: string[]) => {
        const emails = emailsToInvite || emailsInput
            .split(/[\n,]+/)
            .map(e => e.trim())
            .filter(e => e.length > 0);

        if (emails.length === 0) return;

        const result = await inviteMaintainers(emails);
        if (result?.results) {
            setInviteResult(result.results);
            if (!emailsToInvite) setEmailsInput("");
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            // Simple CSV parsing: assume one email per line or comma separated
            const emails = text
                .split(/[\n,]+/)
                .map(e => e.trim())
                .filter(e => e.length > 0 && e.includes('@')); // basic validation

            if (emails.length > 0) {
                handleInvite(emails);
            } else {
                alert("No valid emails found in the CSV file.");
            }
        };
        reader.readAsText(file);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Maintainer Management</CardTitle>
                <CardDescription>Invite and manage maintainers in your organization.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Invite Section */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg space-y-3">
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Invite Maintainers
                        </div>
                        <div className="text-sm text-gray-500">
                            Enter comma-separated emails or upload a CSV file to invite maintainers.
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="maintainer1@example.com, maintainer2@example.com"
                                value={emailsInput}
                                onChange={(e) => setEmailsInput(e.target.value)}
                                disabled={inviting}
                            />
                            <Button onClick={() => handleInvite()} disabled={inviting || !emailsInput.trim()}>
                                {inviting ? "Inviting..." : "Invite"}
                            </Button>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={inviting}
                                title="Upload CSV"
                            >
                                <FileUp className="h-4 w-4" />
                            </Button>
                        </div>
                        {inviteResult && (
                            <div className="text-sm space-y-1 mt-2 max-h-40 overflow-y-auto p-2 bg-white dark:bg-black/20 rounded border border-gray-100 dark:border-white/5">
                                {inviteResult.map((res, idx) => (
                                    <div key={idx} className={res.success ? "text-green-600" : "text-red-600"}>
                                        {res.email}: {res.success ? "Invited successfully" : res.error}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Active Members */}
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div className="font-semibold text-gray-900 dark:text-white mb-3">Active Members ({users.length})</div>
                            {users.length === 0 ? (
                                <div className="text-sm text-gray-500 italic">No active members yet.</div>
                            ) : (
                                <div className="space-y-2">
                                    {users.map(user => (
                                        <div key={user.id} className="flex flex-col justify-center text-sm border-b border-gray-200 dark:border-white/10 pb-2 last:border-0 last:pb-0 h-12">
                                            <span className="font-medium text-gray-900 dark:text-white">{user.displayName}</span>
                                            <span className="text-gray-500">{user.email}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pending Invitations */}
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div className="font-semibold text-gray-900 dark:text-white mb-3">Pending Invitations ({invitations.length})</div>
                            {invitations.length === 0 ? (
                                <div className="text-sm text-gray-500 italic">No pending invitations.</div>
                            ) : (
                                <div className="space-y-2">
                                    {invitations.map(invite => (
                                        <div key={invite.id} className="flex items-center justify-between text-sm border-b border-gray-200 dark:border-white/10 pb-2 last:border-0 last:pb-0 h-12">
                                            <span className="text-gray-600 dark:text-gray-300">{invite.email}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteInvitation(invite.id!)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}