import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'

interface StepIndicatorProps {
  currentStep: number // 1 to 5
  totalSteps?: number
  stepTitles?: string[]
}

const DEFAULT_TITLES = ['Department', 'Specialist', 'Date', 'Time Slot', 'Estimate']

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps = 5,
  stepTitles = DEFAULT_TITLES,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1
          const isDone = stepNum < currentStep
          const isCurrent = stepNum === currentStep

          return (
            <React.Fragment key={idx}>
              <View
                style={[
                  styles.stepCircle,
                  isDone && styles.stepDone,
                  isCurrent && styles.stepCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.stepText,
                    (isDone || isCurrent) && styles.stepTextActive,
                  ]}
                >
                  {isDone ? '✓' : stepNum}
                </Text>
              </View>

              {idx < totalSteps - 1 && (
                <View
                  style={[
                    styles.connector,
                    isDone && styles.connectorDone,
                  ]}
                />
              )}
            </React.Fragment>
          )
        })}
      </View>

      <Text style={styles.titleText}>
        Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1] || ''}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.sm,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.slate100,
    borderWidth: 1.5,
    borderColor: THEME.colors.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    backgroundColor: THEME.colors.healthy,
    borderColor: THEME.colors.healthyDark,
  },
  stepCurrent: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primaryDark,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.slate500,
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  connector: {
    width: 24,
    height: 2,
    backgroundColor: THEME.colors.slate200,
    marginHorizontal: 4,
  },
  connectorDone: {
    backgroundColor: THEME.colors.healthy,
  },
  titleText: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
