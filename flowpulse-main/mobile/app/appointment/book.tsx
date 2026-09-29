import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SlotPicker } from '../../components/booking/SlotPicker'
import { StepIndicator } from '../../components/booking/StepIndicator'
import { VisitEstimateCard } from '../../components/booking/VisitEstimateCard'
import { DepartmentCard } from '../../components/cards/DepartmentCard'
import { DoctorCard } from '../../components/cards/DoctorCard'
import { Button } from '../../components/ui/Button'
import { Header } from '../../components/ui/Header'
import { useAppointment } from '../../hooks/useAppointment'
import { DEMO_DEPARTMENTS, DEMO_DOCTORS, DEMO_PATIENT } from '../../lib/data/demo-data'
import { calculateExpectedCompletion, calculateRecommendedArrival } from '../../lib/engines/visit-time-engine'
import { THEME } from '../../lib/constants/theme'
import type { DepartmentId, DepartmentInfo, Doctor } from '../../lib/types'

export default function BookAppointmentScreen() {
  const router = useRouter()
  const { createBooking, bookingLoading } = useAppointment()

  // Form State
  const [currentStep, setCurrentStep] = useState<number>(1) // 1 to 5
  const [selectedDept, setSelectedDept] = useState<DepartmentInfo>(DEMO_DEPARTMENTS[0])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(DEMO_DOCTORS[0])
  const [selectedDate, setSelectedDate] = useState<string>('Today, 28 Aug 2026')
  const [selectedSlot, setSelectedSlot] = useState<string>('10:30 AM')
  const [patientName, setPatientName] = useState<string>(DEMO_PATIENT.name)
  const [patientPhone, setPatientPhone] = useState<string>(DEMO_PATIENT.phone)
  const [patientEmail, setPatientEmail] = useState<string>(DEMO_PATIENT.email)

  // Filter doctors by selected department
  const availableDoctors = DEMO_DOCTORS.filter(
    (d) => d.departmentId === selectedDept.id || d.departmentId === 'general-opd',
  )

  // Visit Estimates
  const arrivalInfo = calculateRecommendedArrival(selectedSlot, 0)
  const completionInfo = calculateExpectedCompletion({
    departmentId: selectedDept.id,
    scheduledTime: selectedSlot,
    queueWaitMinutes: 14,
    includeDiagnostics: true,
  })

  // Handlers
  const handleDepartmentSelect = (dept: DepartmentInfo) => {
    setSelectedDept(dept)
    const matchedDoctor = DEMO_DOCTORS.find((d) => d.departmentId === dept.id) || DEMO_DOCTORS[0]
    setSelectedDoctor(matchedDoctor)
    setCurrentStep(2)
  }

  const handleDoctorSelect = (doc: Doctor) => {
    setSelectedDoctor(doc)
    setCurrentStep(3)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setCurrentStep(4)
  }

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot)
    setCurrentStep(5)
  }

  const handleConfirmBooking = async () => {
    // Validation
    if (!patientName.trim()) {
      Alert.alert('Validation Error', 'Please enter the patient full name.')
      return
    }
    if (!selectedDept) {
      Alert.alert('Validation Error', 'Please choose a department.')
      return
    }
    if (!selectedDoctor) {
      Alert.alert('Validation Error', 'Please choose a specialist doctor.')
      return
    }
    if (!selectedDate) {
      Alert.alert('Validation Error', 'Please select an appointment date.')
      return
    }
    if (!selectedSlot) {
      Alert.alert('Validation Error', 'Please select a preferred time slot.')
      return
    }

    try {
      const newAppt = await createBooking({
        patientId: DEMO_PATIENT.id,
        patientName,
        departmentId: selectedDept.id,
        departmentName: selectedDept.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorQualification: selectedDoctor.qualification,
        doctorImageUrl: selectedDoctor.imageUrl,
        scheduledDate: selectedDate,
        scheduledTime: selectedSlot,
      })

      // Navigate to confirmation screen with query params
      router.replace({
        pathname: '/appointment/confirmation',
        params: {
          id: newAppt.id,
          patientName: newAppt.patientName,
          doctorName: newAppt.doctorName,
          departmentName: newAppt.departmentName,
          scheduledTime: newAppt.scheduledTime,
          recommendedArrival: newAppt.recommendedArrivalWindow,
          expectedWait: String(newAppt.expectedQueueWaitMinutes),
          expectedCompletion: newAppt.estimatedCompletionTime,
          token: newAppt.token,
        },
      })
    } catch (err: any) {
      Alert.alert('Booking Error', err?.message || 'Could not complete appointment booking.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Header */}
        <View style={styles.topNav}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1)
              } else {
                router.back()
              }
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Book Appointment</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Step Progress Bar */}
        <StepIndicator currentStep={currentStep} totalSteps={5} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: CHOOSE DEPARTMENT */}
          {currentStep === 1 && (
            <View>
              <Text style={styles.stepHeader}>Select Clinical Department</Text>
              <Text style={styles.stepSubtitle}>
                Choose the specialized department for your consultation
              </Text>
              {DEMO_DEPARTMENTS.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  department={dept}
                  selected={selectedDept.id === dept.id}
                  onSelect={() => handleDepartmentSelect(dept)}
                />
              ))}
            </View>
          )}

          {/* STEP 2: CHOOSE DOCTOR */}
          {currentStep === 2 && (
            <View>
              <Text style={styles.stepHeader}>Select Specialist Doctor</Text>
              <Text style={styles.stepSubtitle}>
                Available specialists in {selectedDept.name}
              </Text>
              {availableDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  selected={selectedDoctor.id === doc.id}
                  onSelect={() => handleDoctorSelect(doc)}
                />
              ))}
            </View>
          )}

          {/* STEP 3 & 4: DATE & TIME */}
          {(currentStep === 3 || currentStep === 4) && (
            <View>
              <Text style={styles.stepHeader}>Choose Date & Preferred Slot</Text>
              <Text style={styles.stepSubtitle}>
                Booking with {selectedDoctor.name} ({selectedDept.name})
              </Text>
              <SlotPicker
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSlotSelect}
              />
              {currentStep === 3 && (
                <Button
                  title="Continue to Time Slots →"
                  onPress={() => setCurrentStep(4)}
                  variant="primary"
                  size="lg"
                  style={{ marginTop: THEME.spacing.lg }}
                />
              )}
            </View>
          )}

          {/* STEP 5: VISIT ESTIMATE & CONFIRMATION */}
          {currentStep === 5 && (
            <View>
              <Text style={styles.stepHeader}>Review & Confirm Visit</Text>
              <Text style={styles.stepSubtitle}>
                FlowPulse has generated your personalized door-to-door timeline
              </Text>

              {/* Patient Contact Info Verification */}
              <View style={styles.contactForm}>
                <Text style={styles.formTitle}>PATIENT DETAILS</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    value={patientName}
                    onChangeText={setPatientName}
                    style={styles.textInput}
                    placeholder="Enter patient name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number (for SMS token)</Text>
                  <TextInput
                    value={patientPhone}
                    onChangeText={setPatientPhone}
                    style={styles.textInput}
                    placeholder="+91 98450 XXXXX"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Calculated Visit Estimate Card */}
              <View style={{ marginVertical: THEME.spacing.lg }}>
                <VisitEstimateCard
                  patientName={patientName}
                  doctorName={selectedDoctor.name}
                  departmentName={selectedDept.name}
                  scheduledDate={selectedDate}
                  scheduledTime={selectedSlot}
                  recommendedArrival={arrivalInfo.recommendedWindow}
                  expectedWaitMinutes={14}
                  expectedConsultationTime={arrivalInfo.targetArrivalTimeStr}
                  estimatedVisitDuration={completionInfo.formattedDuration}
                  expectedCompletionTime={completionInfo.expectedCompletionTime}
                />
              </View>

              {/* Confirm CTA */}
              <Button
                title="CONFIRM APPOINTMENT"
                onPress={handleConfirmBooking}
                variant="primary"
                size="lg"
                loading={bookingLoading}
                style={styles.confirmBtn}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.card,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  navTitle: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxxl,
  },
  stepHeader: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  stepSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
    marginBottom: THEME.spacing.lg,
  },
  contactForm: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  formTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.md,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.slate700,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: THEME.colors.slate50,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: THEME.colors.navy,
  },
  confirmBtn: {
    width: '100%',
  },
})
