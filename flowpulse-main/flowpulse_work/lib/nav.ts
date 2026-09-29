import {
  Activity,
  Clock,
  Waypoints,
  Building2,
  BedDouble,
  Users,
  Compass,
  Waves,
  FlaskConical,
  ChartLine,
  Cable,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  description: string
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Operations',
    items: [
      {
        title: 'Command Center',
        href: '/staff',
        icon: Activity,
        description: 'Live hospital-wide flow overview',
      },
      {
        title: 'Live Queues',
        href: '/staff/live-queues',
        icon: Clock,
        description: 'Real-time department queues & predictions',
      },
      {
        title: 'Patient Flow',
        href: '/staff/patient-flow',
        icon: Waypoints,
        description: 'Admission-to-discharge journey mapping',
      },
      {
        title: 'Campus & Locations',
        href: '/campus-map',
        icon: Compass,
        description: 'Multi-hospital indoor location tracking',
      },
      {
        title: 'Departments',
        href: '/staff/departments',
        icon: Building2,
        description: 'Unit-level performance and load',
      },
      {
        title: 'Beds & Capacity',
        href: '/staff/beds-capacity',
        icon: BedDouble,
        description: 'Real-time bed availability and turnover',
      },
      {
        title: 'Staff Operations',
        href: '/staff/staff-operations',
        icon: Users,
        description: 'Staffing levels, ratios and coverage',
      },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        title: 'Ripple Analysis',
        href: '/staff/ripple-analysis',
        icon: Waves,
        description: 'Downstream impact of upstream events',
      },
      {
        title: 'Scenario Simulator',
        href: '/staff/scenario-simulator',
        icon: FlaskConical,
        description: 'Counterfactual "what-if" modeling',
      },
      {
        title: 'Analytics',
        href: '/staff/analytics',
        icon: ChartLine,
        description: 'Historical trends and reporting',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        title: 'Integrations',
        href: '/staff/integrations',
        icon: Cable,
        description: 'EHR, ADT and data source connections',
      },
      {
        title: 'Settings',
        href: '/staff/settings',
        icon: Settings,
        description: 'Workspace and platform configuration',
      },
    ],
  },
]

export const navItems: NavItem[] = navSections.flatMap((s) => s.items)

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === '/staff') return navItems.find((i) => i.href === '/staff')
  // Match the most specific non-root route
  return navItems
    .filter((i) => i.href !== '/staff')
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
}
