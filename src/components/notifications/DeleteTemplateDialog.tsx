'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  templateId: string | null;
  templateName: string;
}

export default function DeleteTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
  templateId,
  templateName,
}: DeleteTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      setError(null);


      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '템플릿 삭제에 실패했습니다.');
      }

      // 성공 처리
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Template delete error:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle>템플릿 삭제</DialogTitle>
          </div>
          <DialogDescription>
            이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <p className="text-sm text-obsidian">
            정말로 <span className="font-semibold">&quot;{templateName}&quot;</span> 템플릿을 삭제하시겠습니까?
          </p>
          <p className="text-sm text-foreground/70 mt-2">
            이 템플릿과 관련된 모든 데이터가 영구적으로 삭제됩니다.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

