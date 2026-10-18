# Advisor UI redesign — Android handoff

## Image policy

- Preserve all 20 supplied WebP files and their style mapping. No new image dependency, replacement, crop, stretch, or preload.
- `AdvisorImage` renders the entire source with `contain`, bounded Android decoding and an inset inside a neutral frame. Rounded surfaces do not mask image corners.
- Detail images use source aspect ratio with a viewport height limit. Compact thumbnails deliberately leave neutral space for landscape posters and collages.
- Classic Glam retains the supplied poster: both its model and its lettering remain visible. Text already embedded in source images is not removed.
- ScanPhoto keeps image and landmark geometry aligned with `contain`; its frame no longer masks the photograph's corners.
- Image errors use a fallback; changing source URI clears the effective failed-source state. Small placeholders omit long text.

## Presentation

- Landing: shorter heading, bounded original overview image, three steps, safe-area CTA.
- Results: three horizontal cards in engine order, two unique tags maximum, two-line descriptions, understated order numbers. Full metadata and palettes live in detail.
- One collapsed optional customization panel contains effects and preferences. Opening/closing does not call their change handlers. Existing engine callbacks remain unchanged.
- Detail: fixed close header, full image, palette and reasons; techniques/steps are expandable and unmount on close.
- Services/MUA: compact responsive cards, horizontal swipe with previous/next controls, limited text lines, existing routes, matching and pagination.
- Advisor uses dark status-bar content outside the camera, existing safe-area insets, keyboard-aware scrolling and contrasting text/CTA colors.

## Device acceptance still required

Build the APK manually and check these on Android; JavaScript tests do not prove native layout, bitmap decoding or memory consumption:

1. Widths 320/360/390/412, short viewport and enlarged system font: headings, CTA, Top 3 and modal close stay reachable.
2. Open all 20 styles, including landscape Douyin/Latte/Peach and Classic Glam. Confirm all four edges and the complete source composition appear.
3. Scan without selecting effects/preferences; verify three real suggestions. Open/close customization without changing it; verify ranking stays unchanged.
4. Change and clear a preference/effect; confirm the existing rerank behavior, conflict notice and service/MUA matches.
5. Enter/exit camera and open/close every modal with gesture and three-button system navigation. Check status-bar icon contrast, bottom inset, hardware back and scrolling.
6. Open matching, enter budget, dismiss keyboard, follow service/MUA routes. Test long names and larger text.
7. Test offline, empty catalog, failed images and retry; Top 3 must remain available when marketplace requests fail.
8. Repeat scan → results → detail → back; inspect memory using the existing Advisor diagnostics. No new large gallery or eager image preload was introduced.

No APK/AAB, release configuration, backend, engine, ML Kit or Gemini change is part of this work.
