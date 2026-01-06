"use client"

import { useState, useEffect } from "react"
import { Plus, Building2, CreditCard, Wallet, PiggyBank, MoreVertical, Pencil, Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { BankAccount } from "@/lib/types"

const accountTypeIcons = {
  checking: Building2,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Wallet,
}

const accountTypeColors = {
  checking: "bg-blue-500",
  savings: "bg-green-500",
  credit: "bg-purple-500",
  cash: "bg-amber-500",
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    accountNumber: "",
    accountType: "checking" as "checking" | "savings" | "credit" | "cash",
    balance: 0,
    currency: "INR",
    isDefault: false,
  })
  const [allowBalanceEdit, setAllowBalanceEdit] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/bank-accounts")
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bank accounts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingAccount
        ? `/api/bank-accounts/${editingAccount.id}`
        : "/api/bank-accounts"
      const method = editingAccount ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Account ${editingAccount ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchAccounts()
      } else {
        throw new Error("Failed to save account")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save account",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    console.log("[BankAccounts] Delete requested for account:", id)
    if (!confirm("Are you sure you want to delete this account?")) {
      console.log("[BankAccounts] Delete cancelled by user")
      return
    }

    try {
      console.log("[BankAccounts] Deleting account...")
      const response = await fetch(`/api/bank-accounts/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        console.log("[BankAccounts] Account deleted successfully")
        toast({
          title: "Success",
          description: "Account deleted successfully",
        })
        fetchAccounts()
      } else {
        console.error("[BankAccounts] Delete failed with status:", response.status)
      }
    } catch (error) {
      console.error("[BankAccounts] Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (account: BankAccount) => {
    console.log("[BankAccounts] Editing account:", account.id)
    setEditingAccount(account)
    setAllowBalanceEdit(false)
    setFormData({
      name: account.name,
      accountNumber: account.accountNumber || "",
      accountType: account.accountType,
      balance: account.balance,
      currency: account.currency,
      isDefault: account.isDefault,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingAccount(null)
    setAllowBalanceEdit(false)
    setFormData({
      name: "",
      accountNumber: "",
      accountType: "checking",
      balance: 0,
      currency: "INR",
      isDefault: false,
    })
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">
            Manage your financial accounts and track balances
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? "Edit Account" : "Add New Account"}
                </DialogTitle>
                <DialogDescription>
                  {editingAccount
                    ? "Update your account details"
                    : "Add a new bank account to track"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Checking"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number (Optional)</Label>
                  <Input
                    id="accountNumber"
                    placeholder="xxxx-xxxx-xxxx-1234"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, accountNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, accountType: value })
                    }
                  >
                    <SelectTrigger id="accountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">
                    Current Balance
                    {editingAccount && !allowBalanceEdit && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Automatically calculated from transactions)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        balance: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={editingAccount && !allowBalanceEdit}
                    required={!editingAccount}
                    className={editingAccount && !allowBalanceEdit ? "bg-muted cursor-not-allowed" : ""}
                  />
                  {editingAccount && !allowBalanceEdit && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Balance is managed automatically through transactions.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAllowBalanceEdit(true)}
                        className="text-xs h-8"
                      >
                        Manually Adjust Balance
                      </Button>
                    </div>
                  )}
                  {editingAccount && allowBalanceEdit && (
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      ⚠️ Manual adjustment mode. This will override the calculated balance.
                    </p>
                  )}
                  {!editingAccount && (
                    <p className="text-xs text-muted-foreground">
                      Set your starting balance. It will be updated automatically as you add transactions.
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isDefault" className="cursor-pointer">
                    Set as default account
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAccount ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardHeader>
          <CardTitle>Total Balance</CardTitle>
          <CardDescription>Across all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            ₹{totalBalance.toLocaleString("en-IN")}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          </p>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No accounts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first bank account
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const Icon = accountTypeIcons[account.accountType]
            const colorClass = accountTypeColors[account.accountType]

            return (
              <Card key={account.id} className="relative overflow-hidden">
                <div
                  className={`absolute top-0 right-0 w-24 h-24 ${colorClass} opacity-10 rounded-bl-full`}
                />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {account.name}
                        {account.isDefault && (
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {account.accountType.charAt(0).toUpperCase() +
                          account.accountType.slice(1)}
                        {account.accountNumber && ` • ****${account.accountNumber.slice(-4)}`}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 relative z-10"
                        aria-label="Account options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50">
                      <DropdownMenuItem
                        onClick={() => handleEdit(account)}
                        className="cursor-pointer"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(account.id)}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{account.balance.toLocaleString("en-IN")}
                  </div>
                  {account.isDefault && (
                    <Badge variant="secondary" className="mt-2">
                      Default
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
