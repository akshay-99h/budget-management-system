"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Heart,
  ShoppingCart,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Wishlist } from "@/lib/types"
import { cn } from "@/lib/utils"

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
}

const priorityBadgeVariants = {
  high: "destructive",
  medium: "default",
  low: "secondary",
}

export default function WishlistPage() {
  const [items, setItems] = useState<Wishlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Wishlist | null>(null)
  const [wishlistBudget, setWishlistBudget] = useState(0)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    estimatedPrice: 0,
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    link: "",
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/wishlist")
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch wishlist items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingItem
        ? `/api/wishlist/${editingItem.id}`
        : "/api/wishlist"
      const method = editingItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Item ${editingItem ? "updated" : "added"} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchItems()
      } else {
        throw new Error("Failed to save item")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const response = await fetch(`/api/wishlist/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item deleted successfully",
        })
        fetchItems()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const handleMarkPurchased = async (item: Wishlist) => {
    try {
      const response = await fetch(`/api/wishlist/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPurchased: !item.isPurchased,
          purchasedDate: !item.isPurchased
            ? new Date().toISOString().split("T")[0]
            : undefined,
          actualPrice: !item.isPurchased ? item.estimatedPrice : undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: item.isPurchased
            ? "Marked as unpurchased"
            : "Marked as purchased",
        })
        fetchItems()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: Wishlist) => {
    setEditingItem(item)
    setFormData({
      itemName: item.itemName,
      description: item.description || "",
      estimatedPrice: item.estimatedPrice,
      priority: item.priority,
      category: item.category || "",
      link: item.link || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      itemName: "",
      description: "",
      estimatedPrice: 0,
      priority: "medium",
      category: "",
      link: "",
    })
  }

  const activeItems = items.filter((item) => !item.isPurchased)
  const purchasedItems = items.filter((item) => item.isPurchased)
  const totalWishlistValue = activeItems.reduce(
    (sum, item) => sum + item.estimatedPrice,
    0
  )
  const affordableItems = activeItems.filter(
    (item) => item.estimatedPrice <= wishlistBudget
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
          <p className="text-muted-foreground">
            Track items you want and manage your wishlist budget
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Item" : "Add to Wishlist"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update wishlist item details"
                    : "Add a new item to your wishlist"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    placeholder="e.g., Laptop, Camera, Book"
                    value={formData.itemName}
                    onChange={(e) =>
                      setFormData({ ...formData, itemName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Any additional details..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedPrice">Estimated Price</Label>
                    <Input
                      id="estimatedPrice"
                      type="number"
                      step="0.01"
                      value={formData.estimatedPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Electronics, Books"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Link (Optional)</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://..."
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                  />
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
                  {editingItem ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Section */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Wishlist Budget
          </CardTitle>
          <CardDescription>
            Set your available budget to see what you can afford
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="number"
                step="0.01"
                value={wishlistBudget}
                onChange={(e) =>
                  setWishlistBudget(parseFloat(e.target.value) || 0)
                }
                placeholder="Enter your budget"
                className="text-2xl font-bold"
              />
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Can afford</div>
              <div className="text-2xl font-bold text-purple-500">
                {affordableItems.length} items
              </div>
            </div>
          </div>
          {wishlistBudget > 0 && (
            <div className="mt-4 p-4 bg-background rounded-lg border">
              <div className="flex items-center justify-between text-sm">
                <span>Total Wishlist Value:</span>
                <span className="font-semibold">
                  ₹{totalWishlistValue.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span>Your Budget:</span>
                <span className="font-semibold">
                  ₹{wishlistBudget.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                <span>Remaining:</span>
                <span
                  className={cn(
                    "font-semibold",
                    wishlistBudget >= totalWishlistValue
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  ₹{(wishlistBudget - totalWishlistValue).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items List */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active ({activeItems.length})
          </TabsTrigger>
          <TabsTrigger value="purchased">
            Purchased ({purchasedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading wishlist...</p>
            </div>
          ) : activeItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Your wishlist is empty
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add items you want to save for
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeItems.map((item) => {
                const canAfford =
                  wishlistBudget > 0 && item.estimatedPrice <= wishlistBudget
                const colorClass = priorityColors[item.priority]

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "relative overflow-hidden",
                      canAfford && "ring-2 ring-purple-500 ring-offset-2"
                    )}
                  >
                    <div
                      className={`absolute top-0 right-0 w-20 h-20 ${colorClass} opacity-10 rounded-bl-full`}
                    />
                    {canAfford && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-purple-500">Can Afford!</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold">
                            {item.itemName}
                          </CardTitle>
                          {item.category && (
                            <CardDescription className="text-xs mt-1">
                              {item.category}
                            </CardDescription>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMarkPurchased(item)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Purchased
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">
                          ₹{item.estimatedPrice.toLocaleString("en-IN")}
                        </div>
                        <Badge variant={priorityBadgeVariants[item.priority] as any}>
                          {item.priority}
                        </Badge>
                      </div>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Item
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchased" className="space-y-4 mt-6">
          {purchasedItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  No purchased items yet
                </h3>
                <p className="text-muted-foreground text-center">
                  Items you purchase will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {purchasedItems.map((item) => (
                <Card key={item.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {item.itemName}
                        </CardTitle>
                        {item.purchasedDate && (
                          <CardDescription className="text-xs mt-1">
                            Purchased on{" "}
                            {new Date(item.purchasedDate).toLocaleDateString()}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleMarkPurchased(item)}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Mark as Unpurchased
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Estimated: ₹{item.estimatedPrice.toLocaleString("en-IN")}
                      </span>
                      {item.actualPrice && (
                        <span className="font-semibold">
                          Paid: ₹{item.actualPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
