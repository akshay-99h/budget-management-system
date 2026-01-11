"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, Activity, MoreVertical, Pencil, Trash2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { useToast } from "@/hooks/use-toast"
import { SIP, SIPAdjustment, BankAccount } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { calculateTotalInvested } from "@/lib/utils/sip"
import { parseISO, isBefore } from "date-fns"
import { v4 as uuidv4 } from "uuid"
import { Trash2 as Trash2Icon, Plus as PlusIcon } from "lucide-react"

export default function SIPPage() {
  const [sips, setSips] = useState<SIP[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSip, setEditingSip] = useState<SIP | null>(null)
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
    currentNetValue: undefined as number | undefined,
    adjustments: [] as SIPAdjustment[],
    bankAccountId: "",
    investmentType: "mutual-fund" as "mutual-fund" | "provident-fund",
  })
  const [showAdjustments, setShowAdjustments] = useState(false)

  useEffect(() => {
    fetchSIPs()
    fetchBankAccounts()
  }, [])

  // Set default bank account when bank accounts are first loaded (only for new SIPs)
  const [bankAccountsInitialized, setBankAccountsInitialized] = useState(false)
  useEffect(() => {
    if (bankAccounts.length > 0 && !bankAccountsInitialized) {
      setBankAccountsInitialized(true)
      if (!editingSip) {
        // Only set default for new SIPs when bank accounts are first loaded
        const defaultAccount = bankAccounts.find(acc => acc.isDefault) || bankAccounts[0]
        if (defaultAccount) {
          setFormData(prev => {
            // Only set if it's currently empty
            if (prev.bankAccountId === "") {
              return { ...prev, bankAccountId: defaultAccount.id }
            }
            return prev
          })
        }
      }
    }
  }, [bankAccounts.length, bankAccountsInitialized, editingSip])

  // When editing a SIP, set the bankAccountId from the SIP (only once when editingSip changes)
  const [lastEditingSipId, setLastEditingSipId] = useState<string | null>(null)
  useEffect(() => {
    if (editingSip && editingSip.id !== lastEditingSipId && bankAccounts.length > 0) {
      setLastEditingSipId(editingSip.id)
      if (editingSip.bankAccountId) {
        const accountExists = bankAccounts.some(acc => acc.id === editingSip.bankAccountId)
        if (accountExists) {
          // Set the bankAccountId from the SIP being edited
          setFormData(prev => ({ ...prev, bankAccountId: editingSip.bankAccountId }))
        } else {
          // If the account doesn't exist, set to default
          const defaultAccount = bankAccounts.find(acc => acc.isDefault) || bankAccounts[0]
          if (defaultAccount) {
            setFormData(prev => ({ ...prev, bankAccountId: defaultAccount.id }))
          }
        }
      } else {
        // If SIP has no bankAccountId, set to default
        const defaultAccount = bankAccounts.find(acc => acc.isDefault) || bankAccounts[0]
        if (defaultAccount) {
          setFormData(prev => ({ ...prev, bankAccountId: defaultAccount.id }))
        }
      }
    }
  }, [editingSip?.id, lastEditingSipId, bankAccounts])

  const fetchSIPs = async () => {
    try {
      const response = await fetch("/api/sip")
      if (response.ok) {
        const data = await response.json()
        setSips(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch SIPs",
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
    
    // Get the current formData value to ensure we have the latest
    const currentFormData = { ...formData }
    
    // Validate bankAccountId before submitting
    if (!currentFormData.bankAccountId || currentFormData.bankAccountId === "") {
      toast({
        title: "Error",
        description: "Please select a bank account",
        variant: "destructive",
      })
      return
    }
    
    try {
      const url = editingSip ? `/api/sip/${editingSip.id}` : "/api/sip"
      const method = editingSip ? "PUT" : "POST"

      // Ensure bankAccountId is included in the request - use currentFormData to avoid stale closures
      const dataToSend = {
        ...currentFormData,
        bankAccountId: currentFormData.bankAccountId, // Explicitly include it
      }
      
      // Debug: Log what we're sending
      console.log('Sending SIP data:', { 
        ...dataToSend, 
        bankAccountId: currentFormData.bankAccountId,
        bankAccountIdLength: currentFormData.bankAccountId?.length 
      })

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `SIP ${editingSip ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchSIPs()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SIP",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SIP?")) return

    try {
      const response = await fetch(`/api/sip/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Success", description: "SIP deleted successfully" })
        fetchSIPs()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete SIP",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (sip: SIP) => {
    setEditingSip(sip)
    setFormData({
      name: sip.name,
      amount: sip.amount,
      frequency: sip.frequency,
      startDate: sip.startDate,
      endDate: sip.endDate || "",
      category: sip.category,
      description: sip.description || "",
      isActive: sip.isActive,
      currentNetValue: sip.currentNetValue,
      adjustments: sip.adjustments || [],
      bankAccountId: sip.bankAccountId || "",
      investmentType: sip.investmentType || "mutual-fund",
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
      currentNetValue: undefined,
      adjustments: [],
      bankAccountId: defaultAccount?.id || "",
      investmentType: "mutual-fund",
    })
    setEditingSip(null)
    setShowAdjustments(false)
  }

  const addAdjustment = () => {
    // Calculate base net value from total invested
    const totalInvested = editingSip ? calculateTotalInvested(editingSip) : 0
    const currentBaseValue = formData.currentNetValue !== undefined 
      ? formData.currentNetValue 
      : totalInvested
    
    const newAdjustment = {
      id: uuidv4(),
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      type: "adjustment" as const,
      description: "",
    }
    
    setFormData({
      ...formData,
      adjustments: [
        ...formData.adjustments,
        newAdjustment,
      ],
    })
    setShowAdjustments(true)
  }

  const updateAdjustment = (index: number, field: keyof SIPAdjustment, value: any) => {
    const updated = [...formData.adjustments]
    updated[index] = { ...updated[index], [field]: value }
    
    // Calculate new currentNetValue based on adjustment type and amount
    if ((field === "amount" || field === "type") && typeof updated[index].amount === "number") {
      // Start with total invested as base
      const totalInvested = editingSip ? calculateTotalInvested(editingSip) : 0
      let newNetValue = totalInvested
      
      // Apply all adjustments in order
      updated.forEach((adj) => {
        if (adj.amount && typeof adj.amount === "number") {
          if (adj.type === "adjustment") {
            // Set net value to adjustment amount (overrides previous value)
            newNetValue = adj.amount
          } else if (adj.type === "deposit") {
            // Add deposit to current net value
            newNetValue += adj.amount
          } else if (adj.type === "withdrawal") {
            // Subtract withdrawal from current net value
            newNetValue -= adj.amount
          }
        }
      })
      
      setFormData({ 
        ...formData, 
        adjustments: updated,
        currentNetValue: newNetValue
      })
    } else {
      setFormData({ ...formData, adjustments: updated })
    }
  }

  const removeAdjustment = (index: number) => {
    const updated = formData.adjustments.filter((_, i) => i !== index)
    
    // Recalculate currentNetValue after removal
    const totalInvested = editingSip ? calculateTotalInvested(editingSip) : 0
    let newNetValue = totalInvested
    
    // Apply remaining adjustments
    updated.forEach((adj) => {
      if (adj.amount && typeof adj.amount === "number") {
        if (adj.type === "adjustment") {
          newNetValue = adj.amount
        } else if (adj.type === "deposit") {
          newNetValue += adj.amount
        } else if (adj.type === "withdrawal") {
          newNetValue -= adj.amount
        }
      }
    })
    
    setFormData({
      ...formData,
      adjustments: updated,
      currentNetValue: newNetValue,
    })
  }

  const totalMonthlyInvestment = sips
    .filter((s) => s.isActive)
    .reduce((sum, sip) => {
      const multiplier = {
        daily: 30,
        weekly: 4.33,
        monthly: 1,
        yearly: 1 / 12,
      }
      return sum + sip.amount * multiplier[sip.frequency]
    }, 0)

  const totalInvested = sips
    .filter((s) => s.isActive)
    .reduce((sum, sip) => {
      // Use currentNetValue if available, otherwise calculate from total invested and adjustments
      if (sip.currentNetValue !== undefined) {
        return sum + sip.currentNetValue
      }

      // Calculate net value from total invested and adjustments
      const invested = calculateTotalInvested(sip)
      const adjustmentsTotal = (sip.adjustments || []).reduce((adjSum, adj) => {
        if (adj.type === "adjustment") {
          return adj.amount // Override with adjustment amount
        } else if (adj.type === "deposit") {
          return adjSum + adj.amount
        } else if (adj.type === "withdrawal") {
          return adjSum - adj.amount
        }
        return adjSum
      }, invested)

      return sum + adjustmentsTotal
    }, 0)

  // Calculate breakdown by investment type
  const investmentBreakdown = sips
    .filter((s) => s.isActive)
    .reduce((acc, sip) => {
      const type = sip.investmentType || "mutual-fund"
      let value = 0

      if (sip.currentNetValue !== undefined) {
        value = sip.currentNetValue
      } else {
        const invested = calculateTotalInvested(sip)
        const adjustmentsTotal = (sip.adjustments || []).reduce((adjSum, adj) => {
          if (adj.type === "adjustment") {
            return adj.amount
          } else if (adj.type === "deposit") {
            return adjSum + adj.amount
          } else if (adj.type === "withdrawal") {
            return adjSum - adj.amount
          }
          return adjSum
        }, invested)
        value = adjustmentsTotal
      }

      acc[type] = (acc[type] || 0) + value
      return acc
    }, {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            SIP Investments
          </h1>
          <p className="text-muted-foreground mt-1">Manage your systematic investment plans</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add SIP
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active SIPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sips.filter((s) => s.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalMonthlyInvestment.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Invested
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Investment Breakdown</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mutual Fund:</span>
                        <span className="font-medium">₹{(investmentBreakdown["mutual-fund"] || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Provident Fund:</span>
                        <span className="font-medium">₹{(investmentBreakdown["provident-fund"] || 0).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-1 mt-1 flex justify-between text-sm font-semibold">
                        <span>Total:</span>
                        <span>₹{totalInvested.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInvested.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total SIPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sips.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sips.map((sip) => (
          <Card key={sip.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{sip.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{sip.category}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(sip)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(sip.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">₹{sip.amount.toLocaleString()}</span>
                <Badge variant={sip.isActive ? "default" : "secondary"}>
                  {sip.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="capitalize">{sip.frequency}</span>
              </div>
              {(() => {
                const totalInvested = calculateTotalInvested(sip)
                const adjustmentsTotal = (sip.adjustments || []).reduce((sum, adj) => {
                  if (adj.type === "withdrawal") return sum - adj.amount
                  if (adj.type === "deposit") return sum + adj.amount
                  return sum + adj.amount // adjustment can be positive or negative
                }, 0)
                const calculatedNetValue = totalInvested + adjustmentsTotal
                const displayedNetValue = sip.currentNetValue !== undefined ? sip.currentNetValue : calculatedNetValue
                
                return (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Invested:</span>
                      <span className="font-medium">₹{totalInvested.toLocaleString()}</span>
                    </div>
                    {sip.currentNetValue !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Net Value:</span>
                        <span className="font-semibold text-primary">₹{displayedNetValue.toLocaleString()}</span>
                      </div>
                    )}
                    {sip.adjustments && sip.adjustments.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {sip.adjustments.length} adjustment{sip.adjustments.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )
              })()}
              {(() => {
                const nextDate = parseISO(sip.nextExecutionDate)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                nextDate.setHours(0, 0, 0, 0)
                
                // Only show if the date is in the future
                if (!isBefore(nextDate, today)) {
                  return (
                    <div className="text-sm text-muted-foreground">
                      Next: {nextDate.toLocaleDateString()}
                    </div>
                  )
                }
                return null
              })()}
              {sip.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{sip.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSip ? "Edit SIP" : "Add New SIP"}</DialogTitle>
            <DialogDescription>
              {editingSip ? "Update your SIP details" : "Create a new systematic investment plan"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountId">Bank Account *</Label>
                <Select 
                  value={formData.bankAccountId} 
                  onValueChange={(value) => {
                    console.log('Bank account selected:', value)
                    setFormData(prev => {
                      const updated = { ...prev, bankAccountId: value }
                      console.log('Updated formData.bankAccountId:', updated.bankAccountId)
                      return updated
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} {account.isDefault && "(Default)"} - ₹{account.balance.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.bankAccountId && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {bankAccounts.find(acc => acc.id === formData.bankAccountId)?.name || formData.bankAccountId}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentType">Investment Type *</Label>
                <Select value={formData.investmentType} onValueChange={(value: "mutual-fund" | "provident-fund") => setFormData({ ...formData, investmentType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutual-fund">Mutual Fund</SelectItem>
                    <SelectItem value="provident-fund">Provident Fund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
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
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentNetValue">Current Net Value</Label>
                <Input
                  id="currentNetValue"
                  type="number"
                  step="0.01"
                  value={formData.currentNetValue !== undefined ? formData.currentNetValue : ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentNetValue: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional - current market value"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-calculate from investments and adjustments
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Adjustments</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdjustment}
                    className="h-8"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {formData.adjustments.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-3 max-h-60 overflow-y-auto">
                    {formData.adjustments.map((adjustment, index) => (
                      <div key={adjustment.id} className="space-y-2 p-2 border rounded bg-card">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Date</Label>
                            <Input
                              type="date"
                              value={adjustment.date}
                              onChange={(e) =>
                                updateAdjustment(index, "date", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={adjustment.type}
                              onValueChange={(value: "withdrawal" | "deposit" | "adjustment") =>
                                updateAdjustment(index, "type", value)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                                <SelectItem value="deposit">Deposit</SelectItem>
                                <SelectItem value="adjustment">Adjustment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={adjustment.amount || ""}
                              onChange={(e) =>
                                updateAdjustment(index, "amount", parseFloat(e.target.value) || 0)
                              }
                              className="h-8 text-xs"
                              placeholder="0.00"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdjustment(index)}
                            className="h-8 w-8 mt-6"
                          >
                            <Trash2Icon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description (optional)</Label>
                          <Input
                            type="text"
                            value={adjustment.description || ""}
                            onChange={(e) =>
                              updateAdjustment(index, "description", e.target.value)
                            }
                            className="h-8 text-xs"
                            placeholder="Reason for adjustment"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {formData.adjustments.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No adjustments. Click "Add" to record withdrawals, deposits, or adjustments.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
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
              <Button type="submit">{editingSip ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
