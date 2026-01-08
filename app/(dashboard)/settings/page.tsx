"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import { getUserById } from "@/lib/data/storage"
import { Trash2, AlertTriangle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/contexts/ThemeContext"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { theme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const [selectedYear, setSelectedYear] = useState(format(new Date(), "yyyy"))

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

  const handleWipeMonth = async () => {
    try {
      const response = await fetch(`/api/data/wipe?type=month&month=${selectedMonth}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to wipe data")

      toast({
        title: "Success",
        description: `Data for ${format(new Date(selectedMonth + "-01"), "MMMM yyyy")} has been deleted`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to wipe data",
        variant: "destructive",
      })
    }
  }

  const handleWipeYear = async () => {
    try {
      const response = await fetch(`/api/data/wipe?type=year&year=${selectedYear}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to wipe data")

      toast({
        title: "Success",
        description: `Data for ${selectedYear} has been deleted`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to wipe data",
        variant: "destructive",
      })
    }
  }

  const handleWipeAll = async () => {
    try {
      const response = await fetch(`/api/data/wipe?type=all`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to wipe data")

      toast({
        title: "Success",
        description: "All your data has been deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to wipe data",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`/api/data/wipe?type=account`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete account")

      toast({
        title: "Success",
        description: "Your account has been deleted",
      })

      // Sign out after deletion
      await signOut({ callbackUrl: "/login" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    }
  }

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
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred theme. Current: <span className="font-medium capitalize">{theme}</span>
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

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

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions - proceed with caution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wipe Month Data */}
          <div className="space-y-3">
            <Label>Delete Data for Specific Month</Label>
            <p className="text-sm text-muted-foreground">
              Permanently delete all transactions and budgets for a specific month
            </p>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const date = new Date()
                    date.setMonth(date.getMonth() - i)
                    const monthStr = format(date, "yyyy-MM")
                    return (
                      <SelectItem key={monthStr} value={monthStr}>
                        {format(date, "MMMM yyyy")}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Month
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {format(new Date(selectedMonth + "-01"), "MMMM yyyy")} Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all transactions and budgets for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWipeMonth} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Separator />

          {/* Wipe Year Data */}
          <div className="space-y-3">
            <Label>Delete Data for Specific Year</Label>
            <p className="text-sm text-muted-foreground">
              Permanently delete all transactions and budgets for an entire year
            </p>
            <div className="flex gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Year
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedYear} Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all transactions and budgets for the year {selectedYear}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWipeYear} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Separator />

          {/* Wipe All Data */}
          <div className="space-y-3">
            <Label>Delete All Data</Label>
            <p className="text-sm text-muted-foreground">
              Permanently delete all your transactions, budgets, and loans. Your account will remain active.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Your Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL your transactions, budgets, and loans.
                    Your account will remain active, but all financial data will be lost.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleWipeAll} className="bg-destructive hover:bg-destructive/90">
                    Delete All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator />

          {/* Delete Account */}
          <div className="space-y-3">
            <Label>Delete Account</Label>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. You will be signed out.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">Delete Your Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and ALL associated data including
                    transactions, budgets, and loans. You will be signed out and will need to
                    create a new account to use this app again. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    Delete Account Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              All data is stored in MongoDB database, ensuring your financial information
              is securely organized and accessible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

