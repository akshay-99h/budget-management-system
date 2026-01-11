"use client"

import { useState, useEffect } from "react"
import { Plus, CreditCard, MoreVertical, Pencil, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Subscription, BankAccount } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

const SUBSCRIPTION_CATEGORIES = [
  "Entertainment", "Software", "Cloud Services", "Music", "Gaming",
  "Fitness", "News", "Education", "Storage", "Productivity", "Other"
]

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    category: "",
    description: "",
    isActive: true,
    bankAccountId: "",
    reminderEnabled: true,
    reminderDaysBefore: 3,
  })

  useEffect(() => {
    fetchSubscriptions()
    fetchBankAccounts()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subscriptions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch("/api/bank-accounts")
      if (response.ok) {
        const data = await response.json()
        setBankAccounts(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bank accounts",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingSubscription
        ? `/api/subscriptions/${editingSubscription.id}`
        : "/api/subscriptions"
      const method = editingSubscription ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Subscription ${editingSubscription ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchSubscriptions()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save subscription",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return

    try {
      const response = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Success", description: "Subscription deleted successfully" })
        fetchSubscriptions()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setFormData({
      name: subscription.name,
      amount: subscription.amount,
      frequency: subscription.frequency,
      startDate: subscription.startDate,
      endDate: subscription.endDate || "",
      category: subscription.category,
      description: subscription.description || "",
      isActive: subscription.isActive,
      bankAccountId: subscription.bankAccountId,
      reminderEnabled: subscription.reminderEnabled,
      reminderDaysBefore: subscription.reminderDaysBefore,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    const defaultAccount = bankAccounts.find(acc => acc.isDefault) || bankAccounts[0]
    setFormData({
      name: "",
      amount: 0,
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      category: "",
      description: "",
      isActive: true,
      bankAccountId: defaultAccount?.id || "",
      reminderEnabled: true,
      reminderDaysBefore: 3,
    })
    setEditingSubscription(null)
  }

  const totalMonthlySpend = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, sub) => {
      const multiplier = {
        daily: 30,
        weekly: 4.33,
        monthly: 1,
        yearly: 1 / 12,
      }
      return sum + sub.amount * multiplier[sub.frequency]
    }, 0)

  const totalYearlySpend = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, sub) => {
      const multiplier = {
        daily: 365,
        weekly: 52,
        monthly: 12,
        yearly: 1,
      }
      return sum + sub.amount * multiplier[sub.frequency]
    }, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Subscriptions
          </h1>
          <p className="text-muted-foreground mt-1">Manage your recurring subscriptions</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {subscriptions.filter((s) => s.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalMonthlySpend)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Yearly Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalYearlySpend)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading...</p>
        ) : subscriptions.length === 0 ? (
          <Card className="col-span-full border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No subscriptions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first subscription to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          subscriptions.map((subscription) => (
            <Card key={subscription.id} className="border-2 hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{subscription.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{subscription.category}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(subscription)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(subscription.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Amount</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(subscription.amount)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{subscription.frequency}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next Payment</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(subscription.nextExecutionDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant={subscription.isActive ? "default" : "secondary"}>
                    {subscription.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {subscription.reminderEnabled && (
                    <span className="text-xs text-muted-foreground">
                      Reminder: {subscription.reminderDaysBefore}d before
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubscription ? "Edit Subscription" : "Add New Subscription"}
            </DialogTitle>
            <DialogDescription>
              {editingSubscription
                ? "Update your subscription details"
                : "Create a new recurring subscription"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Netflix, Spotify"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Billing Cycle *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountId">Bank Account *</Label>
                <Select
                  value={formData.bankAccountId}
                  onValueChange={(value) => setFormData({ ...formData, bankAccountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} {account.isDefault && "(Default)"} - ₹
                        {account.balance.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Notes (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="reminderEnabled">Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified before payment is due
                  </p>
                </div>
                <Switch
                  id="reminderEnabled"
                  checked={formData.reminderEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, reminderEnabled: checked })
                  }
                />
              </div>

              {formData.reminderEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="reminderDaysBefore">Remind me (days before)</Label>
                  <Input
                    id="reminderDaysBefore"
                    type="number"
                    min="0"
                    max="30"
                    value={formData.reminderDaysBefore}
                    onChange={(e) =>
                      setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value) })
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active Subscription</Label>
                  <p className="text-sm text-muted-foreground">
                    Include in total spending calculations
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSubscription ? "Update" : "Create"} Subscription
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
