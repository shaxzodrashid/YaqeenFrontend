# Quality QA & Governance

[← Back to Main Index](../YAQEEN_DESIGN_SYSTEM.md)

---

# Design QA Checklist

## Foundations

- [ ] Only approved colors are used.
- [ ] Semantic tokens are used instead of hard-coded values.
- [ ] Playfair Display is limited to headings or branded moments.
- [ ] Inter is used for UI and dense content.
- [ ] Spacing follows the 8-point scale.
- [ ] Radius values come from the approved scale.
- [ ] Shadows match an elevation token.

## Brand

- [ ] Logo proportions are unchanged.
- [ ] Clear space is respected.
- [ ] Gold has sufficient contrast.
- [ ] Ornament is subtle and does not reduce readability.
- [ ] The screen is not excessively dark or bright.
- [ ] Premium styling is restrained.

## Components

- [ ] Primary action is visually clear.
- [ ] Buttons include hover, pressed, focus, loading, and disabled states.
- [ ] Inputs have persistent labels.
- [ ] Errors explain recovery.
- [ ] Dropdowns support keyboard use.
- [ ] Toggle behavior is immediate and understandable.
- [ ] Chips and badges are used according to purpose.
- [ ] Card click behavior is unambiguous.

## Responsive

- [ ] Layout works at 320 px width.
- [ ] Layout works at tablet width.
- [ ] Content does not exceed the max-width grid.
- [ ] Text can zoom to 200%.
- [ ] Navigation transforms appropriately.
- [ ] No essential content requires horizontal scrolling.

## Accessibility

- [ ] Text meets WCAG AA contrast.
- [ ] Gold is not used as small text on light surfaces.
- [ ] Focus is visible.
- [ ] Targets are at least 44 × 44 px.
- [ ] Color is not the only state indicator.
- [ ] Icon buttons have accessible labels.
- [ ] Charts have text alternatives.
- [ ] Reduced motion is supported.

## Localization and RTL

- [ ] Layout has been tested in RTL.
- [ ] Directional icons mirror correctly.
- [ ] Logo artwork is not mirrored.
- [ ] Arabic diacritics are not clipped.
- [ ] Long translations fit.
- [ ] Currency, numbers, and dates are locale-aware.
- [ ] Mixed-direction content is stable.

## Content

- [ ] Button labels begin with clear verbs.
- [ ] Error messages state impact and recovery.
- [ ] Financial failures state whether funds moved.
- [ ] Labels use sentence case.
- [ ] Copy is concise and respectful.
- [ ] Dates and currencies are unambiguous.

---

# Governance and Versioning

## Ownership

A design-system change should have:

- a design owner;
- an engineering owner;
- an accessibility reviewer for relevant changes;
- a localization reviewer for Arabic or RTL changes;
- product-team consultation for breaking changes.

## Change Categories

### Patch

Examples:

- copy correction;
- documentation clarification;
- non-breaking token alias;
- accessibility annotation.

Version example: `1.0.1`

### Minor

Examples:

- new component;
- new optional variant;
- additional pattern;
- new semantic token.

Version example: `1.1.0`

### Major

Examples:

- token rename without alias;
- component API removal;
- typography replacement;
- grid or interaction model change.

Version example: `2.0.0`

## Contribution Process

1. Identify a repeated product need.
2. Confirm that an existing component cannot solve it.
3. Document use cases and constraints.
4. Create design and behavior proposal.
5. Review accessibility and RTL.
6. Build a coded prototype.
7. Test across products.
8. Publish with documentation and migration notes.

## Deprecation

Deprecated components must include:

- replacement guidance;
- migration example;
- deprecation date;
- removal target version;
- temporary compatibility period.

Do not silently remove tokens or variants.

---

# Appendix

## Board-Defined Inventory

The supplied board visibly establishes:

### Brand

- Arabic calligraphic mark
- YAQEEN wordmark
- “Calm. Trustworthy. Refined.”
- Deep-blue ornamental brand field

### Colors

- Royal Blue `#0F2D5C`
- Deep Navy `#11213D`
- Champagne Gold `#C8A96A`
- Ivory `#F7F5F0`
- Light Gray `#E6E7EB`
- Cool Blue Gray `#B7C2D1`
- Slate Gray `#6B7280`

### Typography

- Playfair Display headings
- Inter UI text

### Core Components

- Primary button
- Secondary button
- Tertiary button
- Text input
- Focused input
- Disabled input
- Select
- Dropdown menu
- Toggle
- Checkbox
- Tabs
- Chips and badges
- Premium card
- Desktop navigation bar

### Tokens and Principles

- Radius: 4, 8, 12, 16, 24 px
- Spacing: 8, 16, 24, 32, 40, 48, 64 px
- 2 px rounded outline icons
- Elevation levels: None, Soft, Medium, Elevated
- Clarity over complexity
- Consistent and intuitive
- Respectful of heritage
- Premium in every detail

### Example Product Patterns

- Desktop dashboard
- Sidebar navigation
- Summary metric cards
- Recent transaction list
- Spending donut chart
- Premium promotional card
- Mobile home screen
- Quick actions
- Bottom navigation

## Reference Implementation Decisions

The following were added to turn the board into an implementable system:

- exact component dimensions;
- responsive grid and breakpoints;
- interaction-state colors;
- semantic success, warning, danger, and information colors;
- accessibility requirements;
- RTL and localization guidance;
- motion durations and easing;
- CSS and JSON token structures;
- component architecture and QA standards.

These additions preserve the original visual direction while resolving areas that a static presentation board cannot fully specify.

## Final Design Statement

> Yaqeen should create confidence at every touchpoint through calm hierarchy, precise interaction, culturally respectful detail, and a restrained balance of blue, ivory, and gold.
