import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TRANSLATIONS, SupportedLanguage } from '../lib/i18n/translations'

describe('FlowPulse Multilingual (i18n) Engine', () => {
  const languages: SupportedLanguage[] = ['en', 'hi', 'kn', 'ta']

  it('provides complete translation dictionaries for all supported languages', () => {
    for (const lang of languages) {
      const dict = TRANSLATIONS[lang]
      assert.ok(dict !== undefined, `Missing dictionary for ${lang}`)
      assert.ok(dict.appName.length > 0)
      assert.ok(dict.bookAppointment.length > 0)
      assert.ok(dict.trackVisit.length > 0)
      assert.ok(dict.emergency.length > 0)
      assert.ok(dict.stages.consultation.length > 0)
      assert.ok(dict.stages.diagnostics.length > 0)
    }
  })

  it('correctly includes regional South Asian languages (Hindi, Kannada, Tamil)', () => {
    assert.ok(TRANSLATIONS.hi.bookAppointment.includes('अपॉइंटमेंट'))
    assert.ok(TRANSLATIONS.kn.bookAppointment.includes('ಅಪಾಯಿಂಟ್ಮೆಂಟ್'))
    assert.ok(TRANSLATIONS.ta.bookAppointment.includes('முன்பதிவு'))
  })
})
