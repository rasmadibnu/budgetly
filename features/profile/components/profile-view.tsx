"use client";

import Link from "next/link";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/features/profile/server/actions";
import { changePasswordSchema, type ChangePasswordInput } from "@/features/profile/schemas/change-password-schema";
import type { UserProfile } from "@/types/app";

export function ProfileView({ user }: { user: UserProfile }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await changePasswordAction(values);
        form.reset();
        toast.success("Password updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update password");
      }
    });
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Profile"
        title="👤 Account security and identity"
        description="Review your account details and update the password used to access this private household workspace."
      />

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Internal Budgetly user profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-semibold">{user.username}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{user.role}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Internal auth
              </span>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings">
                Open settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Use your current password to set a new one.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input id="currentPassword" type="password" {...form.register("currentPassword")} />
                {form.formState.errors.currentPassword ? <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" {...form.register("newPassword")} />
                {form.formState.errors.newPassword ? <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
                {form.formState.errors.confirmPassword ? <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p> : null}
              </div>
              <Button type="submit" disabled={isPending}>
                <KeyRound className="mr-2 h-4 w-4" />
                {isPending ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
