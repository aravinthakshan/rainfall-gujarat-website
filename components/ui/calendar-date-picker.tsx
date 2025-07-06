"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CalendarDatePickerProps {
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
  availableDates: string[]
  disabled?: boolean
  className?: string
  allowAnyDate?: boolean // Allow selecting any date, not just available ones
}

export function CalendarDatePicker({
  selectedDate,
  onDateChange,
  availableDates,
  disabled = false,
  className,
  allowAnyDate = false,
}: CalendarDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Convert available date strings to Date objects
  const availableDateObjects = React.useMemo(() => {
    return availableDates.map(dateStr => {
      // Parse date string like "16/06/2025" to Date object
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number)
        return new Date(year, month - 1, day) // month is 0-indexed
      }
      // Parse date string like "16.06.2025" to Date object (dot format)
      if (dateStr.includes('.')) {
        const [day, month, year] = dateStr.split('.').map(Number)
        return new Date(year, month - 1, day)
      }
      // Parse date string like "16th June 2025" to Date object (legacy format)
      const match = dateStr.match(/(\d+)(st|nd|rd|th)\s+(June)\s+(\d{4})/)
      if (match) {
        const day = parseInt(match[1], 10)
        const month = 5 // June is month 5 (0-indexed)
        const year = parseInt(match[4], 10)
        return new Date(year, month, day)
      }
      // Parse date string like "2025-06-05" to Date object (legacy format)
      if (dateStr.includes('-')) {
        return new Date(dateStr)
      }
      return new Date()
    }).filter(date => !isNaN(date.getTime()))
  }, [availableDates])

  // Function to check if a date is available
  const isDateAvailable = React.useCallback((date: Date) => {
    return availableDateObjects.some(availableDate => 
      availableDate.getTime() === date.getTime()
    )
  }, [availableDateObjects])

  // Function to format date for display
  const formatDisplayDate = (date: Date | undefined) => {
    if (!date) return "Select date"
    return format(date, "PPP")
  }

  // Handle date selection and close popup
  const handleDateSelect = (date: Date | undefined) => {
    onDateChange(date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplayDate(selectedDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={allowAnyDate ? undefined : (date) => !isDateAvailable(date)}
          initialFocus
          defaultMonth={selectedDate || new Date(2025, 5, 1)} // Default to June 2025
        />
      </PopoverContent>
    </Popover>
  )
} 