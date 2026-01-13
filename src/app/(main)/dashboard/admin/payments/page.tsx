import { Suspense } from "react";

import { redirect } from "next/navigation";

import { Clock, DollarSign, Edit, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Payments List Component
async function PaymentsList() {
  const supabase = await createSupabaseServerClient();

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      id,
      description,
      amount,
      payment_type,
      recipient_name,
      status,
      due_date,
      paid_at,
      created_at,
      projects(title),
      episodes(episode_number, title)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const statusColors: Record<string, string> = {
    unpaid: "bg-red-100 text-red-800 ring-red-600/20",
    partial: "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
    paid: "bg-green-100 text-green-800 ring-green-600/20",
  };

  const typeColors: Record<string, string> = {
    honor: "bg-purple-100 text-purple-800",
    salary: "bg-blue-100 text-blue-800",
    party_cash: "bg-pink-100 text-pink-800",
    vendor: "bg-orange-100 text-orange-800",
    other: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payments Management</CardTitle>
            <CardDescription>Track and manage project payments</CardDescription>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Payment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project / Episode</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.map((payment) => {
              const isOverdue =
                payment.status !== "paid" && payment.due_date && new Date(payment.due_date) < new Date();

              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{(payment.projects as any)?.title || "N/A"}</span>
                      {payment.episodes && (
                        <span className="text-xs text-muted-foreground">
                          Ep {(payment.episodes as any)?.episode_number}: {(payment.episodes as any)?.title}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={payment.description || ""}>
                      {payment.description || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{payment.recipient_name || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${typeColors[payment.payment_type || "other"]}`}>
                      {payment.payment_type?.replace("_", " ") || "other"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    Rp {(Number(payment.amount) / 1000000).toFixed(2)}M
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${statusColors[payment.status]}`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.due_date ? (
                      <div className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                        {new Date(payment.due_date).toLocaleDateString()}
                        {isOverdue && <div className="text-xs text-red-600">Overdue</div>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {(!payments || payments.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No payments recorded</p>
            <p className="text-sm mt-1">Add your first payment to start tracking</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stats Overview
async function PaymentsStats() {
  const supabase = await createSupabaseServerClient();

  const { data: payments } = await supabase.from("payments").select("amount, status, due_date");

  const totalAmount = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
  const paidAmount =
    payments?.filter((p) => p.status === "paid").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
  const unpaidAmount =
    payments?.filter((p) => p.status === "unpaid").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
  const partialAmount =
    payments?.filter((p) => p.status === "partial").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

  const overdueCount =
    payments?.filter((p) => p.status !== "paid" && p.due_date && new Date(p.due_date) < new Date()).length || 0;

  const stats = [
    {
      label: "Total Payments",
      value: `Rp ${(totalAmount / 1000000).toFixed(1)}M`,
      color: "text-blue-600",
      icon: DollarSign,
      description: `${payments?.length || 0} transactions`,
    },
    {
      label: "Paid",
      value: `Rp ${(paidAmount / 1000000).toFixed(1)}M`,
      color: "text-green-600",
      icon: TrendingUp,
      description: `${((paidAmount / totalAmount) * 100 || 0).toFixed(0)}% completed`,
    },
    {
      label: "Unpaid",
      value: `Rp ${(unpaidAmount / 1000000).toFixed(1)}M`,
      color: "text-red-600",
      icon: TrendingDown,
      description: `${payments?.filter((p) => p.status === "unpaid").length || 0} pending`,
    },
    {
      label: "Overdue",
      value: overdueCount,
      color: "text-orange-600",
      icon: Clock,
      description: overdueCount > 0 ? "Needs attention" : "All on track",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Payment Type Breakdown
async function PaymentTypeBreakdown() {
  const supabase = await createSupabaseServerClient();

  const { data: payments } = await supabase.from("payments").select("payment_type, amount");

  const typeBreakdown = payments?.reduce(
    (acc, p) => {
      const type = p.payment_type || "other";
      if (!acc[type]) {
        acc[type] = { count: 0, total: 0 };
      }
      acc[type].count += 1;
      acc[type].total += Number(p.amount) || 0;
      return acc;
    },
    {} as Record<string, { count: number; total: number }>,
  );

  const typeColors: Record<string, string> = {
    honor: "bg-purple-100 text-purple-800",
    salary: "bg-blue-100 text-blue-800",
    party_cash: "bg-pink-100 text-pink-800",
    vendor: "bg-orange-100 text-orange-800",
    other: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Type Breakdown</CardTitle>
        <CardDescription>Spending by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(typeBreakdown || {}).map(([type, data]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`capitalize ${typeColors[type]}`}>
                  {type.replace("_", " ")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {data.count} {data.count === 1 ? "payment" : "payments"}
                </span>
              </div>
              <span className="font-medium">Rp {(data.total / 1000000).toFixed(2)}M</span>
            </div>
          ))}
        </div>

        {(!typeBreakdown || Object.keys(typeBreakdown).length === 0) && (
          <div className="text-center py-6 text-muted-foreground text-sm">No payment data yet</div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function PaymentsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Page Component
export default async function PaymentsManagementPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (userProfile?.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments Management</h1>
        <p className="text-muted-foreground">Track project expenses, salaries, and vendor payments</p>
      </div>

      <Suspense fallback={<Skeleton className="h-24" />}>
        <PaymentsStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Suspense fallback={<PaymentsListSkeleton />}>
            <PaymentsList />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <PaymentTypeBreakdown />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
