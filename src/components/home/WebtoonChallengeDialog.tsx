'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, PenTool, Image as ImageIcon, ChevronLeft, ChevronRight, CheckCircle, Copy, Download, Camera, UserCircle2, Check, ArrowRight, RefreshCcw } from 'lucide-react';
import { compressImage } from '@/lib/utils/image-client';
import { downloadWebtoon } from '@/lib/utils/download';
import { drawTextOnImageClient } from '@/lib/utils/canvas-text-client';
import Image from 'next/image';

export default function WebtoonChallengeDialog({ open, onOpenChange, recoveryData }: { open: boolean, onOpenChange: (open: boolean) => void, recoveryData: any }) {
  const [step, setStep] = useState<'STYLE' | 'SCRIPT' | 'CHARACTER' | 'IMAGE' | 'POSTED'>('STYLE');
  const [genre, setGenre] = useState('sitcom');
  const [visualStyle, setVisualStyle] = useState('premium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [editedPanels, setEditedPanels] = useState<any[]>([]);
  const [panelCount, setPanelCount] = useState('4'); 

  // 캐릭터 관련 상태 
  const [characterPrompt, setCharacterPrompt] = useState('');
  const [characterSheetImage, setCharacterSheetImage] = useState('');
  const [userReferenceImage, setUserReferenceImage] = useState('');
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);

  // 듀얼 캐릭터 시스템
  const [refBasedCharacter, setRefBasedCharacter] = useState<string | null>(null);
  const [promptBasedCharacter, setPromptBasedCharacter] = useState<string | null>(null);
  const [selectedCharacterType, setSelectedCharacterType] = useState<'ref' | 'prompt' | null>(null);
  const [savedCharacters, setSavedCharacters] = useState<any[]>([]);
  const [isSavingCharacter, setIsSavingCharacter] = useState(false);

  // Phase 2: 자유 주제 입력 모드
  const [topicMode, setTopicMode] = useState<'recovery' | 'free'>('recovery');
  const [freeTopic, setFreeTopic] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Phase 2: 인스타그램 캡션
  const [instagramCaption, setInstagramCaption] = useState<{ description: string; hashtags: string } | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const genres = [
    { id: 'sitcom', label: '시트콤', icon: '😆', desc: '위트와 유머가 넘치는 일상' },
    { id: 'drama', label: '드라마', icon: '🌅', desc: '가슴 뭉클한 감동과 성장' },
    { id: 'romance', label: '로맨스', icon: '💖', desc: '설레는 사랑과 관계의 회복' },
    { id: 'slice-of-life', label: '일상/힐링', icon: '🌿', desc: '조용한 평온함과 소소한 행복' },
    { id: 'fantasy', label: '판타지', icon: '🦄', desc: '상상력 너머의 경이로운 세계' },
    { id: 'thriller', label: '스릴러', icon: '🕵️', desc: '긴장감 넘치는 하루의 재구성' },
    { id: 'action', label: '액션', icon: '🔥', desc: '시련에 맞서는 역동적인 에너지' }
  ];

  const styles = [
    { id: 'premium', label: '프리미엄 웹툰', icon: '✨', desc: '세련된 디지털 드로잉과 깔끔 채색' },
    { id: 'romance', label: '로맨스 판타지', icon: '💖', desc: '화려한 장식과 몽환적인 조명 효과' },
    { id: 'noir', label: '누아르/스릴러', icon: '🌑', desc: '강렬한 명암대비와 묵직한 분위기' },
    { id: 'anime', label: '일본 애니메이션', icon: '🎞️', desc: '셀식 채색 특유의 선명한 감성' },
    { id: 'retro-90s', label: '90년대 레트로', icon: '📺', desc: '아날로그 필름과 VHS 노이즈 감성' },
    { id: 'manga-bw', label: '흑백 만화', icon: '🖋️', desc: '스크린톤과 펜 선 중심의 출판 만화' },
    { id: 'watercolor', label: '수채화', icon: '🎨', desc: '부드럽고 투명한 물감 번짐 효과' },
    { id: 'oil', label: '유화/임파스토', icon: '🖼️', desc: '두꺼운 붓터치와 질감이 살아있는 유화' },
    { id: 'fairytale', label: '동화 일러스트', icon: '🦄', desc: '따뜻한 색감과 귀엽고 단순한 형태' },
    { id: 'american', label: '아메리칸 코믹스', icon: '🦸', desc: '굵은 외곽선과 강렬한 원색의 히어로물' },
    { id: '3d', label: '3D 애니메이션', icon: '🚀', desc: '입체감이 뚜렷한 디즈니/픽사 스타일' }
  ];

  const handleSuggestTopics = async () => {
    setIsLoadingTopics(true);
    setSuggestedTopics([]);
    try {
      const res = await fetch('/api/webtoon/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedTopics(data.ideas || []);
      }
    } catch (error) {
      console.error('Topic suggestion failed:', error);
      alert('주제 추천 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleStartGeneration = async () => {
    if (topicMode === 'free' && !freeTopic.trim()) {
      alert('주제를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/webtoon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-script',
          genre,
          visualStyle,
          panelCount,
          date: new Date().toISOString().split('T')[0],
          topic: topicMode === 'free' ? freeTopic : undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedData(data);
        setEditedPanels(data.panels);
        setCharacterPrompt(data.characterPrompt || '');
        setStep('SCRIPT');
      } else {
        const errorData = await res.json();
        alert(errorData.error || '대본 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('대본 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePanel = async (panelNumber: number) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/webtoon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate-panel',
          genre,
          visualStyle,
          panelData: generatedData.panels.find((p: any) => p.panelNumber === panelNumber),
          characterSheetImage
        })
      });
      if (res.ok) {
        const data = await res.json();
        const base64Only = data.imageUrl.includes(',') ? data.imageUrl.split(',')[1] : data.imageUrl;
        
        // 클라이언트 사이드에서 텍스트 합성
        const targetPanel = generatedData.panels.find((p: any) => p.panelNumber === panelNumber);
        const synthesizedBase64 = await drawTextOnImageClient(base64Only, targetPanel?.script || '');
        const finalImageUrl = `data:image/png;base64,${synthesizedBase64}`;
        
        const newPanels = generatedData.panels.map((p: any) =>
          p.panelNumber === panelNumber ? { ...p, imageUrl: finalImageUrl, cleanImageUrl: `data:image/png;base64,${base64Only}` } : p
        );
        setGeneratedData({ ...generatedData, panels: newPanels });
      } else {
        alert('이미지 재생성에 실패했습니다.');
      }
    } catch (error) {
      alert('이미지 재생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmScript = () => {
    setStep('CHARACTER');
  };

  const handleGenerateCharacterSheet = async () => {
    setIsGeneratingCharacter(true);
    setRefBasedCharacter(null);
    setPromptBasedCharacter(null);
    setSelectedCharacterType(null);

    try {
      const res = await fetch('/api/character/generate-dual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: characterPrompt,
          referenceImage: userReferenceImage,
          visualStyle
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.refBasedImageUrl) setRefBasedCharacter(data.refBasedImageUrl);
        if (data.promptBasedImageUrl) setPromptBasedCharacter(data.promptBasedImageUrl);
      } else {
        alert('캐릭터 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('캐릭터 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingCharacter(false);
    }
  };

  const handleSelectCharacter = (type: 'ref' | 'prompt') => {
    setSelectedCharacterType(type);
    const selectedImage = type === 'ref' ? refBasedCharacter : promptBasedCharacter;
    if (selectedImage) {
      setCharacterSheetImage(selectedImage);
    }
  };

  const handleSaveCharacter = async () => {
    if (!characterSheetImage) return;
    setIsSavingCharacter(true);
    try {
      const res = await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${visualStyle} 스타일 캐릭터`,
          imageData: characterSheetImage, // imageData로 전달 (백엔드 요구사항)
          prompt: characterPrompt || '웹툰 챌린지에서 생성된 캐릭터',
          visualStyle,
          setAsDefault: true
        })
      });
      if (res.ok) {
        console.log('Character saved to profile');
      }
    } catch (error) {
      console.error('Failed to save character:', error);
    } finally {
      setIsSavingCharacter(false);
    }
  };

  const handleFinalGenerateWebtoon = async () => {
    setIsGenerating(true);
    setStep('IMAGE'); // 즉시 이미지 뷰로 전환
    
    // 초기 패널 데이터 세팅 (이미지는 아직 없음)
    const initialPanels = editedPanels.map(p => ({
      ...p,
      imageUrl: '', // 로딩 표시용 빈 주소
      cleanImageUrl: ''
    }));

    setGeneratedData((prev: any) => ({
      ...prev,
      panels: initialPanels,
      summary: freeTopic || '오늘의 회복 웹툰',
      characterSheetImage
    }));

    try {
      const updatedPanels = [...initialPanels];
      
      // 개별 패널 순차 생성 루프
      for (let i = 0; i < editedPanels.length; i++) {
        const panel = editedPanels[i];
        
        const res = await fetch('/api/webtoon/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'regenerate-panel', // 단일 패널 생성 로직 재활용
            panels: editedPanels,
            panelNumber: panel.panelNumber,
            visualStyle,
            genre,
            characterPrompt,
            characterSheetImage
          })
        });

        if (res.ok) {
          const data = await res.json();
          const base64Only = data.imageUrl.includes(',') ? data.imageUrl.split(',')[1] : data.imageUrl;
          
          // 클라이언트 사이드에서 텍스트 합성
          const synthesizedBase64 = await drawTextOnImageClient(base64Only, panel.script);
          
          updatedPanels[i] = {
            ...panel,
            imageUrl: `data:image/png;base64,${synthesizedBase64}`,
            cleanImageUrl: `data:image/png;base64,${base64Only}`
          };

          // 한 장 완료될 때마다 상태 업데이트 (실시간 렌더링)
          setGeneratedData((prev: any) => ({
            ...prev,
            panels: [...updatedPanels]
          }));
        }
      }

      if (!instagramCaption) generateInstagramCaption();
    } catch (error) {
      console.error('Incremental generation failed:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostWebtoon = async (isPublic: boolean) => {
    if (!generatedData || !generatedData.panels) {
      alert('저장할 웹툰이 없습니다.');
      return;
    }

    setIsGenerating(true);
    try {
      const compressedPanels = await Promise.all(
        generatedData.panels.map(async (p: any) => {
          const { cleanImageUrl, ...rest } = p;
          const compressedUrl = await compressImage(p.imageUrl, 800, 0.6);
          return {
            ...rest,
            imageUrl: compressedUrl
          };
        })
      );

      const payload = {
        date: new Date().toISOString(),
        episodeNumber: generatedData.episodeNumber || 1,
        title: generatedData.summary || '오늘의 회복 웹툰', 
        panels: compressedPanels,
        script: generatedData.summary || editedPanels[0]?.script || '',
        summary: generatedData.summary || '오늘의 회복 웹툰',
        imageUrl: compressedPanels[0]?.imageUrl || '',
        characterPrompt,
        visualStyle,
        genre,
        isPublic
      };

      const res = await fetch('/api/webtoon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStep('POSTED');
        if (characterSheetImage && !savedCharacters.find(c => c.imageUrl === characterSheetImage)) {
          handleSaveCharacter();
        }
      } else {
        let errorMsg = '게시에 실패했습니다.';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const err = await res.json();
            errorMsg = err.error || errorMsg;
          } else if (res.status === 413) {
            errorMsg = '전송용량이 너무 큽니다. 내용을 조금 줄이거나 다시 시도해주세요. (413)';
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Webtoon post failed:', error);
      alert('게시 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateInstagramCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const topic = topicMode === 'free' ? freeTopic : '오늘의 회복 이야기';
      const res = await fetch('/api/webtoon/sns-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          panels: editedPanels
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInstagramCaption({
          description: data.description,
          hashtags: data.hashtags
        });
      }
    } catch (error) {
      console.error('Instagram caption generation failed:', error);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleDownload = async (format: 'individual' | 'grid' | 'horizontal' | 'vertical') => {
    try {
      await downloadWebtoon(
        {
          panels: generatedData.panels,
          title: topicMode === 'free' ? freeTopic.substring(0, 20) : 'webtoon'
        },
        format
      );
    } catch (error) {
      console.error('Download failed:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const copyToClipboard = async (text: string, type: '설명' | '해시태그') => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type}이(가) 복사되었습니다!`);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('복사 중 오류가 발생했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl p-0 rounded-[32px] border-none shadow-3xl bg-white focus:outline-none max-h-[90vh] flex flex-col [&>button]:text-white [&>button]:opacity-100 [&>button]:z-50">
        <DialogHeader className="sr-only">
          <DialogTitle>웹툰 챌린지</DialogTitle>
          <DialogDescription>오늘의 회복 데이터를 웹툰으로 생성합니다.</DialogDescription>
        </DialogHeader>
        {/* Header - 고정 */}
        <div className="bg-obsidian p-6 md:p-8 text-mist relative rounded-t-[32px] flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-chapter-accent/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 relative z-10">
            <Sparkles className="text-reward-gold" /> 일일 웹툰 챌린지
          </h2>
          <p className="text-mist/60 text-sm mt-1 relative z-10">오늘의 회복 데이터를 한 컷의 예술로 만듭니다.</p>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {step === 'STYLE' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12">
              {/* 1. 장르 선택 (Select) */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-obsidian flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                  어떤 분위기의 이야기를 만들까요? (장르)
                </h3>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="w-full h-14 rounded-2xl border-line bg-mist/20 text-obsidian font-bold">
                    <SelectValue placeholder="장르 선택" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-line max-h-60 overflow-y-auto shadow-2xl">
                    {genres.map(g => (
                      <SelectItem key={g.id} value={g.id} className="focus:bg-primary/5 rounded-xl py-3">
                        <div className="flex items-center gap-3">
                          <span className="shrink-0 text-xl">{g.icon}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-obsidian text-sm md:text-base">{g.label}</div>
                            <div className="text-[9px] md:text-[10px] text-slate font-medium truncate">{g.desc}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. 스타일 선택 (Select) */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-obsidian flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
                  원하시는 그림 스타일을 선택하세요.
                </h3>
                <Select value={visualStyle} onValueChange={setVisualStyle}>
                  <SelectTrigger className="w-full h-14 rounded-2xl border-line bg-mist/20 text-obsidian font-bold">
                    <SelectValue placeholder="스타일 선택" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-line max-h-60 overflow-y-auto shadow-2xl">
                    {styles.map(s => (
                      <SelectItem key={s.id} value={s.id} className="focus:bg-primary/5 rounded-xl py-3">
                        <div className="flex items-center gap-3">
                          <span className="shrink-0 text-xl">{s.icon}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-obsidian text-sm md:text-base">{s.label}</div>
                            <div className="text-[9px] md:text-[10px] text-slate font-medium truncate">{s.desc}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2.5 컷 수 선택 (신규) */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-obsidian flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
                  웹툰 분량을 선택하세요. (컷 수)
                </h3>
                <Select value={panelCount} onValueChange={setPanelCount}>
                  <SelectTrigger className="w-full h-14 rounded-2xl border-line bg-mist/20 text-obsidian font-bold">
                    <SelectValue placeholder="컷 수 선택" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-line max-h-60 overflow-y-auto shadow-2xl">
                    {[1, 2, 4, 6, 8, 10].map(count => (
                      <SelectItem key={count} value={count.toString()} className="focus:bg-primary/5 rounded-xl py-3 font-bold text-obsidian">
                        {count}컷 {count === 1 ? '(단편)' : count === 4 ? '(추천)' : count === 10 ? '(장편)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. 주제 선택 */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-obsidian flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">4</span>
                  웹툰 주제를 선택하세요.
                </h3>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={topicMode === 'recovery' ? 'default' : 'outline'}
                    onClick={() => setTopicMode('recovery')}
                    className={`flex-1 h-12 rounded-xl font-bold transition-all text-xs md:text-sm ${topicMode === 'recovery' ? 'bg-primary' : ''}`}
                  >
                    회복 데이터 사용
                  </Button>
                  <Button
                    variant={topicMode === 'free' ? 'default' : 'outline'}
                    onClick={() => setTopicMode('free')}
                    className={`flex-1 h-12 rounded-xl font-bold transition-all text-xs md:text-sm ${topicMode === 'free' ? 'bg-primary' : ''}`}
                  >
                    자유 주제 입력
                  </Button>
                </div>

                {topicMode === 'free' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={freeTopic}
                        onChange={(e) => setFreeTopic(e.target.value)}
                        placeholder="예: 배달비가 너무 비싼 요즘... (Enter로 생성)"
                        className="flex-1 p-4 border border-line rounded-xl focus:ring-2 focus:ring-primary bg-mist/10 text-sm font-medium"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleStartGeneration();
                        }}
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={handleSuggestTopics}
                        disabled={isLoadingTopics}
                        className="h-12 w-12 rounded-xl bg-primary-container/50 hover:bg-amber-200"
                        title="gleemile 주제 추천받기"
                      >
                        {isLoadingTopics ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <span className="text-xl">💡</span>
                        )}
                      </Button>
                    </div>

                    {/* AI 추천 주제 목록 */}
                    {suggestedTopics.length > 0 && (
                      <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                        <p className="font-bold text-sm mb-2 text-amber-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> 이런 주제는 어때요?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTopics.map((idea, idx) => (
                            <button
                              key={idx}
                              onClick={() => setFreeTopic(idea)}
                              className="px-4 py-2 bg-white rounded-full border border-primary/30 hover:border-primary/30 hover:bg-amber-50 text-xs text-amber-900 font-bold transition-all shadow-sm"
                            >
                              {idea}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-6">
                <Button 
                  className="w-full h-16 rounded-2xl font-black bg-obsidian text-mist shadow-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  onClick={handleStartGeneration}
                  disabled={isGenerating || (topicMode === 'free' && !freeTopic.trim())}
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5 text-reward-gold" />}
                  gleemile 웹툰 대본 생성 시작
                </Button>
              </div>
            </div>
          )}

          {step === 'SCRIPT' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-obsidian flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-primary" /> 장면별 대본 검토
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-black uppercase text-primary border-primary/30">
                    {genre.toUpperCase()} / {editedPanels.length} CUTS
                  </Badge>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {editedPanels.map((panel, idx) => (
                    <div key={idx} className="p-5 bg-mist/30 border border-line rounded-2xl group space-y-3">
                      <div className="inline-flex bg-obsidian text-mist text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
                        PANEL {panel.panelNumber}
                      </div>
                      <Textarea
                        value={panel.script}
                        onChange={(e) => {
                          const newPanels = [...editedPanels];
                          newPanels[idx].script = e.target.value;
                          setEditedPanels(newPanels);
                        }}
                        className="bg-transparent border-none focus-visible:ring-0 text-obsidian font-medium leading-relaxed min-h-[80px] p-0 text-sm resize-none"
                        placeholder="장면 설명을 입력하세요..."
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate italic text-center text-balance px-4">
                  "장면별 대본을 자유롭게 수정해 보세요."
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 h-14 font-bold text-sm md:text-base" onClick={() => setStep('STYLE')}>뒤로</Button>
                <Button className="flex-[2] h-14 px-4 md:px-8 font-black rounded-xl bg-primary text-sm md:text-base whitespace-nowrap" onClick={handleConfirmScript}>
                  캐릭터 설정하기 <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'CHARACTER' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pb-10">
              <div className="space-y-1">
                <h3 className="font-black text-obsidian flex items-center gap-2 text-xl">
                  <UserCircle2 className="w-6 h-6 text-primary" /> 웹툰 캐릭터 완성하기
                </h3>
                <p className="text-xs font-bold text-slate">사진과 설명을 바탕으로 두 가지 캐릭터를 만들어 드려요. 마음에 드는 것을 선택하세요!</p>
              </div>

              {/* 입력 영역 */}
              <div className="p-5 bg-white border-2 border-line rounded-3xl shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 레퍼런스 사진 */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate uppercase tracking-wider">📷 레퍼런스 사진 (선택)</label>
                    <input type="file" accept="image/*" id="char-ref-upload" className="hidden"
                      aria-label="캐릭터 레퍼런스 사진 업로드"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setUserReferenceImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-line hover:border-primary transition-colors cursor-pointer aspect-video flex flex-col items-center justify-center bg-mist/10"
                      onClick={() => document.getElementById('char-ref-upload')?.click()}>
                      {userReferenceImage ? (
                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={userReferenceImage} className="w-full h-full object-cover" alt="Reference" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-slate/40 mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate italic">사진 업로드</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 캐릭터 묘사 */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate uppercase tracking-wider">📝 캐릭터 묘사</label>
                    <Textarea
                      value={characterPrompt}
                      onChange={(e) => setCharacterPrompt(e.target.value)}
                      className="min-h-[100px] bg-mist/10 border-none rounded-2xl text-sm font-medium leading-relaxed resize-none"
                      placeholder="성별, 나이, 머리색, 옷차림 등..."
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateCharacterSheet}
                  disabled={isGeneratingCharacter || (!characterPrompt && !userReferenceImage)}
                  className="w-full h-12 rounded-2xl font-black bg-obsidian text-mist shadow-xl"
                >
                  {isGeneratingCharacter ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5 text-reward-gold" />}
                  ✨ 캐릭터 2종 생성하기
                </Button>
              </div>

              {/* 듀얼 캐릭터 선택 영역 */}
              {(refBasedCharacter || promptBasedCharacter) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <h4 className="text-sm font-black text-obsidian">🎭 캐릭터를 선택하세요</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 사진 기반 캐릭터 */}
                    {refBasedCharacter && (
                      <div
                        className={`relative rounded-3xl overflow-hidden border-4 transition-all cursor-pointer hover:scale-[1.02] ${selectedCharacterType === 'ref' ? 'border-primary shadow-lg shadow-primary/30' : 'border-white shadow-md'
                          }`}
                        onClick={() => handleSelectCharacter('ref')}
                      >
                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={refBasedCharacter} alt="사진 기반" className="w-full aspect-square object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-xs font-black">📷 사진 기반</p>
                        </div>
                        {selectedCharacterType === 'ref' && (
                          <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 프롬프트 기반 캐릭터 */}
                    {promptBasedCharacter && (
                      <div
                        className={`relative rounded-3xl overflow-hidden border-4 transition-all cursor-pointer hover:scale-[1.02] ${selectedCharacterType === 'prompt' ? 'border-primary shadow-lg shadow-primary/30' : 'border-white shadow-md'
                          }`}
                        onClick={() => handleSelectCharacter('prompt')}
                      >
                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={promptBasedCharacter} alt="gleemile 프롬프트 기반" className="w-full aspect-square object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-xs font-black">📝 gleemile 프롬프트 기반</p>
                        </div>
                        {selectedCharacterType === 'prompt' && (
                          <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedCharacterType && (
                    <p className="text-[10px] text-primary font-bold text-center">✨ 선택된 캐릭터가 웹툰 전반에 주인공으로 등장합니다!</p>
                  )}
                </div>
              )}

              {/* 결과가 없을 때 안내 */}
              {!refBasedCharacter && !promptBasedCharacter && !isGeneratingCharacter && (
                <div className="aspect-video bg-mist/20 rounded-3xl border-4 border-white shadow-inner flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-mist/50 flex items-center justify-center mb-3">
                    <ImageIcon className="w-6 h-6 opacity-20" />
                  </div>
                  <p className="text-xs font-black text-slate/40 text-center">사진이나 묘사를 입력하고<br />버튼을 눌러 캐릭터를 생성하세요</p>
                </div>
              )}

              {/* 로딩 상태 */}
              {isGeneratingCharacter && (
                <div className="aspect-video bg-mist/20 rounded-3xl border-4 border-white shadow-inner flex flex-col items-center justify-center animate-pulse">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                  <p className="text-xs font-black text-slate">gleemile이 두 가지 캐릭터를 그리는 중...</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" className="flex-1 h-14 font-black text-slate" onClick={() => setStep('SCRIPT')}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> 대본 수정으로
                </Button>
                <Button
                  className="flex-[2] h-14 px-8 font-black rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 disabled:opacity-50"
                  onClick={() => {
                    handleSaveCharacter();
                    handleFinalGenerateWebtoon();
                  }}
                  disabled={isGenerating || !selectedCharacterType}
                >
                  {isGenerating || isSavingCharacter ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                  선택한 캐릭터로 웹툰 생성
                </Button>
              </div>
            </div>
          )}

          {step === 'IMAGE' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-obsidian flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" /> 완성된 멀티컷 웹툰
                </h3>

                <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                    {generatedData.panels.map((panel: any, idx: number) => (
                      <div key={idx} className="relative group rounded-[24px] overflow-hidden border border-line shadow-lg bg-mist/10 aspect-video flex flex-col items-center justify-center">
                        {panel.imageUrl ? (
                          <>
                            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={panel.imageUrl} alt={`Panel ${panel.panelNumber}`} className="w-full h-auto animate-in fade-in duration-500" />
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/90 backdrop-blur-sm hover:bg-white text-obsidian font-bold text-xs shadow-xl"
                                onClick={() => handleRegeneratePanel(panel.panelNumber)}
                                disabled={isGenerating}
                              >
                                <RefreshCcw className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                                다시 만들기
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative">
                              <Loader2 className="w-12 h-12 text-primary animate-spin" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-black">{panel.panelNumber}</span>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-obsidian animate-pulse">gleemile이 그리는 중...</p>
                              <p className="text-[10px] text-slate/40 mt-1 uppercase tracking-widest leading-none">Drawing Panel {panel.panelNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                <p className="text-[10px] text-slate/60 text-center uppercase tracking-widest font-black">Scroll to read more</p>
              </div>

              {/* Phase 2: 다운로드 옵션 */}
              <div className="p-4 bg-mist/30 rounded-2xl space-y-3">
                <h4 className="text-sm font-black text-obsidian flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  웹툰 다운로드
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('grid')}
                    className="text-xs"
                  >
                    바둑판 (2x2)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('horizontal')}
                    className="text-xs"
                  >
                    가로 연속
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('vertical')}
                    className="text-xs"
                  >
                    세로 연속
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('individual')}
                    className="text-xs"
                  >
                    개별 파일
                  </Button>
                </div>
              </div>

              {/* Phase 2: 인스타그램 캡션 */}
              {instagramCaption && (
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl space-y-3 border border-purple-200">
                  <h4 className="text-sm font-black text-purple-900 flex items-center gap-2">
                    📱 인스타그램 포스트 추천
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-secondary">설명</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(instagramCaption.description, '설명')}
                          className="h-6 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          복사
                        </Button>
                      </div>
                      <p className="text-sm text-purple-900 bg-white/60 p-3 rounded-lg">
                        {instagramCaption.description}
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-secondary">해시태그</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(instagramCaption.hashtags, '해시태그')}
                          className="h-6 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          복사
                        </Button>
                      </div>
                      <p className="text-xs text-purple-800 bg-white/60 p-3 rounded-lg font-mono">
                        {instagramCaption.hashtags}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-14 font-bold rounded-xl border-line"
                  onClick={() => handlePostWebtoon(false)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2" /> : null}
                  나만 보기로 저장
                </Button>
                <Button
                  className="h-14 font-black rounded-xl bg-chapter-accent text-background"
                  onClick={() => handlePostWebtoon(true)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2 h-5 w-5" />}
                  전체 공개로 게시
                </Button>
              </div>
            </div>
          )}

          {step === 'POSTED' && (
            <div className="py-12 text-center space-y-6 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-status-good/10 text-status-good rounded-full flex items-center justify-center mx-auto shadow-inner border border-status-good/20 text-xl">
                ✨
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-obsidian tracking-tight">오늘의 회복 기록 완료!</h3>
                <p className="text-slate font-medium italic">"당신의 여정이 한 권의 책으로 엮이고 있습니다."</p>
              </div>
              <div className="pt-6">
                <Button
                  className="h-14 px-10 font-black rounded-2xl bg-obsidian text-mist shadow-xl"
                  onClick={() => onOpenChange(false)}
                >
                  확인
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
