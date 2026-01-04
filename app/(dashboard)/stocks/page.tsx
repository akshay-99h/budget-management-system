"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, TrendingDown, MoreVertical, Pencil, Trash2, DollarSign } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { Stock } from "@/lib/types"

const categoryColors: Record<Stock["category"], string> = {
  "equity": "bg-blue-500",
  "mutual-fund": "bg-green-500",
  "etf": "bg-purple-500",
  "bonds": "bg-yellow-500",
  "other": "bg-gray-500",
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: 0,
    purchasePrice: 0,
    currentPrice: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
    broker: "",
    category: "equity" as Stock["category"],
    notes: "",
  })

  useEffect(() => {
    fetchStocks()
  }, [])

  const fetchStocks = async () => {
    try {
      const response = await fetch("/api/stocks")
      if (response.ok) {
        const data = await response.json()
        setStocks(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stocks",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingStock ? `/api/stocks/${editingStock.id}` : "/api/stocks"
      const method = editingStock ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Stock ${editingStock ? "updated" : "added"} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchStocks()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save stock",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stock?")) return

    try {
      const response = await fetch(`/api/stocks/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Success", description: "Stock deleted successfully" })
        fetchStocks()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete stock",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock)
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity,
      purchasePrice: stock.purchasePrice,
      currentPrice: stock.currentPrice || 0,
      purchaseDate: stock.purchaseDate,
      broker: stock.broker || "",
      category: stock.category,
      notes: stock.notes || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      symbol: "",
      name: "",
      quantity: 0,
      purchasePrice: 0,
      currentPrice: 0,
      purchaseDate: new Date().toISOString().split("T")[0],
      broker: "",
      category: "equity",
      notes: "",
    })
    setEditingStock(null)
  }

  const calculateGainLoss = (stock: Stock) => {
    if (!stock.currentPrice) return { amount: 0, percentage: 0 }
    const totalInvestment = stock.purchasePrice * stock.quantity
    const currentValue = stock.currentPrice * stock.quantity
    const amount = currentValue - totalInvestment
    const percentage = (amount / totalInvestment) * 100
    return { amount, percentage }
  }

  const totalInvestment = stocks.reduce((sum, s) => sum + s.purchasePrice * s.quantity, 0)
  const currentValue = stocks.reduce((sum, s) => sum + (s.currentPrice || s.purchasePrice) * s.quantity, 0)
  const totalGainLoss = currentValue - totalInvestment
  const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Stock Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage your stock investments</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stock
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stocks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInvestment.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${totalGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
              {totalGainLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              ₹{Math.abs(totalGainLoss).toLocaleString()}
            </div>
            <p className={`text-sm ${totalGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
              {totalGainLoss >= 0 ? "+" : ""}{totalGainLossPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stocks.map((stock) => {
          const { amount, percentage } = calculateGainLoss(stock)
          return (
            <Card key={stock.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {stock.symbol}
                      <Badge className={categoryColors[stock.category]}>
                        {stock.category.replace("-", " ")}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{stock.name}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(stock)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(stock.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-semibold">{stock.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Price</p>
                    <p className="font-semibold">₹{stock.purchasePrice.toLocaleString()}</p>
                  </div>
                  {stock.currentPrice && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Current Price</p>
                        <p className="font-semibold">₹{stock.currentPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">P&L</p>
                        <p className={`font-semibold ${amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {amount >= 0 ? "+" : ""}₹{Math.abs(amount).toLocaleString()}
                        </p>
                        <p className={`text-xs ${amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {percentage >= 0 ? "+" : ""}{percentage.toFixed(2)}%
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Purchased: {new Date(stock.purchaseDate).toLocaleDateString()}
                </div>
                {stock.broker && (
                  <p className="text-sm text-muted-foreground">Broker: {stock.broker}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStock ? "Edit Stock" : "Add New Stock"}</DialogTitle>
            <DialogDescription>
              {editingStock ? "Update your stock details" : "Add a new stock to your portfolio"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="mutual-fund">Mutual Fund</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="bonds">Bonds</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Company/Fund Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price *</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice || ""}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentPrice">Current Price</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    value={formData.currentPrice || ""}
                    onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="broker">Broker</Label>
                <Input
                  id="broker"
                  value={formData.broker}
                  onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingStock ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
