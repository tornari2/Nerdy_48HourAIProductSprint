"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FirstSessionData {
  overview: {
    totalFirstSessions: number;
    badFirstSessions: number;
    overallDropoutRate: number;
    avgRating: number;
    window: string;
  };
  bySubject: Array<{
    subject: string;
    totalFirstSessions: number;
    badFirstSessions: number;
    dropoutRate: number;
  }>;
  poorPerformingTutors: Array<{
    tutorId: string;
    name: string;
    subjects: string[] | null;
    firstSessionDropoutRate: number;
    firstSessionsLast30d: number;
    avgStudentRatingLast30d: number | null;
  }>;
}

export default function FirstSessionsPage() {
  const [data, setData] = useState<FirstSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/first-sessions");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching first session data:", error);
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
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, bySubject, poorPerformingTutors } = data;

  // Prepare chart data
  const chartData = bySubject
    .filter((s) => s.totalFirstSessions >= 5)
    .slice(0, 10)
    .map((s) => ({
      subject: s.subject.length > 12 ? s.subject.slice(0, 12) + "..." : s.subject,
      dropoutRate: Math.round(s.dropoutRate * 100),
      sessions: s.totalFirstSessions,
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">First Session Patterns</h1>
        <p className="text-muted-foreground mt-2">
          24% of churners fail at the first session — identifying patterns here is critical
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Total First Sessions</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {overview.totalFirstSessions.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{overview.window}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Bad First Sessions</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-400">
              {overview.badFirstSessions.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Churned or rated ≤ 2
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-orange-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Dropout Rate</CardDescription>
            <CardTitle className="text-3xl font-bold text-orange-400">
              {overview.overallDropoutRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Avg First Session Rating</CardDescription>
            <CardTitle className="text-3xl font-bold">{overview.avgRating}/5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All first sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Dropout by Subject */}
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle>First Session Dropout Rate by Subject</CardTitle>
          <CardDescription>
            Subjects with highest first-session failure rates (min 5 sessions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#888" unit="%" />
                  <YAxis dataKey="subject" type="category" stroke="#888" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Dropout Rate"]}
                  />
                  <Bar dataKey="dropoutRate" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.dropoutRate > 30
                            ? "#ef4444"
                            : entry.dropoutRate > 20
                            ? "#f97316"
                            : entry.dropoutRate > 10
                            ? "#eab308"
                            : "#22c55e"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Not enough data to display chart
            </p>
          )}
        </CardContent>
      </Card>

      {/* Subject Breakdown Table */}
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle>Subject Breakdown</CardTitle>
          <CardDescription>First session performance by subject area</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">First Sessions</TableHead>
                <TableHead className="text-center">Bad Sessions</TableHead>
                <TableHead className="text-center">Dropout Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySubject.slice(0, 15).map((subject) => (
                <TableRow key={subject.subject} className="border-border/50">
                  <TableCell className="font-medium">{subject.subject}</TableCell>
                  <TableCell className="text-center">{subject.totalFirstSessions}</TableCell>
                  <TableCell className="text-center">{subject.badFirstSessions}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        subject.dropoutRate > 0.3
                          ? "risk-high"
                          : subject.dropoutRate > 0.2
                          ? "risk-medium"
                          : "risk-low"
                      }
                    >
                      {(subject.dropoutRate * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tutors with Poor First Sessions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Tutors Flagged for Poor First Sessions</CardTitle>
          <CardDescription>
            Tutors with first-session dropout rates exceeding 25%
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {poorPerformingTutors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Tutor</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="text-center">First Sessions</TableHead>
                  <TableHead className="text-center">Avg Rating</TableHead>
                  <TableHead className="text-center">Dropout Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poorPerformingTutors.map((tutor) => (
                  <TableRow
                    key={tutor.tutorId}
                    className="border-border/50 cursor-pointer hover:bg-accent/10"
                  >
                    <TableCell>
                      <Link
                        href={`/tutors/${tutor.tutorId}`}
                        className="font-medium hover:text-primary"
                      >
                        {tutor.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tutor.subjects?.slice(0, 2).map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {tutor.firstSessionsLast30d}
                    </TableCell>
                    <TableCell className="text-center">
                      {tutor.avgStudentRatingLast30d?.toFixed(1) || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="risk-high">
                        {(tutor.firstSessionDropoutRate * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No tutors currently flagged for poor first sessions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Banner */}
      <Card className="glass-card border-indigo-500/20 mt-8">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">First Session Coaching Opportunity</p>
              <p className="text-sm text-muted-foreground">
                {poorPerformingTutors.length} tutors could benefit from first-session coaching
              </p>
            </div>
            <Link href="/tutors?sortBy=churnRisk&order=desc">
              <Badge className="cursor-pointer hover:bg-primary/90">View All High Risk →</Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

