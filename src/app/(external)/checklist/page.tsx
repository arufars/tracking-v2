"use client";

import { useEffect, useState } from "react";

import { CheckCircle2, Circle, Download, Printer, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

export default function ChecklistPage() {
  const [checklist, setChecklist] = useState<Record<string, ChecklistSection>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved state from localStorage
    const saved = localStorage.getItem("dreamlight-checklist");
    if (saved) {
      setChecklist(JSON.parse(saved));
    } else {
      setChecklist(initialChecklist);
    }
  }, []);

  useEffect(() => {
    if (mounted && Object.keys(checklist).length > 0) {
      localStorage.setItem("dreamlight-checklist", JSON.stringify(checklist));
    }
  }, [checklist, mounted]);

  const toggleItem = (sectionKey: string, itemId: string) => {
    setChecklist((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        items: prev[sectionKey].items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)),
      },
    }));
  };

  const resetChecklist = () => {
    if (confirm("Apakah Anda yakin ingin reset semua checklist?")) {
      setChecklist(initialChecklist);
      localStorage.removeItem("dreamlight-checklist");
    }
  };

  const calculateProgress = (sectionKey: string) => {
    const section = checklist[sectionKey];
    if (!section || section.items.length === 0) return 0;
    const checked = section.items.filter((item) => item.checked).length;
    return Math.round((checked / section.items.length) * 100);
  };

  const calculateOverallProgress = () => {
    const allItems = Object.values(checklist).flatMap((section) => section.items);
    if (allItems.length === 0) return 0;
    const checked = allItems.filter((item) => item.checked).length;
    return Math.round((checked / allItems.length) * 100);
  };

  if (!mounted) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Work in Progress
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Checklist Implementasi Sistem</h1>
          <p className="text-xl text-muted-foreground">Dreamlight World Media Production Tracking System</p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>📅 Dibuat: 8 Januari 2026</span>
            <Separator orientation="vertical" className="h-4" />
            <span>🔄 Status: In Progress</span>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall Progress</span>
              <Badge variant={overallProgress === 100 ? "default" : "secondary"} className="text-lg px-4 py-1">
                {overallProgress}%
              </Badge>
            </CardTitle>
            <CardDescription>Total progress implementasi sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={resetChecklist}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset Checklist
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/docs/CHECKLIST_IMPLEMENTASI_SISTEM.md" download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Markdown
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="roles">👥 Roles</TabsTrigger>
            <TabsTrigger value="security">🔒 Keamanan</TabsTrigger>
            <TabsTrigger value="project">📁 Proyek</TabsTrigger>
            <TabsTrigger value="budget">💰 Anggaran</TabsTrigger>
            <TabsTrigger value="notification">🔔 Notifikasi</TabsTrigger>
            <TabsTrigger value="report">📊 Laporan</TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <RoleCard
                role="Tim Produksi"
                emoji="👨‍💼"
                description="Full access - Kelola semua aspek produksi"
                color="bg-blue-500/10 border-blue-500/20"
                sectionKey="role_production"
                checklist={checklist}
                toggleItem={toggleItem}
                progress={calculateProgress("role_production")}
              />
              <RoleCard
                role="Broadcaster/Client"
                emoji="📺"
                description="Read-only - Monitor progress & delivery"
                color="bg-green-500/10 border-green-500/20"
                sectionKey="role_broadcaster"
                checklist={checklist}
                toggleItem={toggleItem}
                progress={calculateProgress("role_broadcaster")}
              />
              <RoleCard
                role="Investor"
                emoji="💼"
                description="High-level - Financial summary & ROI"
                color="bg-purple-500/10 border-purple-500/20"
                sectionKey="role_investor"
                checklist={checklist}
                toggleItem={toggleItem}
                progress={calculateProgress("role_investor")}
              />
            </div>

            {/* Insight dari Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Insight dari Checklist</CardTitle>
                <CardDescription>Ringkasan fitur yang sudah ada vs belum ada per role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Tim Produksi Insight */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">👨‍💼</span>
                      <div>
                        <h3 className="font-semibold text-lg">Tim Produksi</h3>
                        <p className="text-sm text-muted-foreground">
                          {calculateProgress("role_production")}% (
                          {checklist.role_production?.items.filter((i) => i.checked).length}/
                          {checklist.role_production?.items.length} fitur)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">Sudah ada:</span>
                        </div>
                        <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                          <li>• Project CRUD</li>
                          <li>• Episode Management</li>
                          <li>• User Management</li>
                          <li>• Basic dashboard</li>
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Circle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-sm">Belum ada:</span>
                        </div>
                        <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                          <li>• Milestone Management</li>
                          <li>• Budget tracking lengkap</li>
                          <li>• Team Payment</li>
                          <li>• Notification System</li>
                          <li>• Automated Reports</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Broadcaster Insight */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📺</span>
                      <div>
                        <h3 className="font-semibold text-lg">Broadcaster</h3>
                        <p className="text-sm text-muted-foreground">
                          {calculateProgress("role_broadcaster")}% (
                          {checklist.role_broadcaster?.items.filter((i) => i.checked).length}/
                          {checklist.role_broadcaster?.items.length} fitur)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">Sudah ada:</span>
                        </div>
                        <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                          <li>• View own projects</li>
                          <li>• View episode status & details</li>
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Circle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-sm">Belum ada:</span>
                        </div>
                        <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                          <li>• Dashboard khusus broadcaster</li>
                          <li>• Delivery schedule view</li>
                          <li>• File download</li>
                          <li>• Notifications</li>
                          <li>• Progress reports</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Investor Insight */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">💼</span>
                      <div>
                        <h3 className="font-semibold text-lg">Investor</h3>
                        <p className="text-sm text-muted-foreground">
                          {calculateProgress("role_investor")}% (
                          {checklist.role_investor?.items.filter((i) => i.checked).length}/
                          {checklist.role_investor?.items.length} fitur)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Circle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-sm">Belum ada:</span>
                        </div>
                        <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                          <li>• Dashboard investor</li>
                          <li>• Portfolio overview</li>
                          <li>• Financial summary charts</li>
                          <li>• ROI tracking</li>
                          <li>• Monthly reports</li>
                        </ul>
                        <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-muted">
                          <p className="text-xs text-muted-foreground italic">
                            💡 Semua fitur investor masuk Phase 3 (Advanced Features)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Perbandingan Akses Per Role</CardTitle>
                <CardDescription>Tabel perbandingan fitur yang dapat diakses oleh setiap role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Fitur</th>
                        <th className="text-center py-3 px-4 font-semibold">Tim Produksi</th>
                        <th className="text-center py-3 px-4 font-semibold">Broadcaster</th>
                        <th className="text-center py-3 px-4 font-semibold">Investor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-3 px-4 font-medium">Project Management</td>
                        <td className="text-center py-3 px-4">✅ CRUD All</td>
                        <td className="text-center py-3 px-4">📖 Read Own</td>
                        <td className="text-center py-3 px-4">📊 Summary</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Episode Management</td>
                        <td className="text-center py-3 px-4">✅ CRUD All</td>
                        <td className="text-center py-3 px-4">📖 Read Own</td>
                        <td className="text-center py-3 px-4">❌ No Access</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Financial Details</td>
                        <td className="text-center py-3 px-4">✅ View All</td>
                        <td className="text-center py-3 px-4">❌ No Access</td>
                        <td className="text-center py-3 px-4">📊 % Only</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Team Payments</td>
                        <td className="text-center py-3 px-4">✅ CRUD All</td>
                        <td className="text-center py-3 px-4">❌ No Access</td>
                        <td className="text-center py-3 px-4">❌ No Access</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Reports</td>
                        <td className="text-center py-3 px-4">✅ Generate All</td>
                        <td className="text-center py-3 px-4">📖 Progress</td>
                        <td className="text-center py-3 px-4">💰 Financial</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">User Management</td>
                        <td className="text-center py-3 px-4">✅ CRUD All</td>
                        <td className="text-center py-3 px-4">❌ No Access</td>
                        <td className="text-center py-3 px-4">❌ No Access</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <ChecklistCard
              title="🔒 Mekanisme Keamanan dan Akses"
              description="Implementasi security dan authorization system"
              sectionKey="security"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("security")}
            />
          </TabsContent>

          {/* Project Tab */}
          <TabsContent value="project" className="space-y-6">
            <ChecklistCard
              title="📁 Manajemen Proyek"
              description="CRUD operations dan project management"
              sectionKey="project"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("project")}
            />
            <ChecklistCard
              title="🎬 Episode Management"
              description="Kelola episode untuk project series"
              sectionKey="episode"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("episode")}
            />
            <ChecklistCard
              title="🎯 Milestone Management"
              description="Tracking milestone dan deadline"
              sectionKey="milestone"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("milestone")}
            />
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6">
            <ChecklistCard
              title="💰 Manajemen Anggaran"
              description="Budget planning, tracking, dan alerts"
              sectionKey="budget"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("budget")}
            />
            <ChecklistCard
              title="💳 Team Payment Management"
              description="Kelola pembayaran honor, gaji, dan petty cash"
              sectionKey="payment"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("payment")}
            />
          </TabsContent>

          {/* Notification Tab */}
          <TabsContent value="notification" className="space-y-6">
            <ChecklistCard
              title="🔔 Sistem Notifikasi"
              description="Automated notifications untuk berbagai events"
              sectionKey="notification"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("notification")}
            />
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-6">
            <ChecklistCard
              title="📊 Laporan Otomatis"
              description="Daily, weekly, dan monthly reports"
              sectionKey="report"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("report")}
            />
            <ChecklistCard
              title="📈 Analytics & Insights"
              description="Data visualization dan analytics"
              sectionKey="analytics"
              checklist={checklist}
              toggleItem={toggleItem}
              progress={calculateProgress("analytics")}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Dibuat oleh Dreamlight World Media Development Team</p>
          <p className="mt-1">Terakhir Diupdate: 8 Januari 2026</p>
        </div>
      </div>
    </div>
  );
}

interface RoleCardProps {
  role: string;
  emoji: string;
  description: string;
  color: string;
  sectionKey: string;
  checklist: Record<string, ChecklistSection>;
  toggleItem: (sectionKey: string, itemId: string) => void;
  progress: number;
}

function RoleCard({ role, emoji, description, color, sectionKey, checklist, toggleItem, progress }: RoleCardProps) {
  const section = checklist[sectionKey];

  if (!section || section.items.length === 0) {
    return null;
  }

  return (
    <Card className={`${color} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-4xl">{emoji}</span>
          <Badge variant={progress === 100 ? "default" : progress > 0 ? "secondary" : "outline"}>{progress}%</Badge>
        </div>
        <CardTitle className="text-xl">{role}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {section.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 rounded hover:bg-background/50 transition-colors cursor-pointer"
              onClick={() => toggleItem(sectionKey, item.id)}
            >
              <div className="mt-0.5">
                {item.checked ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span
                className={`flex-1 text-xs leading-relaxed ${
                  item.checked ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChecklistCardProps {
  role_production: {
    title: "Tim Produksi";
    items: [
      { id: "prod-1"; label: "Dashboard Tim Produksi dengan overview cards"; checked: true },
      { id: "prod-2"; label: "Project CRUD (Create, Read, Update, Delete/Archive)"; checked: true },
      { id: "prod-3"; label: "Episode Management dengan 6 status"; checked: true },
      { id: "prod-4"; label: "Milestone Management (public & internal)"; checked: false },
      { id: "prod-5"; label: "Budget Planning & Tracking (5 kategori)"; checked: false },
      { id: "prod-6"; label: "Expense Tracking dengan approval workflow"; checked: false },
      { id: "prod-7"; label: "Income Tracking & Account Receivable"; checked: false },
      { id: "prod-8"; label: "Team Payment Management (Honor, Gaji, Petty Cash)"; checked: false },
      { id: "prod-9"; label: "User Management (Create, Edit, Assign Role)"; checked: true },
      { id: "prod-10"; label: "Delivery Schedule Management"; checked: false },
      { id: "prod-11"; label: "Notification System (Send & Receive)"; checked: false },
      { id: "prod-12"; label: "Report Generation (Daily, Weekly, Monthly)"; checked: false },
      { id: "prod-13"; label: "Budget Alert System (90%, 95%, 100%)"; checked: false },
      { id: "prod-14"; label: "Payment Reminder System"; checked: false },
      { id: "prod-15"; label: "Audit Log Viewer"; checked: false },
    ];
  };
  role_broadcaster: {
    title: "Broadcaster/Client";
    items: [
      { id: "broad-1"; label: "Dashboard Broadcaster dengan project overview"; checked: false },
      { id: "broad-2"; label: "View Own Projects (read-only)"; checked: true },
      { id: "broad-3"; label: "View Production Status (Pre/Production/Post)"; checked: false },
      { id: "broad-4"; label: "View Episode Status (untuk series)"; checked: true },
      { id: "broad-5"; label: "View Episode Details dengan progress"; checked: true },
      { id: "broad-6"; label: "View Public Milestones only"; checked: false },
      { id: "broad-7"; label: "View Delivery Schedule"; checked: false },
      { id: "broad-8"; label: "Download Delivered Files"; checked: false },
      { id: "broad-9"; label: "View Project Timeline"; checked: false },
      { id: "broad-10"; label: "Receive Delivery Notifications"; checked: false },
      { id: "broad-11"; label: "Receive Episode Status Notifications"; checked: false },
      { id: "broad-12"; label: "Weekly Progress Report (email)"; checked: false },
      { id: "broad-13"; label: "Monthly Progress Summary"; checked: false },
      { id: "broad-14"; label: "Contact Production Team (support)"; checked: false },
      { id: "broad-15"; label: "Submit Feedback on Deliverables"; checked: false },
    ];
  };
  role_investor: {
    title: "Investor";
    items: [
      { id: "inv-1"; label: "Dashboard Investor dengan portfolio overview"; checked: false },
      { id: "inv-2"; label: "View All Projects (high-level summary)"; checked: false },
      { id: "inv-3"; label: "View Overall Progress (percentage only)"; checked: false },
      { id: "inv-4"; label: "View Budget Utilization (percentage, no details)"; checked: false },
      { id: "inv-5"; label: "View Expense Progress (percentage only)"; checked: false },
      { id: "inv-6"; label: "View Income Status (percentage received/pending)"; checked: false },
      { id: "inv-7"; label: "View Project Completion Rate"; checked: false },
      { id: "inv-8"; label: "View Public Milestones only"; checked: false },
      { id: "inv-9"; label: "Financial Summary Chart"; checked: false },
      { id: "inv-10"; label: "ROI Tracking Dashboard"; checked: false },
      { id: "inv-11"; label: "Risk Indicators (overbudget, delayed)"; checked: false },
      { id: "inv-12"; label: "Monthly Financial Report (email)"; checked: false },
      { id: "inv-13"; label: "Quarterly Business Review Report"; checked: false },
      { id: "inv-14"; label: "Export to PDF for board meetings"; checked: false },
      { id: "inv-15"; label: "Portfolio Performance Analytics"; checked: false },
    ];
  };
  title: string;
  description: string;
  sectionKey: string;
  checklist: Record<string, ChecklistSection>;
  toggleItem: (sectionKey: string, itemId: string) => void;
  progress: number;
}

function ChecklistCard({ title, description, sectionKey, checklist, toggleItem, progress }: ChecklistCardProps) {
  const section = checklist[sectionKey];

  if (!section || section.items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={progress === 100 ? "default" : progress > 0 ? "secondary" : "outline"}>{progress}%</Badge>
        </div>
        <Progress value={progress} className="h-2 mt-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {section.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => toggleItem(sectionKey, item.id)}
            >
              <div className="mt-0.5">
                {item.checked ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <span
                className={`flex-1 text-sm leading-relaxed ${
                  item.checked ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Initial checklist data
const initialChecklist: Record<string, ChecklistSection> = {
  security: {
    title: "Keamanan",
    items: [
      { id: "sec-1", label: "Login dengan email dan password", checked: true },
      { id: "sec-2", label: "Session management dengan Supabase Auth", checked: true },
      { id: "sec-3", label: "Token refresh otomatis", checked: true },
      { id: "sec-4", label: "Logout functionality", checked: true },
      { id: "sec-5", label: "Role assignment di database (users.role)", checked: true },
      { id: "sec-6", label: "Middleware untuk route protection", checked: true },
      { id: "sec-7", label: "Server-side role checking", checked: true },
      { id: "sec-8", label: "Client-side UI conditional rendering", checked: true },
      { id: "sec-9", label: "RLS policies untuk tabel projects", checked: false },
      { id: "sec-10", label: "RLS policies untuk tabel episodes", checked: false },
      { id: "sec-11", label: "RLS policies untuk tabel finances", checked: false },
      { id: "sec-12", label: "RLS policies untuk tabel team_payments", checked: false },
      { id: "sec-13", label: "RLS policies untuk tabel milestones", checked: false },
      { id: "sec-14", label: "Log setiap akses data sensitif", checked: false },
      { id: "sec-15", label: "Track perubahan data penting", checked: false },
      { id: "sec-16", label: "Monitor failed authorization attempts", checked: false },
    ],
  },
  project: {
    title: "Manajemen Proyek",
    items: [
      { id: "proj-1", label: "Create project (Tim Produksi only)", checked: true },
      { id: "proj-2", label: "Read project (sesuai role)", checked: true },
      { id: "proj-3", label: "Update project (Tim Produksi only)", checked: true },
      { id: "proj-4", label: "Delete/Archive project (Admin only)", checked: false },
      { id: "proj-5", label: "Field validation dengan Zod", checked: true },
      { id: "proj-6", label: "Auto-assign creator ke project", checked: true },
      { id: "proj-7", label: "Project status management (active, completed, archived)", checked: true },
      { id: "proj-8", label: "Project type support (film, series, documentary, variety)", checked: true },
    ],
  },
  episode: {
    title: "Episode Management",
    items: [
      { id: "ep-1", label: "Episode CRUD operations", checked: true },
      { id: "ep-2", label: "Episode status: Pre-Production", checked: true },
      { id: "ep-3", label: "Episode status: Production", checked: true },
      { id: "ep-4", label: "Episode status: Post-Production", checked: true },
      { id: "ep-5", label: "Episode status: Review", checked: false },
      { id: "ep-6", label: "Episode status: Master Ready", checked: true },
      { id: "ep-7", label: "Episode status: Delivered", checked: false },
      { id: "ep-8", label: "Episode filters dan search", checked: true },
      { id: "ep-9", label: "Episode detail view", checked: true },
      { id: "ep-10", label: "Episode timeline", checked: false },
      { id: "ep-11", label: "Batch operations (bulk status update)", checked: false },
    ],
  },
  milestone: {
    title: "Milestone Management",
    items: [
      { id: "ms-1", label: "Milestone CRUD", checked: false },
      { id: "ms-2", label: "Milestone status tracking", checked: false },
      { id: "ms-3", label: "Milestone visibility control (public vs internal)", checked: false },
      { id: "ms-4", label: "Milestone reminders", checked: false },
      { id: "ms-5", label: "Milestone dependencies", checked: false },
      { id: "ms-6", label: "Critical path visualization", checked: false },
    ],
  },
  budget: {
    title: "Manajemen Anggaran",
    items: [
      { id: "bud-1", label: "Set total budget per project", checked: true },
      { id: "bud-2", label: "Kategori budget (5 kategori standar)", checked: false },
      { id: "bud-3", label: "Alokasi persentase per kategori", checked: false },
      { id: "bud-4", label: "Alert threshold settings", checked: false },
      { id: "bud-5", label: "Real-time expense tracking", checked: false },
      { id: "bud-6", label: "Budget vs actual comparison", checked: false },
      { id: "bud-7", label: "Percentage used calculation", checked: false },
      { id: "bud-8", label: "Remaining budget display", checked: false },
      { id: "bud-9", label: "Alert at 90% usage", checked: false },
      { id: "bud-10", label: "Alert at 95% usage", checked: false },
      { id: "bud-11", label: "Alert at 100% usage (over budget)", checked: false },
      { id: "bud-12", label: "Notification to Tim Produksi & Finance", checked: false },
      { id: "bud-13", label: "Transfer budget antar kategori", checked: false },
      { id: "bud-14", label: "Approval workflow", checked: false },
      { id: "bud-15", label: "History tracking", checked: false },
    ],
  },
  payment: {
    title: "Team Payment",
    items: [
      { id: "pay-1", label: "Payment types: Honor (project-based)", checked: false },
      { id: "pay-2", label: "Payment types: Gaji (monthly salary)", checked: false },
      { id: "pay-3", label: "Payment types: Petty Cash", checked: false },
      { id: "pay-4", label: "Payment scheduling", checked: false },
      { id: "pay-5", label: "Payment calendar view", checked: false },
      { id: "pay-6", label: "Payment history", checked: false },
      { id: "pay-7", label: "Payment reminders", checked: false },
      { id: "pay-8", label: "Receipt generation", checked: false },
    ],
  },
  notification: {
    title: "Notifikasi",
    items: [
      { id: "not-1", label: "Milestone reminder H-7", checked: false },
      { id: "not-2", label: "Milestone reminder H-3", checked: false },
      { id: "not-3", label: "Milestone reminder H-1", checked: false },
      { id: "not-4", label: "Milestone overdue alert", checked: false },
      { id: "not-5", label: "Delivery reminder H-7", checked: false },
      { id: "not-6", label: "Delivery reminder H-3", checked: false },
      { id: "not-7", label: "Delivery confirmation", checked: false },
      { id: "not-8", label: "Payment due reminder H-7", checked: false },
      { id: "not-9", label: "Payment due reminder H-3", checked: false },
      { id: "not-10", label: "Payment due reminder H-1", checked: false },
      { id: "not-11", label: "Payment completed confirmation", checked: false },
      { id: "not-12", label: "Budget 90% warning", checked: false },
      { id: "not-13", label: "Budget 95% critical alert", checked: false },
      { id: "not-14", label: "Budget 100% exceeded emergency", checked: false },
      { id: "not-15", label: "Episode status change notification", checked: false },
      { id: "not-16", label: "Episode master ready notification", checked: false },
      { id: "not-17", label: "Episode revision request notification", checked: false },
      { id: "not-18", label: "In-app notifications UI", checked: false },
      { id: "not-19", label: "Email notifications", checked: false },
      { id: "not-20", label: "Database trigger setup", checked: false },
      { id: "not-21", label: "Notification queue", checked: false },
      { id: "not-22", label: "Email integration (SMTP/SendGrid)", checked: false },
      { id: "not-23", label: "Notification preferences", checked: false },
      { id: "not-24", label: "Notification history", checked: false },
    ],
  },
  report: {
    title: "Laporan",
    items: [
      { id: "rep-1", label: "Daily Reports: Tasks completed today", checked: false },
      { id: "rep-2", label: "Daily Reports: Expenses recorded today", checked: false },
      { id: "rep-3", label: "Daily Reports: Milestones due today", checked: false },
      { id: "rep-4", label: "Daily Reports: Email summary format", checked: false },
      { id: "rep-5", label: "Weekly Reports: Project progress summary", checked: false },
      { id: "rep-6", label: "Weekly Reports: Budget utilization per project", checked: false },
      { id: "rep-7", label: "Weekly Reports: Upcoming milestones", checked: false },
      { id: "rep-8", label: "Weekly Reports: Overdue tasks/milestones", checked: false },
      { id: "rep-9", label: "Weekly Reports: PDF + Email format", checked: false },
      { id: "rep-10", label: "Monthly Reports: Financial summary", checked: false },
      { id: "rep-11", label: "Monthly Reports: Productivity metrics", checked: false },
      { id: "rep-12", label: "Monthly Reports: Budget performance analysis", checked: false },
      { id: "rep-13", label: "Monthly Reports: Project completion rates", checked: false },
      { id: "rep-14", label: "Monthly Reports: Excel + PDF format", checked: false },
      { id: "rep-15", label: "Custom Reports: On-demand generation", checked: false },
      { id: "rep-16", label: "Custom Reports: Custom date range", checked: false },
      { id: "rep-17", label: "Custom Reports: Custom filters", checked: false },
      { id: "rep-18", label: "Custom Reports: Multiple export formats", checked: false },
      { id: "rep-19", label: "Report generation engine", checked: false },
      { id: "rep-20", label: "PDF generation (jsPDF/Puppeteer)", checked: false },
      { id: "rep-21", label: "Excel export (ExcelJS)", checked: false },
      { id: "rep-22", label: "Scheduled jobs (Cron/Vercel Cron)", checked: false },
      { id: "rep-23", label: "Report templates", checked: false },
      { id: "rep-24", label: "Email delivery", checked: false },
    ],
  },
  analytics: {
    title: "Analytics",
    items: [
      { id: "ana-1", label: "Budget utilization charts", checked: false },
      { id: "ana-2", label: "Project progress tracking", checked: false },
      { id: "ana-3", label: "Team productivity metrics", checked: false },
      { id: "ana-4", label: "Financial forecasting", checked: false },
      { id: "ana-5", label: "Trend analysis", checked: false },
      { id: "ana-6", label: "Export to BI tools", checked: false },
    ],
  },
};
