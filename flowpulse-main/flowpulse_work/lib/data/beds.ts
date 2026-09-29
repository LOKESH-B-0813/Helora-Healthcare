import { patients } from "./patients"
import { createRng, rngInt, rngWeighted } from "./rng"
import type { Bed, BedStatus } from "./types"

interface WardSpec {
  ward: string
  prefix: string
  count: number
}

// 120 beds total across the modeled inpatient / treatment areas.
const WARD_SPECS: WardSpec[] = [
  { ward: "Emergency", prefix: "ED", count: 24 },
  { ward: "ICU", prefix: "IC", count: 16 },
  { ward: "Ward A", prefix: "WA", count: 42 },
  { ward: "Ward B", prefix: "WB", count: 38 },
]

function clock(base: number, add: number): string {
  const total = (base + add) % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function generateBeds(): Bed[] {
  const next = createRng(55012099)
  const list: Bed[] = []
  const admitted = patients.filter(
    (p) => p.status === "admitted" || p.status === "in-treatment",
  )
  let admittedCursor = 0
  const nowMinutes = 12 * 60 // reference "now" = 12:00

  for (const spec of WARD_SPECS) {
    for (let i = 1; i <= spec.count; i++) {
      const status = rngWeighted<BedStatus>(next, [
        ["occupied", 60],
        ["available", 15],
        ["reserved", 6],
        ["dirty", 7],
        ["cleaning", 6],
        ["blocked", 3],
      ])

      let assignedPatientId: string | null = null
      let expectedAvailableAt: string | null = null

      if (status === "occupied") {
        const patient = admitted[admittedCursor % admitted.length]
        admittedCursor++
        assignedPatientId = patient?.id ?? null
        expectedAvailableAt = clock(nowMinutes, rngInt(next, 60, 480))
      } else if (status === "cleaning") {
        expectedAvailableAt = clock(nowMinutes, rngInt(next, 10, 45))
      } else if (status === "dirty") {
        expectedAvailableAt = clock(nowMinutes, rngInt(next, 30, 90))
      } else if (status === "reserved") {
        expectedAvailableAt = clock(nowMinutes, rngInt(next, 15, 120))
      }

      list.push({
        id: `${spec.prefix}-${String(i).padStart(2, "0")}`,
        ward: spec.ward,
        bedNumber: `${spec.prefix}-${String(i).padStart(2, "0")}`,
        status,
        assignedPatientId,
        expectedAvailableAt,
      })
    }
  }

  return list
}

export const beds: Bed[] = generateBeds()

export const bedSummary = {
  total: beds.length,
  occupied: beds.filter((b) => b.status === "occupied").length,
  available: beds.filter((b) => b.status === "available").length,
  reserved: beds.filter((b) => b.status === "reserved").length,
  dirty: beds.filter((b) => b.status === "dirty").length,
  cleaning: beds.filter((b) => b.status === "cleaning").length,
  blocked: beds.filter((b) => b.status === "blocked").length,
}
