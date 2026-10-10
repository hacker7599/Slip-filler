import React from 'react'
import { Page, View } from '@react-pdf/renderer'

// Physical page: 8in x 4in landscape continuous paper, 72pt/in.
// 8in = 203.2mm, 4in = 101.6mm. PRINT_W > PRINT_H, so the MediaBox is
// landscape by construction — no printer-side rotation is ever required.
export const PRINT_W = 8 * 72 // 576pt = 203.2mm
export const PRINT_H = 4 * 72 // 288pt = 101.6mm

export const mmToPt = (mm) => (mm * 72) / 25.4

/** Uniform design→paper scale (preserves scan geometry, no X/Y stretch). */
export function designScale(designW, designH) {
  return Math.min(PRINT_W / designW, PRINT_H / designH)
}

/**
 * Convert a paper-space feed nudge (mm) into design-canvas points.
 * Offsets are applied inside the pre-scale design View, so without this
 * conversion 1mm in the UI only moved ~scale×1mm on the sheet — and X/Y
 * drifted differently under the old non-uniform scale.
 */
export function mmOffsetToDesign(mm, designW, designH) {
  const scale = designScale(designW, designH)
  return scale > 0 ? mmToPt(mm) / scale : 0
}

// Shared 8x4in landscape page.
//
// Each template's design canvas (e.g. 850x458) comes from a slip scan and
// must keep a single uniform scale so field positions stay geometrically
// correct relative to each other and to pre-printed stationery. Stretching
// X and Y independently filled the sheet but warped the layout — values then
// missed their slots on the dot-matrix overlay, worse toward the edges.
//
// Uniform Math.min() scale + centering matches the README (esp. Krishna's
// taller 850x600 canvas → smaller print with side margins) and keeps blank
// stationery and values overlays registered.
export default function PrintPage({ designW, designH, bg, debug = false, children }) {
  const scale = designScale(designW, designH)
  const drawnW = designW * scale
  const drawnH = designH * scale
  const originX = (PRINT_W - drawnW) / 2
  const originY = (PRINT_H - drawnH) / 2

  return (
    // size=[576,288] already has W>H, so the MediaBox is landscape as given.
    // Do NOT add orientation="landscape" here: react-pdf treats the tuple as
    // portrait-normalised and would swap it to [288,576], which (with
    // wrap=false) collapsed the box to [0 0 288 0]. The explicit tuple is the
    // single source of truth for page geometry.
    // margin/padding 0 — any page margin would shift content off stationery.
    // Width/height are intentionally not set in style; they would fight the
    // size prop. wrap=false keeps the scaled canvas on exactly one page.
    <Page
      size={[PRINT_W, PRINT_H]}
      wrap={false}
      style={{ margin: 0, padding: 0, backgroundColor: bg, fontFamily: 'Helvetica' }}
    >
      {/* Must stay IN FLOW (no position:'absolute'): with wrap=false react-pdf
          derives the page height from in-flow content, so an absolute root
          yields a zero-height MediaBox ([0 0 576 0]). This full-size in-flow
          View is what fixes the 288pt height. */}
      <View style={{ width: PRINT_W, height: PRINT_H, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            left: originX,
            top: originY,
            width: designW,
            height: designH,
            transform: `scale(${scale})`,
            // Absolute points — % origin is unreliable across react-pdf versions
            transformOrigin: '0 0',
          }}
        >
          {children}
        </View>

        {/* Alignment-test guides: paper edge (red), content box (blue),
            centre lines (green) — for feed / scale checks at 100% print */}
        {debug && (
          <>
            <View style={{
              position: 'absolute', left: 0, top: 0,
              width: PRINT_W - 1, height: PRINT_H - 1,
              border: '1 dashed #ff0000',
            }} />
            <View style={{
              position: 'absolute', left: originX, top: originY,
              width: drawnW - 1, height: drawnH - 1,
              border: '1 dashed #0066cc',
            }} />
            <View style={{
              position: 'absolute', left: 0, top: PRINT_H / 2,
              width: PRINT_W, height: 0.5, backgroundColor: '#00a000',
            }} />
            <View style={{
              position: 'absolute', left: PRINT_W / 2, top: 0,
              width: 0.5, height: PRINT_H, backgroundColor: '#00a000',
            }} />
          </>
        )}
      </View>
    </Page>
  )
}
