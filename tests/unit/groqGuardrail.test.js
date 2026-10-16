const { validateResponse, formatResponse } = require('../../services/ai/responseFormatter')

describe('Groq AI Guardrail & Numeric Anti-Fabrication Tests', () => {
  // Ground-truth deterministic engine output context
  const deterministicContext = {
    cgpa: {
      current: 8.25,
      target: 9.0,
      predicted: 8.5
    },
    stats: {
      attendance: 88,
      completedCredits: 60,
      remainingCredits: 100
    },
    health: {
      score: 85
    },
    subjects: {
      courses: [
        { name: 'Data Structures', grade: 9, credits: 4, attendance: 90, semester: 3 },
        { name: 'Operating Systems', grade: 8, credits: 3, attendance: 85, semester: 4 }
      ],
      highRisk: []
    }
  }

  test('refuses LLM output containing a fabricated CGPA absent from deterministic engines', () => {
    // Mocked Groq response hallucinating a fake CGPA of 9.95 (actual is 8.25)
    const mockedGroqResponse = 'Congratulations! According to our AI projection, your CGPA is 9.95 and you are top of the cohort.'

    const isValid = validateResponse(mockedGroqResponse, deterministicContext)
    expect(isValid).toBe(false)

    const formatted = formatResponse(mockedGroqResponse, deterministicContext)
    expect(formatted.answer).toBe("I don't have enough academic data to answer that.")
    expect(formatted.answer).not.toContain('9.95')
  })

  test('refuses LLM output containing fabricated attendance absent from deterministic engines', () => {
    // Mocked Groq response hallucinating low attendance of 42% (actual is 88%)
    const mockedGroqResponse = 'Alert: Your overall attendance is 42% and you face severe debarment consequences.'

    const isValid = validateResponse(mockedGroqResponse, deterministicContext)
    expect(isValid).toBe(false)

    const formatted = formatResponse(mockedGroqResponse, deterministicContext)
    expect(formatted.answer).toBe("I don't have enough academic data to answer that.")
    expect(formatted.answer).not.toContain('42%')
  })

  test('refuses LLM output containing a fabricated course grade absent from deterministic engines', () => {
    // Mocked Groq response hallucinating a grade of 3.5 in Data Structures (actual is 9)
    const mockedGroqResponse = 'Review needed: In Data Structures, your final grade is 3.5, which is below passing threshold.'

    const isValid = validateResponse(mockedGroqResponse, deterministicContext)
    expect(isValid).toBe(false)

    const formatted = formatResponse(mockedGroqResponse, deterministicContext)
    expect(formatted.answer).toBe("I don't have enough academic data to answer that.")
    expect(formatted.answer).not.toContain('3.5')
  })

  test('refuses LLM output referencing non-existent courses (hallucinated curriculum)', () => {
    const mockedGroqResponse = 'You should prepare thoroughly for Quantum Physics in your upcoming semester exams.'

    const isValid = validateResponse(mockedGroqResponse, deterministicContext)
    expect(isValid).toBe(false)

    const formatted = formatResponse(mockedGroqResponse, deterministicContext)
    expect(formatted.answer).toBe("I don't have enough academic data to answer that.")
  })

  test('accepts LLM output when numeric metrics strictly match deterministic engine outputs', () => {
    const validGroqResponse = 'Your current CGPA is 8.25 with average attendance of 88%. To reach your target CGPA of 9.0, focus on maintaining your semester velocity.'

    const isValid = validateResponse(validGroqResponse, deterministicContext)
    expect(isValid).toBe(true)

    const formatted = formatResponse(validGroqResponse, deterministicContext)
    expect(formatted.answer).toBe(validGroqResponse)
    expect(formatted.suggestions.length).toBe(3)
  })
})
