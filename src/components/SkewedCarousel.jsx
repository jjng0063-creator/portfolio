import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
const normalizeItem = it => (typeof it === 'string' ? { image: it } : it)
const RAD = Math.PI / 180
const easeOutCubic = t => 1 - (1 - t) ** 3

/**
 * A coverflow-style carousel: the focused card sits flat and full size while
 * every other card is rotated toward it. Cards are laid out along a shallow
 * arc, so their spacing compresses toward the edges.
 */
export default function SkewedCarousel({
  items = [],
  cardWidth = 200,
  cardHeight = 280,
  rotation = 60,
  inactiveScale = 0.85,
  arc = 18,
  spread = 720,
  depth = 0.35,
  perspective = 1400,
  visibleCards = 3,
  radius = 14,
  duration = 0.7,
  ease = easeOutCubic,
  loop = true,
  autoplay = false,
  autoplayDelay = 3500,
  showControls = true,
  showIndicators = true,
  onChange,
  className = '',
}) {
  const data = useMemo(
    () => (Array.isArray(items) ? items : []).map(normalizeItem),
    [items]
  )
  const count = data.length

  const rootRef = useRef(null)
  const cardRefs = useRef([])
  const captionRefs = useRef([])

  const posRef = useRef(0)
  const rafRef = useRef(0)
  const activeRef = useRef(0)
  const dragRef = useRef(null)
  const autoRef = useRef(null)
  const reducedRef = useRef(false)
  const cfgRef = useRef({})
  const onChangeRef = useRef(onChange)

  const [active, setActive] = useState(0)

  /** Signed distance from `pos` to card `i`, taking the short way round. */
  const offsetOf = useCallback((i, pos) => {
    const { count: n, loop: wrap } = cfgRef.current
    let off = i - pos
    if (wrap && n > 0) {
      off = ((off % n) + n) % n
      if (off > n / 2) off -= n
    }
    return off
  }, [])

  const layout = useCallback(
    pos => {
      const c = cfgRef.current
      for (let i = 0; i < c.count; i++) {
        const el = cardRefs.current[i]
        if (!el) continue

        const off = offsetOf(i, pos)
        const abs = Math.abs(off)
        const angle = off * c.arc * RAD

        // Along a shallow arc: x compresses at the edges, z recedes slightly.
        const x = c.spread * Math.sin(angle)
        const z = -c.spread * c.depth * (1 - Math.cos(angle))

        // `rotation` is measured against the viewing ray rather than the screen,
        // so every off-centre card is foreshortened by the same amount however
        // far from the middle it sits. `faceOn` is the rotation that would turn
        // this card square to the eye; the skew is applied relative to that.
        const faceOn = -Math.atan2(x, c.perspective - z) / RAD
        const t = clamp(abs, 0, 1)
        const rotY = faceOn - Math.sign(off) * c.rotation * t
        const scale = 1 + (c.inactiveScale - 1) * t

        gsap.set(el, {
          xPercent: -50,
          yPercent: -50,
          x,
          z,
          rotationY: rotY,
          scale,
          opacity: abs <= c.visibleCards + 0.5 ? 1 : 0,
          zIndex: 1000 - Math.round(abs * 100),
        })

        const cap = captionRefs.current[i]
        if (cap) gsap.set(cap, { opacity: clamp(1 - abs * 1.6, 0, 1) })
      }
    },
    [offsetOf]
  )

  const commit = useCallback(pos => {
    const n = cfgRef.current.count
    if (!n) return
    const idx = ((Math.round(pos) % n) + n) % n
    if (activeRef.current === idx) return
    activeRef.current = idx
    setActive(idx)
    onChangeRef.current?.(idx)
  }, [])

  const stopAnim = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }, [])

  const animateTo = useCallback(
    (target, immediate = false) => {
      const c = cfgRef.current
      stopAnim()

      const dest = c.loop ? target : clamp(target, 0, c.count - 1)

      if (immediate || reducedRef.current || c.duration <= 0) {
        posRef.current = dest
        layout(dest)
        commit(dest)
        return
      }

      const from = posRef.current
      const startedAt = performance.now()
      const ms = c.duration * 1000

      const tick = now => {
        const p = clamp((now - startedAt) / ms, 0, 1)
        posRef.current = from + (dest - from) * c.ease(p)
        layout(posRef.current)
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          posRef.current = dest
          layout(dest)
          rafRef.current = 0
        }
      }

      rafRef.current = requestAnimationFrame(tick)
      commit(dest)
    },
    [layout, commit, stopAnim]
  )

  const navigateBy = useCallback(
    delta => animateTo(Math.round(posRef.current) + delta),
    [animateTo]
  )

  const focusIndex = useCallback(
    i => animateTo(posRef.current + offsetOf(i, posRef.current)),
    [animateTo, offsetOf]
  )

  // ---- input -------------------------------------------------------------

  const stepPx = useCallback(
    () => Math.max(1, cfgRef.current.spread * Math.sin(cfgRef.current.arc * RAD)),
    []
  )

  const onPointerDown = e => {
    if (e.target.closest('button')) return
    stopAnim()
    dragRef.current = { x: e.clientX, start: posRef.current, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = e => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 4) d.moved = true
    posRef.current = d.start - dx / stepPx()
    layout(posRef.current)
  }

  const onPointerUp = e => {
    const d = dragRef.current
    if (!d) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    animateTo(Math.round(posRef.current))
    // Cleared after the click handler runs, so a drag never counts as a click.
    setTimeout(() => (dragRef.current = null), 0)
  }

  const onKeyDown = e => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      navigateBy(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      navigateBy(1)
    }
  }

  // Horizontal wheel input only — vertical scrolling stays with the page.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let timer = null
    const onWheel = e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      if (timer) return
      navigateBy(e.deltaX > 0 ? 1 : -1)
      timer = setTimeout(() => {
        timer = null
      }, 260)
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      root.removeEventListener('wheel', onWheel)
      if (timer) clearTimeout(timer)
    }
  }, [navigateBy])

  // ---- lifecycle ---------------------------------------------------------

  // Keep the latest props reachable from callbacks and rAF ticks without
  // rebuilding them. Declared first so the layout effect below sees fresh
  // config on the same render.
  useEffect(() => {
    onChangeRef.current = onChange
    cfgRef.current = {
      count,
      arc,
      spread,
      depth,
      rotation,
      inactiveScale,
      visibleCards,
      perspective,
      loop,
      duration,
      ease,
    }
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      reducedRef.current = mq.matches
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    layout(posRef.current)
  }, [
    layout,
    cardWidth,
    cardHeight,
    rotation,
    inactiveScale,
    arc,
    spread,
    depth,
    visibleCards,
    count,
  ])

  useEffect(() => {
    if (!autoplay || count < 2) return
    const root = rootRef.current
    const stop = () => {
      if (autoRef.current) clearInterval(autoRef.current)
      autoRef.current = null
    }
    const start = () => {
      stop()
      autoRef.current = setInterval(() => navigateBy(1), autoplayDelay)
    }
    start()
    root?.addEventListener('mouseenter', stop)
    root?.addEventListener('mouseleave', start)
    root?.addEventListener('focusin', stop)
    return () => {
      stop()
      root?.removeEventListener('mouseenter', stop)
      root?.removeEventListener('mouseleave', start)
      root?.removeEventListener('focusin', stop)
    }
  }, [autoplay, autoplayDelay, count, navigateBy])

  useEffect(
    () => () => {
      stopAnim()
      if (autoRef.current) clearInterval(autoRef.current)
    },
    [stopAnim]
  )

  if (!count) return null

  return (
    <div className={`flex w-full flex-col items-center ${className}`.trim()}>
      <div
        ref={rootRef}
        className="relative w-full cursor-grab touch-pan-y select-none overflow-hidden outline-none active:cursor-grabbing focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-white/40"
        style={{ perspective: `${perspective}px`, height: cardHeight + 80 }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Projects carousel"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}>
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {data.map((item, i) => (
            <div
              key={i}
              ref={el => (cardRefs.current[i] = el)}
              onClick={() => {
                if (!dragRef.current?.moved) focusIndex(i)
              }}
              className="absolute left-1/2 top-1/2 cursor-pointer overflow-hidden bg-[#0b0d12] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.8)] [backface-visibility:hidden] [will-change:transform,opacity]"
              style={{ width: cardWidth, height: cardHeight, borderRadius: radius }}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={active !== i}>
              {item.content ? (
                <div className="h-full w-full [pointer-events:none]">{item.content}</div>
              ) : (
                <img
                  className="block h-full w-full select-none object-cover [-webkit-user-drag:none] [pointer-events:none]"
                  src={item.image}
                  alt={item.alt || ''}
                  draggable={false}
                />
              )}

              {item.caption && (
                <div
                  ref={el => (captionRefs.current[i] = el)}
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-12">
                  <p className="truncate text-sm font-medium text-white">
                    {item.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {(showControls || showIndicators) && count > 1 && (
        <div className="mt-4 flex items-center gap-5">
          {showControls && (
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => navigateBy(-1)}
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M15 5l-7 7 7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {showIndicators && (
            <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
              {data.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={active === i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => focusIndex(i)}
                  className={`h-px cursor-pointer transition-all duration-300 ${
                    active === i ? 'w-8 bg-foreground' : 'w-5 bg-muted-foreground/40'
                  }`}
                />
              ))}
            </div>
          )}

          {showControls && (
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => navigateBy(1)}
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M9 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
