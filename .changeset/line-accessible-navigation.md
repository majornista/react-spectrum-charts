---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

Add S2 Line support to accessible keyboard navigation (`accessibleNavigation` on `Chart`), bringing lines to parity with the existing Bar navigation. Arrow keys move between points within a line (wrapping at the ends); for multi-series lines, Up/Down move between lines at the top level or jump to the point at the same position in the adjacent line once drilled into a point, and Enter/Right drills into a line's first point. Focus rings render around the focused line and point, the corresponding `Legend` entry stays at full opacity while a line or one of its points has focus, Enter/Space on a focused point opens its `ChartPopover` and fires its `onClick`, and a focused point's `ChartInspect` tooltip is positioned by projecting its data value through the chart's scales, since a line point has no persistent rendered mark of its own. Fixed a latent bug where a chart with more than one accessibly-navigable mark (e.g. a Bar and a Line, or two Bars) could produce duplicate focus signal and focus-ring declarations in the generated Vega spec.
