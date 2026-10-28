"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  ArrowRight, BookOpen, Check, Download, Eye, EyeOff, Github, GraduationCap,
  Loader2, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from "@/modals/zod";
import { registerUser } from "@/server-functions/auth-actions";
import { cn } from "@/modals/utils";

type Mode = "signin" | "signup";
type Provider = "google" | "github";

const benefits = [
  { icon: GraduationCap, title: "Structured courses", text: "Follow courses that build skill by skill." },
  { icon: Download, title: "Downloadable resources", text: "Keep every product you claim or buy." },
  { icon: BookOpen, title: "One learning library", text: "Courses, products and orders in a single place." },
];

function safeCallback(value?: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export default function AuthScreen() {
  const router = useRouter();
  const { status } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [callbackUrl, setCallbackUrl] = useState("/");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(safeCallback(params.get("callbackUrl")));
    if (params.get("mode") === "signup") setMode("signup");
  }, []);

  const signInForm = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  const password = signUpForm.watch("password") || "";
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const finishSignIn = (url: string) => {
    toast.success("Welcome back to Studic");
    router.push(url);
    router.refresh();
  };

  const onSubmitSignIn = async (values: SignInValues) => {
    const result = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (result?.error) {
      toast.error("Email or password is incorrect. Please try again.");
      return;
    }
    finishSignIn(callbackUrl);
  };

  const onSubmitSignUp = async (values: SignUpValues) => {
    const result = await registerUser({ name: values.name, email: values.email, password: values.password });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const signed = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (signed?.error) {
      toast.success("Account created. Please sign in.");
      setMode("signin");
      signInForm.setValue("email", values.email);
      return;
    }
    toast.success("Your account is ready");
    router.push(callbackUrl);
    router.refresh();
  };

  const onProvider = async (provider: Provider) => {
    setPendingProvider(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      toast.error("That sign-in option is unavailable right now.");
      setPendingProvider(null);
    }
  };

  if (status === "authenticated") {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck size={26} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">You are already signed in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Head to your library to see your courses and products.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link href="/profile">Open my library</Link></Button>
          <Button asChild variant="outline"><Link href="/courses">Browse courses</Link></Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
      <aside className="relative hidden overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-background to-violet-500/10 p-9 lg:flex lg:min-h-[560px] lg:flex-col lg:justify-between">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles size={13} /> Studic learning
          </p>
          <h1 className="mt-7 text-4xl font-semibold leading-[1.1] tracking-tight">
            Learn deeper.<br />Keep everything<br />you unlock.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Sign in once to follow courses, claim resources and revisit every purchase from your own library.
          </p>
        </div>

        <div className="relative mt-10 space-y-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3 rounded-2xl border bg-background/60 p-3.5 backdrop-blur">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <benefit.icon size={17} />
              </span>
              <div>
                <p className="text-sm font-medium">{benefit.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Check size={14} className="text-emerald-500" /> No card required to start learning.
        </p>
      </aside>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 lg:hidden">
          <p className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles size={13} /> Studic
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Learn deeper. Keep everything you unlock.</h1>
        </div>

        <Card className="overflow-hidden border shadow-xl shadow-primary/5">
          <div className="grid grid-cols-2 gap-1 border-b bg-muted/40 p-1.5">
            {(["signin", "signup"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  mode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {value === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="space-y-5 p-6 sm:p-7">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {mode === "signin" ? "Welcome back" : "Start learning today"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signin" ? "Sign in to continue where you left off." : "Create a free account — it takes a minute."}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" className="h-11 justify-center gap-2" disabled={pendingProvider !== null} onClick={() => onProvider("google")}>
                {pendingProvider === "google" ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Google
              </Button>
              <Button type="button" variant="outline" className="h-11 justify-center gap-2" disabled={pendingProvider !== null} onClick={() => onProvider("github")}>
                {pendingProvider === "github" ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />} GitHub
              </Button>
            </div>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
            </div>

            {mode === "signin" ? (
              <form className="space-y-4" onSubmit={signInForm.handleSubmit(onSubmitSignIn)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="signin-email" type="email" autoComplete="email" placeholder="you@example.com" className="h-11 pl-9" {...signInForm.register("email")} />
                  </div>
                  {signInForm.formState.errors.email && <p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => toast.info("Password reset is not available yet. Contact support if you are locked out.")}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 pl-9 pr-10"
                      {...signInForm.register("password")}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {signInForm.formState.errors.password && <p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>}
                </div>

                <Button type="submit" className="h-11 w-full gap-2" disabled={signInForm.formState.isSubmitting}>
                  {signInForm.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Sign in <ArrowRight size={16} />
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  New to Studic?{" "}
                  <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setMode("signup")}>
                    Create an account
                  </button>
                </p>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={signUpForm.handleSubmit(onSubmitSignUp)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <div className="relative">
                    <UserRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="signup-name" autoComplete="name" placeholder="Siddharth Sharma" className="h-11 pl-9" {...signUpForm.register("name")} />
                  </div>
                  {signUpForm.formState.errors.name && <p className="text-xs text-destructive">{signUpForm.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" className="h-11 pl-9" {...signUpForm.register("email")} />
                  </div>
                  {signUpForm.formState.errors.email && <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="h-11 pl-9 pr-10"
                      {...signUpForm.register("password")}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((step) => (
                      <span
                        key={step}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          password && strength > step ? (strength === 1 ? "bg-amber-400" : strength === 2 ? "bg-lime-500" : "bg-emerald-500") : "bg-muted"
                        )}
                      />
                    ))}
                    <span className="w-16 text-right text-[11px] text-muted-foreground">
                      {password ? ["Weak", "Fair", "Good", "Strong"][strength] : ""}
                    </span>
                  </div>
                  {signUpForm.formState.errors.password && <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm password</Label>
                  <Input id="signup-confirm" type="password" autoComplete="new-password" placeholder="Repeat your password" className="h-11" {...signUpForm.register("confirmPassword")} />
                  {signUpForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="h-11 w-full gap-2" disabled={signUpForm.formState.isSubmitting}>
                  {signUpForm.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Create account <ArrowRight size={16} />
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setMode("signin")}>
                    Sign in
                  </button>
                </p>
              </form>
            )}

            <p className="text-center text-[11px] leading-5 text-muted-foreground">
              By continuing you agree to our{" "}
              <Link href="/tnc" className="underline underline-offset-4 hover:text-foreground">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
