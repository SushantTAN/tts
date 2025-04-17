import React, { useState, useRef, useEffect } from 'react'
import './App.css'

const WINDOW_SIZE = 3

const App: React.FC = () => {
  const [text, setText] = useState('')
  const [captions, setCaptions] = useState<React.ReactNode[]>([])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)
  const charIndicesRef = useRef<number[]>([])

  // Load available voices
  useEffect(() => {
    const synth = window.speechSynthesis

    const loadVoices = () => {
      const available = synth.getVoices()
      if (available.length) {
        setVoices(available)
      }
    }

    loadVoices()
    synth.onvoiceschanged = loadVoices
  }, [])

  // Build char‐index map & initialize first window whenever text changes
  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(w => w)
    const charIndices: number[] = []
    let idx = 0
    words.forEach(w => {
      charIndices.push(idx)
      idx += w.length + 1
    })
    charIndicesRef.current = charIndices

    // first window
    const firstWindow = words.slice(0, WINDOW_SIZE).map((w, i) => (
      <span key={i}>{w} </span>
    ))
    setCaptions(firstWindow)
  }, [text])

  const handleSpeak = () => {
    window.speechSynthesis.cancel()
    const words = text.trim().split(/\s+/).filter(w => w)
    const charIndices = charIndicesRef.current

    const utt = new SpeechSynthesisUtterance(text)
    // assign selected voice
    if (voices[selectedVoiceIndex]) {
      utt.voice = voices[selectedVoiceIndex]
    }

    utt.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word') {
        const ci = event.charIndex
        let wordIndex = charIndices.findIndex((start, i) => {
          const next = charIndices[i + 1] ?? Infinity
          return ci >= start && ci < next
        })
        if (wordIndex === -1) wordIndex = words.length - 1

        if (wordIndex > 0 && wordIndex % WINDOW_SIZE === 0) {
          const block = words.slice(wordIndex, wordIndex + WINDOW_SIZE)
          setCaptions(block.map((w, i) => <span key={i}>{w} </span>))
        }
      }
    }

    utt.onend = () => {
      const last = words.slice(-WINDOW_SIZE)
      setCaptions(last.map((w, i) => <span key={i}>{w} </span>))
    }

    window.speechSynthesis.speak(utt)
  }

  return (
    <div className="container">
      <h1 className="title">Lyrics‑Style TTS</h1>

      <textarea
        className="input-text"
        rows={6}
        placeholder="Type your text here…"
        value={text}
        onChange={e => setText(e.target.value)}
      />

      {/* Voice selector */}
      <select
        className="voice-select"
        value={selectedVoiceIndex}
        onChange={e => setSelectedVoiceIndex(Number(e.target.value))}
      >
        {voices.map((v, i) => (
          <option key={v.voiceURI + i} value={i}>
            {v.name} ({v.lang})
          </option>
        ))}
      </select>

      <button className="btn" onClick={handleSpeak} disabled={!text.trim()}>
        Speak
      </button>

      <div className="captions-container">
        {captions}
      </div>
    </div>
  )
}

export default App
