"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
} from "recharts";

interface TutorDetail {
  tutor: {
    tutorId: string;
    name: string;
    subjects: string[] | null;
    yearsExperience: number | null;
    timezone: string | null;
    hireDate: string | null;
  };
  metrics: {
    totalSessionsLast30d: number;
    firstSessionsLast30d: number;
    firstSessionDropoutRate: number;
    tutorRescheduleRate: number;
    tutorNoShowRate: number;
    avgStudentRatingLast30d: number | null;
    aiAvgQualityScore: number | null;
    churnRiskLabel: string;
    noShowRiskLabel: string;
    highReschedulerFlag: boolean;
    poorFirstSessionFlag: boolean;
  } | null;
  sessions: Array<{
    sessionId: string;
    subject: string;
    scheduledStartAt: string;
    status: string;
    isFirstSessionForStudent: boolean;
    studentRating: number | null;
    aiQualityScore: number | null;
    aiStrengths: string[] | null;
    aiAreasForImprovement: string[] | null;
    aiRiskTags: string[] | null;
    transcript: string | null;
    hasTranscript: boolean;
  }>;
  ratingTrend: Array<{ week: string; avgRating: number; count: number }>;
  stats: {
    totalSessions: number;
    completedSessions: number;
    firstSessions: number;
    evaluatedSessions: number;
  };
}

function RiskBadge({ level, large = false }: { level: string | null; large?: boolean }) {
  if (!level) return null;

  const className = {
    high: "risk-high",
    medium: "risk-medium",
    low: "risk-low",
  }[level] || "";

  return (
    <Badge className={`${className} ${large ? "text-sm px-3 py-1" : ""}`}>
      {level.toUpperCase()} RISK
    </Badge>
  );
}

export default function TutorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<TutorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTutor() {
      try {
        const res = await fetch(`/api/tutors/${resolvedParams.id}`);
        const json = await res.json();
        setData(json);

        // Select first session with transcript by default
        const sessionWithTranscript = json.sessions?.find((s: any) => s.hasTranscript);
        if (sessionWithTranscript) {
          setSelectedSession(sessionWithTranscript.sessionId);
        }
      } catch (error) {
        console.error("Error fetching tutor:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTutor();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.tutor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Tutor not found</p>
            <Link href="/tutors">
              <Button variant="outline" className="mt-4">
                ← Back to Tutors
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tutor, metrics, sessions, ratingTrend, stats } = data;
  const selectedSessionData = sessions.find((s) => s.sessionId === selectedSession);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/tutors"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← Back to Tutors
          </Link>
          <h1 className="text-3xl font-bold">{tutor.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {tutor.subjects?.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <RiskBadge level={metrics?.churnRiskLabel || null} large />
          <div className="flex gap-2">
            {metrics?.highReschedulerFlag && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                High Rescheduler
              </Badge>
            )}
            {metrics?.poorFirstSessionFlag && (
              <Badge variant="outline" className="text-red-400 border-red-500/30">
                Poor First Sessions
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Sessions (30d)</p>
            <p className="text-2xl font-bold">{metrics?.totalSessionsLast30d || 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">First Sessions</p>
            <p className="text-2xl font-bold">{metrics?.firstSessionsLast30d || 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Avg Rating</p>
            <p className="text-2xl font-bold">
              {metrics?.avgStudentRatingLast30d?.toFixed(1) || "-"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">AI Score</p>
            <p className="text-2xl font-bold">
              {metrics?.aiAvgQualityScore?.toFixed(1) || "-"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-yellow-500/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Reschedule Rate</p>
            <p className="text-2xl font-bold text-yellow-400">
              {((metrics?.tutorRescheduleRate || 0) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-orange-500/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">No-Show Rate</p>
            <p className="text-2xl font-bold text-orange-400">
              {((metrics?.tutorNoShowRate || 0) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Trend Chart */}
      <Card className="glass-card mb-6">
        <CardHeader>
          <CardTitle>Rating Trend (Last 4 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="week" stroke="#888" />
                <YAxis domain={[0, 5]} stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="avgRating"
                  fill="url(#gradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sessions & Transcripts */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
          <TabsTrigger value="transcript">Transcript Viewer</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>
                {stats.evaluatedSessions} of {stats.totalSessions} sessions have AI evaluations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">AI Score</TableHead>
                      <TableHead>AI Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.slice(0, 20).map((session) => (
                      <TableRow
                        key={session.sessionId}
                        className={`border-border/50 cursor-pointer ${
                          session.hasTranscript ? "hover:bg-accent/10" : ""
                        } ${selectedSession === session.sessionId ? "bg-accent/20" : ""}`}
                        onClick={() => session.hasTranscript && setSelectedSession(session.sessionId)}
                      >
                        <TableCell className="text-sm">
                          {new Date(session.scheduledStartAt).toLocaleDateString()}
                          {session.isFirstSessionForStudent && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              1st
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{session.subject}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              session.status === "completed"
                                ? "text-emerald-400 border-emerald-500/30"
                                : session.status === "no_show"
                                ? "text-red-400 border-red-500/30"
                                : "text-yellow-400 border-yellow-500/30"
                            }
                          >
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {session.studentRating !== null ? (
                            <span className={`score-${session.studentRating}`}>
                              {session.studentRating}/5
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {session.aiQualityScore !== null ? (
                            <span className={`score-${session.aiQualityScore}`}>
                              {session.aiQualityScore}/5
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {session.aiRiskTags?.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Session Transcript</CardTitle>
                <CardDescription>
                  {selectedSessionData
                    ? `${selectedSessionData.subject} - ${new Date(
                        selectedSessionData.scheduledStartAt
                      ).toLocaleDateString()}`
                    : "Select a session with a transcript"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {selectedSessionData?.transcript ? (
                    <div className="space-y-3 text-sm font-mono">
                      {selectedSessionData.transcript.split("\n").map((line, i) => {
                        const isTutor = line.startsWith("Tutor:");
                        const isStudent = line.startsWith("Student:");
                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-lg ${
                              isTutor
                                ? "bg-indigo-500/10 border-l-2 border-indigo-500"
                                : isStudent
                                ? "bg-violet-500/10 border-l-2 border-violet-500"
                                : ""
                            }`}
                          >
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No transcript available for this session
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>AI Evaluation</CardTitle>
                <CardDescription>
                  {selectedSessionData?.aiQualityScore !== null
                    ? `Quality Score: ${selectedSessionData?.aiQualityScore}/5`
                    : "No evaluation available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSessionData?.aiQualityScore !== null ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-emerald-400 mb-2">✓ Strengths</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {selectedSessionData?.aiStrengths?.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-orange-400 mb-2">
                        ⚡ Areas for Improvement
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {selectedSessionData?.aiAreasForImprovement?.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-violet-400 mb-2">🏷️ Risk Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSessionData?.aiRiskTags?.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Session has not been evaluated by AI
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

