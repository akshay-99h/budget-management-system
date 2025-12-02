"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Wallet,
  TrendingUp,
  Target,
  HandCoins,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Smartphone,
  Database,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const { data: session } = useSession()
  const [particles, setParticles] = useState<Array<{ left: string; top: string; delay: string; duration: string }>>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 8 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${3 + Math.random() * 2}s`,
      }))
    )
  }, [])

  const features = [
    {
      icon: TrendingUp,
      title: "Track Income & Expenses",
      description: "Easily record and categorize all your financial transactions with detailed insights.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Target,
      title: "Smart Budget Management",
      description: "Set monthly budgets per category and get real-time alerts when approaching limits.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: HandCoins,
      title: "Loan Tracking",
      description: "Monitor money you've lent to others with payment tracking and overdue reminders.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Visualize your spending patterns with beautiful charts and exportable reports.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and stored securely. Complete privacy guaranteed.",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      icon: Smartphone,
      title: "Progressive Web App",
      description: "Install on any device. Works offline. Fast and responsive on all screens.",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ]

  const benefits = [
    "100% Free Forever",
    "No Credit Card Required",
    "Works Offline",
    "Data Stored Locally",
    "Export Your Data Anytime",
    "Mobile Friendly",
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_50%)]" />

      {/* Floating particles */}
      {particles.length > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-50 border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                  Budget 2025
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {session ? (
                <Button asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" className="hidden sm:flex">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                    <Link href="/register">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Take Control of Your Finances</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                Personal Budget
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
                Management Made Simple
              </span>
            </h1>
            <p className="mb-10 text-xl text-slate-400 sm:text-2xl">
              Track expenses, manage budgets, monitor loans, and gain insights into your financial health—all in one beautiful, secure app.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {session ? (
                <Button asChild size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20">
                  <Link href="/dashboard">
                    Open Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20">
                    <Link href="/register">
                      Start Free Today
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 bg-slate-900/50 backdrop-blur-sm">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
            <p className="mt-6 text-sm text-slate-500">
              No credit card required • Free forever • Your data stays private
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold text-white">
              Everything You Need to Manage Your Money
            </h2>
            <p className="text-lg text-slate-400">
              Powerful features designed to help you take control of your finances
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden border-slate-800/50 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                >
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl">
              <CardContent className="p-8 sm:p-12">
                <div className="mb-8 text-center">
                  <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                    Why Choose Budget 2025?
                  </h2>
                  <p className="text-slate-400">
                    Built for individuals who value privacy, simplicity, and control
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <span className="text-slate-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Lock className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold text-white">Bank-Level Security</h3>
                  <p className="text-slate-400">
                    Your financial data is encrypted and stored securely. We use industry-standard security practices to protect your information.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Database className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold text-white">Your Data, Your Control</h3>
                  <p className="text-slate-400">
                    All your data is stored locally in MongoDB. Export your data anytime, or delete it completely. You're in full control.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Card className="border-slate-800/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl">
              <CardContent className="p-12">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-2xl shadow-primary/30">
                  <Zap className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="mb-4 text-4xl font-bold text-white">
                  Ready to Take Control?
                </h2>
                <p className="mb-8 text-lg text-slate-400">
                  Join thousands of users managing their finances with Budget 2025. Start your journey to financial freedom today.
                </p>
                {session ? (
                  <Button asChild size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20">
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20">
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Budget 2025</h3>
                <p className="text-sm text-slate-400">Personal Finance Management</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span>© 2025 Budget 2025</span>
              <span>•</span>
              <span>Made with ❤️ for financial freedom</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

