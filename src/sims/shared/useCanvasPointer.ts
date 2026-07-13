import { useEffect, useRef } from 'react'
import { canvasPoint } from './canvasCoords'

export type HitId = string | null

export type CanvasCursor = 'default' | 'grab' | 'grabbing' | 'pointer'

export type PointerHandlers = {
  /** Return hit id under point (CSS canvas coords). */
  hitTest: (pt: { x: number; y: number }, size: { w: number; h: number }) => HitId
  /** Called continuously while dragging (prefer mutating refs + paint loop). */
  onDrag?: (
    id: string,
    pt: { x: number; y: number },
    size: { w: number; h: number },
    start: { x: number; y: number },
  ) => void
  onTap?: (id: HitId, pt: { x: number; y: number }) => void
  onHoverChange?: (id: HitId) => void
  onDragStart?: (id: string, pt: { x: number; y: number }) => void
  onDragEnd?: (id: string | null) => void
}

/**
 * Attach pointer hover/drag to a canvas without React re-renders every move.
 * Cursor is set on the canvas element. Keep hit geometry in a layout ref updated by draw.
 */
export function useCanvasPointer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  handlers: PointerHandlers,
  enabled = true,
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const hoverRef = useRef<HitId>(null)
  const dragRef = useRef<HitId>(null)
  const startRef = useRef({ x: 0, y: 0 })
  const movedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !enabled) return

    const size = () => ({
      w: canvas.parentElement?.clientWidth ?? canvas.clientWidth,
      h: canvas.parentElement?.clientHeight ?? canvas.clientHeight,
    })

    const setCursor = (c: CanvasCursor) => {
      canvas.style.cursor = c
    }

    const syncCursor = () => {
      if (dragRef.current) setCursor('grabbing')
      else if (hoverRef.current) setCursor('grab')
      else setCursor('default')
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const pt = canvasPoint(canvas, e)
      const id = handlersRef.current.hitTest(pt, size())
      dragRef.current = id
      startRef.current = pt
      movedRef.current = false
      if (id) {
        canvas.setPointerCapture(e.pointerId)
        handlersRef.current.onDragStart?.(id, pt)
        setCursor('grabbing')
      }
    }

    const onMove = (e: PointerEvent) => {
      const pt = canvasPoint(canvas, e)
      const s = size()

      if (dragRef.current) {
        movedRef.current = true
        handlersRef.current.onDrag?.(dragRef.current, pt, s, startRef.current)
        return
      }

      const id = handlersRef.current.hitTest(pt, s)
      if (id !== hoverRef.current) {
        hoverRef.current = id
        handlersRef.current.onHoverChange?.(id)
        syncCursor()
      }
    }

    const endDrag = (e: PointerEvent, tap: boolean) => {
      const id = dragRef.current
      const pt = canvasPoint(canvas, e)
      if (tap && !movedRef.current) {
        handlersRef.current.onTap?.(id ?? handlersRef.current.hitTest(pt, size()), pt)
      }
      if (id) handlersRef.current.onDragEnd?.(id)
      dragRef.current = null
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
      const hover = handlersRef.current.hitTest(pt, size())
      hoverRef.current = hover
      handlersRef.current.onHoverChange?.(hover)
      syncCursor()
    }

    const onUp = (e: PointerEvent) => endDrag(e, true)
    const onCancel = (e: PointerEvent) => endDrag(e, false)

    const onLeave = () => {
      if (dragRef.current) return
      if (hoverRef.current) {
        hoverRef.current = null
        handlersRef.current.onHoverChange?.(null)
        setCursor('default')
      }
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onCancel)
    canvas.addEventListener('pointerleave', onLeave)

    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.style.cursor = 'default'
    }
  }, [canvasRef, enabled])

  return { hoverRef, dragRef }
}
