'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CharacterImage from '@/components/ui/CharacterImage';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  ArrowLeft,
  ShoppingCart,
  Package,
  CreditCard,
  Gift,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface NotificationSettings {
  email: {
    order: boolean;
    shipping: boolean;
    coupon: boolean;
    point: boolean;
    promotion: boolean;
    newsletter: boolean;
  };
  sms: {
    order: boolean;
    shipping: boolean;
    coupon: boolean;
    promotion: boolean;
  };
  push: {
    order: boolean;
    shipping: boolean;
    coupon: boolean;
    point: boolean;
    promotion: boolean;
  };
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      order: true,
      shipping: true,
      coupon: true,
      point: true,
      promotion: false,
      newsletter: false,
    },
    sms: {
      order: true,
      shipping: true,
      coupon: false,
      promotion: false,
    },
    push: {
      order: true,
      shipping: true,
      coupon: true,
      point: true,
      promotion: false,
    },
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('알림 설정 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        alert('알림 설정이 저장되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '알림 설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
      alert('알림 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    category: 'email' | 'sms' | 'push',
    key: string,
    value: boolean
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-obsidian mb-6">
              알림 설정을 관리하려면 로그인해주세요.
            </p>
            <Button asChild>
              <Link href="/auth/signin">로그인하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/me">
              <ArrowLeft className="h-4 w-4 mr-2" />
              마이페이지로 돌아가기
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">알림 설정</h1>
          <p className="text-obsidian">
            받고 싶은 알림을 선택하세요
          </p>
        </div>

        {/* 이메일 알림 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              이메일 알림
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="email-order">주문 알림</Label>
                  <p className="text-sm text-foreground/70">주문 확인, 주문 취소 알림</p>
                </div>
              </div>
              <Switch
                id="email-order"
                checked={settings.email.order}
                onCheckedChange={(checked) => updateSetting('email', 'order', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="email-shipping">배송 알림</Label>
                  <p className="text-sm text-foreground/70">배송 시작, 배송 완료 알림</p>
                </div>
              </div>
              <Switch
                id="email-shipping"
                checked={settings.email.shipping}
                onCheckedChange={(checked) => updateSetting('email', 'shipping', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Gift className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="email-coupon">쿠폰 알림</Label>
                  <p className="text-sm text-foreground/70">쿠폰 발급, 만료 예정 알림</p>
                </div>
              </div>
              <Switch
                id="email-coupon"
                checked={settings.email.coupon}
                onCheckedChange={(checked) => updateSetting('email', 'coupon', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="email-point">포인트 알림</Label>
                  <p className="text-sm text-foreground/70">포인트 적립, 사용, 만료 알림</p>
                </div>
              </div>
              <Switch
                id="email-point"
                checked={settings.email.point}
                onCheckedChange={(checked) => updateSetting('email', 'point', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="email-promotion">프로모션 알림</Label>
                  <p className="text-sm text-foreground/70">할인, 이벤트 정보 알림</p>
                </div>
              </div>
              <Switch
                id="email-promotion"
                checked={settings.email.promotion}
                onCheckedChange={(checked) => updateSetting('email', 'promotion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="email-newsletter">뉴스레터 구독</Label>
                  <p className="text-sm text-foreground/70">주간 뉴스레터 수신</p>
                </div>
              </div>
              <Switch
                id="email-newsletter"
                checked={settings.email.newsletter}
                onCheckedChange={(checked) => updateSetting('email', 'newsletter', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SMS 알림 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              SMS 알림
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="sms-order">주문 알림</Label>
                  <p className="text-sm text-foreground/70">주문 확인, 주문 취소 알림</p>
                </div>
              </div>
              <Switch
                id="sms-order"
                checked={settings.sms.order}
                onCheckedChange={(checked) => updateSetting('sms', 'order', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="sms-shipping">배송 알림</Label>
                  <p className="text-sm text-foreground/70">배송 시작, 배송 완료 알림</p>
                </div>
              </div>
              <Switch
                id="sms-shipping"
                checked={settings.sms.shipping}
                onCheckedChange={(checked) => updateSetting('sms', 'shipping', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Gift className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="sms-coupon">쿠폰 알림</Label>
                  <p className="text-sm text-foreground/70">쿠폰 발급 알림</p>
                </div>
              </div>
              <Switch
                id="sms-coupon"
                checked={settings.sms.coupon}
                onCheckedChange={(checked) => updateSetting('sms', 'coupon', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="sms-promotion">프로모션 알림</Label>
                  <p className="text-sm text-foreground/70">할인, 이벤트 정보 알림</p>
                </div>
              </div>
              <Switch
                id="sms-promotion"
                checked={settings.sms.promotion}
                onCheckedChange={(checked) => updateSetting('sms', 'promotion', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 푸시 알림 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              푸시 알림
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="push-order">주문 알림</Label>
                  <p className="text-sm text-foreground/70">주문 확인, 주문 취소 알림</p>
                </div>
              </div>
              <Switch
                id="push-order"
                checked={settings.push.order}
                onCheckedChange={(checked) => updateSetting('push', 'order', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="push-shipping">배송 알림</Label>
                  <p className="text-sm text-foreground/70">배송 시작, 배송 완료 알림</p>
                </div>
              </div>
              <Switch
                id="push-shipping"
                checked={settings.push.shipping}
                onCheckedChange={(checked) => updateSetting('push', 'shipping', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Gift className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="push-coupon">쿠폰 알림</Label>
                  <p className="text-sm text-foreground/70">쿠폰 발급, 만료 예정 알림</p>
                </div>
              </div>
              <Switch
                id="push-coupon"
                checked={settings.push.coupon}
                onCheckedChange={(checked) => updateSetting('push', 'coupon', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="push-point">포인트 알림</Label>
                  <p className="text-sm text-foreground/70">포인트 적립, 사용, 만료 알림</p>
                </div>
              </div>
              <Switch
                id="push-point"
                checked={settings.push.point}
                onCheckedChange={(checked) => updateSetting('push', 'point', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-4 w-4 text-foreground/70" />
                <div>
                  <Label htmlFor="push-promotion">프로모션 알림</Label>
                  <p className="text-sm text-foreground/70">할인, 이벤트 정보 알림</p>
                </div>
              </div>
              <Switch
                id="push-promotion"
                checked={settings.push.promotion}
                onCheckedChange={(checked) => updateSetting('push', 'promotion', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" asChild>
            <Link href="/me">취소</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}

