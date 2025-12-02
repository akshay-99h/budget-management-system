"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import { getUserById } from "@/lib/data/storage"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/user`)
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          }
        } catch (error) {
          console.error("Error fetching user:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [session])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your account information and details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={session?.user?.name || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={session?.user?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>
          {user?.createdAt && (
            <div className="space-y-2">
              <Label>Member Since</Label>
              <Input
                value={formatDate(user.createdAt)}
                disabled
                className="bg-muted"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your local data storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Your data is stored in MongoDB database. All your financial information is securely stored
              and organized in collections for transactions, budgets, and loans.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Data Location</p>
            <p className="text-sm text-muted-foreground">
              <code className="px-1 py-0.5 bg-muted rounded">
                MongoDB database
              </code>
            </p>
            <p className="text-xs text-muted-foreground">
              Data is stored in MongoDB collections: users, transactions, budgets, loans
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>
            Information about this application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Budget 2025 is a personal budgeting application built with Next.js 16,
              designed to help you track your income, expenses, budgets, and loans.
            </p>
            <p className="text-sm text-muted-foreground">
              All data is stored locally on your device, ensuring complete privacy
              and control over your financial information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

