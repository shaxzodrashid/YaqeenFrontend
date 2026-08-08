# Inclusive Design (Accessibility & RTL)

[← Back to Main Index](../YAQEEN_DESIGN_SYSTEM.md)

---

# Accessibility

## Target

Yaqeen products should meet **WCAG 2.2 AA** as a minimum.

## Keyboard Interaction

All interactive elements must be reachable and usable by keyboard.

Required:

- logical tab order;
- visible focus;
- no keyboard trap;
- `Enter` and `Space` behavior appropriate to control type;
- `Escape` closes dismissible overlays;
- arrow-key navigation for menus, selects, tabs, and radio groups where expected.

## Focus Style

Recommended focus style:

```css
outline: 3px solid #8FA9CF;
outline-offset: 2px;
```

For focused inputs, combine the ring with a Royal Blue border. Do not remove focus outlines without replacing them.

## Touch Targets

- Minimum: 44 × 44 px
- Preferred for primary mobile actions: 48 × 48 px or larger
- Small visual icons may sit inside a larger invisible target

## Color and State

Never communicate state by color alone.

Use combinations such as:

- icon + text + color;
- sign + amount + color;
- shape + label;
- pattern + legend.

## Screen-Reader Labels

Provide accessible names for:

- icon buttons;
- avatars that open menus;
- notification icons;
- charts;
- toggles;
- fields without visible native labels;
- dismiss controls;
- amount visibility controls.

Examples:

- `aria-label="Open notifications"`
- `aria-label="Hide account balance"`
- `aria-label="Remove Active filter"`

## Forms

- Every field must have a programmatic label.
- Required fields should be announced.
- Errors should be associated with the field.
- Focus should move to the first invalid field after submission.
- Error summaries are recommended for long forms.
- Do not disable paste in password or verification fields without a documented security requirement.

## Motion and Flashing

- No content should flash more than three times per second.
- Respect `prefers-reduced-motion`.
- Avoid parallax or ornamental motion behind text.
- Motion must not delay task completion.

## Charts and Financial Information

- Provide text summaries.
- Ensure amounts are readable by screen readers in the correct order.
- Do not announce decorative currency icons.
- Use table alternatives for complex charts.
- Make hidden balance controls explicit.

---

# Arabic, RTL, and Localization

## Layout Mirroring

In right-to-left interfaces:

- sidebar moves to the right;
- back and forward arrows mirror;
- chevrons indicating direction mirror;
- icon-label order mirrors where appropriate;
- text aligns to the right;
- page actions shift according to reading direction;
- transaction amounts align to the logical end.

Do not mirror:

- logo artwork;
- media controls with universal direction;
- check marks;
- clock faces;
- brand-specific symbols.

## Bidirectional Content

Financial interfaces frequently mix Arabic, Latin currency codes, and numbers.

Requirements:

- use Unicode-aware bidi handling;
- test currency codes before and after values;
- isolate user-generated text;
- avoid manually inserting directional characters without engineering review;
- test phone numbers, IBANs, account IDs, and dates.

## Arabic Typography

- Do not apply Latin letter spacing to Arabic.
- Use appropriate Arabic line height, typically 1.5–1.7× font size.
- Check diacritics for clipping.
- Avoid all-caps styling analogues.
- Use culturally correct punctuation.
- Verify truncation at word boundaries.

## Translation Expansion

Allow for:

- 30–40% text expansion from English into some languages;
- taller Arabic labels;
- longer German or Russian labels;
- flexible buttons;
- multi-line helper text;
- locale-specific date and number formats.

## Numbers and Currencies

Use locale-aware formatting libraries.

Examples may include:

- English: `SAR 247,850.75`
- Arabic locale: locale-appropriate digits and separators based on product requirements

Do not hard-code commas, decimal separators, currency position, or date order.
