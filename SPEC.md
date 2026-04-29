# Blackwood Landing Page Specification

## Project Overview
- **Project name**: Blackwood Private Office Landing Page
- **Type**: Marketing website / landing page
- **Core functionality**: Single-page luxury landing site for invite-only private operating platform
- **Target users**: Ultra-high-net-worth founders, principals, executives, family offices

## UI/UX Specification

### Layout Structure
- **Sections**: Navigation, Hero, Capabilities, Positioning, Onboarding CTA, Footer
- **Max content width**: 1200px centered
- **Responsive breakpoints**: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)

### Visual Design

#### Color Palette
- **Background Primary**: #0A0A0A (rich black)
- **Background Secondary**: #141414 (charcoal)
- **Background Tertiary**: #1A1A1A (soft charcoal)
- **Surface**: #1F1F1F (glass panels)
- **Border**: #2A2A2A (subtle borders)
- **Text Primary**: #FAFAFA (warm white)
- **Text Secondary**: #A1A1A1 (warm stone)
- **Text Muted**: #6B6B6B (muted)
- **Accent**: #D4AF37 (warm gold accent - subtle use only)
- **Glow**: rgba(255, 255, 255, 0.03) (subtle glow)

#### Typography
- **Font Family**: "Instrument Serif" for headings, "DM Sans" for body (Google Fonts)
- **Hero Headline**: 64px desktop / 36px mobile, font-weight 400, letter-spacing -0.02em
- **Section Headlines**: 48px desktop / 28px mobile, font-weight 400
- **Body**: 16px, font-weight 400, line-height 1.7
- **Small/Labels**: 12px, font-weight 500, letter-spacing 0.1em, uppercase

#### Spacing System
- **Section padding**: 120px vertical desktop / 80px mobile
- **Element spacing**: 24px standard, 48px between major elements
- **Container padding**: 24px mobile / 48px desktop

#### Visual Effects
- **Glass panels**: background rgba(255,255,255,0.02), backdrop-blur 20px, border 1px solid rgba(255,255,255,0.05)
- **Glow gradients**: radial-gradient with very subtle white opacity
- **Shadows**: none (flat design with subtle borders)
- **Animations**: Framer Motion with ease-out curves, 0.6s duration typical

### Components

#### Navigation
- Fixed top, transparent background with subtle blur on scroll
- Logo: "Blackwood" wordmark in Instrument Serif
- Subtitle: "Private Office" in small caps, muted color
- Button: "Request Access" - outlined style, subtle border

#### Hero Section
- Badge: Small pill with "Invite-only" + decorative elements
- Large headline with elegant serif
- Support text in secondary color
- Two CTA buttons: Primary (filled) and Secondary (outlined)
- Animated "command brief" card on right side - shows sample workflow

#### Capabilities Section
- 4 capability cards in 2x2 grid
- Each card: Icon (Lucide), Title, Brief description
- Hover: subtle glow effect

#### Positioning Section
- Centered headline
- 4 principle cards with icon + title + description

#### Onboarding CTA
- Descriptive text about manual configuration
- Single primary CTA button

#### Footer
- Minimal: Copyright + tagline
- Everything centered

## Functionality Specification

### Core Features
- Smooth scroll navigation
- Framer Motion animations on scroll (fade up, stagger)
- Animated command brief card in hero
- Responsive layout switching
- Hover states on interactive elements

### User Interactions
- Click navigation links → smooth scroll to section
- Hover capability cards → subtle glow
- Click CTAs → no action (placeholder)

### Animations
- Page load: staggered reveal of sections
- Scroll: fade-up animations with viewport trigger
- Hero command card: subtle floating animation
- Buttons: subtle scale on hover

## Acceptance Criteria
- [ ] Page loads without errors
- [ ] All 6 sections visible
- [ ] Typography is elegant and readable
- [ ] Animations are smooth (60fps)
- [ ] Mobile responsive - readable on 375px width
- [ ] Glass panel effects work
- [ ] No "startup SaaS" vibe - feels exclusive/private
- [ ] All icons render correctly