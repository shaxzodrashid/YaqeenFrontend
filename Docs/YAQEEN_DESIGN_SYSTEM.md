---
title: 'Yaqeen Design System'
version: '1.0.0'
status: 'Production foundation'
last_updated: '2026-07-18'
source: 'Yaqeen UI design-system reference board supplied by the project owner'
---

# Yaqeen Design System

> **Calm. Trustworthy. Refined.**  
> A visual language of clarity and confidence—rooted in heritage, designed for today.

This document converts the supplied Yaqeen visual design board into a practical, implementation-ready design system for product design, web, mobile, and engineering teams.

---

## Document Conventions

To keep the system accurate to the supplied reference while making it usable in production, specifications are identified as follows:

- **Board-defined** — directly visible or explicitly named in the supplied design board.
- **Standardized** — a production specification added to make the visual direction consistent and implementable.
- **Extension** — a carefully matched addition for states or use cases not shown in the board.

When a standardized value differs from an implementation already in production, teams should document the exception and resolve it during the next design-system review.

---

# System Overview

## Purpose

The Yaqeen Design System exists to create interfaces that feel:

- calm rather than cold;
- premium rather than ornamental;
- trustworthy rather than corporate;
- culturally grounded rather than decorative;
- clear rather than visually sparse;
- modern without losing the brand’s heritage.

It provides a shared visual and interaction language for:

- responsive websites;
- desktop dashboards;
- mobile applications;
- authenticated financial or account experiences;
- public-facing landing pages;
- marketing and brand-supporting UI;
- internal operational tools.

## Design Principles

The supplied board establishes four primary principles:

### Clarity over complexity

Every screen should communicate hierarchy immediately. Decoration must never compete with the user’s task.

- **Apply it by:** presenting one clear primary action per section, grouping related information, removing repeated labels, using whitespace to create hierarchy, and revealing advanced controls progressively.

### Consistent and intuitive

Repeated actions should look and behave the same across all Yaqeen products.

- **Apply it by:** using shared components, keeping labels stable, preserving component state behavior, using predictable navigation positions, and following the spacing and typography scales.

### Respectful of heritage

Arabic calligraphy and arabesque patterns are identity assets, not general-purpose decoration.

- **Apply them by:** reserving the calligraphic mark for branded moments, using patterns as low-contrast atmosphere, preserving generous clear space around cultural motifs, avoiding random or excessive geometric ornament, and supporting Arabic and right-to-left layouts properly.

### Premium in every detail

Premium quality comes from precision, not visual excess.

- **Apply it by:** aligning elements to the grid, using restrained shadows, maintaining consistent radii, writing concise and confident copy, and treating loading, empty, error, and disabled states as first-class states.

## Visual Balance

Yaqeen should never feel excessively dark or excessively bright.

### Recommended surface ratio

- **Ivory and light neutral surfaces**: 60–70%
- **Royal Blue and Deep Navy**: 20–30%
- **Champagne Gold**: 5–10%
- **Supporting grays and semantic accents**: 5–10%

## Brand Expression Spectrum

- **Marketing hero**: Strong logo, deep-blue field, restrained pattern, gold accent
- **Product dashboard**: Light background, blue navigation, subtle gold highlights
- **Mobile application**: Blue header or key navigation, mostly light content surfaces
- **Data-dense admin view**: Neutral surfaces, blue hierarchy, minimal ornament
- **Premium promotion**: Deep-blue card with gold accent and geometric motif
- **Error or critical workflow**: Functional clarity first; branding remains secondary

---

# Documentation Directory

Below is the entry point for the modular chapters of the design system. Click any link to open the respective theme document.

| Chapter                                                              | Description                                                      | Key Sections Included                                                                                                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📖 **[Brand & Identity](design-system/brand_identity.md)**           | Core brand foundations, logos, and voice guidelines.             | Brand Essence & Attributes, Voice & Tone, Logo Assets & Misuse, Clear Space, Content Design                                                                 |
| 🎨 **[Foundations](design-system/foundations.md)**                   | Basic visual pillars and stylistic scales.                       | Color Palette (Semantic, Functional, Contrast), Typography (Source Serif 4 & Inter scales), Spacing Scale, Shape & Radius, Elevation & Shadows, Iconography |
| 🧩 **[Core Components](design-system/components.md)**                | Production-ready UI component behaviors.                         | Buttons, Inputs, Dropdowns, Checkboxes, Toggle switches, Tabs, Chips & Badges, Cards, Navigation & Sidebar                                                  |
| 📐 **[Product Patterns & Motion](design-system/patterns_motion.md)** | Assembled layouts, responsive transformations, and animations.   | Dashboard shells, Metric cards, Transaction lists, Spending donut chart, Responsive breakpoints, Animation duration & easing                                |
| 🌍 **[Inclusive Design](design-system/inclusive_design.md)**         | Accessibility compliance and right-to-left (RTL) specifications. | WCAG 2.2 AA rules, Keyboard & touch targets, Form accessibility, Screen readers, RTL layout mirroring, Arabic typography, Bidi content                      |
| 💻 **[Tokens & Engineering](design-system/tokens_engineering.md)**   | System implementation details for developers and designers.      | CSS Custom Properties, Token JSON schema, Component APIs, State ownership, Figma structure, Handoff & Testing guidelines                                    |
| ⚖️ **[Quality & Governance](design-system/quality_governance.md)**   | Verification checklists and contribution frameworks.             | QA Checklist (Accessibility, Components, Brand, RTL), Change Categories, Versioning, Contribution process, Appendix                                         |

---

## Final Design Statement

> Yaqeen should create confidence at every touchpoint through calm hierarchy, precise interaction, culturally respectful detail, and a restrained balance of blue, ivory, and gold.
