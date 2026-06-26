'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Activity,
  Brain,
  Lightbulb,
  RefreshCw,
  Play,
  Pause,
  Square,
  Settings
} from 'lucide-react';

interface AdvancedTestStats {
  testId: string;
  testName: string;
  status: string;
  startDate: string;
  endDate?: string;
  variants: {
    name: string;
    description: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    pValue: number;
    isSignificant: boolean;
    expectedLoss: number;
    risk: 'low' | 'medium' | 'high';
  }[];
  overallStats: {
    totalParticipants: number;
    totalConversions: number;
    overallConversionRate: number;
    statisticalPower: number;
    minimumDetectableEffect: number;
    testDuration: number;
    estimatedCompletionTime?: string;
  };
  recommendations: {
    action: 'continue' | 'stop' | 'extend' | 'declare_winner';
    reason: string;
    confidence: number;
    expectedImpact: number;
  };
  bayesianStats: {
    probabilityOfBeingBest: number[];
    expectedLoss: number[];
    credibleInterval: {
      lower: number;
      upper: number;
    }[];
  };
}

interface ABTestAdvancedDashboardProps {
  testId: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export default function ABTestAdvancedDashboard({ testId }: ABTestAdvancedDashboardProps) {
  const [stats, setStats] = useState<AdvancedTestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/ab-tests/${testId}/advanced-stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || '통계를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('통계를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [testId]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000); // 30초마다 새로고침
      return () => clearInterval(interval);
    }
  }, [autoRefresh, testId]);

  const handleAction = async (action: string) => {
    try {
      const response = await fetch(`/api/admin/ab-tests/${testId}/advanced-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchStats();
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'completed': return 'bg-primary';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-surface0';
      default: return 'bg-surface0';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-obsidian';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'continue': return <Play className="h-4 w-4" />;
      case 'stop': return <Square className="h-4 w-4" />;
      case 'extend': return <Clock className="h-4 w-4" />;
      case 'declare_winner': return <CheckCircle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">통계를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
        <Button onClick={fetchStats} className="mt-4">
          다시 시도
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-obsidian">
        <p>통계 데이터가 없습니다.</p>
      </div>
    );
  }

  // 차트 데이터 준비
  const conversionData = stats.variants.map((variant, index) => ({
    name: variant.name,
    conversionRate: variant.conversionRate,
    participants: variant.participants,
    conversions: variant.conversions,
    confidence: variant.confidenceInterval.upper - variant.confidenceInterval.lower,
    color: COLORS[index % COLORS.length]
  }));

  const bayesianData = stats.variants.map((variant, index) => ({
    name: variant.name,
    probability: stats.bayesianStats.probabilityOfBeingBest[index] || 0,
    expectedLoss: stats.bayesianStats.expectedLoss[index] || 0
  }));

  const powerData = [
    { name: '현재 검정력', value: stats.overallStats.statisticalPower * 100 },
    { name: '목표 검정력', value: 80 },
    { name: '부족한 검정력', value: Math.max(0, 80 - stats.overallStats.statisticalPower * 100) }
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{stats.testName}</h2>
          <div className="flex items-center space-x-4 mt-2">
            <Badge className={`${getStatusColor(stats.status)} text-white`}>
              {stats.status}
            </Badge>
            <span className="text-sm text-obsidian">
              {stats.overallStats.testDuration}일 진행
            </span>
            <span className="text-sm text-obsidian">
              {stats.overallStats.totalParticipants}명 참여
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            자동 새로고침
          </Button>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 추천사항 카드 */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            gleemile 추천사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getActionIcon(stats.recommendations.action)}
                <span className="font-medium">
                  {stats.recommendations.action === 'continue' && '테스트 계속 진행'}
                  {stats.recommendations.action === 'stop' && '테스트 중단'}
                  {stats.recommendations.action === 'extend' && '테스트 연장'}
                  {stats.recommendations.action === 'declare_winner' && '승자 선언'}
                </span>
                <Badge variant="outline">
                  신뢰도 {Math.round(stats.recommendations.confidence * 100)}%
                </Badge>
              </div>
              <p className="text-sm text-obsidian mb-3">
                {stats.recommendations.reason}
              </p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleAction(stats.recommendations.action)}
                >
                  추천사항 실행
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('auto_terminate')}
                >
                  자동 종료 검사
                </Button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round(stats.recommendations.expectedImpact * 100) / 100}%
              </div>
              <div className="text-sm text-obsidian">예상 개선율</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 메인 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-obsidian">총 참가자</p>
                <p className="text-2xl font-bold">{stats.overallStats.totalParticipants.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-obsidian">전체 전환율</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.overallStats.overallConversionRate * 100) / 100}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-obsidian">통계적 검정력</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.overallStats.statisticalPower * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-secondary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-obsidian">최소 검출 효과</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.overallStats.minimumDetectableEffect * 100) / 100}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 분석 탭 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="variants">변형별 분석</TabsTrigger>
          <TabsTrigger value="bayesian">베이지안 분석</TabsTrigger>
          <TabsTrigger value="power">검정력 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 전환율 비교 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>전환율 비교</CardTitle>
                <CardDescription>각 변형의 전환율과 신뢰구간</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      `${value}%`,
                      name === 'conversionRate' ? '전환율' : name
                    ]} />
                    <Bar dataKey="conversionRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 참가자 수 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>참가자 분포</CardTitle>
                <CardDescription>각 변형별 참가자 수</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      // @ts-ignore
                      label={({ name, participants }) => `${name}: ${participants}명`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="participants"
                    >
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {stats.variants.map((variant, index) => (
              <Card key={variant.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        {variant.name}
                        {variant.isSignificant && (
                          <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                        )}
                      </CardTitle>
                      <CardDescription>{variant.description}</CardDescription>
                    </div>
                    <Badge className={getRiskColor(variant.risk)}>
                      {variant.risk} risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-obsidian">참가자</p>
                      <p className="font-bold text-xl">{variant.participants.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-obsidian">전환</p>
                      <p className="font-bold text-xl">{variant.conversions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-obsidian">전환율</p>
                      <p className="font-bold text-xl">{variant.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-obsidian">P-value</p>
                      <p className="font-bold text-xl">{variant.pValue}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>신뢰구간 (95%)</span>
                        <span>{variant.confidenceInterval.lower}% - {variant.confidenceInterval.upper}%</span>
                      </div>
                      <Progress 
                        value={variant.conversionRate} 
                        className="h-2"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>예상 손실</span>
                        <span>{variant.expectedLoss}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, variant.expectedLoss * 10)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bayesian" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 베이지안 확률 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>베이지안 최고 확률</CardTitle>
                <CardDescription>각 변형이 최고일 확률</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bayesianData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, '최고 확률']} />
                    <Bar dataKey="probability" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 예상 손실 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>베이지안 예상 손실</CardTitle>
                <CardDescription>각 변형의 예상 손실</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bayesianData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, '예상 손실']} />
                    <Bar dataKey="expectedLoss" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="power" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 검정력 분석 */}
            <Card>
              <CardHeader>
                <CardTitle>통계적 검정력</CardTitle>
                <CardDescription>현재 검정력과 목표 검정력 비교</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>현재 검정력</span>
                      <span>{Math.round(stats.overallStats.statisticalPower * 100)}%</span>
                    </div>
                    <Progress 
                      value={stats.overallStats.statisticalPower * 100} 
                      className="h-3"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>목표 검정력 (80%)</span>
                      <span>80%</span>
                    </div>
                    <Progress value={80} className="h-3" />
                  </div>
                  
                  {stats.overallStats.estimatedCompletionTime && (
                    <div className="text-sm text-obsidian">
                      <Clock className="h-4 w-4 inline mr-1" />
                      예상 완료: {new Date(stats.overallStats.estimatedCompletionTime).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 최소 검출 효과 */}
            <Card>
              <CardHeader>
                <CardTitle>최소 검출 가능 효과</CardTitle>
                <CardDescription>현재 설정으로 검출 가능한 최소 효과</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {Math.round(stats.overallStats.minimumDetectableEffect * 100) / 100}%
                  </div>
                  <p className="text-sm text-obsidian">
                    이 값보다 큰 효과만 통계적으로 검출할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}















