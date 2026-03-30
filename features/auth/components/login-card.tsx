"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AtSign, LockKeyhole } from "lucide-react";

import { loginAction } from "@/features/auth/server/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/layout/logo";

const initialState = { error: "", success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export function LoginCard() {
  const router = useRouter();
  const [state, formAction] = useFormState(loginAction, initialState);

  useEffect(() => {
    if (state?.success) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [router, state?.success]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Logo />
        <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em]">Welcome back</h1>
        <p className="text-[13px] text-muted-foreground">
          Sign in to your household workspace
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-[13px]">Email or username</Label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="you@example.com"
                className="pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px]">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="password" name="password" type="password" className="pl-9" required />
            </div>
          </div>
          <div className="rounded-lg bg-muted/60 p-3 text-[12px] text-muted-foreground">
            <p className="font-medium text-foreground">Demo credentials</p>
            <p className="mt-1">`husband` or `wife` &middot; Password: `Budgetly123!`</p>
          </div>
          {state?.error ? <p className="text-[13px] text-destructive">{state.error}</p> : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
