# 🎨 Theme Quick Reference Guide

## Quick Color Replacement Guide

Use this guide to quickly update any component to support light/dark themes.

---

## 🔍 Find & Replace Patterns

### Backgrounds

| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `bg-white` | `bg-background` or `bg-card` | Main backgrounds |
| `bg-gray-50` | `bg-muted` | Subtle backgrounds |
| `bg-gray-100` | `bg-accent` | Hover states, highlights |
| `bg-gray-200` | `bg-border` | Borders as backgrounds |
| `bg-gray-900` | `bg-card dark:bg-gray-900` | Dark sections |

### Text Colors

| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `text-black` | `text-foreground` | Primary text |
| `text-gray-900` | `text-foreground` | Primary text |
| `text-gray-700` | `text-foreground` | Body text |
| `text-gray-600` | `text-muted-foreground` | Secondary text |
| `text-gray-500` | `text-muted-foreground` | Disabled/subtle text |
| `text-gray-400` | `text-muted-foreground` | Placeholder text |

### Borders

| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `border-gray-200` | `border-border` | Standard borders |
| `border-gray-300` | `border-border` | Input borders |
| `border-gray-400` | `border-border` | Emphasized borders |

### Hover States

| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `hover:bg-gray-100` | `hover:bg-accent` | Button hover |
| `hover:bg-gray-50` | `hover:bg-muted` | Subtle hover |
| `hover:text-gray-900` | `hover:text-foreground` | Text hover |

---

## 🎯 Component Checklist

When updating a component, check these elements:

### ✅ Layout Elements
- [ ] Container backgrounds
- [ ] Section dividers
- [ ] Spacing elements

### ✅ Interactive Elements
- [ ] Button backgrounds
- [ ] Button text colors
- [ ] Button hover states
- [ ] Button borders
- [ ] Link colors
- [ ] Link hover states

### ✅ Content Elements
- [ ] Card backgrounds
- [ ] Card text
- [ ] Heading colors
- [ ] Body text colors
- [ ] Caption/meta text

### ✅ Form Elements
- [ ] Input backgrounds
- [ ] Input borders
- [ ] Input text
- [ ] Placeholder text
- [ ] Label text
- [ ] Error messages
- [ ] Helper text

### ✅ Navigation Elements
- [ ] Nav backgrounds
- [ ] Nav item text
- [ ] Active state
- [ ] Hover state
- [ ] Borders/dividers

---

## 🎨 Common Component Patterns

### Card Component
```tsx
// ✅ Theme-aware
<div className="bg-card text-card-foreground border border-border rounded-lg p-6">
  <h3 className="text-lg font-semibold text-foreground mb-2">Title</h3>
  <p className="text-muted-foreground">Description text</p>
</div>
```

### Button Component
```tsx
// Primary button
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click Me
</button>

// Secondary button
<button className="bg-muted text-foreground hover:bg-accent border border-border">
  Cancel
</button>

// Ghost button
<button className="text-foreground hover:bg-accent hover:text-accent-foreground">
  Learn More
</button>
```

### Input Component
```tsx
<input 
  className="w-full bg-background text-foreground border border-border 
             rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary 
             focus:border-primary placeholder:text-muted-foreground"
  placeholder="Enter text..."
/>
```

### Navigation Link
```tsx
<Link 
  to="/path"
  className="text-muted-foreground hover:text-foreground hover:bg-accent 
             rounded-lg px-3 py-2 transition-colors"
>
  Menu Item
</Link>
```

### Section Header
```tsx
<div className="border-b border-border pb-4 mb-6">
  <h2 className="text-2xl font-bold text-foreground">Section Title</h2>
  <p className="text-muted-foreground mt-1">Section description</p>
</div>
```

---

## 🚨 Special Cases

### Brand Colors (Keep As-Is)
These colors should stay consistent across themes:
- `bg-adtip-teal` (brand color)
- `text-adtip-teal` (brand color)
- `bg-red-600` (errors/destructive)
- `bg-green-600` (success)
- `bg-yellow-600` (warnings)

### Gradients
For gradients, add dark mode variants:
```tsx
// ✅ With dark mode
<div className="bg-gradient-to-r from-blue-50 to-purple-50 
                dark:from-blue-900/20 dark:to-purple-900/20">

// ✅ Semantic gradient
<div className="bg-gradient-to-r from-primary/10 to-accent/10">
```

### Shadow Colors
```tsx
// ✅ Theme-aware shadows
<div className="shadow-md shadow-black/10 dark:shadow-black/50">

// ✅ Or use Tailwind's default (automatically adapts)
<div className="shadow-lg">
```

---

## 🧪 Testing Checklist

Before marking a component as "themed":

1. **Visual Test**
   - [ ] Component looks good in light mode
   - [ ] Component looks good in dark mode
   - [ ] No jarring color mismatches
   - [ ] Text is readable in both modes

2. **Interaction Test**
   - [ ] Hover states work in both modes
   - [ ] Active states visible in both modes
   - [ ] Focus states clear in both modes
   - [ ] Disabled states appropriate in both modes

3. **Accessibility Test**
   - [ ] Text contrast meets WCAG standards (4.5:1 minimum)
   - [ ] Interactive elements clearly distinguishable
   - [ ] Focus indicators visible
   - [ ] No information conveyed by color alone

4. **Edge Cases**
   - [ ] Long text doesn't break layout
   - [ ] Empty states look appropriate
   - [ ] Error states are visible
   - [ ] Loading states are clear

---

## 💡 Pro Tips

### 1. Use Browser DevTools
- Toggle theme in the app
- Use DevTools to inspect elements
- Check computed styles
- Verify CSS custom properties are applied

### 2. Test Systematically
- Go page by page
- Focus on one section at a time
- Toggle theme frequently
- Take screenshots for comparison

### 3. Look for These Patterns
```tsx
// 🚨 Warning signs that need fixing:
- className="bg-white"
- className="text-black"  
- className="bg-gray-*"
- className="text-gray-*"
- style={{ backgroundColor: '#fff' }}
```

### 4. Use Regex to Find Issues
Search your codebase for:
- `bg-white|bg-gray-\d+`
- `text-black|text-gray-\d+`
- `border-gray-\d+`

---

## 📊 Theme Token Reference

### All Available Tokens

```tsx
// Backgrounds
bg-background          // Main page bg
bg-foreground         // Inverse bg (rare)
bg-card               // Card/panel bg
bg-popover            // Dropdown/modal bg
bg-primary            // Brand/CTA bg
bg-secondary          // Secondary button bg
bg-muted              // Subtle/disabled bg
bg-accent             // Hover/highlight bg
bg-destructive        // Error/danger bg

// Text
text-foreground       // Primary text
text-background       // Text on bg (rare)
text-card-foreground  // Text on cards
text-popover-foreground // Text on popovers
text-primary-foreground // Text on primary bg
text-secondary-foreground // Text on secondary bg
text-muted-foreground // Secondary/disabled text
text-accent-foreground // Text on accent bg
text-destructive-foreground // Text on destructive bg

// Borders
border-border         // Standard border
border-input          // Input border
border-ring           // Focus ring

// Special
bg-sidebar           // Sidebar bg (if different from main)
text-sidebar-foreground // Sidebar text
```

---

## 🎯 Quick Decision Tree

**Is it a main page/card background?**
→ Use `bg-background` or `bg-card`

**Is it subtle/secondary background?**
→ Use `bg-muted`

**Is it for hover/highlight?**
→ Use `bg-accent` or `hover:bg-accent`

**Is it primary text?**
→ Use `text-foreground`

**Is it secondary/meta text?**
→ Use `text-muted-foreground`

**Is it a border?**
→ Use `border-border`

**Is it a brand element (button, badge)?**
→ Use `bg-primary text-primary-foreground`

---

## 📞 Need Help?

### Common Issues

**Problem:** Text not readable in dark mode
**Solution:** Use `text-foreground` instead of `text-gray-*`

**Problem:** Background too bright in dark mode
**Solution:** Use `bg-background` or `bg-card` instead of `bg-white`

**Problem:** Hover state not visible
**Solution:** Use `hover:bg-accent` instead of `hover:bg-gray-100`

**Problem:** Border not showing in dark mode
**Solution:** Use `border-border` instead of `border-gray-200`

---

**Last Updated:** January 2025  
**For:** AdTip Web Application Theme Implementation
