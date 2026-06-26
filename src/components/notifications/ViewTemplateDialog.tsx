'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Bell,
  MessageSquare,
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  Globe,
  Tag,
  User,
  Calendar
} from 'lucide-react';

interface ViewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
}

interface TemplateData {
  name: string;
  description: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  category: string;
  priority: string;
  language: string;
  status: 'active' | 'inactive' | 'draft';
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  stats?: {
    totalSchedules: number;
    activeSchedules: number;
    totalSent: number;
    totalDelivered: number;
    averageDeliveryRate: number;
    averageOpenRate: number;
  };
}

export default function ViewTemplateDialog({
  open,
  onOpenChange,
  templateId,
}: ViewTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);

  useEffect(() => {
    if (open && templateId) {
      fetchTemplate();
    }
  }, [open, templateId]);

  const fetchTemplate = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      setError(null);


      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '템플릿 정보를 불러올 수 없습니다.');
      }

      setTemplate(data);
    } catch (error) {
      console.error('Template fetch error:', error);
      setError(error instanceof Error ? error.message : '템플릿 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'push':
        return <Bell className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'in_app':
        return <Smartphone className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            활성
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            비활성
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            초안
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={colors[priority] || 'bg-gray-100 text-obsidian'}>
        {priority}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>템플릿 상세 정보</DialogTitle>
          <DialogDescription>
            템플릿의 상세 정보를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : template ? (
          <div className="space-y-6 py-4">
            {/* 헤더 정보 */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-xl">{template.name}</h3>
                {template.description && (
                  <p className="text-obsidian mt-1">{template.description}</p>
                )}
              </div>
              {getStatusBadge(template.status)}
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-surface rounded-lg">
              <div className="flex items-center gap-2">
                {getTypeIcon(template.type)}
                <div>
                  <p className="text-sm text-obsidian">타입</p>
                  <p className="font-medium capitalize">{template.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <div>
                  <p className="text-sm text-obsidian">카테고리</p>
                  <p className="font-medium">{template.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <div>
                  <p className="text-sm text-obsidian">언어</p>
                  <p className="font-medium">{template.language.toUpperCase()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-obsidian">우선순위</p>
                <div className="mt-1">{getPriorityBadge(template.priority)}</div>
              </div>
            </div>

            {/* 템플릿 내용 */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">제목</h4>
                <div className="p-3 bg-surface rounded-md">
                  <p>{template.title}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">내용</h4>
                <div className="p-3 bg-surface rounded-md whitespace-pre-wrap">
                  <p>{template.content}</p>
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div>
              <h4 className="font-semibold mb-2">태그</h4>
              <div className="flex flex-wrap gap-2">
                {template.tags && template.tags.length > 0 ? (
                  template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-foreground/70 text-sm">태그가 없습니다.</p>
                )}
              </div>
            </div>

            {/* 통계 */}
            <div>
              <h4 className="font-semibold mb-3">사용 통계</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-obsidian">총 전송</p>
                  <p className="text-2xl font-bold text-primary">
                    {template.stats?.totalSent?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-obsidian">전달률</p>
                  <p className="text-2xl font-bold text-green-600">
                    {template.stats?.averageDeliveryRate?.toFixed(1) || '0.0'}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-obsidian">열람률</p>
                  <p className="text-2xl font-bold text-secondary">
                    {template.stats?.averageOpenRate?.toFixed(1) || '0.0'}%
                  </p>
                </div>
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-obsidian">
                <User className="h-4 w-4" />
                <span>생성자: {template.createdBy.name} ({template.createdBy.email})</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-obsidian">
                <Calendar className="h-4 w-4" />
                <span>생성일: {new Date(template.createdAt).toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-obsidian">
                <Clock className="h-4 w-4" />
                <span>수정일: {new Date(template.updatedAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

