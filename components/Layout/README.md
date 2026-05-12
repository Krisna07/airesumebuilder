# Dashboard Layout Components

Reusable dashboard layout components following the design system specifications for consistent dashboard interfaces across the application.

## Components

### DashboardLayout

The main dashboard layout component with optional slots for header, sidebar, and action bar.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | Main content area |
| `header` | `ReactNode` | Optional | Header slot for titles, breadcrumbs, and actions |
| `sidebar` | `ReactNode` | Optional | Sidebar slot for navigation and filters |
| `actionBar` | `ReactNode` | Optional | Fixed bottom action bar |
| `maxWidth` | `"narrow" \| "default" \| "wide"` | `"default"` | Container max-width constraint |
| `className` | `string` | Optional | Additional CSS classes |

#### Max Width Options

- **narrow**: 850px - Content-focused dashboards (e.g., resume builder)
- **default**: 1200px - Standard dashboards with data grids
- **wide**: 1400px - Data-heavy dashboards with complex layouts

#### Usage

```tsx
import { DashboardLayout } from "@/components/Layout"

export default function MyDashboard() {
  return (
    <DashboardLayout
      header={<h1>Dashboard Title</h1>}
      sidebar={<nav>Navigation</nav>}
      actionBar={<Button>Save</Button>}
      maxWidth="default"
    >
      <div>Main content goes here</div>
    </DashboardLayout>
  )
}
```

#### Features

- **Responsive Container**: Adapts padding from mobile (16px) to tablet (24px) to desktop (32px)
- **Optional Slots**: Header, sidebar, and action bar are all optional
- **Dark Mode**: Full dark mode support with proper color tokens
- **Sidebar Behavior**: 
  - Mobile: Full-width with bottom border
  - Desktop: 240px fixed width with right border
- **Action Bar**: 
  - Fixed bottom positioning
  - Semi-transparent background with backdrop blur
  - Centered button group
  - Automatically adds bottom padding to content

---

### DashboardHeader

Pre-styled header component for dashboard pages with title, metadata, and optional actions.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Main heading text |
| `metadata` | `string` | Optional | Additional metadata (e.g., count) |
| `actions` | `ReactNode` | Optional | Action buttons or controls |
| `breadcrumbs` | `ReactNode` | Optional | Breadcrumb navigation |

#### Usage

```tsx
import { DashboardHeader } from "@/components/Layout"

<DashboardHeader
  title="All Resumes"
  metadata="12 in total"
  actions={<Button>Add New</Button>}
  breadcrumbs={<Breadcrumbs />}
/>
```

#### Design Specifications

- Title: `text-2xl font-medium`
- Metadata: `text-xs font-bold text-gray-500`
- Breadcrumbs: `text-sm text-gray-600`
- Spacing: `space-y-2` between elements

---

### DashboardEmptyState

Consistent empty state pattern for dashboards with icon, message, and call-to-action.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ReactNode` | Optional | Icon component (e.g., Rocket, Search) |
| `title` | `string` | Required | Empty state heading |
| `description` | `string` | Optional | Descriptive message |
| `action` | `ReactNode` | Optional | Call-to-action button |

#### Usage

```tsx
import { DashboardEmptyState } from "@/components/Layout"
import { Rocket } from "lucide-react"

<DashboardEmptyState
  icon={<Rocket className="h-12 w-12" />}
  title="Let's get started"
  description="Create your first resume to begin."
  action={<Button>Add New</Button>}
/>
```

#### Icon Context Guidelines

- **Rocket**: Creation contexts (e.g., "Create your first item")
- **Search**: Filter/search contexts (e.g., "No results found")
- **Inbox**: Pending/waiting contexts (e.g., "No items yet")

#### Design Specifications

- Min height: 400px
- Icon color: `text-teal-500`
- Title: `text-xl font-bold`
- Description: `text-gray-600 dark:text-gray-400`
- Max width: 448px (md)

---

### DashboardCardGrid

Responsive grid layout for dashboard cards following design system patterns.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | Card components |
| `columns` | `2 \| 3 \| 4` | `3` | Number of columns on desktop |
| `className` | `string` | Optional | Additional CSS classes |

#### Usage

```tsx
import { DashboardCardGrid } from "@/components/Layout"

<DashboardCardGrid columns={3}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</DashboardCardGrid>
```

#### Responsive Behavior

| Columns | Mobile (<640px) | Tablet (640px+) | Desktop (768px+) | Large (1024px+) |
|---------|-----------------|-----------------|------------------|-----------------|
| 2 | 1 column | 2 columns | 2 columns | 2 columns |
| 3 | 2 columns | 3 columns | 3 columns | 3 columns |
| 4 | 2 columns | 2 columns | 3 columns | 4 columns |

#### Design Specifications

- Gap: 16px (gap-4)
- Breakpoints: 
  - Mobile: <640px (sm)
  - Tablet: 640px-767px
  - Desktop: 768px-1023px
  - Large: 1024px+

---

## Design System Compliance

All components follow the design system specifications:

### Color Tokens

- **Backgrounds**: `white` / `slate-950` (dark)
- **Borders**: `gray-200` / `slate-700` (dark)
- **Text**: `gray-900` / `white` (dark)
- **Accent**: `teal-500`, `teal-600`

### Spacing Scale

- **Mobile padding**: `px-4` (16px)
- **Tablet padding**: `px-6` (24px)
- **Desktop padding**: `px-8` (32px)
- **Grid gap**: `gap-4` (16px)
- **Section spacing**: `py-4` to `py-6`

### Typography

- **Page titles**: `text-2xl font-medium`
- **Metadata**: `text-xs font-bold`
- **Body text**: `text-sm` to `text-base`

### Responsive Breakpoints

- **Mobile**: <640px
- **Tablet**: 640px-767px
- **Desktop**: 768px-1023px
- **Large**: 1024px+

---

## Examples

### Basic Dashboard

```tsx
import { DashboardLayout, DashboardHeader, DashboardCardGrid } from "@/components/Layout"

export default function Dashboard() {
  return (
    <DashboardLayout
      header={
        <DashboardHeader
          title="Dashboard"
          metadata="24 items"
        />
      }
    >
      <DashboardCardGrid columns={3}>
        {items.map(item => (
          <Card key={item.id}>{item.name}</Card>
        ))}
      </DashboardCardGrid>
    </DashboardLayout>
  )
}
```

### Dashboard with Sidebar and Action Bar

```tsx
import { DashboardLayout } from "@/components/Layout"

export default function Dashboard() {
  return (
    <DashboardLayout
      sidebar={
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>Settings</li>
          </ul>
        </nav>
      }
      actionBar={
        <div className="flex gap-2">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      }
    >
      <div>Main content</div>
    </DashboardLayout>
  )
}
```

### Empty State Dashboard

```tsx
import { DashboardLayout, DashboardEmptyState } from "@/components/Layout"
import { Rocket } from "lucide-react"

export default function Dashboard() {
  const hasItems = items.length > 0

  return (
    <DashboardLayout>
      {hasItems ? (
        <div>Items grid</div>
      ) : (
        <DashboardEmptyState
          icon={<Rocket className="h-12 w-12" />}
          title="Let's get started"
          description="Create your first item to begin."
          action={<Button>Add New</Button>}
        />
      )}
    </DashboardLayout>
  )
}
```

---

## Migration Guide

### Migrating Existing Pages

To migrate an existing page to use the dashboard layout:

1. **Identify the current layout pattern**:
   ```tsx
   // Before
   <section className="w-full flex items-center justify-center">
     <div className="p-4 w-full max-w-[850px]">
       {/* Content */}
     </div>
   </section>
   ```

2. **Replace with DashboardLayout**:
   ```tsx
   // After
   import { DashboardLayout } from "@/components/Layout"
   
   <DashboardLayout maxWidth="narrow">
     {/* Content */}
   </DashboardLayout>
   ```

3. **Extract action bars**:
   ```tsx
   // Before
   <div className="fixed bottom-0 bg-white/80 backdrop-blur-sm">
     <Button>Action</Button>
   </div>
   
   // After
   <DashboardLayout
     actionBar={<Button>Action</Button>}
   >
     {/* Content */}
   </DashboardLayout>
   ```

4. **Extract headers**:
   ```tsx
   // Before
   <h3 className="text-2xl font-medium border-b pb-2">
     Title <span className="text-xs">metadata</span>
   </h3>
   
   // After
   <DashboardLayout
     header={
       <DashboardHeader
         title="Title"
         metadata="metadata"
       />
     }
   >
     {/* Content */}
   </DashboardLayout>
   ```

---

## Accessibility

All components follow WCAG AA accessibility guidelines:

- **Semantic HTML**: Proper use of `<header>`, `<main>`, `<aside>`, `<nav>`
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Proper focus states and focus trapping where needed
- **Color Contrast**: All text meets WCAG AA contrast requirements
- **Touch Targets**: Minimum 44x44px touch targets on mobile
- **Screen Readers**: Proper ARIA labels and semantic structure

---

## Performance

- **Minimal Re-renders**: Components use React best practices to minimize re-renders
- **CSS-only Animations**: Backdrop blur and transitions use CSS for better performance
- **Responsive Images**: Support for optimized images with Next.js Image component
- **Code Splitting**: Components can be lazy-loaded when needed

---

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- iOS Safari (latest 2 versions)
- Android Chrome (latest 2 versions)

---

## Related Components

- **Button**: `components/Ui/Button.tsx`
- **Card**: `components/Ui/Card.tsx` (if exists)
- **Input**: `components/Input.tsx`

---

## Contributing

When adding new dashboard patterns:

1. Follow the existing component structure
2. Use design system tokens (colors, spacing, typography)
3. Ensure dark mode support
4. Add TypeScript types
5. Document props and usage
6. Test responsive behavior
7. Verify accessibility compliance
