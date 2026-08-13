/**
 * Web Speech API wrapper for word audio pronunciation.
 */

export function speakWord(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  try {
    window.speechSynthesis.cancel() // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9 // Slightly calmer pace for learners
    window.speechSynthesis.speak(utterance)
  } catch (err) {
    console.warn('Speech synthesis failed:', err)
  }
}
