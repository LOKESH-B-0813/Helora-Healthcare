import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SAMPLE_REVIEWS,
  computeDoctorAggregateRating,
} from '../lib/engine/doctor-reviews'

describe('FlowPulse Doctor Reviews & Rating Engine', () => {
  it('computes average rating, punctuality and recommendation percentages', () => {
    const doc101Reviews = SAMPLE_REVIEWS.filter((r) => r.doctorId === 'DOC-101')
    const aggregate = computeDoctorAggregateRating(doc101Reviews)

    assert.equal(aggregate.totalReviews, 2)
    assert.equal(aggregate.averageRating, 5.0)
    assert.ok(aggregate.recommendationPercentage >= 95)
    assert.ok(aggregate.bedsideAverage > 0)
    assert.ok(aggregate.punctualityAverage > 0)
  })

  it('handles empty reviews fallback gracefully', () => {
    const aggregate = computeDoctorAggregateRating([])
    assert.equal(aggregate.totalReviews, 0)
    assert.equal(aggregate.averageRating, 5.0)
  })
})
