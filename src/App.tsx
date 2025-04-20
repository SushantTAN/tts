import React, { useState, useRef, useEffect } from 'react'
import './App.css'

const WINDOW_SIZE = 3

const App: React.FC = () => {
  const [paragraphs, setParagraphs] = useState<string[]>([''])
  const [captions, setCaptions] = useState<React.ReactNode[]>([])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)

  const charIndicesRef = useRef<number[][]>([]) // stores char indices per paragraph

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

  const handleSpeakAll = () => {
    speechSynthesis.cancel()
    speakParagraph(0)
  }

  const speakParagraph = (paraIndex: number) => {
    if (paraIndex >= paragraphs.length) return

    const text = paragraphs[paraIndex].trim()
    if (!text) {
      speakParagraph(paraIndex + 1)
      return
    }

    const words = text.split(/\s+/).filter(Boolean)
    const charIndices: number[] = []
    let idx = 0
    words.forEach(w => {
      charIndices.push(idx)
      idx += w.length + 1
    })
    charIndicesRef.current[paraIndex] = charIndices

    // Show first block
    setCaptions(words.slice(0, WINDOW_SIZE).map((w, i) => <span key={i}>{w} </span>))

    const utt = new SpeechSynthesisUtterance(text)
    if (voices[selectedVoiceIndex]) {
      utt.voice = voices[selectedVoiceIndex]
    }

    utt.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word') {
        const ci = event.charIndex
        const charIndices = charIndicesRef.current[paraIndex]
        const wordIndex = charIndices.findIndex((start, i) => {
          const next = charIndices[i + 1] ?? Infinity
          return ci >= start && ci < next
        })

        if (wordIndex >= 0 && wordIndex % WINDOW_SIZE === 0) {
          const chunk = words.slice(wordIndex, wordIndex + WINDOW_SIZE)
          setCaptions(chunk.map((w, i) => <span key={i}>{w} </span>))
        }
      }
    }

    utt.onend = () => {
      const lastChunk = words.slice(-WINDOW_SIZE)
      setCaptions(lastChunk.map((w, i) => <span key={i}>{w} </span>))
      speakParagraph(paraIndex + 1)
    }

    speechSynthesis.speak(utt)
  }

  const handleTextChange = (index: number, value: string) => {
    const updated = [...paragraphs]
    updated[index] = value
    setParagraphs(updated)
  }

  const addParagraph = () => {
    setParagraphs([...paragraphs, ''])
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex flex-col items-center">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Multi-Paragraph TTS with 3-Word Captions
        </h1>

        {paragraphs.map((para, i) => (
          <textarea
            key={i}
            value={para}
            onChange={e => handleTextChange(i, e.target.value)}
            placeholder={`Paragraph ${i + 1}`}
            rows={3}
            className="w-full mb-4 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-y"
          />
        ))}

        <button
          onClick={addParagraph}
          className="w-full py-2 mb-4 text-indigo-600 border border-indigo-500 rounded hover:bg-indigo-50 transition"
        >
          + Add Paragraph
        </button>

        <select
          className="w-full mb-4 p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          value={selectedVoiceIndex}
          onChange={e => setSelectedVoiceIndex(+e.target.value)}
        >
          {voices.map((v, i) => (
            <option key={v.voiceURI + i} value={i}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>

        <button
          onClick={handleSpeakAll}
          disabled={paragraphs.every(p => !p.trim())}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-105 hover:shadow-md"
        >
          Speak All
        </button>

        <div className="mt-6 p-4 bg-gray-800 text-gray-100 rounded-lg text-lg min-h-[3rem] text-center">
          {captions}
        </div>
      </div>

      <div className='w-full'>
        <h2>My Intro Video</h2>
        <div className='relative w-full'>
          <video
            src="/videos/videoplayback.mp4"      // ← note the leading “/”
            controls               // show play/pause/etc.
            className="w-full rounded-lg shadow-lg"
          >
            Your browser doesn’t support the <code>&lt;video&gt;</code> tag.
          </video>

          {/* overlay container */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* caption box */}
            <div className="caption-font">
              {captions}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
