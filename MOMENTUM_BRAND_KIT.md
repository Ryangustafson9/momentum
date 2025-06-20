# 🎨 Momentum Gym Brand Kit

*A comprehensive brand guide for the Momentum Gym Management System*

---

## 📋 Table of Contents

1. [Brand Overview](#brand-overview)
2. [Logo & Visual Identity](#logo--visual-identity)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [UI Components](#ui-components)
6. [Layout & Spacing](#layout--spacing)
7. [Iconography](#iconography)
8. [Brand Applications](#brand-applications)
9. [Usage Guidelines](#usage-guidelines)
10. [Assets & Downloads](#assets--downloads)

---

## 🎯 Brand Overview

### **Brand Name:** Momentum Gym
### **Tagline:** "Your fitness journey starts here"
### **Brand Personality:**
- **Professional** - Clean, modern, trustworthy
- **Energetic** - Dynamic gradients, vibrant colors
- **Inclusive** - Welcoming to all fitness levels
- **Tech-Forward** - Modern UI, seamless experience

### **Target Audience:**
- Gym members seeking digital convenience
- Fitness professionals managing operations
- Gym administrators overseeing business

---

## 🎨 Logo & Visual Identity

### **Primary Logo**
- **File:** `momentum-logo.svg`
- **Dimensions:** 1587 × 230px
- **Format:** SVG (scalable vector)
- **Color:** Dark Blue (#203D49)

### **Avatar/Icon**
- **File:** `momentum-avatar.svg`
- **Dimensions:** 1024 × 1024px
- **Design:** Gradient circle with person silhouette
- **Colors:** Indigo to Purple gradient

### **Logo Usage:**
- **Expanded Sidebar:** 128px × 96px
- **Collapsed Sidebar:** 32px × 32px (avatar)
- **Login Pages:** Variable sizing
- **Headers:** Responsive scaling

---

## 🌈 Color Palette

### **Primary Colors**

#### **Indigo Series**
```css
--primary: #4f46e5        /* Indigo-600 */
--primary-light: #6366f1  /* Indigo-500 */
--primary-dark: #3730a3   /* Indigo-700 */
```

#### **Purple Series**
```css
--secondary: #7c3aed      /* Purple-600 */
--secondary-light: #8b5cf6 /* Purple-500 */
--secondary-dark: #5b21b6  /* Purple-700 */
```

#### **Pink Accent**
```css
--accent: #ec4899         /* Pink-500 */
--accent-light: #f472b6   /* Pink-400 */
--accent-dark: #be185d    /* Pink-600 */
```

### **Gradient Combinations**

#### **Primary Gradient**
```css
background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
/* Indigo to Purple */
```

#### **Login Background**
```css
background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
/* Indigo → Purple → Pink */
```

#### **Avatar Fallback**
```css
background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
/* Indigo-500 to Purple-500 */
```

### **Neutral Colors**

#### **Grays**
```css
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827
```

#### **Semantic Colors**
```css
--success: #10b981       /* Green-500 */
--warning: #f59e0b       /* Amber-500 */
--error: #ef4444         /* Red-500 */
--info: #3b82f6          /* Blue-500 */
```

---

## ✍️ Typography

### **Font Family**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### **Font Weights**
- **Light:** 300
- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

### **Typography Scale**

#### **Headings**
```css
h1: 2.25rem (36px) - font-weight: 700
h2: 1.875rem (30px) - font-weight: 600
h3: 1.5rem (24px) - font-weight: 600
h4: 1.25rem (20px) - font-weight: 500
h5: 1.125rem (18px) - font-weight: 500
h6: 1rem (16px) - font-weight: 500
```

#### **Body Text**
```css
Large: 1.125rem (18px) - font-weight: 400
Base: 1rem (16px) - font-weight: 400
Small: 0.875rem (14px) - font-weight: 400
Extra Small: 0.75rem (12px) - font-weight: 400
```

---

## 🧩 UI Components

### **Buttons**

#### **Primary Button**
```css
background: linear-gradient(135deg, #4f46e5, #7c3aed);
color: white;
border-radius: 0.5rem;
padding: 0.75rem 1.5rem;
font-weight: 500;
```

#### **Secondary Button**
```css
background: transparent;
border: 1px solid #d1d5db;
color: #374151;
border-radius: 0.5rem;
padding: 0.75rem 1.5rem;
```

#### **Ghost Button**
```css
background: transparent;
color: #6b7280;
border-radius: 0.5rem;
padding: 0.75rem 1.5rem;
hover: background-color: #f3f4f6;
```

### **Cards**
```css
background: white;
border-radius: 0.75rem;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
border: 1px solid #e5e7eb;
padding: 1.5rem;
```

### **Input Fields**
```css
border: 1px solid #d1d5db;
border-radius: 0.5rem;
padding: 0.75rem 1rem;
font-size: 1rem;
focus: border-color: #4f46e5;
focus: ring: 2px #4f46e5 (20% opacity);
```

---

## 📐 Layout & Spacing

### **Spacing Scale**
```css
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
```

### **Border Radius**
```css
sm: 0.25rem (4px)
md: 0.5rem (8px)
lg: 0.75rem (12px)
xl: 1rem (16px)
2xl: 1.5rem (24px)
3xl: 2rem (32px)
```

### **Container Widths**
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## 🎯 Iconography

### **Icon Library:** Lucide React
### **Icon Sizes:**
- **Small:** 16px (h-4 w-4)
- **Medium:** 20px (h-5 w-5)
- **Large:** 24px (h-6 w-6)
- **Extra Large:** 32px (h-8 w-8)

### **Common Icons:**
- **Navigation:** Home, Users, Calendar, Settings
- **Actions:** Plus, Edit, Trash2, Eye, Search
- **Status:** CheckCircle, AlertTriangle, X
- **Fitness:** Dumbbell, Target, Award, TrendingUp

---

## 🖥️ Brand Applications

### **Login Pages**
- Gradient background (Indigo → Purple → Pink)
- White card with backdrop blur
- Club logo at top
- Momentum branding at bottom
- Rounded corners (24px)

### **Dashboards**
- Light gradient backgrounds
- Card-based layouts
- Consistent spacing (24px grid)
- Sidebar navigation with brand colors

### **Sidebars**
- **Expanded:** Momentum logo (128×96px)
- **Collapsed:** User avatar (32×32px)
- Gradient header background
- Indigo/purple color scheme

### **Data Visualization**
- Primary colors for main metrics
- Gradient fills for charts
- Consistent color coding
- Clean, minimal design

---

## 📋 Usage Guidelines

### **Logo Guidelines**

#### **DO:**
✅ Use the official SVG logo files
✅ Maintain proper aspect ratios
✅ Ensure adequate white space around logo
✅ Use on contrasting backgrounds
✅ Scale proportionally

#### **DON'T:**
❌ Stretch or distort the logo
❌ Change logo colors
❌ Add effects or shadows
❌ Use low-resolution versions
❌ Place on busy backgrounds

### **Color Guidelines**

#### **Primary Usage:**
- **Indigo (#4f46e5):** Main actions, primary buttons, links
- **Purple (#7c3aed):** Secondary actions, accents
- **Pink (#ec4899):** Highlights, call-to-action elements

#### **Accessibility:**
- Maintain 4.5:1 contrast ratio for text
- Use semantic colors consistently
- Provide alternative indicators beyond color

### **Typography Guidelines**

#### **Hierarchy:**
1. **H1:** Page titles, main headings
2. **H2:** Section headers
3. **H3:** Subsection headers
4. **Body:** Regular content
5. **Small:** Captions, metadata

#### **Best Practices:**
- Use consistent line heights (1.5-1.6)
- Limit line length to 60-80 characters
- Maintain proper spacing between elements

---

## 📦 Assets & Downloads

### **Logo Files**
```
/public/assets/
├── momentum-logo.svg          # Primary logo (1587×230)
├── momentum-avatar.svg        # Avatar/icon (1024×1024)
└── NordicFitness.png         # Club logo example
```

### **Color Swatches**
```css
/* CSS Custom Properties */
:root {
  --primary: #4f46e5;
  --secondary: #7c3aed;
  --accent: #ec4899;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --gray-50: #f9fafb;
  --gray-900: #111827;
}
```

### **Component Library**
- Button variants (primary, secondary, ghost)
- Card components with consistent styling
- Input field designs
- Navigation elements
- Modal/dialog patterns

### **Gradient Presets**
```css
/* Login Background */
.gradient-login {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
}

/* Primary Gradient */
.gradient-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

/* Avatar Fallback */
.gradient-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
}

/* Light Background */
.gradient-light {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
}
```

---

## 🎨 Design Tokens

### **Spacing System**
```javascript
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px'
};
```

### **Border Radius**
```javascript
const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px'
};
```

### **Shadows**
```css
/* Card Shadow */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);

/* Modal Shadow */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Button Shadow */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
```

---

## 🚀 Implementation Examples

### **React Component with Brand Colors**
```jsx
import { Button } from '@/components/ui/button';

const BrandedButton = () => (
  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
    Get Started
  </Button>
);
```

### **CSS Classes**
```css
/* Primary gradient background */
.bg-momentum-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

/* Brand text color */
.text-momentum {
  color: #4f46e5;
}

/* Card with brand styling */
.momentum-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}
```

---

## 📱 Responsive Considerations

### **Mobile Adaptations**
- Larger touch targets (44px minimum)
- Simplified navigation
- Stacked layouts
- Readable font sizes (16px minimum)

### **Tablet Adaptations**
- Hybrid layouts
- Collapsible sidebars
- Touch-friendly interactions
- Optimized spacing

### **Desktop Optimizations**
- Full sidebar navigation
- Multi-column layouts
- Hover states
- Keyboard shortcuts

---

## 🔄 Brand Evolution

### **Version History**
- **v1.0:** Initial brand establishment
- **Current:** Refined color palette and typography
- **Future:** Potential dark mode variations

### **Planned Enhancements**
- Dark theme color variants
- Additional logo variations
- Extended icon library
- Animation guidelines

---

*This brand kit ensures consistent visual identity across all Momentum Gym applications and touchpoints. For questions or updates, please refer to the design system documentation.*
