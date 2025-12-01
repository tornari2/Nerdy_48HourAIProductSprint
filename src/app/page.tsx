"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalTutors: number;
  highRiskTutors: number;
  mediumRiskTutors: number;
  lowRiskTutors: number;
  avgRescheduleRate: number;
  avgNoShowRate: number;
  poorFirstSessionTutors: number;
  highReschedulerTutors: number;
}

interface FirstSessionOverview {
  totalFirstSessions: number;
  overallDropoutRate: number;
  avgRating: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [firstSessionStats, setFirstSessionStats] = useState<FirstSessionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tutors data with timeout
        const tutorsController = new AbortController();
        const tutorsTimeout = setTimeout(() => tutorsController.abort(), 15000); // 15 second timeout

        const tutorsRes = await fetch("/api/tutors?limit=1000", {
          signal: tutorsController.signal,
        });
        clearTimeout(tutorsTimeout);

        if (!tutorsRes.ok) {
          throw new Error(`HTTP error! status: ${tutorsRes.status}`);
        }

        const tutorsData = await tutorsRes.json();

        // Check for error message in response
        if (tutorsData.error) {
          setError(tutorsData.error);
        }

        if (tutorsData.tutors && Array.isArray(tutorsData.tutors)) {
          const tutors = tutorsData.tutors;
          setStats({
            totalTutors: tutors.length,
            highRiskTutors: tutors.filter((t: any) => t.churnRiskLabel === "high").length,
            mediumRiskTutors: tutors.filter((t: any) => t.churnRiskLabel === "medium").length,
            lowRiskTutors: tutors.filter((t: any) => t.churnRiskLabel === "low").length,
            avgRescheduleRate:
              tutors.length > 0
                ? tutors.reduce((sum: number, t: any) => sum + (t.tutorRescheduleRate || 0), 0) /
                  tutors.length
                : 0,
            avgNoShowRate:
              tutors.length > 0
                ? tutors.reduce((sum: number, t: any) => sum + (t.tutorNoShowRate || 0), 0) /
                  tutors.length
                : 0,
            poorFirstSessionTutors: tutors.filter((t: any) => t.poorFirstSessionFlag).length,
            highReschedulerTutors: tutors.filter((t: any) => t.highReschedulerFlag).length,
          });
        }

        // Fetch first session data with timeout
        const firstSessionController = new AbortController();
        const firstSessionTimeout = setTimeout(() => firstSessionController.abort(), 15000);

        const firstSessionRes = await fetch("/api/first-sessions", {
          signal: firstSessionController.signal,
        });
        clearTimeout(firstSessionTimeout);

        if (firstSessionRes.ok) {
          const firstSessionData = await firstSessionRes.json();
          if (firstSessionData.overview) {
            setFirstSessionStats(firstSessionData.overview);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to connect to the server. Please check your database configuration."
        );
        // Set empty stats so UI doesn't hang
        setStats({
          totalTutors: 0,
          highRiskTutors: 0,
          mediumRiskTutors: 0,
          lowRiskTutors: 0,
          avgRescheduleRate: 0,
          avgNoShowRate: 0,
          poorFirstSessionTutors: 0,
          highReschedulerTutors: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Tutor Quality Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor tutor performance, identify risks, and track quality metrics
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="glass-card border-yellow-500/50 bg-yellow-500/10 mb-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="text-yellow-400 text-xl">⚠️</div>
              <div className="flex-1">
                <p className="font-medium text-yellow-400 mb-1">Database Connection Issue</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  To fix this:
                  <br />1. Make sure DATABASE_URL is set in your .env.local file
                  <br />2. Run <code className="bg-muted px-1 rounded">npm run db:push</code> to create tables
                  <br />3. Run <code className="bg-muted px-1 rounded">npm run db:seed</code> to add sample data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Tutors</CardDescription>
            <CardTitle className="text-3xl font-bold">{stats?.totalTutors || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Tracked with metrics</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20">
          <CardHeader className="pb-2">
            <CardDescription>High Risk Tutors</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-400">
              {stats?.highRiskTutors || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              <Badge variant="secondary" className="risk-medium text-xs">
                {stats?.mediumRiskTutors || 0} medium
              </Badge>
              <Badge variant="secondary" className="risk-low text-xs">
                {stats?.lowRiskTutors || 0} low
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Avg Reschedule Rate</CardDescription>
            <CardTitle className="text-3xl font-bold text-yellow-400">
              {((stats?.avgRescheduleRate || 0) * 100).toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.highReschedulerTutors || 0} high reschedulers flagged
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-orange-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Avg No-Show Rate</CardDescription>
            <CardTitle className="text-3xl font-bold text-orange-400">
              {((stats?.avgNoShowRate || 0) * 100).toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Platform-wide average</p>
          </CardContent>
        </Card>
      </div>

      {/* First Session Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500"></span>
              First Session Performance
            </CardTitle>
            <CardDescription>
              24% of churners fail at first session - monitoring critical
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total First Sessions (30d)</span>
                <span className="font-semibold">{firstSessionStats?.totalFirstSessions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Dropout Rate</span>
                <span className="font-semibold text-orange-400">
                  {(firstSessionStats?.overallDropoutRate || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Rating</span>
                <span className="font-semibold">{firstSessionStats?.avgRating || 0}/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tutors Flagged</span>
                <Badge className="risk-high">{stats?.poorFirstSessionTutors || 0}</Badge>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Link href="/first-sessions">
                <Button variant="secondary" className="w-full">
                  View First Session Patterns →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/tutors?sortBy=churnRisk&order=desc">
                <Button variant="outline" className="w-full justify-start">
                  🔴 View High Risk Tutors
                </Button>
              </Link>
              <Link href="/tutors?sortBy=rescheduleRate&order=desc">
                <Button variant="outline" className="w-full justify-start">
                  📅 View Top Reschedulers
                </Button>
              </Link>
              <Link href="/tutors?sortBy=noShowRate&order=desc">
                <Button variant="outline" className="w-full justify-start">
                  ⚠️ View No-Show Risks
                </Button>
              </Link>
              <Link href="/tutors?sortBy=rating&order=asc">
                <Button variant="outline" className="w-full justify-start">
                  ⭐ View Lowest Rated
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="glass-card border-indigo-500/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI-Powered Quality Insights</p>
              <p className="text-sm text-muted-foreground">
                Session transcripts are evaluated using GPT-4o for quality scores and coaching feedback
          </p>
        </div>
            <Link href="/tutors">
              <Button>Explore Tutors →</Button>
            </Link>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
