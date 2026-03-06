"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeamMember } from "@/lib/types";
import {
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
} from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface SettingsClientProps {
    teamMembers: TeamMember[];
}

export default function SettingsClient({ teamMembers }: SettingsClientProps) {
    const router = useRouter();
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const result = await createTeamMember(formData);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Team member added!");
            setAddOpen(false);
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingMember) return;
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const result = await updateTeamMember(editingMember.id, formData);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Team member updated!");
            setEditOpen(false);
            setEditingMember(null);
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Remove "${name}" from the team?`)) return;
        const result = await deleteTeamMember(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Team member removed!");
            router.refresh();
        }
    };

    const openEdit = (member: TeamMember) => {
        setEditingMember(member);
        setEditOpen(true);
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your application settings.
                </p>
            </div>

            {/* Team Section */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Team Members</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage team members displayed on the About page.
                            </p>
                        </div>
                        <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    + Add Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Team Member</DialogTitle>
                                    <DialogDescription>
                                        Add a new member to display on the About page.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAdd} className="space-y-4 mt-2">
                                    <div className="space-y-2">
                                        <Label>Name *</Label>
                                        <Input
                                            name="name"
                                            placeholder="e.g., John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Position *</Label>
                                        <Input
                                            name="position"
                                            placeholder="e.g., MS in Computer Science"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Photo URL</Label>
                                        <Input
                                            name="photo_url"
                                            placeholder="https://example.com/photo.jpg"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Direct link to a profile photo. Leave empty for a
                                            default avatar.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Display Order</Label>
                                        <Input
                                            name="display_order"
                                            type="number"
                                            min="0"
                                            defaultValue="0"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Lower numbers appear first.
                                        </p>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Adding..." : "Add Member"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {teamMembers.length === 0 ? (
                        <div className="text-center py-12 rounded-xl border border-dashed border-border/50">
                            <p className="text-lg text-muted-foreground">
                                No team members yet.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Add members to display them on the About page.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Photo</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead className="w-20">Order</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                {member.photo_url ? (
                                                    <img
                                                        src={member.photo_url}
                                                        alt={member.name}
                                                        className="h-10 w-10 rounded-full object-cover ring-1 ring-border/50"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-semibold text-sm">
                                                        {member.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .toUpperCase()
                                                            .slice(0, 2)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {member.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {member.position}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {member.display_order}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEdit(member)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            handleDelete(member.id, member.name)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) setEditingMember(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Team Member</DialogTitle>
                        <DialogDescription>
                            Update team member details.
                        </DialogDescription>
                    </DialogHeader>
                    {editingMember && (
                        <form onSubmit={handleEdit} className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                    name="name"
                                    defaultValue={editingMember.name}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Position *</Label>
                                <Input
                                    name="position"
                                    defaultValue={editingMember.position}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Photo URL</Label>
                                <Input
                                    name="photo_url"
                                    defaultValue={editingMember.photo_url || ""}
                                    placeholder="https://example.com/photo.jpg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Display Order</Label>
                                <Input
                                    name="display_order"
                                    type="number"
                                    min="0"
                                    defaultValue={editingMember.display_order}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
