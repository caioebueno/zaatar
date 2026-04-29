# Product Manager — Design Spec

## Objective

Design a Product Manager interface that allows admins to:

- Create and edit products
- Organize products inside categories
- Manage translations (Spanish / Portuguese)
- Handle multiple photos
- Attach modifier groups
- Attach products to progressive discount prizes
- Reorder categories and products

The experience must be fast, clear, and optimized for daily use.

---

## Information Architecture

### Main Screen

- Header
  - Search
  - Add Product button

- Content
  - Category sections
    - Category header
    - Product list
    - Product rows

---

## Product List

### Layout

- Products grouped by categories
- Categories displayed vertically
- Each category can be collapsed

---

### Category Block

Elements:
- Category name
- Drag handle
- Collapse / expand control
- Product count

---

### Product Row

Elements:
- Main image
- Product name
- Price
- Compared price (if exists)
- Status (Active / Inactive)
- Edit action
- Drag handle

---

### Behavior

- Drag & drop to reorder products within a category
- Drag & drop to move products between categories
- Toggle active/inactive inline
- Click row to edit product

---

## Add / Edit Product

### Layout

- Side drawer (recommended) or full page

---

### Sections

#### 1. Basic Info

- Name
- Description
- Category
- Active toggle

---

#### 2. Translations

Languages:
- Spanish (ES)
- Portuguese (PT)

Fields:
- Name
- Description

Rules:
- Optional fields
- Fallback to default language if empty

---

#### 3. Photos

- Multiple image upload
- Remove image
- Reorder images
- First image is the main display image

---

#### 4. Pricing

- Price
- Compared at price

Rules:
- Compared price is optional
- If present, should be visually shown as discount

---

#### 5. Modifier Groups

- List of attached modifier groups
- Add modifier group
- Remove modifier group
- Reorder modifier groups

Each group displays:
- Title
- Type (Single / Multiple)
- Required indicator
- Min / Max selection (if applicable)
- List of items

---

#### Modifier Group Behavior

- SINGLE: only one option selectable
- MULTI: multiple options selectable
- Required groups must enforce selection

---

#### 6. Progressive Discount Prizes

- List of attached prizes
- Attach product to prize
- Remove product from prize

Each prize displays:
- Name
- Quantity
- Image (optional)

---

## Category Management

- Categories displayed in main list
- Drag & drop to reorder
- Clear visual separation between categories

---

## Product Ordering

- Products ordered within categories
- Drag & drop supported
- Products can move between categories
- Immediate visual feedback after reorder

---

## UX Principles

### Speed
- Add/edit product quickly
- Minimal clicks and friction

### Clarity
- Clear grouping and hierarchy
- Clean layout with distinct sections

### Reusability
- Modifier groups reused across products
- Consistent component patterns

### Error Prevention
- Clear status indicators
- Logical form structure
- Visual clarity for pricing and options

---

## Core Components

- CategoryBlock
- ProductRow
- ProductForm
- ImageUploader
- PriceInput
- ModifierGroupCard
- ModifierItemRow
- TranslationTabs
- ToggleSwitch
- DragHandle

---

## Responsive Behavior

### Desktop
- Full list view
- Side drawer for editing

### Tablet
- Same layout with tighter spacing

### Mobile (optional)
- Stacked layout
- Full screen editing

---

## Success Criteria

- Products grouped correctly by category
- Categories and products can be reordered visually
- Product editing is fast and intuitive
- Translations are easy to manage
- Modifier groups are clear and reusable
- Multiple photos are manageable
- Pricing is clearly displayed
- Interface is clean, modern, and efficient