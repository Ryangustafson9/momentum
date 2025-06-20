# 🎨 Momentum Gym Brand Assets

This directory contains all the visual assets and resources for the Momentum Gym brand.

## 📁 Directory Structure

```
brand-assets/
├── README.md                 # This file
├── logos/                    # Logo variations
│   ├── momentum-logo.svg     # Primary logo
│   ├── momentum-avatar.svg   # Avatar/icon version
│   └── logo-variations/      # Different sizes and formats
├── colors/                   # Color palettes and swatches
│   ├── color-palette.css     # CSS color variables
│   ├── tailwind-colors.js    # Tailwind config colors
│   └── brand-colors.json     # JSON color definitions
├── typography/               # Font and text styling
│   ├── font-specimens.html   # Typography examples
│   └── text-styles.css       # Predefined text classes
├── components/               # UI component examples
│   ├── buttons.html          # Button variations
│   ├── cards.html            # Card components
│   └── forms.html            # Form elements
├── templates/                # Page templates
│   ├── login-template.html   # Login page template
│   ├── dashboard-template.html # Dashboard template
│   └── sidebar-template.html # Sidebar template
└── guidelines/               # Usage guidelines
    ├── logo-usage.md         # Logo usage rules
    ├── color-guidelines.md   # Color usage guidelines
    └── accessibility.md      # Accessibility standards
```

## 🎯 Quick Start

### Using the Brand Colors
```css
/* Import the color palette */
@import './colors/color-palette.css';

/* Use brand colors */
.primary-button {
  background: var(--momentum-primary);
  color: white;
}

.gradient-bg {
  background: var(--momentum-gradient-primary);
}
```

### Logo Implementation
```html
<!-- Primary logo for headers -->
<img src="./logos/momentum-logo.svg" alt="Momentum Gym" class="h-20 w-auto">

<!-- Avatar for collapsed sidebars -->
<img src="./logos/momentum-avatar.svg" alt="Momentum" class="h-8 w-8 rounded-full">
```

## 🌈 Color Reference

### Primary Colors
- **Indigo:** `#4f46e5` - Main brand color
- **Purple:** `#7c3aed` - Secondary brand color  
- **Pink:** `#ec4899` - Accent color

### Gradients
- **Primary:** `linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)`
- **Login:** `linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)`
- **Avatar:** `linear-gradient(135deg, #6366f1 0%, #a855f7 100%)`

## 📐 Logo Specifications

### Primary Logo (`momentum-logo.svg`)
- **Dimensions:** 1587 × 230 pixels
- **Aspect Ratio:** 6.9:1
- **Color:** Dark Blue (#203D49)
- **Format:** SVG (scalable)
- **Usage:** Headers, branding, marketing materials

### Avatar Logo (`momentum-avatar.svg`)
- **Dimensions:** 1024 × 1024 pixels
- **Aspect Ratio:** 1:1
- **Design:** Gradient circle with person silhouette
- **Format:** SVG (scalable)
- **Usage:** Profile pictures, collapsed sidebars, favicons

## 🎨 Component Styling

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #4f46e5;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #4f46e5;
}
```

### Cards
```css
.momentum-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.momentum-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

## 📱 Responsive Guidelines

### Mobile (< 768px)
- Logo: Use avatar version in headers
- Buttons: Full width, larger touch targets
- Cards: Single column layout
- Text: Minimum 16px font size

### Tablet (768px - 1024px)
- Logo: Medium size primary logo
- Buttons: Standard sizing
- Cards: 2-column grid
- Sidebar: Collapsible

### Desktop (> 1024px)
- Logo: Full size primary logo
- Buttons: Standard sizing with hover effects
- Cards: 3-4 column grid
- Sidebar: Expanded by default

## 🎯 Brand Applications

### Login Pages
```html
<div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
  <div class="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl">
    <!-- Club logo at top -->
    <img src="./logos/club-logo.png" alt="Club Logo" class="h-16 mx-auto">
    
    <!-- Login form -->
    <form class="space-y-6">
      <!-- Form fields -->
    </form>
    
    <!-- Momentum branding at bottom -->
    <div class="text-center text-gray-500">
      Powered by <span class="text-indigo-600 font-semibold">Momentum</span>
    </div>
  </div>
</div>
```

### Dashboard Headers
```html
<header class="bg-white/80 backdrop-blur-sm border-b border-gray-200">
  <div class="flex items-center justify-between px-6 py-4">
    <img src="./logos/momentum-logo.svg" alt="Momentum Gym" class="h-8">
    <!-- Navigation and user menu -->
  </div>
</header>
```

## 🔧 Development Integration

### CSS Custom Properties
```css
:root {
  /* Brand Colors */
  --momentum-primary: #4f46e5;
  --momentum-secondary: #7c3aed;
  --momentum-accent: #ec4899;
  
  /* Gradients */
  --momentum-gradient-primary: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  --momentum-gradient-login: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
  --momentum-gradient-avatar: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  
  /* Spacing */
  --momentum-spacing-xs: 4px;
  --momentum-spacing-sm: 8px;
  --momentum-spacing-md: 16px;
  --momentum-spacing-lg: 24px;
  --momentum-spacing-xl: 32px;
  
  /* Border Radius */
  --momentum-radius-sm: 4px;
  --momentum-radius-md: 8px;
  --momentum-radius-lg: 12px;
  --momentum-radius-xl: 16px;
  
  /* Shadows */
  --momentum-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --momentum-shadow-md: 0 1px 3px rgba(0, 0, 0, 0.1);
  --momentum-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        momentum: {
          primary: '#4f46e5',
          secondary: '#7c3aed',
          accent: '#ec4899',
        }
      },
      backgroundImage: {
        'momentum-primary': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'momentum-login': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
      }
    }
  }
}
```

## 📋 Checklist for Brand Compliance

### ✅ Logo Usage
- [ ] Using official SVG files
- [ ] Maintaining aspect ratios
- [ ] Proper sizing for context
- [ ] Adequate white space
- [ ] Contrasting backgrounds

### ✅ Color Usage
- [ ] Using brand color variables
- [ ] Maintaining accessibility contrast
- [ ] Consistent gradient applications
- [ ] Proper semantic color usage

### ✅ Typography
- [ ] Using Inter font family
- [ ] Proper heading hierarchy
- [ ] Consistent line heights
- [ ] Readable font sizes

### ✅ Components
- [ ] Following button styling guidelines
- [ ] Using consistent card designs
- [ ] Proper spacing and padding
- [ ] Responsive considerations

---

*For questions about brand usage or to request additional assets, please refer to the main brand kit documentation.*
