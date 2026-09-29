import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CLINICAL_THEMES, getThemeTokens } from '../lib/theme/contrast-tokens'

describe('FlowPulse Clinical Theme Tokens', () => {
  it('provides WCAG-compliant light, dark, and emergency high-contrast tokens', () => {
    assert.ok(CLINICAL_THEMES['clinical-light'] !== undefined)
    assert.ok(CLINICAL_THEMES['midnight-dark'] !== undefined)
    assert.ok(CLINICAL_THEMES['high-contrast-emergency'] !== undefined)
  })

  it('retrieves tokens by mode with fallback to light', () => {
    const tokens = getThemeTokens('high-contrast-emergency')
    assert.equal(tokens.background, '#000000')
    assert.equal(tokens.statusCritical, '#FF0033')
  })
})
