"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PhoneCall,
  MessageCircle,
  Sparkles,
  Send,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type RecoveryStatus = "normal" | "warning" | "alert";
type Message = { role: "user" | "assistant"; text: string };

export default function RecoveryMonitoring() {
  const { addToast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [day, setDay] = useState(1);
  const [status, setStatus] = useState<RecoveryStatus>("normal");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, string>>({
    pain: "없음",
    swelling: "정상",
    fever: "없음",
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiGuideContent, setAiGuideContent] = useState("");
  const [recoveryMessages, setRecoveryMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data?.user) setSession(data);
      } catch (err) {
        console.error("Session fetch failed", err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const userName = session?.user?.name || "유저";
    const initialMessage =
      `안녕하세요 ${userName}님! 현재 기록하신 ${selectedSymptoms.pain} 정도의 통증과 ${selectedSymptoms.swelling} 붓기에 대해 저와 상담하시겠습니까? 무엇이든 물어보세요.`;
    setRecoveryMessages([{ role: "assistant", text: initialMessage }]);
  }, [session, selectedSymptoms]);

  const handleSymptomChange = (category: string, value: string) => {
    const updatedSymptoms = { ...selectedSymptoms, [category]: value };
    setSelectedSymptoms(updatedSymptoms);

    let newStatus: RecoveryStatus = "normal";
    Object.values(updatedSymptoms).forEach((val) => {
      if (val === "참기힘듬" || val === "고열" || val === "피부당김") {
        newStatus = "alert";
      } else if ((val === "심함" || val === "수면방해") && newStatus !== "alert") {
        newStatus = "warning";
      }
    });
    setStatus(newStatus);
    addToast({
      title: "상태 업데이트",
      description: `"${value}" 상태로 기록되었습니다.`,
      variant: "info",
    });
  };

  const protocol = [
    { id: "p1", text: "시술 부위 냉찜질 (15분씩 3회)", day: 1 },
    { id: "p2", text: "항생제 및 처방약 복용 완료", day: 1 },
    { id: "p3", text: "시술 부위 물 닿지 않게 주의", day: 1 },
    { id: "p4", text: "가벼운 산책으로 혈액순환 돕기", day: 2 },
    { id: "p5", text: "시술 부위 보습제 충분히 도포", day: 2 },
    { id: "p6", text: "자극적인 음식(맵고 짠 것) 피하기", day: 2 },
    { id: "p7", text: "잠잌 때 머리를 심장보다 높게 두기", day: 3 },
    { id: "p8", text: "음주 및 흥연 금지 유지", day: 3 },
  ];

  const handleCheck = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const generateAiGuide = async () => {
    setIsAiThinking(true);
    setIsGuideOpen(true);
    try {
      const response = await fetch("/api/ai/recovery/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          symptoms: selectedSymptoms,
          completedProtocols: checkedItems.length,
          totalProtocols: protocol.length,
        }),
      });
      const data = await response.json();
      if (data.advice) {
        setAiGuideContent(data.advice);
      } else {
        throw new Error(data.error || "분석 실패");
      }
    } catch (error) {
      setAiGuideContent(
        "gleemile 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiThinking) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setRecoveryMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsAiThinking(true);
    try {
      const response = await fetch("/api/ai/recovery/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, day, symptoms: selectedSymptoms }),
      });
      const data = await response.json();
      if (data.response) {
        setRecoveryMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.response },
        ]);
      } else {
        throw new Error(data.error || "답변 실패");
      }
    } catch (error) {
      setRecoveryMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "죄송합니다. 현재 gleemile 상담 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const currentProtocol = protocol.filter((p) => p.day === day);
  const completedToday = checkedItems.filter(
    (id) => protocol.find((p) => p.id === id)?.day === day
  ).length;
  const completionRate =
    currentProtocol.length > 0 ? (completedToday / currentProtocol.length) * 100 : 0;

  const statusBadge =
    status === "alert"
      ? "즉시 연락 필요"
      : status === "warning"
        ? "주의 관찰"
        : "정상 회복 중";

  const statusColor =
    status === "alert"
      ? "bg-status-danger text-white"
      : status === "warning"
        ? "bg-amber-400 text-amber-950 ring-2 ring-primary ring-offset-1"
        : "bg-status-good text-white";

  const headingText =
    status === "alert"
      ? "상태가 불안정합니다. 즉시 조치가 필요해요."
      : status === "warning"
        ? "약간의 불편함이 있으시군요."
        : "순조로운 회복을 축하드려요!";

  const advisorTitle =
    status === "alert"
      ? "상태가 불안정합니다. 즉시 조치가 필요해요."
      : status === "warning"
        ? "gleemile이 정밀 회복 분석을 마쳤습니다."
        : "현재 회복 상태가 매우 이상적입니다!";

  const advisorDesc =
    status === "alert"
      ? "현재 기록된 데이터는 즉각적인 의료진 개입이 필요한 수준입니다. gleemile과의 상담을 통해 응급 가이드를 받거나 담당자와 연결하세요."
      : status === "warning"
        ? "붓기와 수면 방해 패턴이 감지되었습니다. gleemile이 제안하는 맞춤형 가이드 확인이 권장됩니다."
        : "데이터 상으로 시술 부위의 안정이 빠르게 진행되고 있습니다. 이 흐름을 유지하기 위한 정밀 유지 가이드를 확인해 보세요.";

  const symptomGroups = [
    {
      label: "통증 정도",
      key: "pain",
      options: ["없음", "가벼움", "수면방해", "참기힘듬"],
    },
    {
      label: "붓기 상태",
      key: "swelling",
      options: ["정상", "약간", "심함", "피부당김"],
    },
    {
      label: "열감/발열",
      key: "fever",
      options: ["없음", "약간있음", "고열"],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* 상태 개요 */}
      <Card className="bg-surface/50 border-none shadow-xl rounded-[40px] overflow-hidden">
        <CardContent className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge
                  className={`${statusColor} px-4 py-1.5 rounded-full text-xs font-black tracking-tight border-none transition-all duration-500`}
                >
                  {statusBadge}
                </Badge>
                <div className="flex items-center text-text-secondary text-sm font-bold">
                  <Clock className="w-4 h-4 mr-1" />
                  시술 후 {day}일차
                </div>
              </div>
              <h2 className="font-black tracking-tight leading-tight transition-all text-4xl">
                {headingText}
              </h2>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-14 w-14 rounded-full border-line hover:bg-primary/5"
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
              <Button
                className={`h-14 px-8 rounded-full font-black shadow-lg transition-all ${status === "alert"
                  ? "bg-status-danger text-white animate-pulse"
                  : "bg-primary text-background shadow-primary/20"
                  }`}
              >
                <PhoneCall className="w-5 h-5 mr-3" />
                긴급 상담 연결
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background/80 p-6 rounded-[32px] border border-line space-y-4">
              <div className="flex justify-between items-center text-sm font-bold opacity-60">
                <span>오늘의 성취도</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2 bg-line" />
            </div>
            <div className="bg-background/80 p-6 rounded-[32px] border border-line flex items-center gap-4">
              <div className="w-12 h-12 bg-status-good/10 text-status-good rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold opacity-50 uppercase">Today's Tip</p>
                <p className="font-bold text-sm">냉찜질은 붓기 완화에 필수!</p>
              </div>
            </div>
            <div className="bg-background/80 p-6 rounded-[32px] border border-line flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold opacity-50 uppercase">Predicted Recovery</p>
                <p className="font-bold text-sm">72시간 후 외출 가능 예상</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 컨디션 체크 */}
        <Card className="bg-white border-line shadow-md rounded-[32px]">
          <CardHeader>
            <CardTitle className="font-black text-xl">실시간 콘디션 체크</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {symptomGroups.map((q) => (
              <div key={q.key} className="space-y-2">
                <p className="text-sm font-bold text-text-secondary">{q.label}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedSymptoms[q.key] === opt
                        ? "bg-primary text-background border-primary shadow-md scale-105"
                        : "bg-white border-line hover:border-primary/50"
                        }`}
                      onClick={() => handleSymptomChange(q.key, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 회복 프로토콜 */}
        <Card className="bg-white border-line shadow-md rounded-[32px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-black text-xl">회복 프로토콜</CardTitle>
            <div className="flex gap-1">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={`px-3 h-8 rounded-lg text-[10px] font-black transition-all ${day === d
                    ? "bg-primary text-background shadow-md"
                    : "bg-mist hover:bg-mist/80"
                    }`}
                >
                  {d}일차
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentProtocol.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCheck(item.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${checkedItems.includes(item.id)
                  ? "bg-status-good/5 border-status-good/20"
                  : "bg-surface border-line hover:border-primary/30"
                  }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${checkedItems.includes(item.id)
                    ? "bg-status-good border-status-good text-white"
                    : "border-line"
                    }`}
                >
                  {checkedItems.includes(item.id) && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <span
                  className={`text-sm font-medium ${checkedItems.includes(item.id)
                    ? "line-through text-text-tertiary"
                    : "text-text-primary"
                    }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI 어드바이저 */}
      <Card
        className={`border-none ${status === "alert"
          ? "bg-status-danger/10"
          : status === "warning"
            ? "bg-status-amber/10"
            : "bg-primary/5"
          } rounded-[40px] overflow-hidden transition-all duration-500`}
      >
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-xl bg-white shadow-2xl shrink-0 ${status === "alert" ? "animate-pulse" : ""
              }`}
          >
            {status === "alert" ? "🚨" : status === "warning" ? "🤖" : "✨"}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles
                className={`w-5 h-5 ${status === "alert"
                  ? "text-status-danger"
                  : status === "warning"
                    ? "text-status-amber"
                    : "text-primary"
                  }`}
              />
              <span className="text-xs font-black uppercase tracking-widest opacity-60">
                Youniqle Recovery Advisor
              </span>
            </div>
            <h4
              className={`text-3xl font-black ${status === "alert"
                ? "text-status-danger"
                : status === "warning"
                  ? "text-obsidian"
                  : "text-primary"
                } tracking-tight leading-tight`}
            >
              {advisorTitle}
            </h4>
            <p className="text-lg text-text-secondary font-medium leading-relaxed">
              {advisorDesc}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-obsidian text-mist hover:bg-obsidian/90 font-black h-14 px-10 rounded-2xl shadow-xl transition-all hover:scale-105"
              >
                회복 전문가와 상담하기
              </button>
              <button
                onClick={generateAiGuide}
                className="h-14 px-8 rounded-2xl font-black bg-white border border-obsidian/10 hover:bg-mist/30 flex items-center gap-2 transition-all"
              >
                {session?.user?.name || '내'} 님을 위한 맞춤 가이드 생성 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* gleemile 채팅 모달 */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[500px] h-[700px] flex flex-col p-0 overflow-hidden bg-white border-line rounded-[32px]">
          <DialogHeader className="p-6 bg-obsidian text-mist border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-background">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="font-black text-xl">gleemile 회복 케어</DialogTitle>
                <DialogDescription className="text-mist/60 text-xs font-bold">
                  24시간 당신의 회복을 지원합니다
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6 bg-mist/20">
            <div className="h-full pr-4 overflow-y-auto">
              <div className="space-y-6">
                {recoveryMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${msg.role === "user"
                        ? "bg-obsidian text-mist"
                        : "bg-primary text-background"
                        }`}
                    >
                      {msg.role === "user" ? "👤" : "🤖"}
                    </div>
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl shadow-sm border ${msg.role === "user"
                        ? "bg-primary text-background rounded-tr-none border-primary/20"
                        : "bg-white text-obsidian rounded-tl-none border-line"
                        } text-sm font-medium leading-relaxed`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs shrink-0">
                      🤖
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl rounded-tl-none border border-line text-xs font-bold text-slate">
                      gleemile이 답변을 준비하고 있습니다...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 bg-white border-t border-line shrink-0">
            <div className="relative flex items-center">
              <input
                placeholder="질문을 입력하세요..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="w-full h-14 pl-6 pr-14 rounded-2xl bg-mist/30 border border-line focus:outline-none text-sm font-medium"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isAiThinking}
                size="icon"
                className="absolute right-2 w-10 h-10 bg-obsidian text-mist rounded-xl shadow-lg hover:scale-105 transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI 가이드 모달 */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white border-line rounded-[40px] p-8 overflow-hidden">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-primary text-background border-none px-3 font-black">
                YOUNIQLE PERSONALIZED GUIDE
              </Badge>
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight">
              {session?.user?.name || "유저"}님 맞춤 가이드
            </DialogTitle>
          </DialogHeader>
          {isAiThinking ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="text-center">
                <p className="font-black text-obsidian text-xl">gleemile 회복 분석 중...</p>
                <p className="text-sm text-text-tertiary font-medium">
                  콘디션과 프로토콜 데이터를 분석 중입니다.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-[400px] pr-4 overflow-y-auto">
                <div className="whitespace-pre-wrap text-text-primary text-base font-medium leading-loose space-y-4">
                  {aiGuideContent.split("\n").map((line, i) => (
                    <p
                      key={i}
                      className={
                        (line.startsWith("[") && line.includes("]")) ||
                          line.startsWith("🚨") ||
                          line.startsWith("✅") ||
                          line.startsWith("💡") ||
                          line.startsWith("⚠️")
                          ? "font-black text-obsidian mt-6 mb-2 text-lg"
                          : ""
                      }
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              <DialogFooter className="mt-8">
                <Button
                  onClick={() => setIsGuideOpen(false)}
                  className="w-full h-14 bg-obsidian text-mist font-black rounded-2xl shadow-xl"
                >
                  확인했습니다
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
