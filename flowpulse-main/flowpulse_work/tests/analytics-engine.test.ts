import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateHourlyTrafficDistribution,
  calculateDepartmentEfficiency,
} from '../lib/engine/analytics-engine'

describe('FlowPulse Healthcare Analytics & Throughput Engine', () => {
  it('generates hourly arrival and throughput traffic slots across daytime hours', () => {
    const distribution = generateHourlyTrafficDistribution()
    assert.ok(distribution.length >= 8)
    assert.ok(distribution.some((s) => s.label.includes('10:00 AM')))
    assert.ok(distribution.every((s) => s.arrivalVolume > 0 && s.throughputVolume > 0))
  })

  it('calculates department efficiency score and grades properly', () => {
    const result = calculateDepartmentEfficiency({
      departmentId: 'cardiology',
      departmentName: 'Cardiology Clinic',
      currentOccupancy: 14,
      capacity: 18,
      avgWaitMinutes: 15,
      nominalServiceMinutes: 18,
    })

    assert.ok(result.efficiencyScore >= 60 && result.efficiencyScore <= 100)
    assert.ok(['A+', 'A', 'B', 'C', 'D'].includes(result.grade))
    assert.ok(result.throughputPerHour > 0)
    assert.ok(result.avgTurnaroundMinutes > 0)
  })
})
