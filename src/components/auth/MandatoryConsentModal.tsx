'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CONSENT_TEXTS } from '@/constants/consents';
import CharacterImage from '@/components/ui/CharacterImage';

export default function MandatoryConsentModal() {
  const { data: session, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [policyData, setPolicyData] = useState<{ [key: string]: any } | null>(null);
  
  const [formData, setFormData] = useState({
    termsAccepted: false,
    privacyAccepted: false,
    sensitiveInfoAccepted: false,
    thirdPartyAccepted: false,
    marketingConsent: false,
  });

  useEffect(() => {
    fetch('/api/policies/active')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.policyMap) {
          setPolicyData(json.data.policyMap);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      // 필수 항목 중 하나라도 누락된 경우 모달 표시
      const isMissingConsent = 
        !user.termsAcceptedAt || 
        !user.privacyAcceptedAt || 
        !user.sensitiveInfoAcceptedAt || 
        !user.thirdPartyAcceptedAt;
      
      if (isMissingConsent) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
  }, [session]);

  const allMandatoryAccepted = 
    formData.termsAccepted && 
    formData.privacyAccepted && 
    formData.sensitiveInfoAccepted && 
    formData.thirdPartyAccepted;

  const handleAgreeAll = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      termsAccepted: checked,
      privacyAccepted: checked,
      sensitiveInfoAccepted: checked,
      thirdPartyAccepted: checked,
      marketingConsent: checked,
    }));
  };

  const handleSubmit = async () => {
    if (!allMandatoryAccepted) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // 세션 업데이트
        const updated = await updateSession();
        console.log('Session updated:', updated);
        
        // 동의가 완료되면 모달 닫기
        setIsOpen(false);
        
        // 강제 새로고침이 필요한 경우 (세션 정보가 즉시 반영 안 될 때를 대비)
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || '동의 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Consent submission error:', error);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        // 모바일(S24 등)에서 긴 내용이 잘리지 않도록 flex-col, max-h-[90vh], overflow-y-auto를 적용합니다.
        className="max-w-md w-[92%] sm:w-full rounded-[32px] p-0 border-none bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto [&>button]:!text-white [&>button]:!opacity-100 [&>button_svg]:!h-5 [&>button_svg]:!w-5 scrollbar-hide"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-primary p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 bg-white/20 rounded-full p-2">
              <CharacterImage
                src="/character/youniqle-1.png"
                alt="Youniqle"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              서비스 이용 약관 개정 안내
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm font-medium leading-relaxed">
            더 나은 서비스 제공을 위해 이용약관 및 개인정보 처리방침이 개정되었습니다. <br/>
            계속해서 서비스를 이용하시려면 아래 필수 항목에 동의해 주세요.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <div className="flex items-center space-x-2">
              <input
                id="modalAgreeAll"
                type="checkbox"
                aria-label="전체 동의"
                checked={allMandatoryAccepted && formData.marketingConsent}
                onChange={(e) => handleAgreeAll(e.target.checked)}
                className="h-5 w-5 rounded-md border-primary text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="modalAgreeAll" className="text-sm font-bold text-text-primary cursor-pointer">
                전체 동의하기
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <ConsentRow 
              id="m-terms" 
              label={policyData?.TERMS?.title || "서비스 이용약관 동의 (필수)"} 
              checked={formData.termsAccepted}
              onChange={() => setFormData(p => ({ ...p, termsAccepted: !p.termsAccepted }))}
              content={policyData?.TERMS?.content || CONSENT_TEXTS.terms}
              isHtml={!!policyData?.TERMS}
            />
            <ConsentRow 
              id="m-privacy" 
              label={policyData?.PRIVACY?.title || "개인정보 처리방침 동의 (필수)"} 
              checked={formData.privacyAccepted}
              onChange={() => setFormData(p => ({ ...p, privacyAccepted: !p.privacyAccepted }))}
              content={policyData?.PRIVACY?.content || CONSENT_TEXTS.privacy}
              isHtml={!!policyData?.PRIVACY}
            />
            <ConsentRow 
              id="m-sensitive" 
              label={policyData?.SENSITIVE?.title || "민감정보 수집 및 이용 동의 (필수)"} 
              checked={formData.sensitiveInfoAccepted}
              onChange={() => setFormData(p => ({ ...p, sensitiveInfoAccepted: !p.sensitiveInfoAccepted }))}
              content={policyData?.SENSITIVE?.content || CONSENT_TEXTS.sensitive}
              isHtml={!!policyData?.SENSITIVE}
            />
            <ConsentRow 
              id="m-thirdParty" 
              label={policyData?.THIRD_PARTY?.title || "개인정보 제3자 제공 동의 (필수)"} 
              checked={formData.thirdPartyAccepted}
              onChange={() => setFormData(p => ({ ...p, thirdPartyAccepted: !p.thirdPartyAccepted }))}
              content={policyData?.THIRD_PARTY?.content || CONSENT_TEXTS.thirdParty}
              isHtml={!!policyData?.THIRD_PARTY}
            />
            <ConsentRow 
              id="m-marketing" 
              label={policyData?.MARKETING?.title || "광고성 정보 수신 동의 (선택)"} 
              checked={formData.marketingConsent}
              onChange={() => setFormData(p => ({ ...p, marketingConsent: !p.marketingConsent }))}
              content={policyData?.MARKETING?.content || CONSENT_TEXTS.marketing}
              isHtml={!!policyData?.MARKETING}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!allMandatoryAccepted || loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-background font-black text-lg rounded-2xl shadow-xl transition-all"
            >
              {loading ? '처리 중...' : '동의하고 계속하기'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConsentRow({ id, label, checked, onChange, content, isHtml }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center space-x-2">
        <input
          id={id}
          type="checkbox"
          aria-label={label}
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 rounded border-line text-primary focus:ring-primary cursor-pointer"
        />
        <Label htmlFor={id} className="text-sm font-medium text-text-secondary cursor-pointer">
          {label}
        </Label>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="text-xs font-bold text-primary hover:underline">상세보기</button>
        </DialogTrigger>
        <DialogContent 
          className="max-w-lg rounded-3xl p-0 overflow-hidden bg-surface max-h-[70vh] flex flex-col border-none [&>button]:!text-white [&>button]:!opacity-100 [&>button_svg]:!h-5 [&>button_svg]:!w-5"
        >
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="font-black text-xl">{label}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 text-base text-text-primary whitespace-pre-wrap leading-relaxed">
            {isHtml ? (
               <div dangerouslySetInnerHTML={{ __html: content }} className="prose prose-sm max-w-none text-obsidian" />
            ) : (
               <>{content}</>
            )}
          </div>
          <div className="p-6 border-t border-line bg-background/50">
            <DialogClose asChild>
              <Button 
                className="w-full h-12 bg-primary rounded-xl font-bold" 
                onClick={() => {
                  if (!checked) onChange();
                }}
              >
                확인
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
