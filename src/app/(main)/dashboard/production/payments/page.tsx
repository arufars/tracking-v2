import { redirect } from "next/navigation";

import { AlertCircle, CheckCircle2, Clock, CreditCard, DollarSign, TrendingUp, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Team Payments",
  description: "Track internal team payments",
};

interface Payment {
  id: string;
  project_name: string;
  recipient_name: string;
  amount: number;
  payment_type: string;
  payment_status: string;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
}

interface PaymentSummary {
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  payment_count: number;
}

async function getProductionPayments(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Get projects where user is a team member
  const { data: userProjects } = await supabase.from("user_projects").select("project_id").eq("user_id", userId);

  const projectIds = userProjects?.map((up) => up.project_id) || [];

  if (projectIds.length === 0) {
    return { payments: [], summary: null };
  }

  // Get payments for these projects
  const { data: payments, error } = await supabase
    .from("payments")
    .select(
      `
      *,
      projects!inner (
        project_name
      ),
      users!payments_recipient_id_fkey (
        full_name
      )
    `,
    )
    .in("project_id", projectIds)
    .order("payment_date", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Error fetching payments:", error);
    return { payments: [], summary: null };
  }

  const processedPayments: Payment[] =
    payments?.map((payment: any) => ({
      id: payment.id,
      project_name: payment.projects.project_name,
      recipient_name: payment.users.full_name,
      amount: payment.amount,
      payment_type: payment.payment_type,
      payment_status: payment.payment_status,
      payment_date: payment.payment_date,
      notes: payment.notes,
      created_at: payment.created_at,
    })) || [];

  // Calculate summary
  const totalPaid = processedPayments.filter((p) => p.payment_status === "paid").reduce((sum, p) => sum + p.amount, 0);

  const totalPending = processedPayments
    .filter((p) => p.payment_status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const today = new Date();
  const totalOverdue = processedPayments
    .filter((p) => {
      if (p.payment_status !== "pending" || !p.payment_date) return false;
      return new Date(p.payment_date) < today;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const summary: PaymentSummary = {
    total_paid: totalPaid,
    total_pending: totalPending,
    total_overdue: totalOverdue,
    payment_count: processedPayments.length,
  };

  return { payments: processedPayments, summary };
}

const PAYMENT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  honor: {
    label: "Honor",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Wallet,
  },
  salary: {
    label: "Salary",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CreditCard,
  },
  "petty-cash": {
    label: "Petty Cash",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: DollarSign,
  },
  bonus: {
    label: "Bonus",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: TrendingUp,
  },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Paid", variant: "outline" },
  pending: { label: "Pending", variant: "secondary" },
  overdue: { label: "Overdue", variant: "destructive" },
};

function PaymentCard({ payment }: { payment: Payment }) {
  const typeConfig = PAYMENT_TYPE_CONFIG[payment.payment_type] || PAYMENT_TYPE_CONFIG.honor;
  const Icon = typeConfig.icon;

  const isOverdue =
    payment.payment_status === "pending" && payment.payment_date && new Date(payment.payment_date) < new Date();

  const statusConfig = isOverdue
    ? STATUS_CONFIG.overdue
    : STATUS_CONFIG[payment.payment_status] || STATUS_CONFIG.pending;

  return (
    <Card className={cn("transition-all hover:shadow-md", isOverdue && "border-red-500 border-2")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn(typeConfig.bgColor, typeConfig.color)}>
                <Icon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <CardTitle className="text-base">{payment.recipient_name}</CardTitle>
            <CardDescription className="text-sm">{payment.project_name}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">Rp {payment.amount.toLocaleString("id-ID")}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Payment Date */}
        {payment.payment_date && (
          <div className={cn("flex items-center gap-2 text-sm", isOverdue && "text-red-600 font-medium")}>
            <Clock className="h-4 w-4" />
            <span>
              {isOverdue ? "Overdue: " : "Due: "}
              {new Date(payment.payment_date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Notes */}
        {payment.notes && (
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-2">{payment.notes}</p>
          </div>
        )}

        {/* Actions */}
        {payment.payment_status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              Mark as Paid
            </Button>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentStats({ summary }: { summary: PaymentSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {summary.total_paid.toLocaleString("id-ID")}</div>
          <p className="text-xs text-muted-foreground">Successfully paid</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {summary.total_pending.toLocaleString("id-ID")}</div>
          <p className="text-xs text-muted-foreground">Awaiting payment</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">Rp {summary.total_overdue.toLocaleString("id-ID")}</div>
          <p className="text-xs text-muted-foreground">Need attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.payment_count}</div>
          <p className="text-xs text-muted-foreground">All transactions</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentTypeBreakdown({ payments }: { payments: Payment[] }) {
  const breakdown = Object.keys(PAYMENT_TYPE_CONFIG).map((type) => {
    const typePayments = payments.filter((p) => p.payment_type === type);
    const total = typePayments.reduce((sum, p) => sum + p.amount, 0);
    const count = typePayments.length;

    return {
      type,
      config: PAYMENT_TYPE_CONFIG[type],
      total,
      count,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Type Breakdown</CardTitle>
        <CardDescription>Distribution by payment category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {breakdown.map(({ type, config, total, count }) => {
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", config.bgColor)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div>
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{count} payments</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Rp {total.toLocaleString("id-ID")}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ProductionPaymentsPage() {
  const supabase = await createSupabaseServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check role
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!userData || (userData.role !== "production" && userData.role !== "admin")) {
    redirect("/unauthorized");
  }

  const { payments, summary } = await getProductionPayments(user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Payments</h1>
          <p className="text-muted-foreground">Track internal payments for honor, salary, and expenses</p>
        </div>
        <Button>
          <DollarSign className="mr-2 h-4 w-4" />
          New Payment
        </Button>
      </div>

      {/* Stats */}
      {summary && <PaymentStats summary={summary} />}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payments List */}
        <div className="lg:col-span-2 space-y-4">
          {payments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  No payment records found for your projects.
                  <br />
                  Start by creating a payment entry.
                </p>
                <Button>Create Payment</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Recent Payments</h2>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Breakdown Sidebar */}
        {payments.length > 0 && (
          <div className="space-y-4">
            <PaymentTypeBreakdown payments={payments} />
          </div>
        )}
      </div>
    </div>
  );
}
