"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings2, Eye, EyeOff, RotateCcw } from "lucide-react"
import { useWidgetPreferences, WIDGET_LABELS, WIDGET_CATEGORIES } from "@/hooks/use-widget-preferences"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function WidgetSettingsDialog() {
  const { preferences, toggleWidget, resetToDefaults, showAll, hideAll } = useWidgetPreferences()

  const visibleCount = Object.values(preferences).filter(Boolean).length
  const totalCount = Object.keys(preferences).length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Customize Widgets
          <span className="text-xs text-muted-foreground">
            ({visibleCount}/{totalCount})
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Customize Dashboard Widgets
          </DialogTitle>
          <DialogDescription>
            Choose which widgets to display on your dashboard. Your preferences are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={showAll} className="gap-2">
            <Eye className="h-4 w-4" />
            Show All
          </Button>
          <Button variant="outline" size="sm" onClick={hideAll} className="gap-2">
            <EyeOff className="h-4 w-4" />
            Hide All
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-2 ml-auto">
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(WIDGET_CATEGORIES).map(([category, widgetIds]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{category}</h3>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-2">
                  {widgetIds.map((widgetId) => (
                    <div
                      key={widgetId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Label
                        htmlFor={widgetId}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {WIDGET_LABELS[widgetId]}
                      </Label>
                      <Switch
                        id={widgetId}
                        checked={preferences[widgetId]}
                        onCheckedChange={() => toggleWidget(widgetId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <DialogTrigger asChild>
            <Button>Done</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
