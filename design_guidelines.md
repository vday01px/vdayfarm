# Design Guidelines: Telegram Mini App - Tài Xỉu (Sicbo) Game

## Design Approach
**Reference-Based: Casino Gaming Apps** - Drawing inspiration from established casino gaming platforms with Vietnamese market aesthetics, focusing on luxurious gold/red themes typical of Asian gaming culture.

## Core Visual Identity

### Typography
- **Primary Font**: Roboto (Vietnamese character support)
- **Headers**: 700 weight, 24-32px for main titles
- **Body**: 400-500 weight, 14-16px for content
- **Numbers/Stats**: 600 weight, tabular figures for currency display
- **Buttons**: 600 weight, 14-16px, uppercase for action buttons

### Layout System
**Tailwind Spacing Units**: 2, 4, 6, 8, 12, 16
- Consistent padding: p-4 for cards, p-6 for sections
- Margins: m-2 for tight spacing, m-4 for standard, m-8 for section breaks
- Grid gaps: gap-4 for betting chips, gap-6 for menu items

### Color Philosophy (Structure Only)
- Background: Casino-themed gradient with golden frame borders
- Betting table: Two distinct sections (Tài/Xỉu) with clear visual separation
- Chips: Graduated hierarchy showing value differences
- Action buttons: High contrast for primary actions (ĐỒNG Ý), secondary for cancel
- Admin panel: Distinct treatment to differentiate from player interface

## Layout Architecture

### Header Bar (Fixed Top)
**Left**: Hamburger menu icon (24x24px, z-index high)
**Right**: User info container
- Telegram username (14px, truncate at 12 chars)
- Balance display (18px, bold, coin icon prefix)
- Spacing: p-4, items aligned with gap-3

### Main Game Area (70% viewport)
**Betting Table**
- Central focal point with rounded corners (16px radius)
- Tài section (top) and Xỉu section (bottom) with equal weight
- Each section contains:
  - Large label (Tài/Xỉu) with icon
  - Bet amount display (prominent, 24px)
  - "Đặt Cược" button (full-width within section)
- Center circle: Dice display area with animation container (120x120px)

**Chip Selection Bar**
- Horizontal scrollable row beneath table
- Chip buttons: 48x48px circles
- Values: 10, 20, 30, 50, 100, 200, 300, 500
- Active state: scale(1.1) with ring indicator

**Control Panel**
- Action buttons row (gap-2):
  - HỦY (cancel, secondary)
  - SỐ KHÁC (custom amount, secondary)
  - TẤT TAY (all-in, warning style)
  - ĐỒNG Ý (confirm, primary, largest)
- Button height: h-12, rounded-lg

### Bottom Section (30% viewport)
**Timer & History**
- Countdown timer: Circular progress indicator (60px diameter)
- Result history: Horizontal row of dots (12px each)
  - Different visual treatment for Tài/Xỉu results
  - Show last 10-15 results, scrollable

### Hamburger Menu (Slide-in Drawer)
**Width**: 280px from left
**Sections**:
1. Profile summary (avatar, username, balance)
2. Navigation items (h-14 each):
   - Nạp (Deposit icon)
   - Rút (Withdraw icon)
   - Giftcode (Gift icon)
   - CSKH (Support icon, links to @vdaychim99)
   - **Admin Panel** (visible only for @vdaychim99, crown icon)

### Admin Panel Interface

**User Management Tab**
- Time filter buttons: Hôm nay, 7 ngày, 1 tháng (toggle group)
- User list table:
  - Columns: Username, Balance, Total Deposit, Total Bet, Status
  - Action buttons: View Details, Lock Account
  - Pagination at bottom
- User detail modal:
  - Stats cards (4-column grid on desktop)
  - Deposit/withdrawal history table
  - Lock/unlock toggle

**Giftcode Management Tab**
- Create form (card layout):
  - Code input (empty for auto-generate)
  - Quantity input (for random codes)
  - Usage limit input
  - Condition selector (radio group): Total Deposit, Total Bet, Both
  - Condition amount input
  - Withdrawal multiplier selector (x2, x3, x4, x5)
  - Generate button (primary)
- Code list table:
  - Columns: Code, Amount, Uses, Max Uses, Created Date, Actions
  - Delete button per row

**Result Control Tab**
- Two-column layout:
  - **Manual Control** (left):
    - Tài/Xỉu selector (large toggle)
    - Current bettors display (2 columns showing Tài players vs Xỉu players)
    - Apply button
  - **Auto Control** (right):
    - Enable/disable toggle
    - Percentage slider (0-100%) labeled "Tỉ lệ thua cổng tiền nhiều"
    - Real-time bet totals display

### Real-time Betting Display
**Position**: Floating overlay near betting table
- Two side-by-side lists (Tài players | Xỉu players)
- Each entry: Avatar + Username + Bet amount
- Max height: 200px, scrollable
- Updates in real-time during betting phase

### Modals & Popups

**Account Locked Popup**
- Modal overlay (semi-transparent background)
- Center card (max-width 400px):
  - Warning icon (large)
  - "Tài khoản bị khóa" heading
  - Contact message
  - Auto-redirect countdown (5s)
  - Manual link to @vdaychim99
  - No close button (forced flow)

**Giftcode Input Modal**
- Clean centered modal
- Code input field (large, centered text)
- Conditions display (if applicable)
- Redeem button

## Component Specifications

### Buttons
- Primary: h-12, rounded-lg, font-semibold
- Secondary: h-10, rounded-md, font-medium
- Icon buttons: 40x40px, rounded-full
- Disabled state: 50% opacity

### Cards
- Rounded corners: 12px for main cards, 8px for nested
- Padding: p-6 for content cards, p-4 for compact
- Shadow: Subtle elevation for depth

### Form Elements
- Input fields: h-12, rounded-lg, border
- Labels: 14px, font-medium, mb-2
- Error states: Red border, small error text below

### Tables
- Header: Sticky, 56px height, font-semibold
- Rows: 64px height, hover state
- Borders: Subtle between rows
- Mobile: Card layout (stack columns)

## Animation Guidelines
**Minimal & Purposeful**
- Dice roll: 3D rotation animation (1.5s)
- Chip placement: Scale + fade in (0.2s)
- Menu slide: 0.3s ease-out
- Result reveal: Pulse effect on winning section (0.5s)
- Timer countdown: Smooth circular progress
- NO: Excessive sparkles, continuous animations, distracting effects

## Responsive Behavior
**Mobile-First** (Telegram primarily mobile)
- Portrait: Single column, full-width table
- Landscape: Optimized for horizontal gaming
- Tablet: 2-column admin panels
- Desktop: Full multi-column admin layouts

## Vietnamese Localization
- All interface text in Vietnamese
- Currency format: Vietnamese Dong symbol placement
- Date format: DD/MM/YYYY
- Number separators: Dot for thousands (1.000.000)

## Images
**No hero images needed** - This is a functional game interface focused on the betting table and controls. Visual richness comes from the casino-themed background treatment (golden borders, subtle patterns) rather than photographic imagery.