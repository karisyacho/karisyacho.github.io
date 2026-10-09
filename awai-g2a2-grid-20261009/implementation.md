# AWAI G2-A2 — membrane grid study

2026-10-09. S0 only. Not a production-quality approval. No KASANE, AIMA, film integration, or change of art direction.

The prescribed Smooth warp is preserved for comparison. Grid uses positions, velocities, a fixed perimeter, local normal pressure, compliant distance constraints, rest-curvature displacement constraints, a weak rest tether, and damping. XY deformation is a result of those constraints, not a prescribed ridge curve.

## Calculation and rendering

- PC: 64×40 cells / 2,665 nodes / 10,344 distance edges / 5,118 bending triples.
- SP: 32×64 cells / 2,145 nodes / 8,288 edges / 4,094 triples.
- Physical coordinates in screen-height units. G1's authored analytic rest shape sets the rest XYZ, including the diagonal ridge.
- Fixed 1/120 s substeps, six alternating constraint iterations. XPBD distance compliance 2e-7; three-point displacement Laplacian bending compliance 8e-5. Lambda resets each substep. Reference: [Macklin et al. XPBD](https://mmacklin.com/xpbd.pdf).
- Local elliptical pressure magnitude 4.2, contact support along .19 / across .10 screen-height. Force acts along the negative normal from the previous position field. The pressure is centered under the projected screen contact; normals are sampled before updating positions to avoid traversal bias.
- Rest tether9, damping7. No gravity. No direct XY warp. Static pixels are exact; when the grid is at rest, the original static shader path is used.
- Delta-only RGBA32F texture (PC42,640 bytes / SP34,320 bytes), updated when revision changes. Four-by-four Catmull-Rom interpolation and derivatives in the existing vertex shader; same interpolation basis in CPU sample diagnostics. GPU readback of positions/derivatives was not measured.
- Authored rest geometry, microfibres, upper-left light, black levels, A/B radiance and G1 overlay remain shared. G1 images are fallback/overlay only. The simulation never deforms a background photo.
- Original fine rendering grid stays Full256×192 or Balanced192×144. Balanced does not change simulation nodes. Texture, buffers, shaders, VAO and program are disposed; observers, callbacks and input handlers are removed on destroy.

## Inputs and comparison

PC press/drag; smartphone tap/short hold,150 ms short-tap retention. Native vertical scroll/pinch with passive listeners and pan-y/pinch-zoom; cancel, edge departure, blur and page changes release the load. WebGL2 failure shows the G1 still. Reduced motion uses a static equilibrium solve when contact changes rather than continuous animation (the solve has CPU cost).

Default Grid / B / optical light off. UI only model selection, A/B, replay, reference/quality controls and four shared sliders: load response, load release, amber, B transmission. Internal physics coefficients are fixed for this study; no parameter search loop.

Comparative input is reference UV(.42,.55), load1, Full, DPR1. Smooth interprets this as a prescribed displacement; Grid as force amplitude. These are matched input conditions, not calibrated equal Newtons. Still maximum is Grid after300substeps; video is real-time 0.6 s rest,2.4 s hold,then actual recovery. Recorded in PC/SP viewport browsers, not on phones. Diagnostic settle freezes the state for comparable A/B capture and is not used for live recovery.

## Measured outcome

Grid reduces projected area compression: minimum determinant PC .505→.982, SP .352→.945. Minimum directional ratio PC .524→approximately .98, SP .260→approximately .94. Main and three additional contacts have no negative sampled determinant. These are sampled results, not a universal injectivity proof. 3D maximum edge strain is about1.02% PC /3.75% SP at the main contact.

Ridge movement is much smaller: PC X1.60/Y2.20 px; SP X2.05/Y2.48 px. Maximum depth is approximately4.2%H PC /3.3%H SP, but depth is not projected lateral motion. Visibility is now primarily sag/shading, and does not meet a claim of Clear/Smooth-level ridge travel.

Whole-line maximum curvature PC27.35 Smooth →62.78 Grid, against63.01 at rest. SP maximum105.68 is unchanged; RMS6.62→5.86. Added sag Hessian RMS PC.646→1.672 /SP1.048→3.884. Not every curvature indicator improves. Full formulas and readings are in evidence/grid-results.json and evidence/rest-curvature.json.

Natural recovery recorded PC3.38 s /SP2.24 s; release solver cost average2.86 /1.96 ms per RAF callback in the automated desktop run. Unit1/60 s step ~6 /5 ms, excluding GPU. GPU submission time is not GPU execution time. Headless frame intervals are not phone FPS.

## Limitations

Coarse grid, linear rest-curvature constraint, no measured material constants, no nonlinear shell bending, no self-contact. Bicubic interpolation is not a strain-constrained continuous surface. Strong stretch preservation with fixed edges limits lateral travel. This study proves a structural reduction of compression, not that the combined visual result is definitively better or finished.

Per-frame accumulated dt is capped1/30 s; low FPS can slow simulation relative to wall time. No physical iPhone/Android, Safari chrome behaviour, outdoor/low-brightness, thermal or low-GPU benchmark. Edge native gesture automation passes; it does not substitute for device testing.

70 automated browser checks and the separate grid unit checks pass; no art approval is inferred. Original Smooth is unchanged. The response to a pure-Z pressure was found laterally weak; one structural change to normal pressure was evaluated at the same magnitude. It remains weak in ridge travel. No further parameter amplification was used to conceal this limit.
