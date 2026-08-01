"use client";

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
  description?: string;
}

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title = "전자서명",
  description = "아래 영역에 정자로 서명해 주세요."
}: SignaturePadModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('서명을 입력해 주세요.');
      return;
    }
    
    // Base64 PNG URL 획득
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-xl p-4 md:p-6 mx-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative touch-none select-none">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            onBegin={() => setIsEmpty(false)}
            canvasProps={{
              className: 'signature-canvas w-full h-48 md:h-64 cursor-crosshair',
              // 모바일 브라우저 스크롤 방지를 위해 touch-action 설정은 css 또는 className으로 처리
              style: { touchAction: 'none' }
            }}
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-300 text-lg font-medium">여기에 서명하세요</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-end gap-2 w-full">
          <Button type="button" variant="outline" onClick={handleClear} className="w-1/3 sm:w-auto">
            지우기
          </Button>
          <div className="flex gap-2 w-2/3 sm:w-auto">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              취소
            </Button>
            <Button type="button" onClick={handleSave} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              서명 완료
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
