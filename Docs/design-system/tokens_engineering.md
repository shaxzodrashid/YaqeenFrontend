# Tokens & Engineering Guidance

[← Back to Main Index](../YAQEEN_DESIGN_SYSTEM.md)

---

# Design Tokens

## CSS Custom Properties

```css
:root {
  /* Brand */
  --yaqeen-royal: #0F2D5C;
  --yaqeen-navy: #11213D;
  --yaqeen-gold: #C8A96A;
  --yaqeen-ivory: #F7F5F0;

  /* Neutrals */
  --yaqeen-gray-100: #E6E7EB;
  --yaqeen-gray-300: #B7C2D1;
  --yaqeen-gray-600: #6B7280;
  --yaqeen-white: #FFFFFF;

  /* Interaction extensions */
  --yaqeen-royal-hover: #173E77;
  --yaqeen-royal-pressed: #0B2348;
  --yaqeen-navy-hover: #1A3157;
  --yaqeen-gold-soft: #F2E9D8;
  --yaqeen-focus: #8FA9CF;

  /* Functional */
  --yaqeen-success: #167A4A;
  --yaqeen-success-soft: #E8F5EE;
  --yaqeen-warning: #8A5A00;
  --yaqeen-warning-soft: #FFF4D8;
  --yaqeen-danger: #B42318;
  --yaqeen-danger-soft: #FDECEA;
  --yaqeen-info: #245EA8;
  --yaqeen-info-soft: #EAF2FC;

  /* Semantic surfaces */
  --color-canvas: var(--yaqeen-ivory);
  --color-surface: var(--yaqeen-white);
  --color-surface-brand: var(--yaqeen-royal);
  --color-surface-brand-strong: var(--yaqeen-navy);

  /* Semantic text */
  --color-text-primary: var(--yaqeen-navy);
  --color-text-secondary: var(--yaqeen-gray-600);
  --color-text-inverse: var(--yaqeen-white);
  --color-text-link: var(--yaqeen-royal);

  /* Borders */
  --color-border-subtle: var(--yaqeen-gray-100);
  --color-border-default: var(--yaqeen-gray-300);
  --color-border-strong: var(--yaqeen-gray-600);

  /* Typography */
  --font-display: "Playfair Display", Georgia, serif;
  --font-ui: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  /* Spacing */
  --space-0: 0;
  --space-0-5: 4px;
  --space-1: 8px;
  --space-1-5: 12px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;
  --space-10: 80px;
  --space-12: 96px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Elevation */
  --shadow-0: none;
  --shadow-1:
    0 1px 2px rgba(17, 33, 61, 0.06),
    0 2px 8px rgba(17, 33, 61, 0.04);
  --shadow-2:
    0 4px 12px rgba(17, 33, 61, 0.10),
    0 1px 3px rgba(17, 33, 61, 0.08);
  --shadow-3:
    0 12px 32px rgba(17, 33, 61, 0.16),
    0 4px 10px rgba(17, 33, 61, 0.08);

  /* Motion */
  --motion-instant: 80ms;
  --motion-fast: 120ms;
  --motion-standard: 180ms;
  --motion-emphasis: 240ms;
  --motion-slow: 320ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

## Example Token JSON

```json
{
  "color": {
    "brand": {
      "royal": { "value": "#0F2D5C", "type": "color" },
      "navy": { "value": "#11213D", "type": "color" },
      "gold": { "value": "#C8A96A", "type": "color" }
    },
    "neutral": {
      "ivory": { "value": "#F7F5F0", "type": "color" },
      "100": { "value": "#E6E7EB", "type": "color" },
      "300": { "value": "#B7C2D1", "type": "color" },
      "600": { "value": "#6B7280", "type": "color" }
    },
    "semantic": {
      "text-primary": { "value": "{color.brand.navy}", "type": "color" },
      "text-secondary": { "value": "{color.neutral.600}", "type": "color" },
      "canvas": { "value": "{color.neutral.ivory}", "type": "color" },
      "primary-action": { "value": "{color.brand.royal}", "type": "color" }
    }
  },
  "spacing": {
    "1": { "value": "8px", "type": "dimension" },
    "2": { "value": "16px", "type": "dimension" },
    "3": { "value": "24px", "type": "dimension" },
    "4": { "value": "32px", "type": "dimension" },
    "6": { "value": "48px", "type": "dimension" },
    "8": { "value": "64px", "type": "dimension" }
  },
  "radius": {
    "sm": { "value": "8px", "type": "dimension" },
    "md": { "value": "12px", "type": "dimension" },
    "lg": { "value": "16px", "type": "dimension" },
    "xl": { "value": "24px", "type": "dimension" }
  }
}
```

## Token Naming Rules

Use:

`category.role.state`

Examples:

- `color.button.primary.hover`
- `color.text.secondary`
- `space.card.padding`
- `radius.control`
- `shadow.overlay`
- `motion.menu.enter`

Avoid names based on appearance alone:

- `dark-blue-button`
- `big-padding`
- `gold-border-card`

Semantic naming allows the implementation to evolve without renaming every component.

---

# Engineering Guidance

## Component Architecture

Each production component should define:

- anatomy;
- variants;
- sizes;
- interaction states;
- accessibility behavior;
- responsive behavior;
- RTL behavior;
- content constraints;
- test coverage.

## Recommended Component API Principles

- Prefer explicit variants: `variant="primary"`.
- Prefer semantic size names: `size="medium"`.
- Do not expose raw color props for standard components.
- Use slots only when composition requires them.
- Prevent invalid combinations where possible.
- Keep design tokens outside component code.

Example conceptual API:

```tsx
<Button
  variant="primary"
  size="medium"
  leadingIcon={<TransferIcon />}
  loading={isSubmitting}
>
  New transfer
</Button>
```

## State Ownership

- Components own visual state.
- Product flows own business state.
- Validation messages come from the form layer.
- Loading and disabled states must not be conflated.
- A disabled control is not a substitute for permission handling.

## Theming

The reference is primarily a balanced light theme with dark branded surfaces.

When implementing dark mode:

- do not simply invert colors;
- preserve Deep Navy hierarchy;
- use lighter blue-gray text;
- reduce gold brightness if needed;
- verify all contrast again;
- avoid pure black backgrounds;
- keep data visualization distinguishable.

Dark mode should be specified and reviewed as a separate theme before release.

## Figma Library Structure

Recommended pages:

1. `00 Cover`
2. `01 Foundations`
3. `02 Tokens`
4. `03 Components`
5. `04 Patterns`
6. `05 Templates`
7. `06 Accessibility`
8. `07 Archive`

Recommended component naming:

```text
Button / Primary / Medium / Default
Button / Primary / Medium / Hover
Input / Text / Default
Input / Text / Error
Navigation / Sidebar / Expanded
Card / Metric / Standard
```

Use component properties for:

- size;
- state;
- icon presence;
- label;
- selected state;
- badge;
- direction.

## Handoff Requirements

Every approved component should include:

- dimensions;
- spacing;
- tokens;
- states;
- behavior;
- accessibility notes;
- responsive notes;
- RTL notes;
- example usage;
- anti-patterns.

## Testing Expectations

### Visual Regression

Test:

- all variants;
- all states;
- long labels;
- narrow containers;
- RTL;
- high zoom;
- dark branded surfaces;
- disabled and loading states.

### Interaction Tests

Test:

- keyboard behavior;
- focus restoration after overlays;
- menu dismissal;
- duplicate-submit prevention;
- screen-reader names;
- reduced motion.
