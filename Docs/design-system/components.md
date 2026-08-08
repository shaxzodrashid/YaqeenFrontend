# Core Components

[← Back to Main Index](../YAQEEN_DESIGN_SYSTEM.md)

---

# Buttons

## Variants

### Primary Button

Board-defined appearance:

- Royal Blue fill;
- white label;
- optional trailing arrow;
- 8 px radius.

Use for the single highest-priority action in a section.

### Secondary Button

Board-defined appearance:

- light surface;
- Champagne Gold border;
- Deep Navy label;
- optional trailing arrow.

Use for a meaningful alternative to the primary action.

### Tertiary Button

Board-defined appearance:

- no container;
- Royal Blue label;
- optional arrow or icon.

Use for low-emphasis actions, links, and inline navigation.

### Destructive Button

Extension:

- Danger fill or danger text;
- must never use gold;
- requires confirmation for irreversible actions.

## Sizes

| Size   | Height | Horizontal Padding | Label      |  Icon |
| ------ | -----: | -----------------: | ---------- | ----: |
| Small  |  36 px |              16 px | 13/18, 600 | 16 px |
| Medium |  44 px |              20 px | 14/20, 600 | 20 px |
| Large  |  52 px |              24 px | 16/24, 600 | 20 px |

Minimum touch target: 44 × 44 px.

## States

Every interactive button must support:

- default;
- hover;
- pressed;
- keyboard focus;
- loading;
- disabled.

### Loading

- preserve the original button width;
- replace or precede the label with a spinner;
- keep the label visible when space allows;
- set `aria-busy="true"`;
- prevent duplicate submission.

### Disabled

- must remain legible;
- must not receive keyboard focus;
- must not be the only explanation of why an action is unavailable;
- show guidance near the relevant form when necessary.

## Content Rules

Button labels should begin with a verb:

- “New transfer”
- “Save changes”
- “View accounts”
- “Try again”

Avoid:

- “Submit” when a more specific verb exists;
- punctuation;
- full sentences;
- unexplained abbreviations.

---

# Text Input

## Anatomy

1. Label
2. Required or optional indicator
3. Input container
4. Leading or trailing icon, when useful
5. Helper text
6. Error or success message

## Standard Dimensions

- Height: 44 px
- Radius: 8 px
- Horizontal padding: 12–16 px
- Label gap: 8 px
- Helper-text gap: 6–8 px

## States

### Default

- white surface;
- 1 px Cool Blue Gray border;
- Deep Navy input text;
- Slate Gray placeholder.

### Hover

- Slate Gray border;
- no layout shift.

### Focus

- 2 px Royal Blue border;
- outer focus ring;
- label remains visible.

### Disabled

- Light Gray background;
- muted text;
- disabled cursor;
- no interaction.

### Error

- danger border;
- danger icon where useful;
- specific error message below.

### Success

Use only when confirmation adds value, such as identity, account, or verification fields.

## Placeholder Rule

A placeholder is an example or hint, not a replacement for the label.

---

# Select and Dropdown

The board shows a closed select and an open option menu.

## Closed Select

Follow input dimensions and states.

## Menu

- Radius: 12 px
- Elevation: 2
- Vertical padding: 8 px
- Option minimum height: 40 px
- Selected option: Royal Blue or soft-blue highlight
- Hovered option: subtle neutral fill
- Maximum visible options before scroll: approximately 7

## Behavior

- support arrow keys;
- `Enter` selects;
- `Escape` closes;
- typeahead should be available for long lists;
- selected value must remain visible;
- use a searchable combobox for lists over approximately 12–15 items.

---

# Checkbox

Board-defined states:

- checked;
- unchecked.

## Specification

- Visual box: 18 × 18 px
- Minimum target: 44 × 44 px
- Radius: 4 px
- Checked fill: Royal Blue
- Check mark: white
- Label gap: 8 px

Use checkboxes for independent multiple selections.

---

# Toggle Switch

Board-defined states:

- On;
- Off.

## Specification

- Track: 40 × 24 px
- Thumb: 18 px
- Active track: Royal Blue
- Inactive track: Cool Blue Gray
- Minimum target: 44 × 44 px

Use toggles only for settings that apply immediately. For changes that require saving, prefer a checkbox or selection control followed by a Save action.

---

# Tabs

The board shows an underline-style tab set.

## Anatomy

- tab label;
- optional count or badge;
- active underline;
- tab panel.

## Specification

- Minimum tab height: 40 px
- Horizontal padding: 12–16 px
- Gap between tabs: 8–16 px
- Active text: Royal Blue
- Active underline: 2 px Royal Blue
- Inactive text: Deep Navy or Slate Gray

## Behavior

- use for peer-level content;
- retain active state when users return, when appropriate;
- allow horizontal scrolling on small screens;
- do not wrap tab labels to two lines;
- use a select control when more than 5–6 tabs cannot fit.

---

# Chips and Badges

Board-defined examples:

- Active;
- Premium;
- New;
- Info.

## Chip

Interactive or removable.

- Height: 28–32 px
- Radius: full
- Horizontal padding: 10–12 px
- Optional leading icon
- Optional trailing remove icon
- Minimum remove target must remain accessible

## Badge

Non-interactive status or count.

- Height: 20–24 px
- Radius: full
- Compact label
- Never use as a standalone control

## Recommended Mappings

| Label Type | Treatment                                |
| ---------- | ---------------------------------------- |
| Active     | Royal Blue fill, white text              |
| Premium    | Champagne Gold fill, Deep Navy text      |
| New        | Light Gray fill, Deep Navy text          |
| Info       | White or neutral fill, subtle border     |
| Count      | Gold or danger fill depending on meaning |

---

# Cards

The board shows a Premium Account card and several dashboard cards.

## Standard Card

- Surface: white
- Radius: 12 or 16 px
- Border: Light Gray
- Elevation: 0 or 1
- Padding: 24 px desktop, 16 px mobile

## Card Hierarchy

1. Optional icon or visual
2. Title
3. Supporting text or value
4. Metadata
5. Action

## Card Rules

- The entire card may be clickable only when it has one destination.
- Do not place multiple unrelated primary actions in one card.
- Use dividers sparingly.
- Keep card heights consistent in a horizontal group where practical.
- On mobile, cards should stack in reading order.

---

# Navigation Bar

The board shows a deep-blue desktop navigation bar with:

- horizontal logo lockup;
- primary navigation items;
- search;
- notification;
- user avatar and menu.

## Specification

- Height: 64 px
- Background: Deep Navy or Royal Blue
- Logo area: 160–200 px
- Horizontal padding: 24 px
- Item gap: 24–32 px
- Active item: white or gold emphasis, with optional subtle background
- Icon size: 20–24 px
- Avatar: 32–36 px

## Behavior

- keep primary destinations visible;
- move lower-priority destinations into an overflow menu;
- use a clear focus state on dark surfaces;
- show notification count as a badge, not color alone.

---

# Sidebar Navigation

The dashboard example uses a dark vertical sidebar.

## Specification

- Expanded width: 240 px
- Collapsed width: 72 px
- Background: Deep Navy
- Item height: 44–48 px
- Item radius: 8 px
- Horizontal padding: 12–16 px
- Active state: lighter blue field with white text
- Icon: 20 px
- Group gap: 8 px
- Logo area: 80–96 px high

Place logout or account-exit actions at the bottom, separated from primary navigation.

---

# Notification Badge

- Minimum diameter: 18 px
- Text: 11–12 px, semibold
- Position: top-end of the icon
- Count over 99: display `99+`
- Do not announce repeated decorative badge updates to screen readers unless relevant.

---

# Avatar and Account Menu

- Default avatar: 32 or 40 px
- Fallback: initials on Royal Blue or neutral background
- Menu should include account identity and critical account actions
- Do not use avatar image alone as the only cue that a menu exists
- Provide a caret or accessible label
