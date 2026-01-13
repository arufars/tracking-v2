import {
  Activity,
  Banknote,
  Calendar,
  ChartBar,
  DollarSign,
  Film,
  Fingerprint,
  FolderKanban,
  Forklift,
  Gauge,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  ReceiptText,
  Settings,
  ShoppingBag,
  SquareArrowUpRight,
  TrendingUp,
  Tv,
  Users,
  Wallet,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// 🎯 ROLE-BASED SIDEBAR ITEMS
export const getSidebarItemsByRole = (role: string): NavGroup[] => {
  switch (role) {
    case "admin":
      return adminSidebarItems;
    case "production":
      return productionSidebarItems;
    case "broadcaster":
      return broadcasterSidebarItems;
    case "investor":
      return investorSidebarItems;
    default:
      return productionSidebarItems;
  }
};

// 👑 ADMIN SIDEBAR
const adminSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        url: "/dashboard/admin/analytics",
        icon: ChartBar,
        comingSoon: true,
      },
    ],
  },
  {
    id: 2,
    label: "Management",
    items: [
      {
        title: "Users",
        url: "/dashboard/admin/users",
        icon: Users,
      },
      {
        title: "Projects",
        url: "/dashboard/admin/projects",
        icon: FolderKanban,
      },
      {
        title: "Payments",
        url: "/dashboard/admin/payments",
        icon: DollarSign,
      },
      {
        title: "Audit Logs",
        url: "/dashboard/admin/audit-logs",
        icon: Activity,
      },
    ],
  },
  {
    id: 3,
    label: "Settings",
    items: [
      {
        title: "System Settings",
        url: "/dashboard/admin/settings",
        icon: Settings,
        comingSoon: true,
      },
    ],
  },
];

// 🎬 PRODUCTION SIDEBAR
const productionSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Production",
    items: [
      {
        title: "Live Board",
        url: "/dashboard/production",
        icon: LayoutDashboard,
      },
      {
        title: "Projects",
        url: "/dashboard/production/projects",
        icon: FolderKanban,
      },
      {
        title: "Episodes",
        url: "/dashboard/production/episodes",
        icon: Film,
      },
      {
        title: "Calendar",
        url: "/dashboard/production/calendar",
        icon: Calendar,
      },
    ],
  },
  {
    id: 2,
    label: "Team",
    items: [
      {
        title: "Payments",
        url: "/dashboard/production/payments",
        icon: DollarSign,
      },
    ],
  },
];

// 📺 BROADCASTER SIDEBAR
const broadcasterSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/broadcaster",
        icon: Tv,
      },
      {
        title: "Projects",
        url: "/dashboard/broadcaster/projects",
        icon: FolderKanban,
      },
      {
        title: "Episodes",
        url: "/dashboard/broadcaster/episodes",
        icon: Film,
      },
      {
        title: "Delivery Schedule",
        url: "/dashboard/broadcaster/schedule",
        icon: Calendar,
      },
    ],
  },
];

// 💰 INVESTOR SIDEBAR
const investorSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Financial",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/investor",
        icon: Wallet,
      },
      {
        title: "Reports",
        url: "/dashboard/investor/reports",
        icon: TrendingUp,
        comingSoon: true,
      },
      {
        title: "Projects",
        url: "/dashboard/investor/projects",
        icon: FolderKanban,
        comingSoon: true,
      },
    ],
  },
];

// Default export (for backward compatibility)
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        title: "Default",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
      {
        title: "Finance",
        url: "/dashboard/finance",
        icon: Banknote,
      },
      {
        title: "Analytics",
        url: "/dashboard/coming-soon",
        icon: Gauge,
        comingSoon: true,
      },
      {
        title: "E-commerce",
        url: "/dashboard/coming-soon",
        icon: ShoppingBag,
        comingSoon: true,
      },
      {
        title: "Academy",
        url: "/dashboard/coming-soon",
        icon: GraduationCap,
        comingSoon: true,
      },
      {
        title: "Logistics",
        url: "/dashboard/coming-soon",
        icon: Forklift,
        comingSoon: true,
      },
    ],
  },
  {
    id: 2,
    label: "Pages",
    items: [
      {
        title: "Email",
        url: "/dashboard/coming-soon",
        icon: Mail,
        comingSoon: true,
      },
      {
        title: "Chat",
        url: "/dashboard/coming-soon",
        icon: MessageSquare,
        comingSoon: true,
      },
      {
        title: "Calendar",
        url: "/dashboard/coming-soon",
        icon: Calendar,
        comingSoon: true,
      },
      {
        title: "Kanban",
        url: "/dashboard/coming-soon",
        icon: Kanban,
        comingSoon: true,
      },
      {
        title: "Invoice",
        url: "/dashboard/coming-soon",
        icon: ReceiptText,
        comingSoon: true,
      },
      {
        title: "Users",
        url: "/dashboard/coming-soon",
        icon: Users,
        comingSoon: true,
      },
      {
        title: "Roles",
        url: "/dashboard/coming-soon",
        icon: Lock,
        comingSoon: true,
      },
      {
        title: "Authentication",
        url: "/auth",
        icon: Fingerprint,
        subItems: [
          { title: "Login v1", url: "/auth/v1/login", newTab: true },
          { title: "Login v2", url: "/auth/v2/login", newTab: true },
          { title: "Register v1", url: "/auth/v1/register", newTab: true },
          { title: "Register v2", url: "/auth/v2/register", newTab: true },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Misc",
    items: [
      {
        title: "Others",
        url: "/dashboard/coming-soon",
        icon: SquareArrowUpRight,
        comingSoon: true,
      },
    ],
  },
];
