# Glassmorphism Quick Reference Guide

## iOS 26 Style Glassmorphism Implementation

### What is Glassmorphism?
A modern UI design trend that creates a frosted glass effect with:
- Semi-transparent backgrounds
- Backdrop blur filter
- Subtle borders
- Layered depth

---

## Light Mode Glassmorphism

### CSS/Inline Styles
```css
background: rgba(255, 255, 255, 0.6);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.18);
```

### Tailwind Classes (approximation)
```tsx
className="bg-white/60 backdrop-blur-xl border border-white/20"
```

### React Inline Style
```tsx
style={{
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderRight: '1px solid rgba(255, 255, 255, 0.18)',
}}
```

---

## Dark Mode Glassmorphism

### CSS/Inline Styles
```css
background: rgba(17, 24, 39, 0.7);  /* gray-900 with 70% opacity */
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(55, 65, 81, 0.5);  /* gray-700 with 50% opacity */
```

### Tailwind Classes (approximation)
```tsx
className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/50"
```

### React Inline Style
```tsx
style={{
  background: 'rgba(17, 24, 39, 0.7)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(55, 65, 81, 0.5)',
}}
```

---

## Implementation Examples

### 1. Sidebar with Glassmorphism
```tsx
<aside
  className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64"
  style={{ 
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRight: '1px solid rgba(255, 255, 255, 0.18)',
  }}
>
  {/* Sidebar content */}
</aside>
```

### 2. Navbar Dropdown with Glassmorphism
```tsx
<div 
  className="fixed top-16 left-0 right-0 z-40"
  style={{
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.18)'
  }}
>
  {/* Dropdown content */}
</div>
```

### 3. Card with Glassmorphism
```tsx
<div 
  className="rounded-2xl p-6 shadow-xl"
  style={{
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px) saturate(150%)',
    WebkitBackdropFilter: 'blur(10px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  }}
>
  {/* Card content */}
</div>
```

### 4. Modal Overlay with Glassmorphism
```tsx
<div 
  className="fixed inset-0 flex items-center justify-center z-50"
  style={{
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }}
>
  <div 
    className="rounded-2xl p-8 max-w-md w-full"
    style={{
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    }}
  >
    {/* Modal content */}
  </div>
</div>
```

---

## Tailwind Custom Classes

Add these to your `tailwind.config.ts` for easier implementation:

```typescript
module.exports = {
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      backdropSaturate: {
        180: '180%',
      }
    }
  }
}
```

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 76+ | ✅ Full | Native support |
| Firefox 103+ | ✅ Full | Native support |
| Safari 9+ | ✅ Full | Requires `-webkit-` prefix |
| Edge 79+ | ✅ Full | Chromium-based |
| Opera 63+ | ✅ Full | Chromium-based |

---

## Performance Tips

### 1. Use Sparingly
- Apply glassmorphism to key UI elements only
- Avoid on frequently updated components
- Don't nest multiple glassmorphism layers

### 2. Optimize Blur Values
```css
/* Heavy - Use for special effects */
backdrop-filter: blur(30px);

/* Medium - Use for cards/panels */
backdrop-filter: blur(20px);

/* Light - Use for overlays */
backdrop-filter: blur(10px);

/* Minimal - Use for subtle effects */
backdrop-filter: blur(5px);
```

### 3. Will-Change Optimization
```css
.glassmorphism-element {
  will-change: backdrop-filter;
  transform: translateZ(0); /* Force GPU acceleration */
}
```

---

## Common Issues & Solutions

### Issue 1: Blur Not Working
**Problem**: Blur effect not visible  
**Solution**: Ensure element has content behind it

```tsx
// ❌ Wrong - Nothing behind to blur
<div className="backdrop-blur-xl bg-white">Content</div>

// ✅ Correct - Background image or element behind
<div className="relative">
  <img src="background.jpg" />
  <div className="absolute inset-0 backdrop-blur-xl bg-white/60">
    Content
  </div>
</div>
```

### Issue 2: Poor Performance
**Problem**: Janky animations with glassmorphism  
**Solution**: Use `transform` for animations instead of position

```tsx
// ❌ Wrong - Reflows on every frame
<div style={{ left: position, backdropFilter: 'blur(20px)' }} />

// ✅ Correct - Uses GPU acceleration
<div style={{ transform: `translateX(${position}px)`, backdropFilter: 'blur(20px)' }} />
```

### Issue 3: Dark Mode Inconsistency
**Problem**: Glassmorphism looks different in dark mode  
**Solution**: Use separate values for light and dark

```tsx
<div 
  style={{
    background: isDark 
      ? 'rgba(17, 24, 39, 0.7)'  // Dark mode
      : 'rgba(255, 255, 255, 0.6)', // Light mode
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  }}
/>
```

---

## Design Best Practices

### 1. Color Opacity
- **Light Mode**: 50-70% opacity for backgrounds
- **Dark Mode**: 60-80% opacity for backgrounds
- **Overlays**: 80-95% opacity

### 2. Blur Amount
- **Sidebars/Panels**: 20-25px
- **Dropdowns**: 15-20px
- **Cards**: 10-15px
- **Overlays**: 5-10px

### 3. Saturation
- **Standard**: 180%
- **Vibrant**: 200-220%
- **Subtle**: 150-170%

### 4. Border Opacity
- **Light Mode**: 10-20% opacity
- **Dark Mode**: 30-50% opacity

---

## Accessibility Considerations

### 1. Text Contrast
Ensure sufficient contrast ratio (WCAG AA: 4.5:1 for normal text):
```tsx
// Add solid background color as fallback
<div 
  style={{
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
  }}
  className="text-gray-900 dark:text-gray-100"
>
  {/* Ensure text is always readable */}
</div>
```

### 2. Reduced Motion
Respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  .glassmorphism-element {
    backdrop-filter: none;
    background: rgba(255, 255, 255, 0.95); /* Higher opacity */
  }
}
```

---

## Complete Component Example

```tsx
import React from 'react';
import { useTheme } from './contexts/ThemeContext';

const GlassmorphismCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className="rounded-2xl p-6 shadow-xl"
      style={{
        background: isDark
          ? 'rgba(17, 24, 39, 0.7)'
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: isDark
          ? '1px solid rgba(55, 65, 81, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.18)',
      }}
    >
      {children}
    </div>
  );
};

export default GlassmorphismCard;
```

---

## Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [CSS Backdrop Filter on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [Glassmorphism Design Trend](https://uxdesign.cc/glassmorphism-in-user-interfaces-1f39bb1308c9)

---

**Last Updated**: October 11, 2025  
**Status**: Production Ready ✅
