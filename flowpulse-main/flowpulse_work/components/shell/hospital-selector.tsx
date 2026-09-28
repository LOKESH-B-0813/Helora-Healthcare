'use client'

import { useState } from 'react'
import { Hospital } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { HOSPITAL_NETWORKS } from '@/lib/data/hospital-locations'

export function HospitalSelector() {
  const [value, setValue] = useState('metro-general')

  return (
    <Select value={value} onValueChange={(v: string | null) => setValue(v || 'metro-general')}>
      <SelectTrigger
        size="default"
        className="h-9 min-w-0 gap-2 border-border bg-card pl-2.5 shadow-xs sm:min-w-[220px]"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Hospital className="size-3.5" />
        </span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[280px]">
        <SelectGroup>
          <SelectLabel>Healthcare Network Facilities</SelectLabel>
          {HOSPITAL_NETWORKS.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{h.name}</span>
                <span className="text-xs text-muted-foreground">{h.address.split(',')[0]} · {h.city}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
