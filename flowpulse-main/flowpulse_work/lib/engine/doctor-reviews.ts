// ============================================================================
// FlowPulse AI — Patient Feedback & Doctor Rating Calculator
// Computes verified patient ratings, bedside manner scores, and punctuality indices.
// ============================================================================

export interface PatientDoctorReview {
  id: string
  doctorId: string
  patientName: string
  rating: number // 1 to 5
  bedsideMannerScore: number // 1 to 5
  punctualityScore: number // 1 to 5
  comment: string
  date: string
  verifiedVisit: boolean
}

export const SAMPLE_REVIEWS: PatientDoctorReview[] = [
  {
    id: 'rev-1',
    doctorId: 'DOC-101',
    patientName: 'Ramesh Patel',
    rating: 5,
    bedsideMannerScore: 5,
    punctualityScore: 5,
    comment: 'Dr. Ananya Rao was extremely thorough with my cardiac review. The FlowPulse arrival window was accurate to the minute!',
    date: '2026-08-28',
    verifiedVisit: true,
  },
  {
    id: 'rev-2',
    doctorId: 'DOC-101',
    patientName: 'Kavita Menon',
    rating: 5,
    bedsideMannerScore: 5,
    punctualityScore: 4,
    comment: 'Clear explanation of ECG telemetry results. Very professional staff and seamless clinic experience.',
    date: '2026-08-25',
    verifiedVisit: true,
  },
  {
    id: 'rev-3',
    doctorId: 'DOC-102',
    patientName: 'Deepak Nair',
    rating: 5,
    bedsideMannerScore: 5,
    punctualityScore: 5,
    comment: 'Dr. Arjun Mehta took time to understand chronic symptoms and coordinated blood work fast.',
    date: '2026-08-24',
    verifiedVisit: true,
  },
]

export function computeDoctorAggregateRating(reviews: PatientDoctorReview[]): {
  averageRating: number
  totalReviews: number
  bedsideAverage: number
  punctualityAverage: number
  recommendationPercentage: number
} {
  if (reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      bedsideAverage: 5.0,
      punctualityAverage: 5.0,
      recommendationPercentage: 100,
    }
  }

  const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0)
  const sumBedside = reviews.reduce((sum, r) => sum + r.bedsideMannerScore, 0)
  const sumPunctuality = reviews.reduce((sum, r) => sum + r.punctualityScore, 0)
  const positiveCount = reviews.filter((r) => r.rating >= 4).length

  return {
    averageRating: parseFloat((sumRating / reviews.length).toFixed(1)),
    totalReviews: reviews.length,
    bedsideAverage: parseFloat((sumBedside / reviews.length).toFixed(1)),
    punctualityAverage: parseFloat((sumPunctuality / reviews.length).toFixed(1)),
    recommendationPercentage: Math.round((positiveCount / reviews.length) * 100),
  }
}
