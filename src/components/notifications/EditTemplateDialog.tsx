'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, HelpCircle, BookOpen } from 'lucide-react';

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  templateId: string | null;
}

interface TemplateFormData {
  name: string;
  description: string;
  type: 'email' | 'push' | 'sms' | 'in_app' | '';
  category: 'order' | 'payment' | 'delivery' | 'promotion' | 'system' | 'marketing' | 'security' | '';
  priority: 'low' | 'medium' | 'high' | 'urgent' | '';
  language: string;
  status: 'active' | 'inactive' | 'draft';
  title: string;
  content: string;
  tags: string[];
}

export default function EditTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
  templateId,
}: EditTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVariableGuide, setShowVariableGuide] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    type: '',
    category: '',
    priority: 'medium',
    language: 'ko',
    status: 'draft',
    title: '',
    content: '',
    tags: [],
  });

  // 템플릿 데이터 로드
  useEffect(() => {
    if (open && templateId) {
      fetchTemplateData();
    }
  }, [open, templateId]);

  const fetchTemplateData = async () => {
    if (!templateId) return;

    try {
      setFetchLoading(true);
      setError(null);


      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        headers: {
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '템플릿 정보를 불러올 수 없습니다.');
      }

      // 폼 데이터 설정
      setFormData({
        name: data.name || '',
        description: data.description || '',
        type: data.type || '',
        category: data.category || '',
        priority: data.priority || 'medium',
        language: data.language || 'ko',
        status: data.status || 'draft',
        title: data.title || '',
        content: data.content || '',
        tags: data.tags || [],
      });
    } catch (error) {
      console.error('Template fetch error:', error);
      setError(error instanceof Error ? error.message : '템플릿 정보를 불러올 수 없습니다.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (field: keyof TemplateFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('템플릿 이름을 입력해주세요.');
      return false;
    }
    if (!formData.type) {
      setError('알림 타입을 선택해주세요.');
      return false;
    }
    if (!formData.category) {
      setError('카테고리를 선택해주세요.');
      return false;
    }
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return false;
    }
    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !templateId) return;

    try {
      setLoading(true);
      setError(null);


      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '템플릿 수정에 실패했습니다.');
      }

      // 성공 처리
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Template update error:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      category: '',
      priority: 'medium',
      language: 'ko',
      status: 'draft',
      title: '',
      content: '',
      tags: [],
    });
    setTagInput('');
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>알림 템플릿 수정</DialogTitle>
          <DialogDescription>
            템플릿 정보를 수정하고 저장하세요.
          </DialogDescription>
        </DialogHeader>

        {fetchLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  템플릿 이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="예: 주문 확인 알림"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  placeholder="템플릿에 대한 간단한 설명을 입력하세요"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>

            {/* 설정 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  알림 타입 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">이메일</SelectItem>
                    <SelectItem value="push">푸시</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="in_app">인앱</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  카테고리 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">주문</SelectItem>
                    <SelectItem value="payment">결제</SelectItem>
                    <SelectItem value="delivery">배송</SelectItem>
                    <SelectItem value="promotion">프로모션</SelectItem>
                    <SelectItem value="system">시스템</SelectItem>
                    <SelectItem value="marketing">마케팅</SelectItem>
                    <SelectItem value="security">보안</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">우선순위</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">언어</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">초안</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 템플릿 내용 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="알림 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
                <p className="text-sm text-foreground/70">
                  변수 사용 가능: {'{'}name{'}'}, {'{'}order_id{'}'}, {'{'}amount{'}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  내용 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="알림 내용을 입력하세요"
                  rows={6}
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                />
                <p className="text-sm text-foreground/70">
                  변수를 사용하여 동적 내용을 포함할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <Label htmlFor="tags">태그</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="태그 입력 후 추가 버튼 클릭"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-gray-200 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading || fetchLoading}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={loading || fetchLoading}>
            {loading ? '저장 중...' : '변경사항 저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

