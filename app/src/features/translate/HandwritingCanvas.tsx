import { useEffect, useRef, useState } from 'react'

interface Props {
  onRecognized: (text: string) => void
  onCancel: () => void
}

export default function HandwritingCanvas({ onRecognized, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const strokesRef = useRef<{ x: number; y: number }[][]>([])
  const currentStrokeRef = useRef<{ x: number; y: number }[] | null>(null)

  const [status, setStatus] = useState<'idle' | 'recognizing' | 'error'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      const width = Math.max(200, rect.width)
      const height = 220
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      redraw()
    }

    const redraw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const stroke of strokesRef.current) {
        if (stroke.length === 0) continue
        ctx.beginPath()
        ctx.moveTo(stroke[0].x, stroke[0].y)
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y)
        }
        ctx.stroke()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    currentStrokeRef.current = [getPoint(e)]
    strokesRef.current.push(currentStrokeRef.current)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !currentStrokeRef.current) return
    const point = getPoint(e)
    currentStrokeRef.current.push(point)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const stroke = currentStrokeRef.current
    if (stroke.length < 2) return
    const prev = stroke[stroke.length - 2]
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    drawingRef.current = false
    currentStrokeRef.current = null
  }

  const clearCanvas = () => {
    strokesRef.current = []
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width / (window.devicePixelRatio || 1)
    const h = canvas.height / (window.devicePixelRatio || 1)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }

  const undoStroke = () => {
    strokesRef.current.pop()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width / (window.devicePixelRatio || 1)
    const h = canvas.height / (window.devicePixelRatio || 1)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y)
      }
      ctx.stroke()
    }
  }

  const recognize = async () => {
    if (strokesRef.current.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    setStatus('recognizing')
    setError(null)
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('deu')
      const { data } = await worker.recognize(canvas)
      await worker.terminate()
      const text = data.text.trim()
      if (!text) {
        setStatus('error')
        setError('No text recognized. Try writing larger and clearer.')
        return
      }
      onRecognized(text)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Recognition failed')
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className="rounded-lg border border-slate-600 bg-white"
      />
      <p className="text-xs text-slate-400">
        Write German with your finger. First recognize downloads a ~5MB
        language model (one time).
      </p>
      {status === 'error' && error && (
        <p className="text-xs text-rose-400">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={recognize}
          disabled={status === 'recognizing'}
          className="flex-1 rounded-lg bg-sky-500 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400"
        >
          {status === 'recognizing' ? 'Recognizing…' : 'Recognize'}
        </button>
        <button
          onClick={undoStroke}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Undo
        </button>
        <button
          onClick={clearCanvas}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Clear
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
