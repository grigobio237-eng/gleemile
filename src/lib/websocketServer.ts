import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'user' | 'partner' | 'admin';
  isAuthenticated?: boolean;
}

interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'payment' | 'shipping' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt: Date;
}

class WebSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of roomIds

  constructor(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.FRONTEND_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // 인증 미들웨어
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        if (!decoded.userId) {
          return next(new Error('Invalid token'));
        }

        // 사용자 정보 조회
        const user = await User.findById(decoded.userId);
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = decoded.userId;
        socket.userType = decoded.type || 'user';
        socket.isAuthenticated = true;

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected via WebSocket`);

      // 사용자 연결 관리
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
        this.joinUserRooms(socket);
      }

      // 알림 구독
      socket.on('subscribe_notifications', (data) => {
        this.subscribeToNotifications(socket, data);
      });

      // 알림 구독 해제
      socket.on('unsubscribe_notifications', (data) => {
        this.unsubscribeFromNotifications(socket, data);
      });

      // 알림 읽음 처리
      socket.on('mark_notification_read', (notificationId) => {
        this.markNotificationAsRead(socket, notificationId);
      });

      // 알림 액션 처리
      socket.on('handle_notification_action', (data) => {
        this.handleNotificationAction(socket, data);
      });

      // 연결 해제
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from WebSocket`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.leaveUserRooms(socket);
        }
      });

      // 에러 처리
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private joinUserRooms(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    // 사용자별 개인 룸
    socket.join(`user_${socket.userId}`);

    // 사용자 타입별 룸
    if (socket.userType) {
      socket.join(`type_${socket.userType}`);
    }

    // 전체 룸 (시스템 알림용)
    socket.join('all_users');

    // 관리자 룸
    if (socket.userType === 'admin') {
      socket.join('admin');
    }

    // 파트너 룸
    if (socket.userType === 'partner') {
      socket.join('partners');
    }
  }

  private leaveUserRooms(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    socket.leave(`user_${socket.userId}`);
    if (socket.userType) {
      socket.leave(`type_${socket.userType}`);
    }
    socket.leave('all_users');
    socket.leave('admin');
    socket.leave('partners');
  }

  private subscribeToNotifications(socket: AuthenticatedSocket, data: any) {
    const { types, categories, priority } = data;

    if (types && Array.isArray(types)) {
      types.forEach((type: string) => {
        socket.join(`notification_type_${type}`);
      });
    }

    if (categories && Array.isArray(categories)) {
      categories.forEach((category: string) => {
        socket.join(`notification_category_${category}`);
      });
    }

    if (priority && Array.isArray(priority)) {
      priority.forEach((p: string) => {
        socket.join(`notification_priority_${p}`);
      });
    }
  }

  private unsubscribeFromNotifications(socket: AuthenticatedSocket, data: any) {
    const { types, categories, priority } = data;

    if (types && Array.isArray(types)) {
      types.forEach((type: string) => {
        socket.leave(`notification_type_${type}`);
      });
    }

    if (categories && Array.isArray(categories)) {
      categories.forEach((category: string) => {
        socket.leave(`notification_category_${category}`);
      });
    }

    if (priority && Array.isArray(priority)) {
      priority.forEach((p: string) => {
        socket.leave(`notification_priority_${p}`);
      });
    }
  }

  private markNotificationAsRead(socket: AuthenticatedSocket, notificationId: string) {
    // 알림 읽음 처리 로직
    console.log(`User ${socket.userId} marked notification ${notificationId} as read`);
  }

  private handleNotificationAction(socket: AuthenticatedSocket, data: any) {
    const { notificationId, action } = data;
    console.log(`User ${socket.userId} handled action ${action} for notification ${notificationId}`);
  }

  // 공개 메서드들
  public sendToUser(userId: string, notification: NotificationData) {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }

  public sendToUserType(userType: 'user' | 'partner' | 'admin', notification: NotificationData) {
    this.io.to(`type_${userType}`).emit('notification', notification);
  }

  public sendToRoom(room: string, notification: NotificationData) {
    this.io.to(room).emit('notification', notification);
  }

  public sendToAll(notification: NotificationData) {
    this.io.emit('notification', notification);
  }

  public sendToAdmins(notification: NotificationData) {
    this.io.to('admin').emit('notification', notification);
  }

  public sendToPartners(notification: NotificationData) {
    this.io.to('partners').emit('notification', notification);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getConnectionCount(): number {
    return this.connectedUsers.size;
  }

  // 알림 타입별 헬퍼 메서드
  public sendOrderNotification(userId: string, orderData: any) {
    const notification: NotificationData = {
      id: `order_${Date.now()}`,
      type: 'order',
      title: '주문 확인',
      message: `주문번호 ${orderData.orderNumber}이(가) 접수되었습니다.`,
      data: orderData,
      actions: [
        { label: '주문 상세보기', action: 'view_order', url: `/orders/${orderData._id}` },
        { label: '배송 추적', action: 'track_shipment', url: `/orders/${orderData._id}/tracking` }
      ],
      priority: 'high',
      createdAt: new Date()
    };

    this.sendToUser(userId, notification);
  }

  public sendPaymentNotification(userId: string, paymentData: any) {
    const notification: NotificationData = {
      id: `payment_${Date.now()}`,
      type: 'payment',
      title: '결제 완료',
      message: `${paymentData.amount.toLocaleString()}원이 결제되었습니다.`,
      data: paymentData,
      actions: [
        { label: '영수증 보기', action: 'view_receipt', url: `/orders/${paymentData.orderId}/receipt` }
      ],
      priority: 'high',
      createdAt: new Date()
    };

    this.sendToUser(userId, notification);
  }

  public sendShippingNotification(userId: string, shippingData: any) {
    const notification: NotificationData = {
      id: `shipping_${Date.now()}`,
      type: 'shipping',
      title: '배송 시작',
      message: `주문번호 ${shippingData.orderNumber}이(가) 배송을 시작했습니다.`,
      data: shippingData,
      actions: [
        { label: '배송 추적', action: 'track_shipment', url: `/orders/${shippingData.orderId}/tracking` }
      ],
      priority: 'medium',
      createdAt: new Date()
    };

    this.sendToUser(userId, notification);
  }

  public sendPromotionNotification(userId: string, promotionData: any) {
    const notification: NotificationData = {
      id: `promotion_${Date.now()}`,
      type: 'promotion',
      title: '특별 할인 혜택',
      message: promotionData.message,
      data: promotionData,
      actions: [
        { label: '혜택 확인하기', action: 'view_promotion', url: promotionData.url }
      ],
      priority: 'medium',
      createdAt: new Date()
    };

    this.sendToUser(userId, notification);
  }

  public sendSystemNotification(message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    const notification: NotificationData = {
      id: `system_${Date.now()}`,
      type: 'system',
      title: '시스템 알림',
      message,
      priority,
      createdAt: new Date()
    };

    this.sendToAll(notification);
  }

  public sendAdminNotification(message: string, data?: any) {
    const notification: NotificationData = {
      id: `admin_${Date.now()}`,
      type: 'system',
      title: '관리자 알림',
      message,
      data,
      priority: 'high',
      createdAt: new Date()
    };

    this.sendToAdmins(notification);
  }
}

let wsServer: WebSocketServer | null = null;

export function initializeWebSocket(server: NetServer): WebSocketServer {
  if (!wsServer) {
    wsServer = new WebSocketServer(server);
  }
  return wsServer;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wsServer;
}

export default WebSocketServer;
