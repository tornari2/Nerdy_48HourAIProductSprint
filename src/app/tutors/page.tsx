"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Tutor {
  tutorId: string;
  name: string;
  subjects: string[] | null;
  yearsExperience: number | null;
  totalSessionsLast30d: number | null;
  tutorRescheduleRate: number | null;
  tutorNoShowRate: number | null;
  avgStudentRatingLast30d: number | null;
  aiAvgQualityScore: number | null;
  churnRiskLabel: string | null;
  noShowRiskLabel: string | null;
  highReschedulerFlag: boolean | null;
  poorFirstSessionFlag: boolean | null;
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <Badge variant="outline">-</Badge>;
  
  const className = {
    high: "risk-high",
    medium: "risk-medium",
    low: "risk-low",
  }[level] || "";

  return <Badge className={className}>{level}</Badge>;
}

function RatingDisplay({ rating, isAI = false }: { rating: number | null; isAI?: boolean }) {
  if (rating === null) return <span className="text-muted-foreground">-</span>;
  
  const scoreClass = rating >= 4 ? "score-4" : rating >= 3 ? "score-3" : rating >= 2 ? "score-2" : "score-1";
  
  return (
    <span className={`font-medium ${scoreClass}`}>
      {rating.toFixed(1)}{isAI ? "" : "/5"}
    </span>
  );
}

function TutorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  
  // Filter state
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "churnRisk");
  const [sortOrder, setSortOrder] = useState(searchParams.get("order") || "desc");
  const [riskFilter, setRiskFilter] = useState(searchParams.get("riskLevel") || "all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchTutors() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          sortBy,
          order: sortOrder,
          limit: "100",
        });
        if (riskFilter !== "all") {
          params.set("riskLevel", riskFilter);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(`/api/tutors?${params}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (data.tutors) {
          setTutors(data.tutors);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Error fetching tutors:", error);
        // Set empty arrays so UI doesn't hang
        setTutors([]);
        setPagination({ total: 0, hasMore: false });
      } finally {
        setLoading(false);
      }
    }

    fetchTutors();
  }, [sortBy, sortOrder, riskFilter]);

  // Filter by search term locally
  const filteredTutors = tutors.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subjects?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Tutor List</h1>
        <p className="text-muted-foreground mt-2">
          {pagination.total} tutors with quality metrics
        </p>
      </div>

      {/* Filters */}
      <Card className="glass-card mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="churnRisk">Churn Risk</SelectItem>
                <SelectItem value="rescheduleRate">Reschedule Rate</SelectItem>
                <SelectItem value="noShowRate">No-Show Rate</SelectItem>
                <SelectItem value="rating">Student Rating</SelectItem>
                <SelectItem value="aiScore">AI Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[120px] bg-background/50">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">High → Low</SelectItem>
                <SelectItem value="asc">Low → High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading tutors...</div>
          ) : filteredTutors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No tutors found. Run the analytics pipeline to generate metrics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Tutor</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead className="text-center">Sessions</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">AI Score</TableHead>
                    <TableHead className="text-center">Reschedule</TableHead>
                    <TableHead className="text-center">No-Show</TableHead>
                    <TableHead className="text-center">Risk</TableHead>
                    <TableHead className="text-center">Flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTutors.map((tutor) => (
                    <TableRow
                      key={tutor.tutorId}
                      className="border-border/50 cursor-pointer hover:bg-accent/10"
                      onClick={() => router.push(`/tutors/${tutor.tutorId}`)}
                    >
                      <TableCell className="font-medium">{tutor.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {tutor.subjects?.slice(0, 2).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                          {(tutor.subjects?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(tutor.subjects?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {tutor.totalSessionsLast30d ?? "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <RatingDisplay rating={tutor.avgStudentRatingLast30d} />
                      </TableCell>
                      <TableCell className="text-center">
                        <RatingDisplay rating={tutor.aiAvgQualityScore} isAI />
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            (tutor.tutorRescheduleRate || 0) > 0.15
                              ? "text-yellow-400"
                              : "text-muted-foreground"
                          }
                        >
                          {((tutor.tutorRescheduleRate || 0) * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            (tutor.tutorNoShowRate || 0) > 0.1
                              ? "text-orange-400"
                              : "text-muted-foreground"
                          }
                        >
                          {((tutor.tutorNoShowRate || 0) * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <RiskBadge level={tutor.churnRiskLabel} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {tutor.highReschedulerFlag && (
                            <Badge
                              variant="outline"
                              className="text-xs text-yellow-400 border-yellow-500/30"
                            >
                              📅
                            </Badge>
                          )}
                          {tutor.poorFirstSessionFlag && (
                            <Badge
                              variant="outline"
                              className="text-xs text-red-400 border-red-500/30"
                            >
                              1️⃣
                            </Badge>
                          )}
                          {tutor.noShowRiskLabel === "high" && (
                            <Badge
                              variant="outline"
                              className="text-xs text-orange-400 border-orange-500/30"
                            >
                              ⚠️
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Flags:</span>
        <span>📅 High Rescheduler</span>
        <span>1️⃣ Poor First Sessions</span>
        <span>⚠️ High No-Show Risk</span>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48"></div>
        <div className="h-12 bg-muted rounded-lg"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    </div>
  );
}

export default function TutorsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TutorsPageContent />
    </Suspense>
  );
}

