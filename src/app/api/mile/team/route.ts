import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import MileTeam from '@/models/MileTeam';
import MileTeamMember, { DEFAULT_PERMISSIONS } from '@/models/MileTeamMember';
import User from '@/models/User';
import crypto from 'crypto';
import { IBlockConfig } from '@/types/block';

// 팀 카테고리별 기본 블록 배열을 생성하는 유틸리티
const getDefaultBlocks = (category: string): IBlockConfig[] => {
  return [
    { blockId: 'wellness', blockName: '웰니스 체크', category: 'core', isActive: true, order: 0 },
    { blockId: 'announcements', blockName: '공지사항', category: 'core', isActive: true, order: 1 },
    { blockId: 'schedule', blockName: '일정', category: 'core', isActive: true, order: 2 },
    { blockId: 'community', blockName: '커뮤니티', category: 'core', isActive: true, order: 3 },
    { blockId: 'players', blockName: '멤버 명단', category: 'core', isActive: true, order: 4 },
  ];
};

// 팀 코드 생성 유틸리티
function generateTeamCode(teamName: string): string {
  const prefix = teamName
    .replace(/[^a-zA-Z0-9가-힣]/g, '')
    .slice(0, 3)
    .toUpperCase();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `FC${prefix}${suffix}`;
}

// GET: 내가 속한 팀 목록 조회
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view'); // 'my' | 'admin'

    // 관리자용: 모든 팀 조회 (승인 대기열 포함)
    if (view === 'admin') {
      const user = await User.findById(session.user.id);
      if (!user || !['admin', 'superadmin'].includes(user.role)) {
        return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
      }

      const teams = await MileTeam.find()
        .populate('createdBy', 'name email avatar')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 });

      // 각 팀의 멤버 수 집계
      const teamsWithCounts = await Promise.all(
        teams.map(async (team) => {
          const memberCount = await MileTeamMember.countDocuments({
            teamId: team._id,
            status: 'active',
          });
          const playerCount = await MileTeamMember.countDocuments({
            teamId: team._id,
            status: 'active',
            role: 'member',
          });
          return {
            ...team.toObject(),
            memberCount,
            playerCount,
          };
        })
      );

      return NextResponse.json({ teams: teamsWithCounts });
    }

    // 일반 유저: 내가 속한 팀 목록
    const memberships = await MileTeamMember.find({
      userId: session.user.id,
      status: 'active',
    }).populate({
      path: 'teamId',
      match: { isActive: true },
      populate: { path: 'createdBy', select: 'name' },
    });

    const user = await User.findById(session.user.id);
    const isAdminUser = user && ['admin', 'superadmin'].includes(user.role);

    let teams = memberships
      .filter((m) => m.teamId)
      .map((m) => ({
        membership: {
          _id: m._id,
          role: m.role,
          position: m.position,
          playerNumber: m.playerNumber,
          joinedAt: m.joinedAt,
          permissions: m.permissions,
        },
        team: m.teamId,
      }));

    // 어드민/수퍼어드민인데 소속된 팀이 없다면 모니터링/테스트용으로 최초의 팀 하나를 head_coach로 연결하여 전달
    if (teams.length === 0 && isAdminUser) {
      const sampleTeam = await MileTeam.findOne({ status: 'approved' }) || await MileTeam.findOne();
      if (sampleTeam) {
        teams = [{
          membership: {
            _id: 'admin-temp-membership',
            role: 'director',
            position: 'ADMIN',
            playerNumber: 99,
            joinedAt: new Date(),
            permissions: DEFAULT_PERMISSIONS.head_coach,
          },
          team: sampleTeam,
        }];
      }
    }

    // 본인이 신청했으나 승인 대기 중인 팀 조회
    const pendingTeam = await MileTeam.findOne({
      createdBy: session.user.id,
      status: 'pending',
    });

    return NextResponse.json({ teams, pendingTeam });
  } catch (error: any) {
    console.error('[Mile Team GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 팀 등록 요청 (총무/조장가 관리자에게 신청)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await req.json();
    const { teamName, category, templateType, ageGroup, region, description, isPublic } = body;

    if (!teamName || !category) {
      return NextResponse.json(
        { error: '팀 이름과 카테고리는 필수입니다' },
        { status: 400 }
      );
    }

    // 팀 코드 생성 (중복 확인)
    let teamCode = generateTeamCode(teamName);
    let attempts = 0;
    while (await MileTeam.findOne({ teamCode }) && attempts < 10) {
      teamCode = generateTeamCode(teamName);
      attempts++;
    }

    const inviteLink = `/mile/join/${teamCode}`;

    const team = await MileTeam.create({
      teamName,
      teamCode,
      category,
      templateType: templateType || 'sports',
      ageGroup,
      region,
      description,
      inviteLink,
      isPublic: isPublic === true,
      isActive: true,
      status: 'approved',
      createdBy: session.user.id,
      enabledBlocks: getDefaultBlocks(templateType || 'sports'),
    });

    // 요청자를 head_coach로 자동 등록 (팀 승인 전이라도)
    await MileTeamMember.create({
      teamId: team._id,
      userId: session.user.id,
      role: 'director',
      status: 'active',
      permissions: DEFAULT_PERMISSIONS.head_coach,
      joinedAt: new Date(),
    });

    // User의 mileRole 업데이트
    await User.findByIdAndUpdate(session.user.id, {
      mileRole: 'leader',
      activeTeamId: team._id,
    });

    return NextResponse.json({
      success: true,
      team: {
        _id: team._id,
        teamName: team.teamName,
        teamCode: team.teamCode,
        inviteLink: team.inviteLink,
        status: team.status,
      },
      message: '팀 등록이 요청되었습니다. 관리자 승인 후 활성화됩니다.',
    });
  } catch (error: any) {
    console.error('[Mile Team POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: 팀 승인/거절/수정 (관리자용)
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const body = await req.json();
    const { teamId, action, rejectedReason } = body;

    if (!teamId || !action) {
      return NextResponse.json({ error: 'teamId와 action은 필수입니다' }, { status: 400 });
    }

    const team = await MileTeam.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: '팀을 찾을 수 없습니다' }, { status: 404 });
    }

    if (action === 'approve') {
      team.status = 'approved';
      team.approvedBy = user._id;
      team.approvedAt = new Date();
      await team.save();

      return NextResponse.json({
        success: true,
        message: `${team.teamName} 팀이 승인되었습니다.`,
        team,
      });
    }

    if (action === 'reject') {
      team.status = 'rejected';
      team.rejectedReason = rejectedReason || '승인 요건 미충족';
      await team.save();

      return NextResponse.json({
        success: true,
        message: `${team.teamName} 팀이 거절되었습니다.`,
      });
    }

    if (action === 'suspend') {
      team.status = 'suspended';
      await team.save();

      return NextResponse.json({
        success: true,
        message: `${team.teamName} 팀이 정지되었습니다.`,
      });
    }

    return NextResponse.json({ error: '올바르지 않은 action입니다' }, { status: 400 });
  } catch (error: any) {
    console.error('[Mile Team PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
