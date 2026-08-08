# Product Patterns & Motion

[← Back to Main Index](../YAQEEN_DESIGN_SYSTEM.md)

---

# Product Patterns

## Dashboard Shell

The reference interface establishes a desktop shell with:

- left sidebar;
- main light content surface;
- welcoming page header;
- top-level action;
- summary cards;
- transaction list;
- spending visualization;
- premium promotional card.

### Recommended Hierarchy

1. Page title and concise context
2. Primary action
3. Key metrics
4. Main task or recent activity
5. Secondary analytics
6. Promotion or discovery

Promotional content must not displace critical account information.

## Welcome Header

Example:

> Welcome back, Ahmed  
> Here’s what’s happening with your accounts today.

Rules:

- Personalize only when identity is reliable.
- Keep the supporting line under 90 characters.
- Do not repeat the user’s name elsewhere unnecessarily.
- Place the primary page action on the opposite side at desktop widths.
- Stack title and action on mobile.

## Summary Metric Card

The board shows:

- Total Balance;
- Active Accounts;
- Pending Transfers.

### Anatomy

1. Metric label
2. Optional icon
3. Primary value
4. Trend or supporting action
5. Optional comparison period

### Rules

- The value is the strongest text.
- Use tabular numerals.
- Pair trends with direction and time period.
- Positive or negative color must match the metric’s meaning.
- Do not assume that an increase is always positive.

## Transaction List

The desktop and mobile examples show:

- icon;
- transaction title;
- account or category;
- signed amount;
- date.

### Row Specification

- Height: 64–72 px comfortable
- Icon container: 32–40 px
- Primary label: 14–16 px, semibold
- Secondary label: 12–14 px
- Amount: 14–16 px, semibold, tabular
- Date: 12 px
- Divider: Light Gray

### Amount Rules

- Incoming: prefix `+`
- Outgoing: prefix `−`
- Always include currency when ambiguity is possible
- Use color plus sign, not color alone
- Align amounts to the text end
- In RTL, preserve natural numeric formatting and currency locale rules

## Spending Overview

The board uses a donut chart with a center total and a legend.

### Rules

- Center value must have a text label.
- Legend order must match chart order.
- Show percentages or values.
- Provide a text/table alternative.
- Minimum ring thickness: 12 px for small charts.
- Avoid more than 5–6 categories.
- Combine minor categories into “Others” when needed.
- Do not use gold for more than one series.

## Premium Promotional Card

The example uses:

- Deep Navy background;
- white text;
- Champagne Gold action;
- geometric gold decoration.

### Rules

- Use one concise benefit statement.
- Keep decoration to the perimeter.
- Provide a clear close action only when the card is dismissible.
- Never disguise an advertisement as account data.
- Do not use urgent visual treatment for premium upsell.

## Mobile Home Screen

The board establishes:

- branded blue top area;
- welcome message;
- balance card;
- quick actions;
- recent transactions;
- bottom navigation.

### Mobile Rules

- Keep the balance card visually connected to the header.
- Limit quick actions to four visible items.
- Use icon plus label.
- Keep recent activity readable without requiring horizontal scrolling.
- Do not place destructive actions in quick actions.
- Keep bottom navigation to 3–5 primary destinations.

## Bottom Navigation

- Height: 64 px plus safe-area inset
- Icon: 22–24 px
- Label: 11–12 px
- Active: Royal Blue
- Inactive: Slate Gray
- Surface: white
- Bottom border or subtle elevation: 1

Use labels for all destinations. Do not rely on icons alone.

## Empty States

An empty state should include:

1. simple icon or illustration;
2. specific title;
3. explanation;
4. primary action, if recovery is possible;
5. optional secondary link.

Example:

**No transfers yet**  
Your completed and pending transfers will appear here.  
`Make a transfer`

Avoid using a full logo as the empty-state illustration.

## Loading States

Use:

- skeletons for structured content;
- inline spinners for actions;
- progress indicators for measurable multi-step processes.

Avoid showing a blocking full-page spinner for local content updates.

## Error States

An error state must answer:

1. What happened?
2. What was affected?
3. Was anything changed or charged?
4. What can the user do next?
5. How can they get help?

Example:

**We could not complete the transfer**  
No funds were deducted. Check the recipient details and try again.

## Confirmation Patterns

Use confirmation dialogs only for:

- destructive actions;
- irreversible submissions;
- high-risk financial actions;
- actions with significant external effect.

The dialog title should name the action:

- “Delete beneficiary?”
- “Cancel transfer?”
- “Sign out of all devices?”

Avoid vague titles such as “Are you sure?”

---

# Responsive Behavior

## Breakpoints

| Token | Range             | Typical Behavior                    |
| ----- | ----------------- | ----------------------------------- |
| `xs`  | 0–479 px          | Single-column mobile                |
| `sm`  | 480–767 px        | Wide mobile / small tablet          |
| `md`  | 768–1023 px       | Tablet; condensed navigation        |
| `lg`  | 1024–1439 px      | Desktop application                 |
| `xl`  | 1440 px and above | Wide desktop with max-width content |

Use content-driven breakpoints when a component requires earlier adaptation.

## Navigation Transformation

### Large Desktop

- expanded sidebar or horizontal nav;
- labels visible;
- page action aligned with page title.

### Tablet

- collapsed sidebar or navigation drawer;
- fewer header actions;
- cards reorganize to 2 columns.

### Mobile

- top app bar;
- bottom navigation for primary destinations;
- drawer or account menu for secondary destinations;
- cards stack vertically.

## Grid Behavior

- Three metric cards → two columns at tablet → one column at narrow mobile.
- Transaction list remains full width.
- Analytics card moves below activity on tablet.
- Promotional card moves after primary content.
- Desktop table may become cards or horizontal scroll only when no better responsive representation exists.

## Text Scaling

The layout must tolerate at least 200% text zoom without loss of content or functionality.

Avoid:

- fixed-height text containers;
- clipping long names;
- hiding important labels;
- icon-only replacements caused by zoom.

---

# Motion

## Motion Principles

Motion should feel:

- calm;
- controlled;
- precise;
- functional;
- subtle.

Motion should explain change, not decorate routine interactions.

## Duration Tokens

| Token             |   Duration | Use                                 |
| ----------------- | ---------: | ----------------------------------- |
| `motion-instant`  |      80 ms | Press feedback                      |
| `motion-fast`     |     120 ms | Hover, icon change                  |
| `motion-standard` |     180 ms | Dropdown, tooltip, small transition |
| `motion-emphasis` |     240 ms | Drawer, card expansion              |
| `motion-slow`     |     320 ms | Page-level branded transition       |
| `motion-brand`    | 480–700 ms | Splash or logo reveal only          |

## Easing

| Token           | Value                            | Use              |
| --------------- | -------------------------------- | ---------------- |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)`     | General UI       |
| `ease-enter`    | `cubic-bezier(0, 0, 0.2, 1)`     | Element entering |
| `ease-exit`     | `cubic-bezier(0.4, 0, 1, 1)`     | Element exiting  |
| `ease-emphasis` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Brand reveal     |

## Component Motion

### Buttons

- subtle background transition;
- no large scale bounce;
- pressed state may translate 1 px or reduce scale to 0.99.

### Menus

- fade plus 4–8 px movement;
- origin should match the trigger;
- duration approximately 180 ms.

### Cards

- avoid hover lift on touch-first products;
- desktop hover may increase elevation by one level;
- no exaggerated tilt or 3D effect.

### Logo Reveal

For splash or launch experiences:

1. calligraphic stroke or soft mask reveal;
2. wordmark fade;
3. subtle gold highlight;
4. transition into product surface.

The reveal must remain concise and skippable through reduced-motion preferences.

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```
