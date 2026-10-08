# AWAI G2-A Clear / Smooth — 2026-10-09

## Scope and result

Clear is the accepted base, preserved. Smooth retains its ridge displacement and replaces concentrated deformation with a distributed field. No KASANE, AIMA, or full-film integration. Static Clear/Smooth pixels and restoration match. Clear versus archived baseline samples match; raster rounding differs by at most 1/255.

The central V valley is reduced in the supplied images. This is a bounded prototype, not final art approval: global ridge curvature is not uniformly reduced, and worst-direction compression on the smartphone becomes worse. No repeated parameter search was performed after the structural revision.

## Implementation

- Existing WebGL2 mesh / renderer / lighting / input / recovery / disposal retained.
- Clear keeps the old warp and sag model; Smooth is a branch of the same shared surface and material.
- Sample Clear's ridge displacement, filter seven samples per control, fit a 17-control uniform cubic B-spline. CPU sampling and GPU drawing use the same basis.
- Normalize X/Y separately to the Clear ridge displacement maxima. Distribute across the plane with a C2 edge return and independently adjustable transverse weighting.
- Evaluate sag around the finger's projected coordinate after deformation, using the existing ridge-aligned influence axes. The contact stays anchored to the screen location, including PC drag.
- Replace contact height irregularities with a smooth Gaussian sag, and filter textile frequencies according to screen derivatives while deformation is active. The static material/light output stays unchanged.
- On release, use the existing restore rate; retain short taps for 150 ms. Pointer cancellation, page leave, scroll/pinch release and WebGL fallback remain in place.

## Development controls

Common Clear/Smooth: depth 0.045; range 0.44; directional ratio 2.1; tension 0; response 22; restore 4.8; pull 0.46; spread 0.62; bend 0.048. Shape depth, range, plane pull and spread are independently exposed.

Smooth-only: curvature filter width 0.14 (range 0.03–0.25, screen-height units); local compression 0.15 (range 0–0.8; lower distributes more widely). These controls are disabled for preserved Clear.

Optional optical settings are common: amber 0.26; B transmission 0.30; optical gain 2.4; delay 0.12 s; glow response 3.2. Default light is off. A/B share the same shape, input and load.

## Evidence

`report.html`: PC/SP × Clear/Smooth × before/maximum/restored, plus light-on maximum. `downloads.html`: mobile MP4 downloads. Four real-time videos use 0.6 s rest, 2.4 s load 1 at UV (0.42,0.55), then actual release/recovery. Videos are automated browser capture, not physical smartphone recording.

`evidence/smooth-results.json`: 22/22 assertions and definitions for 501 reference-ridge points, 81×81 projected deformation Jacobians and 441 contact-neighbourhood added-sag Hessian samples. `evidence/legacy/test-results.json`: retained 31/31 assertions. `evidence/interaction-results.json`: 6/6 additional operation/resource checks. Passing software assertions does not certify art quality.

PC horizontal/vertical maximum displacement: Clear 10.497%W / 11.881%H; Smooth 10.497%W / 11.882%H. SP: Clear 23.370%W / 8.869%H; Smooth 23.375%W / 8.865%H.

Added-sag Hessian RMS: PC 4.302 → 0.646; SP 3.827 → 1.048. Minimum projected area ratio: PC 0.247 → 0.505; SP 0.267 → 0.352. However, whole-ridge curvature maximum PC 17.616 → 27.354, SP 105.675 unchanged; SP minimum directional ratio 0.393 → 0.260. Full definitions and non-improving metrics are published, not discarded.

## Limits and alternative

This is a prescribed height/warp field, not an equilibrium thin shell. Large lateral motion with fixed edges can retain directional compression. If this remains visually unacceptable, the next deformation method should solve in-plane strain and bending constraints on a coarse mesh (e.g. position-based thin-shell constraints), with the G1 rest surface and existing renderer/lighting retained. That alternative has not been implemented in this task.

Full: 49,601 vertices / 98,304 triangles; Balanced: 27,985 / 55,296. Switching disposes old resources. CPU control curves are cached per frame/parameters, but Smooth introduces extra GPU arithmetic. No measured low-end GPU time/FPS or physical phone thermal data; quality is not automatically lowered.

Automated Edge at PC/SP sizes; WebKit startup only. Physical iPhone/Android touch, Safari gestures/browser chrome, real low brightness, outdoor use, prolonged heat and general fold-free behaviour over all coordinates/control settings remain unverified.
