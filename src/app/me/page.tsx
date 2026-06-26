'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import UnifiedAddressSearch from '@/components/ui/UnifiedAddressSearch';
import MembershipInfo from '@/components/ui/MembershipInfo';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Settings,
  Save,
  Store,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  X,
  Upload,
  FileImage,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  CreditCard,
  Ticket,
  Bell,
  LogOut,
  UserX,
  ShoppingBag,
  Heart,
  Activity,
  Zap,
  Sparkles,
  Trophy,
  Link2,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import ReferralSection from '@/components/ui/ReferralSection';
import Image from 'next/image';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicHero from '@/components/me/DynamicHero';
import MembershipProgress from '@/components/me/MembershipProgress';
import AILatestBrief from '@/components/me/AILatestBrief';
import { Switch } from '@/components/ui/switch';
import ChapterWrapper from '@/components/layout/ChapterWrapper';
import QRReferralCard from '@/components/me/QRReferralCard';
import MedicalPassCard from '@/components/me/MedicalPassCard';
import ReferralNetwork from '@/components/shared/ReferralNetwork';
import NavigatorConsultationCenter from '@/components/me/NavigatorConsultationCenter';
import RecoveryLeaderboard from '@/components/me/RecoveryLeaderboard';

export default function MyPage() {
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'recovery' | 'pass' | 'care' | 'profile'>('recovery');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    marketingConsent: false,
    zipCode: '',
    address1: '',
    address2: '',
    avatar: '',
  });
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPartnerApplication, setShowPartnerApplication] = useState(false);
  const [partnerApplicationData, setPartnerApplicationData] = useState({
    partnerType: '',
    businessName: '',
    businessNumber: '',
    businessZipCode: '',
    businessAddress: '',
    businessDetailAddress: '',
    businessPhone: '',
    businessDescription: '',
    bankAccount: '',
    bankName: '',
    accountHolder: '',
    businessRegistrationImage: '',
    bankStatementImage: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({
    businessRegistrationImage: null,
    bankStatementImage: null
  });
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string | null }>({
    businessRegistrationImage: null,
    bankStatementImage: null
  });
  const [partnerApplicationLoading, setPartnerApplicationLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [communityAverages, setCommunityAverages] = useState<any[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [userBadges, setUserBadges] = useState<any[]>([]);

  // 모임 클럽하우스 전용 상태
  const [mileTeamInfo, setMileTeamInfo] = useState<any>(null);
  const [milePendingTeam, setMilePendingTeam] = useState<any>(null);
  const [mileLoading, setMileLoading] = useState(true);

  // 모임 신청 및 가입 폼 상태
  const [mileInviteCode, setMileInviteCode] = useState('');
  const [mileJoining, setMileJoining] = useState(false);
  const [mileCreationMode, setMileCreationMode] = useState(false);
  const [mileNewTeamName, setMileNewTeamName] = useState('');
  const [mileNewCategory, setMileNewCategory] = useState('youth');
  const [mileNewAgeGroup, setMileNewAgeGroup] = useState('');
  const [mileNewRegion, setMileNewRegion] = useState('');
  const [mileNewDescription, setMileNewDescription] = useState('');
  const [mileCreationLoading, setMileCreationLoading] = useState(false);
  const [mileError, setMileError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        // PWARegistration에서 처리하므로 권한만 요청해도 되지만, 즉각적인 반응을 위해 강제 재등록 유도 가능
        window.location.reload(); // 서비스워커 재등록 유도
      }
    } else {
      // 알림 끄기는 브라우저 설정에서 해야 하므로 안내만 표시
      alert('알림을 끄려면 브라우저 설정에서 gleemile 사이트의 알림 권한을 차단해 주세요.');
    }
  };

  const fetchCommunityData = async () => {
    try {
      const res = await fetch('/api/recovery/averages');
      if (res.ok) {
        const data = await res.json();
        setCommunityAverages(data.dailyAverages || []);
      }
    } catch (e) {
      console.error('Failed to fetch community averages:', e);
    }
  };

  const fetchWeeklyReport = async () => {
    try {
      const res = await fetch('/api/dashboard/report');
      if (res.ok) {
        const data = await res.json();
        setWeeklyReport(data.report);
      }
    } catch (e) {
      console.error('Failed to fetch weekly report:', e);
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/me/badges');
      if (res.ok) {
        const data = await res.json();
        setUserBadges(data.badges || []);
      }
    } catch (e) {
      console.error('Failed to fetch badges:', e);
    }
  };

  // WebP 변환 유틸리티
  const convertToWebP = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new globalThis.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            reject(new Error('WebP conversion failed'));
          }
        }, 'image/webp', 0.8); // 퀄리티 0.8
      };
      img.onerror = (e) => reject(e);
      img.src = URL.createObjectURL(file);
    });
  };

  const fetchMileStatus = async () => {
    try {
      const res = await fetch('/api/mile/team');
      if (res.ok) {
        const data = await res.json();
        if (data.teams && data.teams.length > 0) {
          setMileTeamInfo(data.teams[0]);
        } else {
          setMileTeamInfo(null);
        }
        if (data.pendingTeam) {
          setMilePendingTeam(data.pendingTeam);
        } else {
          setMilePendingTeam(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch mile status:', e);
    } finally {
      setMileLoading(false);
    }
  };

  const handleMileJoin = async () => {
    if (!mileInviteCode) {
      setMileError('초대 코드를 입력해 주세요.');
      return;
    }
    setMileJoining(true);
    setMileError('');
    try {
      const cleanCode = mileInviteCode.trim().toUpperCase();
      window.location.href = `/mile/join/${cleanCode}`;
    } catch (e) {
      setMileError('초대 코드가 올바르지 않거나 합류 처리 중 오류가 발생했습니다.');
      setMileJoining(false);
    }
  };

  const handleMileCreate = async () => {
    if (!mileNewTeamName) {
      setMileError('팀 이름을 입력해 주세요.');
      return;
    }
    setMileCreationLoading(true);
    setMileError('');
    try {
      const res = await fetch('/api/mile/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: mileNewTeamName,
          category: mileNewCategory,
          ageGroup: mileNewAgeGroup,
          region: mileNewRegion,
          description: mileNewDescription
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('모임 창단 신청이 정상적으로 접수되었습니다! 관리자 승인 완료 후 대시보드가 오픈됩니다.');
        setMileNewTeamName('');
        setMileNewAgeGroup('');
        setMileNewRegion('');
        setMileNewDescription('');
        setMileCreationMode(false);
        await fetchMileStatus();
      } else {
        setMileError(data.error || '팀 신청에 실패했습니다.');
      }
    } catch (e) {
      setMileError('네트워크 오류가 발생했습니다.');
    } finally {
      setMileCreationLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        marketingConsent: false,
        zipCode: '',
        address1: '',
        address2: '',
        avatar: session.user.image || '',
      });
      fetchUserData();
      fetchHistory();
      fetchUserStatus();
      fetchCommunityData();
      fetchWeeklyReport();
      fetchBadges();
      fetchMileStatus();
    }
  }, [session?.user?.email]);

  const fetchUserData = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        const u = data.user || data;
        setUserData(u);

        if (u.addresses && u.addresses.length > 0) {
          const defaultAddress = u.addresses[0];
          setFormData(prev => ({
            ...prev,
            phone: u.phone || '',
            marketingConsent: u.marketingConsent || false,
            zipCode: defaultAddress.zip || '',
            address1: defaultAddress.addr1 || '',
            address2: defaultAddress.addr2 || '',
            avatar: u.avatar || session?.user?.image || '',
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            phone: u.phone || '',
            marketingConsent: u.marketingConsent || false,
            avatar: u.avatar || session?.user?.image || '',
          }));
        }
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/me/recovery-history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const res = await fetch('/api/me/status');
      if (res.ok) {
        const data = await res.json();
        setUserStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressSelect = (data: any) => {
    setFormData(prev => ({
      ...prev,
      zipCode: data.zonecode,
      address1: data.address,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: any = {
        phone: formData.phone,
        marketingConsent: formData.marketingConsent,
        avatar: formData.avatar,
      };

      if (formData.zipCode && formData.address1) {
        updateData.zipCode = formData.zipCode;
        updateData.address1 = formData.address1;
        updateData.address2 = formData.address2;
      }

      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user || data);
        setIsEditing(false);
        alert('프로필이 업데이트되었습니다.');
      } else {
        const errorData = await response.json();
        alert(`저장 실패: ${errorData.error}`);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const webpFile = await convertToWebP(file);
      const uploadFormData = new FormData();
      uploadFormData.append('file', webpFile);
      uploadFormData.append('folder', 'avatars');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, avatar: data.url }));
      } else {
        alert('이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerApplicationChange = (field: string, value: string) => {
    setPartnerApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. 파일 상태 저장
      setSelectedFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));

      // 2. 미리보기 URL 생성 및 저장
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => ({
        ...prev,
        [fieldName]: previewUrl
      }));
    }
  };

  const handlePartnerApplicationSubmit = async () => {
    setPartnerApplicationLoading(true);
    try {
      // 1. 이미지 업로드 처리 (WebP 변환 후)
      let businessRegistrationImageUrl = partnerApplicationData.businessRegistrationImage;
      let bankStatementImageUrl = partnerApplicationData.bankStatementImage;

      // 사업자등록증 / 자격증 업로드
      if (selectedFiles.businessRegistrationImage) {
        try {
          const webpFile = await convertToWebP(selectedFiles.businessRegistrationImage);
          const formData = new FormData();
          formData.append('file', webpFile);
          formData.append('folder', 'partner-documents');

          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Business Registration Upload Failed');
          const data = await res.json();
          businessRegistrationImageUrl = data.url;
        } catch (e) {
          console.error(e);
          alert('증빙서류 업로드 중 오류가 발생했습니다.');
          setPartnerApplicationLoading(false);
          return;
        }
      }

      // 통장사본 업로드
      if (selectedFiles.bankStatementImage) {
        try {
          const webpFile = await convertToWebP(selectedFiles.bankStatementImage);
          const formData = new FormData();
          formData.append('file', webpFile);
          formData.append('folder', 'partner-documents');

          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Bank Statement Upload Failed');
          const data = await res.json();
          bankStatementImageUrl = data.url;
        } catch (e) {
          console.error(e);
          alert('통장사본 업로드 중 오류가 발생했습니다.');
          setPartnerApplicationLoading(false);
          return;
        }
      }

      let fullBusinessAddress = partnerApplicationData.businessAddress;
      if (partnerApplicationData.businessZipCode) {
        fullBusinessAddress = `[${partnerApplicationData.businessZipCode}] ${fullBusinessAddress}`;
      }
      if (partnerApplicationData.businessDetailAddress) {
        fullBusinessAddress = `${fullBusinessAddress} ${partnerApplicationData.businessDetailAddress}`;
      }

      const response = await fetch('/api/partner/auth/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session?.user?.email || userData?.email || '',
          name: session?.user?.name || userData?.name || '',
          phone: partnerApplicationData.businessPhone,
          ...partnerApplicationData,
          businessAddress: fullBusinessAddress,
          businessRegistrationImage: businessRegistrationImageUrl,
          bankStatementImage: bankStatementImageUrl
        }),
      });

      if (response.ok) {
        alert('파트너 신청이 접수되었습니다. 검토 후 연락드리겠습니다.');
        setShowPartnerApplication(false);
        fetchUserData();
      } else {
        const errorData = await response.json();
        alert(`신청 실패: ${errorData.error}`);
      }
    } catch (error) {
      console.error('신청 오류:', error);
      alert('신청 중 오류가 발생했습니다.');
    } finally {
      setPartnerApplicationLoading(false);
    }
  };

  const getPartnerStatusInfo = () => {
    if (!userData?.partnerStatus || userData.partnerStatus === 'none') {
      return {
        status: 'none',
        title: '파트너 프로토콜 시작',
        description: '회복의 전문가로서 본인만의 상점을 운영하십시오.',
        icon: Store,
        color: 'text-chapter-accent',
        bgColor: 'bg-chapter-accent/5',
        action: () => setShowPartnerApplication(true)
      };
    }

    switch (userData.partnerStatus) {
      case 'pending':
        return {
          status: 'pending',
          title: '검토 진행 중',
          description: '보안 심사가 진행 중입니다. 3-5영업일이 소요됩니다.',
          icon: Clock,
          color: 'text-status-amber',
          bgColor: 'bg-status-amber/5',
          action: null
        };
      case 'approved':
        return {
          status: 'approved',
          title: '파트너 인증 완료',
          description: '인증된 파트너입니다. 관리 대시보드에 접근 가능합니다.',
          icon: CheckCircle,
          color: 'text-status-good',
          bgColor: 'bg-status-good/5',
          action: () => window.open('/partner/login', '_blank')
        };
      case 'rejected':
        return {
          status: 'rejected',
          title: '인증 승인 거절',
          description: userData.partnerApplication?.rejectedReason || '보안 정책에 부합하지 않습니다.',
          icon: XCircle,
          color: 'text-status-danger',
          bgColor: 'bg-status-danger/5',
          action: () => setShowPartnerApplication(true)
        };
      default:
        return null;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chapter-accent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[40px] bg-white text-center p-12">
          <div className="w-20 h-20 bg-mist rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner text-4xl">🔒</div>
          <h2 className="text-lg md:text-3xl font-black text-obsidian tracking-tight mb-2">접근 권한 제한</h2>
          <p className="text-[11px] md:text-sm text-slate font-medium mb-8">대시보드 접근을 위해 인증 프로토콜이 필요합니다.</p>
          <Button asChild className="w-full h-14 rounded-2xl bg-obsidian text-mist font-black">
            <Link href="/auth/signin">인증 시작</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const partnerInfo = getPartnerStatusInfo();

  return (
    <ChapterWrapper chapter="my-page">
      <div className="min-h-screen bg-[#F8FAFC] py-6 px-4 md:py-20">
        <div className="container mx-auto max-w-6xl px-0 md:px-4">

          {/* Dynamic Hero Section */}
          <DynamicHero userName={session.user?.name || '유저'} />

          {/* Glassmorphic Tab Selector */}
          <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-[24px] border border-line/50 shadow-sm mb-8 z-30 overflow-x-auto scrollbar-none w-full gap-1">
            {[
              { id: 'recovery', label: '나의 회복 🌟', icon: Activity },
              { id: 'pass', label: '디지털 패스 🎟️', icon: Ticket },
              { id: 'care', label: '케어 & 상담 🩺', icon: MessageCircle },
              { id: 'profile', label: '프로필 & 설정 ⚙️', icon: Settings },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl text-[11px] sm:text-xs font-black transition-all shrink-0 ${
                    isActive 
                      ? 'bg-[#0E3A3A] text-white shadow-md shadow-[#0E3A3A]/15 scale-[1.01]' 
                      : 'text-foreground/70 hover:text-obsidian hover:bg-slate-100/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-foreground/70'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel with Framer Motion Animation */}
          <AnimatePresence mode="wait">
            {activeTab === 'recovery' && (
              <motion.div
                key="recovery"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 md:space-y-8 animate-in fade-in"
              >
                {/* Badge Collection Section */}
                {userBadges.length > 0 && (
                  <div className="mb-8">
                    <Card className="border-none shadow-sm rounded-[32px] bg-white border border-line">
                      <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-primary">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base md:text-xl font-black text-obsidian tracking-tighter">회복 성취 뱃지</h3>
                              <p className="text-[11px] md:text-sm font-bold text-slate">당신의 성취가 gleemile의 리듬을 만듭니다</p>
                            </div>
                          </div>
                          <div className="bg-primary-container/50 text-primary px-3 py-1 rounded-full text-[10px] font-black">
                            {userBadges.length}개 획득
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                          {userBadges.map((badge, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.1 }}
                              className="flex flex-col items-center gap-2 group cursor-help relative"
                            >
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 transition-all ${
                                badge.rarity === 'legendary' ? 'bg-purple-50 border-purple-200 shadow-purple-100' :
                                badge.rarity === 'epic' ? 'bg-indigo-50 border-secondary/30 shadow-indigo-100' :
                                badge.rarity === 'rare' ? 'bg-amber-50 border-primary/30 shadow-primary/20' :
                                'bg-surface border-line'
                              }`}>
                                {badge.icon}
                              </div>
                              <span className="text-[10px] font-black text-slate text-center leading-tight group-hover:text-obsidian">
                                {badge.name}
                              </span>
                              {/* Hover Tooltip (Simplified) */}
                              <div className="hidden group-hover:block absolute z-10 w-40 p-2 bg-obsidian text-white text-[10px] rounded-lg mt-16 shadow-xl">
                                <p className="font-black text-amber-400 mb-0.5">{badge.name}</p>
                                <p className="opacity-80 leading-relaxed">{badge.description}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Membership Progress & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
                  {/* Membership Rewards (Left) */}
                  <div className="lg:col-span-4 transition-transform hover:scale-[1.01]">
                    <Link href="/membership" className="block h-full">
                      <MembershipProgress
                        currentGrade={userData?.grade || 'cedar'}
                        currentPoints={userData?.points || 0}
                      />
                    </Link>
                  </div>

                  {/* Recovery Growth Quote/Brief (Center) */}
                  <div className="lg:col-span-4">
                    <AILatestBrief
                      solution={history[0]?.aiSolution}
                      createdAt={history[0]?.createdAt}
                    />
                  </div>

                  {/* Quick Stats (Right) */}
                  <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-line flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-foreground/70 uppercase tracking-widest mb-1">Orders</p>
                        <p className="font-black text-obsidian tracking-tighter text-xl">0</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-line flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-foreground/70 uppercase tracking-widest mb-1">Coupons</p>
                        <p className="font-black text-obsidian tracking-tighter text-xl">2</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-line flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-primary flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-foreground/70 uppercase tracking-widest mb-1">Sessions</p>
                        <p className="font-black text-obsidian tracking-tighter text-xl">{history.length}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-line flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-secondary flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-foreground/70 uppercase tracking-widest mb-1">Points</p>
                        <p className="font-black text-obsidian tracking-tighter text-xl">{userData?.points?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                <div>
                  <RecoveryLeaderboard />
                </div>

                {/* Recovery Growth Curve */}
                <Card className="border-none shadow-xl rounded-[32px] md:rounded-[40px] bg-white overflow-hidden group">
                  <CardHeader className="p-6 md:p-8 pb-4 flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-chapter-accent uppercase tracking-widest">Recovery Growth Curve</p>
                        <Badge className="bg-chapter-accent/10 text-chapter-accent border-none text-[9px] font-black uppercase px-2">Community Comparative</Badge>
                      </div>
                      <CardTitle className="text-2xl font-black text-obsidian tracking-tighter">회복 성장 곡선</CardTitle>
                    </div>
                    <Button asChild variant="ghost" className="h-10 px-4 rounded-xl text-xs font-black text-slate hover:bg-mist group-hover:text-chapter-accent transition-all">
                      <Link href="/me/history" className="flex items-center gap-2">
                        전체 보기 <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 pt-2">
                    {historyLoading ? (
                      <div className="h-[200px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chapter-accent"></div>
                      </div>
                    ) : history.length > 0 ? (
                      <div className="space-y-6">
                        {/* 차트 영역 */}
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[...history].reverse().map((h, idx) => {
                              const dateStr = new Date(h.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                              const commData = communityAverages?.find((c: any) => c.date === h.createdAt.split('T')[0]);
                              return {
                                date: dateStr,
                                score: h.totalScore,
                                avg: commData?.avgScore || 65 + (idx % 3),
                                top: commData?.top10Score || 88 + (idx % 2)
                              };
                            })}>
                              <defs>
                                <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" hide />
                              <Tooltip
                                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                 itemStyle={{ padding: '2px 0' }}
                              />
                              <Area type="monotone" dataKey="top" stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 4" fill="transparent" name="상위 10% 목표" />
                              <Area type="monotone" dataKey="avg" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" fill="transparent" name="gleemile 평균" />
                              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#curveColor)" name="나의 회복 점수" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* 소셜 프루프 요약 */}
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between p-4 bg-mist/30 rounded-2xl border border-line/5 transition-all hover:bg-mist/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-reward-gold/10 rounded-xl flex items-center justify-center text-reward-gold">
                                <Zap className="h-5 w-5 fill-current" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate/60 uppercase tracking-tighter">Your Status</p>
                                <p className="font-black text-obsidian tracking-tight">상위 <span className="text-reward-gold">15%</span> 회복 우수자</p>
                              </div>
                            </div>
                            <Badge className="bg-obsidian text-mist border-none text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg">
                              TOP TIER
                            </Badge>
                          </div>

                          {weeklyReport?.percentileFeedback && (
                            <div className="bg-chapter-accent/5 p-4 rounded-2xl border border-chapter-accent/10">
                              <p className="text-[11px] font-bold text-chapter-accent leading-relaxed">
                                <Sparkles className="h-3 w-3 inline-block mr-1 mb-0.5" />
                                {weeklyReport.percentileFeedback}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-center border-t border-line/10 pt-4 px-2">
                            <div>
                              <p className="text-[9px] font-black text-slate uppercase opacity-40">최근 점수</p>
                              <p className="font-black text-secondary">{history[0]?.totalScore || 0}점</p>
                            </div>
                            <div className="w-px h-6 bg-line/20" />
                            <div>
                              <p className="text-[9px] font-black text-slate uppercase opacity-40">전체 평균</p>
                              <p className="font-black text-slate">68점</p>
                            </div>
                            <div className="w-px h-6 bg-line/20" />
                            <div>
                              <p className="text-[9px] font-black text-slate uppercase opacity-40">상위 10%</p>
                              <p className="font-black text-reward-gold">89점</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[200px] flex flex-col items-center justify-center text-center bg-mist/30 rounded-3xl border-2 border-dashed border-line/50">
                        <Activity className="h-8 w-8 text-slate/20 mb-3" />
                        <p className="text-xs font-bold text-slate mb-4">아직 리듬체크 기록이 관측되지 않았습니다.</p>
                        <Button asChild size="sm" className="bg-obsidian text-mist rounded-full px-6 font-black text-[10px]">
                          <Link href="/ai-navigator">첫 리듬체크 시작</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'pass' && (
              <motion.div
                key="pass"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 md:space-y-8 animate-in fade-in"
              >
                {/* 디지털 허브 */}
                <Card className="border-none shadow-2xl rounded-[40px] bg-white overflow-hidden border border-line transition-all hover:shadow-3xl">
                  <CardHeader className="p-8 md:p-10 pb-0 border-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl text-secondary shadow-inner">
                          <Sparkles className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-obsidian tracking-tighter">디지털 허브</h3>
                          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Referral & medical pass</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-secondary-container text-secondary border-none px-3 font-black text-[9px] uppercase tracking-widest">Invitation</Badge>
                        </div>
                        <QRReferralCard 
                          userName={session.user?.name || ''} 
                          referralCode={userData?.referralCode || ''} 
                        />
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-secondary-container text-secondary border-none px-3 font-black text-[9px] uppercase tracking-widest">Medical Pass</Badge>
                        </div>
                        <MedicalPassCard 
                          userName={session.user?.name || ''} 
                          referralCode={userData?.referralCode || ''} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 나의 회복 조직도 */}
                <Card className="border-none shadow-xl rounded-[40px] bg-white overflow-hidden group">
                  <CardHeader className="p-8 md:p-10 pb-4">
                    <div>
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">My Recovery Network</p>
                      <CardTitle className="text-2xl font-black text-obsidian tracking-tighter flex items-center gap-3">
                        나의 회복 조직도
                        <Badge className="bg-indigo-50 text-secondary border-none text-[10px] font-black uppercase">Level 2</Badge>
                      </CardTitle>
                      <p className="text-sm font-medium text-slate mt-1">내가 소개한 친구와 친구가 소개한 사람들의 활동 현황입니다.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-10 pt-2">
                    <ReferralNetwork mode="accordion" />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'care' && (
              <motion.div
                key="care"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 md:space-y-8 animate-in fade-in"
              >
                {/* Service Progress Status Cards */}
                {(userStatus?.concierge || userStatus?.inquiry) && (
                  <div className="flex flex-col gap-4">
                    {/* Concierge Status */}
                    {userStatus?.concierge && (
                      <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden border border-line">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-secondary">
                              <Clock className={`w-7 h-7 ${userStatus.concierge.status === 'pending' ? 'animate-pulse' : ''}`} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Service Status Protocol</p>
                              <h3 className="font-black text-obsidian tracking-tighter flex items-center gap-3 text-xl">
                                {userStatus.concierge.painPoint} 회복 컨시어지
                                <Badge variant="outline" className={`ml-2 px-3 py-0.5 rounded-full text-[10px] font-bold ${userStatus.concierge.status === 'pending' ? 'bg-amber-50 text-primary border-primary/30' :
                                  userStatus.concierge.status === 'approved' ? 'bg-emerald-50 text-secondary border-emerald-200' :
                                    'bg-surface text-foreground/70 border-line'
                                  }`}>
                                  {userStatus.concierge.status === 'pending' ? '검토 중' :
                                    userStatus.concierge.status === 'approved' ? '승인 완료' : '진행 중'}
                                </Badge>
                              </h3>
                              <p className="text-sm font-medium text-slate mt-1">
                                {userStatus.concierge.status === 'pending' ? '관리자가 의뢰서를 검토하고 있습니다.' :
                                  userStatus.concierge.status === 'approved' ? '회복 프로토콜이 승인되었습니다. 상세 내용을 확인하세요.' :
                                    '신청 내용을 처리 중입니다.'}
                              </p>
                            </div>
                          </div>
                          <div className="w-full md:w-auto">
                            <Button variant="outline" asChild className="w-full md:w-auto h-12 rounded-xl border-line font-black text-xs px-8 hover:bg-surface">
                              <Link href="/me/history">진행 내역 보기</Link>
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-surface px-8 pb-8">
                          <div className="h-full bg-slate-200 rounded-full relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: userStatus.concierge.status === 'approved' ? '100%' : '50%' }}
                              className={`absolute left-0 top-0 h-full rounded-full ${userStatus.concierge.status === 'approved' ? 'bg-secondary shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-secondary shadow-[0_0_10px_rgba(79,70,229,0.5)]'
                                }`}
                            />
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Inquiry Status */}
                    {userStatus?.inquiry && (
                      <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden border border-line">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                              <MessageCircle className={`w-7 h-7 ${userStatus.inquiry.status === 'pending' ? 'animate-pulse' : ''}`} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Support Status Protocol</p>
                              <h3 className="font-black text-obsidian tracking-tighter flex items-center gap-3 text-xl">
                                [{userStatus.inquiry.type === 'product' ? '상품' : '일반'}] {userStatus.inquiry.subject}
                                <Badge variant="outline" className={`ml-2 px-3 py-0.5 rounded-full text-[10px] font-bold ${userStatus.inquiry.status === 'pending' ? 'bg-amber-50 text-primary border-primary/30' :
                                  userStatus.inquiry.status === 'resolved' ? 'bg-emerald-50 text-secondary border-emerald-200' :
                                    'bg-surface text-foreground/70 border-line'
                                  }`}>
                                  {userStatus.inquiry.status === 'pending' ? '답변 대기' :
                                    userStatus.inquiry.status === 'resolved' ? '해결 완료' :
                                      userStatus.inquiry.status === 'in_progress' ? '처리 중' : '진행 중'}
                                </Badge>
                              </h3>
                              <p className="text-sm font-medium text-slate mt-1">
                                {userStatus.inquiry.status === 'pending' ? '관리자가 문의 내용을 확인하고 있습니다.' :
                                  userStatus.inquiry.status === 'resolved' ? '문의에 대한 답변이 완료되었습니다.' :
                                    '담당자가 내용을 확인 및 답변을 준비 중입니다.'}
                              </p>
                            </div>
                          </div>
                          <div className="w-full md:w-auto">
                            <Button variant="outline" asChild className="w-full md:w-auto h-12 rounded-xl border-line font-black text-xs px-8 hover:bg-surface">
                              <Link href="/me/inquiries">문의 내역 보기</Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* 전담 네비게이터 상담 센터 */}
                <Card className="border-none shadow-2xl rounded-[40px] bg-white overflow-hidden border border-indigo-50 transition-all hover:shadow-3xl">
                  <CardHeader className="p-8 md:p-10 pb-0 border-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 rounded-2xl text-secondary shadow-inner">
                          <MessageCircle className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="font-black text-obsidian tracking-tighter text-xl">
                            {(session.user as any)?.isNavigator ? '담당 회원 상담 관리' : '전담 네비게이터 상담'}
                          </h3>
                          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Navigator Consultation Center</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-10">
                    <NavigatorConsultationCenter />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 md:space-y-8 animate-in fade-in"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* 프로필 정보 (좌측/전체 너비) */}
                  <div className="lg:col-span-8 space-y-6 md:space-y-8">
                    <Card className="border-none shadow-sm rounded-[32px] md:rounded-[40px] bg-white overflow-hidden">
                      <CardHeader className="p-6 md:p-10 pb-4 flex flex-row items-center justify-between border-b border-mist">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-mist rounded-2xl text-obsidian">
                            <User className="h-6 w-6" />
                          </div>
                          <CardTitle className="text-2xl font-black text-obsidian tracking-tighter">프로필 설정</CardTitle>
                        </div>
                        <Button variant="ghost" onClick={() => setIsEditing(!isEditing)} className="font-black text-xs text-slate hover:bg-mist h-10 px-4 rounded-xl">
                          {isEditing ? <><X className="h-4 w-4 mr-2" /> 취소</> : <><Settings className="h-4 w-4 mr-2" /> 편집</>}
                        </Button>
                      </CardHeader>
                      <CardContent className="p-6 md:p-10 space-y-8 md:space-y-10">
                        <div className="bg-mist/30 p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-line/30 flex items-center gap-4 md:gap-6">
                          <div className="relative w-20 h-20 rounded-[28px] overflow-hidden bg-slate-100 shadow-md border-4 border-white group/avatar flex-shrink-0">
                            <Image 
                              src={formData.avatar || session.user?.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"} 
                              alt="" 
                              fill 
                              className="object-cover" 
                            />
                            {isEditing && (
                              <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <Upload className="text-white h-5 w-5" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} aria-label="프로필 이미지 변경" />
                              </label>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-black text-obsidian truncate">{session.user?.name}</h3>
                            <p className="text-xs font-bold text-slate flex items-center gap-1.5 opacity-60 truncate">
                              <Mail className="h-3 w-3" /> {session.user?.email}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge className="bg-chapter-accent/10 text-chapter-accent border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                                {(session.user as any)?.provider || 'Email'}
                              </Badge>
                              {['essence', 'balance', 'miracle'].includes(userData?.grade?.toLowerCase()) && (
                                <Badge className="bg-primary-container/50 text-primary border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 flex items-center gap-1">
                                  <Zap className="w-2.5 h-2.5" /> FOUNDER
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-xs font-black text-slate uppercase tracking-widest ml-1">연락처</Label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate h-4 w-4 opacity-40" />
                              <Input
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder="010-XXXX-XXXX"
                                className="h-14 pl-12 rounded-2xl bg-mist/50 border-line focus:ring-chapter-accent"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Label className="text-xs font-black text-slate uppercase tracking-widest ml-1">배송지 정보</Label>
                            <div className="space-y-3">
                              <UnifiedAddressSearch
                                provider="google"
                                onAddressSelect={handleAddressSelect}
                                disabled={!isEditing}
                              />
                              <div className="grid grid-cols-1 gap-3">
                                <Input value={formData.zipCode} readOnly placeholder="우편번호" className="h-14 rounded-2xl bg-mist/50 border-line" />
                                <Input value={formData.address1} readOnly placeholder="주소" className="h-14 rounded-2xl bg-mist/50 border-line" />
                                <Input name="address2" value={formData.address2} onChange={handleInputChange} disabled={!isEditing} placeholder="상세 주소를 입력하세요" className="h-14 rounded-2xl bg-mist/50 border-line" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-black text-slate uppercase tracking-widest ml-1">알림 및 동의</Label>
                            <div className="space-y-3">
                              <div className={`h-14 flex items-center justify-between px-5 rounded-2xl border transition-all ${formData.marketingConsent ? 'border-chapter-accent bg-chapter-accent/5' : 'border-line bg-mist/50'}`}>
                                <label htmlFor="marketing" className="text-sm font-bold text-slate cursor-pointer select-none">이벤트 수신동의</label>
                                <Checkbox
                                  id="marketing"
                                  checked={formData.marketingConsent}
                                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, marketingConsent: c as boolean }))}
                                  disabled={!isEditing}
                                  className="rounded-md"
                                />
                              </div>
                              <div className={`h-14 flex items-center justify-between px-5 rounded-2xl border transition-all ${notificationPermission === 'granted' ? 'border-chapter-accent bg-chapter-accent/5' : 'border-line bg-mist/50'}`}>
                                <div className="flex items-center gap-2">
                                  <Bell className={`h-4 w-4 ${notificationPermission === 'granted' ? 'text-chapter-accent' : 'text-slate opacity-40'}`} />
                                  <span className="text-sm font-bold text-slate">푸시 알림</span>
                                </div>
                                <Switch 
                                  checked={notificationPermission === 'granted'}
                                  onCheckedChange={handleNotificationToggle}
                                  className="data-[state=checked]:bg-chapter-accent"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {isEditing && (
                          <Button onClick={handleSave} className="w-full h-16 rounded-[24px] bg-obsidian text-mist font-black text-lg shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                            <Save className="h-5 w-5" /> 프로필 저장하기
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* 모임 클럽하우스 프로토콜 (우측/사이드바) */}
                  <div className="lg:col-span-4">
                    <Card className="border-none shadow-sm rounded-[32px] md:rounded-[40px] bg-white overflow-hidden border border-emerald-100/30">
                      <CardHeader className="p-6 md:p-8 pb-4 flex flex-row items-center justify-between border-b border-mist">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-50 rounded-2xl text-secondary">
                            <Trophy className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="font-black text-obsidian tracking-tighter text-xl">모임 클럽하우스</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 md:p-8 space-y-6">
                        {mileLoading ? (
                          <div className="py-12 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                          </div>
                        ) : mileTeamInfo ? (
                          <div className="space-y-6">
                            <div className="bg-emerald-50/40 p-4 rounded-[20px] border border-emerald-100 flex flex-col gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center text-secondary font-black text-base shrink-0">
                                  ⚽
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-base font-black text-obsidian tracking-tight truncate flex items-center gap-1.5">
                                    {mileTeamInfo.teamName}
                                  </h4>
                                  <Badge className="bg-secondary text-white font-black text-[8px] px-1.5 py-0.5 rounded mt-0.5">
                                    {session.user?.mileRole === 'leader' ? '호스트/조장' : 
                                     session.user?.mileRole === 'member' ? '팀원/스터디원' : '청강생/외부 자문'}
                                  </Badge>
                                </div>
                              </div>
                              <Button asChild size="sm" className="w-full h-11 rounded-xl bg-secondary hover:bg-secondary text-white font-black px-4 shadow-sm">
                                <Link href="/mile/mypage" className="flex items-center justify-center gap-1.5">
                                  클럽하우스 입장 <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>

                            {session.user?.mileRole === 'leader' && (
                              <div className="p-4 rounded-[20px] bg-surface border border-line space-y-3 text-[11px]">
                                <h5 className="font-black text-obsidian tracking-tight flex items-center gap-1">
                                  <span>📢</span> 스쿼드 초대 코드
                                </h5>
                                <p className="text-slate font-bold leading-relaxed">팀원/스터디원 및 학부모 가입 코드를 배포해 주세요.</p>
                                
                                <div className="space-y-2">
                                  <div className="p-3 bg-white rounded-lg border border-line flex items-center justify-between gap-1">
                                    <span className="font-black text-obsidian uppercase tracking-wider truncate">
                                      {mileTeamInfo.teamCode || mileTeamInfo.team?.teamCode || 'ST-CODE'}
                                    </span>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => {
                                        const code = mileTeamInfo.teamCode || mileTeamInfo.team?.teamCode;
                                        if (code) {
                                          navigator.clipboard.writeText(code.toUpperCase());
                                          alert(`팀 초대 코드 (${code.toUpperCase()})가 복사되었습니다!`);
                                        }
                                      }}
                                      className="h-7 px-2 text-[10px] font-black shrink-0 hover:bg-surface border border-line"
                                    >
                                      복사
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : milePendingTeam ? (
                          <div className="bg-amber-50/40 p-4 rounded-[20px] border border-amber-100 space-y-2 text-xs">
                            <h4 className="font-black text-obsidian tracking-tight flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-primary animate-pulse" />
                              {milePendingTeam.teamName} (심사 중)
                            </h4>
                            <p className="font-medium text-foreground/70 leading-normal">보안 승인 심사가 진행 중입니다. 1~2영업일이 소요됩니다.</p>
                          </div>
                        ) : (
                          <div className="space-y-4 text-xs font-bold text-slate">
                            <p className="leading-relaxed">팀 코드로 합류하거나 호스트/개설자 권한으로 신규 팀 개설 신청을 진행할 수 있습니다.</p>
                            <div className="p-4 rounded-[20px] bg-surface border border-line space-y-3">
                              <p className="font-black text-obsidian">초대 코드로 팀 합류</p>
                              <div className="flex gap-1.5">
                                <Input
                                  value={mileInviteCode}
                                  onChange={(e) => setMileInviteCode(e.target.value)}
                                  placeholder="코드 입력"
                                  className="h-10 text-xs rounded-xl bg-white border-line"
                                />
                                <Button onClick={handleMileJoin} disabled={mileJoining} size="sm" className="h-10 rounded-xl bg-obsidian text-white font-black px-4">
                                  {mileJoining ? '...' : '합류'}
                                </Button>
                              </div>
                            </div>
                            <Button onClick={() => setMileCreationMode(!mileCreationMode)} className="w-full h-11 rounded-xl bg-secondary hover:bg-secondary text-white font-black text-xs">
                              {mileCreationMode ? '신청 양식 닫기' : '신규 모임 창단 신청'}
                            </Button>

                            {mileCreationMode && (
                              <div className="bg-surface/50 p-4 rounded-[20px] border border-line space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                <div className="space-y-2 text-[11px]">
                                  <Label className="font-black text-foreground/70">팀 이름</Label>
                                  <Input value={mileNewTeamName} onChange={(e) => setMileNewTeamName(e.target.value)} placeholder="예: gleemile FC" className="h-9 rounded-lg bg-white" />
                                </div>
                                <div className="space-y-2 text-[11px]">
                                  <Label className="font-black text-foreground/70">카테고리</Label>
                                  <select value={mileNewCategory} onChange={(e) => setMileNewCategory(e.target.value)} className="w-full h-9 px-2 rounded-lg border bg-white text-[11px] font-bold">
                                    <option value="youth">유소년 클럽</option>
                                    <option value="amateur">성인 조기 모임 / 동호회</option>
                                    <option value="school">초/중/고/대학교 엘리트 팀</option>
                                    <option value="academy">전문 사설 아카데미</option>
                                  </select>
                                </div>
                                <div className="space-y-2 text-[11px]">
                                  <Label className="font-black text-foreground/70">활동 지역</Label>
                                  <Input value={mileNewRegion} onChange={(e) => setMileNewRegion(e.target.value)} placeholder="예: 서울 송파구" className="h-9 rounded-lg bg-white" />
                                </div>
                                {mileError && <p className="text-[10px] text-rose-500">⚠ {mileError}</p>}
                                <Button onClick={handleMileCreate} disabled={mileCreationLoading} className="w-full h-10 bg-secondary hover:bg-secondary text-white font-black rounded-xl">
                                  {mileCreationLoading ? '제출 중...' : '신청서 제출'}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ChapterWrapper>
  );
}
