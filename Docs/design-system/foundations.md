# Foundations

[← Back to Main Index](../YAQEEN_DESIGN_SYSTEM.md)

---

# Color System

## Core Palette

The following colors are **board-defined**.

| Token           | Name           |       Hex | Primary Use                                           |
| --------------- | -------------- | --------: | ----------------------------------------------------- |
| `brand.royal`   | Royal Blue     | `#0F2D5C` | Primary actions, active navigation, branded panels    |
| `brand.navy`    | Deep Navy      | `#11213D` | High-contrast surfaces, text, sidebars, premium cards |
| `brand.gold`    | Champagne Gold | `#C8A96A` | Premium accents, logo, selected highlights            |
| `neutral.ivory` | Ivory          | `#F7F5F0` | Main background and warm light surfaces               |
| `neutral.100`   | Light Gray     | `#E6E7EB` | Dividers, disabled surfaces, subtle fills             |
| `neutral.300`   | Cool Blue Gray | `#B7C2D1` | Borders, inactive icons, secondary surfaces           |
| `neutral.600`   | Slate Gray     | `#6B7280` | Secondary text, metadata, inactive labels             |

## Semantic Color Roles

Use semantic names in implementation. Components should not reference raw palette values directly unless the color is intentionally decorative.

| Semantic Token                  |     Value | Usage                                |
| ------------------------------- | --------: | ------------------------------------ |
| `color.background.canvas`       | `#F7F5F0` | Main application background          |
| `color.background.surface`      | `#FFFFFF` | Cards, menus, fields                 |
| `color.background.brand`        | `#0F2D5C` | Primary branded surfaces             |
| `color.background.brand-strong` | `#11213D` | Sidebar, elevated premium panels     |
| `color.text.primary`            | `#11213D` | Primary text                         |
| `color.text.secondary`          | `#6B7280` | Supporting text                      |
| `color.text.inverse`            | `#FFFFFF` | Text on blue surfaces                |
| `color.text.brand`              | `#0F2D5C` | Links and active labels              |
| `color.text.premium`            | `#C8A96A` | Decorative headings on dark surfaces |
| `color.border.default`          | `#B7C2D1` | Inputs and standard borders          |
| `color.border.subtle`           | `#E6E7EB` | Cards and dividers                   |
| `color.border.brand`            | `#0F2D5C` | Focused controls                     |
| `color.icon.default`            | `#0F2D5C` | Standard icons                       |
| `color.icon.muted`              | `#6B7280` | Inactive icons                       |
| `color.icon.inverse`            | `#FFFFFF` | Icons on dark surfaces               |
| `color.accent.premium`          | `#C8A96A` | Premium status and decorative detail |

## Interaction Extensions

These are **standardized extensions** derived from the core palette.

| Token                 |                      Hex | Use                          |
| --------------------- | -----------------------: | ---------------------------- |
| `brand.royal-hover`   |                `#173E77` | Hovered primary action       |
| `brand.royal-pressed` |                `#0B2348` | Pressed primary action       |
| `brand.navy-hover`    |                `#1A3157` | Hovered dark navigation item |
| `brand.gold-soft`     |                `#F2E9D8` | Gold-tinted background       |
| `focus.ring`          |                `#8FA9CF` | Accessible focus halo        |
| `overlay.scrim`       | `rgba(17, 33, 61, 0.56)` | Modal backdrop               |

## Functional State Extensions

Functional colors are necessary for complete product behavior but are not explicitly named in the board.

| Token         |       Hex | Background | Use                                  |
| ------------- | --------: | ---------: | ------------------------------------ |
| `success.600` | `#167A4A` |  `#E8F5EE` | Completed, positive balance, success |
| `warning.700` | `#8A5A00` |  `#FFF4D8` | Pending, caution, needs review       |
| `danger.600`  | `#B42318` |  `#FDECEA` | Error, destructive, failed           |
| `info.600`    | `#245EA8` |  `#EAF2FC` | Informational status                 |

Functional color must never be the only indicator. Pair it with text, an icon, shape, or sign.

## Contrast Guidance

Approximate WCAG contrast ratios for key palette combinations:

| Foreground     | Background |   Ratio | Guidance                               |
| -------------- | ---------- | ------: | -------------------------------------- |
| Royal Blue     | Ivory      | 12.43:1 | AAA for normal text                    |
| Deep Navy      | Ivory      | 14.73:1 | AAA for normal text                    |
| Royal Blue     | White      | 13.55:1 | AAA for normal text                    |
| Deep Navy      | White      | 16.05:1 | AAA for normal text                    |
| Champagne Gold | Deep Navy  |  7.14:1 | AAA for normal text                    |
| Champagne Gold | Royal Blue |  6.02:1 | AA for normal text                     |
| Champagne Gold | Ivory      |  2.06:1 | Decorative only; not body text         |
| Slate Gray     | Ivory      |  4.44:1 | Large text only; darken for small text |
| Slate Gray     | White      |  4.83:1 | AA for normal text                     |
| Cool Blue Gray | Deep Navy  |  8.90:1 | AAA for normal text                    |

### Critical Rule

Do not use Champagne Gold as small text on Ivory or white. Use Deep Navy text and reserve gold for:

- icons;
- borders;
- large decorative headings;
- logo artwork;
- premium labels on dark surfaces.

## Color Usage Rules

### Royal Blue

Use for:

- primary buttons;
- active tabs;
- links;
- selected navigation;
- key application headers;
- charts’ primary series.

Avoid using Royal Blue for every card or every heading.

### Deep Navy

Use for:

- primary text;
- desktop sidebar;
- premium cards;
- high-contrast footer or header;
- modal titles.

Avoid large uninterrupted navy backgrounds on task-heavy screens.

### Champagne Gold

Use sparingly for:

- logo;
- premium state;
- small emphasis;
- decorative rules;
- selected ornamental details;
- secondary data-series accents.

Gold is never the default action color.

### Ivory

Use as the preferred page canvas when a warmer, more premium background is appropriate.

### Grays

Use blue-gray neutrals to maintain harmony with the primary brand colors.

## Data-Visualization Palette

Recommended categorical order:

1. Royal Blue — `#0F2D5C`
2. Champagne Gold — `#C8A96A`
3. Cool Blue Gray — `#B7C2D1`
4. Slate Gray — `#6B7280`
5. Light Gray — `#E6E7EB`
6. Deep Navy — `#11213D`

For charts:

- use direct labels when possible;
- do not depend on gold versus gray alone;
- keep gridlines subtle;
- avoid 3D effects;
- show values in text or accessible summaries;
- use patterns or markers when color distinction is insufficient.

---

# Typography

## Type Families

The board defines:

- **Source Serif 4** for headings;
- **Inter** for user-interface text.

### Latin Heading Family

```css
font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
```

Use for:

- page titles;
- editorial headings;
- premium promotional titles;
- branded welcome moments.

Do not use for:

- dense tables;
- small labels;
- buttons;
- form controls;
- long technical instructions.

### Latin UI Family

```css
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

Use for:

- body text;
- labels;
- buttons;
- navigation;
- data;
- captions;
- tables;
- form controls.

## Recommended Arabic Companions

Arabic typography is not fully specified in the visual board. The following pairing is a recommended production foundation:

- **Noto Naskh Arabic** for expressive or editorial Arabic headings;
- **Noto Sans Arabic** for UI, labels, forms, tables, and dense text.

Arabic fonts must be reviewed with native readers before release. Never stretch Arabic type or artificially increase letter spacing.

## Type Scale

### Desktop Scale

| Token         | Font           | Weight |  Size | Line Height | Letter Spacing | Use                 |
| ------------- | -------------- | -----: | ----: | ----------: | -------------: | ------------------- |
| `display-lg`  | Source Serif 4 |    600 | 64 px |       72 px |      `-0.02em` | Brand hero          |
| `display-md`  | Source Serif 4 |    600 | 56 px |       64 px |      `-0.02em` | Major landing title |
| `heading-1`   | Source Serif 4 |    600 | 48 px |       56 px |     `-0.015em` | Page title          |
| `heading-2`   | Source Serif 4 |    600 | 36 px |       44 px |      `-0.01em` | Major section       |
| `heading-3`   | Source Serif 4 |    600 | 28 px |       36 px |     `-0.005em` | Card group title    |
| `heading-4`   | Source Serif 4 |    600 | 22 px |       30 px |            `0` | Card or panel title |
| `subtitle-lg` | Inter          |    600 | 18 px |       26 px |      `-0.01em` | Section subtitle    |
| `subtitle-sm` | Inter          |    600 | 16 px |       24 px |     `-0.005em` | Component title     |
| `body-lg`     | Inter          |    400 | 18 px |       28 px |            `0` | Introductory body   |
| `body-md`     | Inter          |    400 | 16 px |       24 px |            `0` | Default body        |
| `body-sm`     | Inter          |    400 | 14 px |       22 px |            `0` | Secondary body      |
| `label-lg`    | Inter          |    600 | 14 px |       20 px |            `0` | Buttons, fields     |
| `label-sm`    | Inter          |    600 | 12 px |       18 px |       `0.01em` | Metadata labels     |
| `caption`     | Inter          |    500 | 12 px |       18 px |            `0` | Supporting context  |
| `overline`    | Inter          |    600 | 11 px |       16 px |       `0.08em` | Small section label |

### Mobile Adjustments

| Desktop Token   | Mobile Size / Line Height                       |
| --------------- | ----------------------------------------------- |
| `display-lg`    | 44 / 52 px                                      |
| `display-md`    | 40 / 48 px                                      |
| `heading-1`     | 34 / 42 px                                      |
| `heading-2`     | 28 / 36 px                                      |
| `heading-3`     | 24 / 32 px                                      |
| `heading-4`     | 20 / 28 px                                      |
| Body and labels | unchanged unless space is extremely constrained |

## Weight Usage

Use a restrained set:

- 400 — body and supporting text;
- 500 — captions, metadata, low-emphasis labels;
- 600 — headings, buttons, active navigation;
- 700 — limited to high-priority values or compact data emphasis.

Avoid using bold weight for entire paragraphs.

## Numbers and Financial Data

Use tabular numerals for aligned balances, tables, and transaction amounts.

```css
font-variant-numeric: tabular-nums lining-nums;
```

Recommended formatting:

- `SAR 247,850.75`
- `+ SAR 12,500.00`
- `− SAR 5,000.00`

Keep the currency code visible when users may work across currencies.

## Text Alignment and Line Length

- Default body text: left-aligned in LTR, right-aligned in RTL.
- Ideal body line length: 50–75 characters.
- Avoid centered paragraphs longer than two lines.
- Use centered text only in branded, empty, success, or onboarding moments.
- Do not justify UI text.

---

# Layout, Grid, and Spacing

## Base Spacing System

The board defines an **8-point base scale**:

`8, 16, 24, 32, 40, 48, 64`

Production implementation may use 4 px and 12 px as controlled half-step values.

| Token       | Value | Typical Use                                   |
| ----------- | ----: | --------------------------------------------- |
| `space-0`   |  0 px | Reset                                         |
| `space-0-5` |  4 px | Icon optical correction, compact internal gap |
| `space-1`   |  8 px | Icon-label gap, small stack                   |
| `space-1-5` | 12 px | Compact field or chip padding                 |
| `space-2`   | 16 px | Mobile page padding, standard card gap        |
| `space-3`   | 24 px | Card padding, desktop grid gutter             |
| `space-4`   | 32 px | Section separation                            |
| `space-5`   | 40 px | Large component separation                    |
| `space-6`   | 48 px | Page section spacing                          |
| `space-8`   | 64 px | Major section spacing                         |
| `space-10`  | 80 px | Marketing layout only                         |
| `space-12`  | 96 px | Large hero spacing only                       |

## Spacing Rules

- Prefer scale values; avoid arbitrary numbers.
- Internal component spacing should be smaller than external component spacing.
- Related controls should be closer to each other than to unrelated controls.
- Use 24 px as the standard desktop card padding.
- Use 16 px as the standard mobile card padding.
- Use 8 px between icon and label.
- Use 16 px between label and supporting description.
- Use 24–32 px between component groups.

## Desktop Application Grid

**Standardized**

- Maximum content width: 1440 px
- Main content grid: 12 columns
- Column gutter: 24 px
- Outer page margin:
  - 24 px at 1024–1279 px
  - 32 px at 1280–1439 px
  - 48 px at 1440 px and above
- Sidebar width: 240 px expanded
- Sidebar width: 72 px collapsed
- Top navigation height: 64 px
- Page header vertical padding: 24–32 px

## Mobile Grid

- 4 columns
- 16 px outer margin
- 16 px gutter
- 8 px minimum gap between compact items
- Bottom-navigation safe area must include device inset
- Full-width cards may extend to the 16 px page margins, not to screen edges

## Content Density

### Comfortable Density

Default for:

- customer applications;
- account dashboards;
- onboarding;
- financial summaries;
- settings.

Typical row height: 56–64 px.

### Compact Density

Use only for:

- internal operational tables;
- large data lists;
- desktop-only management tools.

Typical row height: 40–48 px.

Do not mix densities within one section.

---

# Shape, Borders, and Elevation

## Corner Radius

The board defines:

`4 px, 8 px, 12 px, 16 px, 24 px`

| Token         |   Value | Use                            |
| ------------- | ------: | ------------------------------ |
| `radius-xs`   |    4 px | Checkbox, small badge          |
| `radius-sm`   |    8 px | Buttons, inputs, tabs          |
| `radius-md`   |   12 px | Standard cards, menus          |
| `radius-lg`   |   16 px | Dashboard panels, mobile cards |
| `radius-xl`   |   24 px | Hero cards, premium panels     |
| `radius-full` | 9999 px | Pills, avatars, toggles        |

### Radius Rules

- Nested elements must use equal or smaller radii than their parent.
- Avoid mixing more than two radius sizes in one component.
- Do not use fully rounded pill buttons as the default primary action.
- Large containers should not use radius below 12 px.

## Borders

| Token            | Value               | Use                       |
| ---------------- | ------------------- | ------------------------- |
| `border-subtle`  | `1px solid #E6E7EB` | Cards, dividers           |
| `border-default` | `1px solid #B7C2D1` | Inputs, inactive controls |
| `border-strong`  | `1px solid #6B7280` | Hovered neutral controls  |
| `border-focus`   | `2px solid #0F2D5C` | Focused fields            |
| `border-premium` | `1px solid #C8A96A` | Premium secondary action  |

Avoid heavy borders around every section. Prefer surface separation and spacing.

## Elevation

The board defines four levels: None, Soft, Medium, Elevated.

| Token         | CSS Shadow                                                      | Use                     |
| ------------- | --------------------------------------------------------------- | ----------------------- |
| `elevation-0` | `none`                                                          | Flat surfaces           |
| `elevation-1` | `0 1px 2px rgba(17,33,61,.06), 0 2px 8px rgba(17,33,61,.04)`    | Standard card           |
| `elevation-2` | `0 4px 12px rgba(17,33,61,.10), 0 1px 3px rgba(17,33,61,.08)`   | Menu, sticky panel      |
| `elevation-3` | `0 12px 32px rgba(17,33,61,.16), 0 4px 10px rgba(17,33,61,.08)` | Modal, elevated overlay |

### Elevation Rules

- Use shadow to communicate hierarchy, not decoration.
- Do not combine strong shadow with a strong border.
- Menus and popovers should be more elevated than the control that opened them.
- Dark cards generally need less visible shadow than light cards.

---

# Iconography and Decorative Language

## Icon Style

The board defines:

- clean, minimal outline icons;
- 2 px stroke;
- rounded line ends.

### Standard Icon Sizes

|     Size | Use                                 |
| -------: | ----------------------------------- |
|    16 px | Dense metadata, table action        |
|    20 px | Inputs, buttons, navigation         |
|    24 px | Default standalone icon             |
|    32 px | Feature card                        |
| 40–48 px | Empty state or premium illustration |

### Rules

- Use one icon family per product.
- Maintain consistent stroke width.
- Do not mix filled and outline icons in the same navigation set.
- Active icons may use a filled container while the icon remains outline.
- Do not use icons without labels when meaning is ambiguous.
- Mirror directional icons in RTL.
- Do not mirror universal symbols such as play, check, or information.

## Arabesque and Ornamental Patterns

Patterns support atmosphere and heritage.

### Approved Use

- low-contrast hero backgrounds;
- premium promotional card corners;
- footer fields;
- subtle header texture;
- print or presentation divider details.

### Opacity Guidance

- Light surface: 2–5%
- Blue surface: 6–12%
- Gold line motif: 15–30%, depending on size

### Restrictions

Patterns must not:

- reduce text readability;
- sit directly behind dense data;
- be used in every card;
- imitate religious text;
- compete with the logo;
- become a repeating wallpaper across the full application.

## Decorative Gold Rules

Thin gold rules and small geometric motifs may mark section boundaries in editorial or brand presentations. In product UI, prefer standard gray dividers unless the boundary communicates a premium or branded context.
