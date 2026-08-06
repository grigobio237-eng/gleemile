export interface AlimtalkPayload {
  recipientPhone: string;
  templateCode: string;
  variables: Record<string, string>;
  webLink?: string;
}

export interface AlimtalkResponse {
  success: boolean;
  messageId?: string;
  shareUrl?: string;
  error?: string;
}

interface AlimtalkProvider {
  sendMessage(payload: AlimtalkPayload): Promise<AlimtalkResponse>;
}

// ---------------------------------------------------------
// Solapi Provider 구현체 (Mock)
// ---------------------------------------------------------
class SolapiProvider implements AlimtalkProvider {
  private apiKey: string;
  private apiSecret: string;
  private senderId: string;

  constructor() {
    this.apiKey = process.env.SOLAPI_API_KEY || '';
    this.apiSecret = process.env.SOLAPI_API_SECRET || '';
    this.senderId = process.env.ALIMTALK_SENDER_ID || '';
  }

  async sendMessage(payload: AlimtalkPayload): Promise<AlimtalkResponse> {
    // 실제 API가 연결되기 전까지 Mock 로직 실행
    console.log('[SolapiProvider] Mock Sending Alimtalk:', {
      to: payload.recipientPhone,
      templateId: payload.templateCode,
      vars: payload.variables,
    });

    const shareUrl = payload.webLink || `https://gleemile.com/link/mock_${Date.now()}`;

    // 실제 환경에서는 여기서 Solapi SDK나 fetch API를 사용하여 통신합니다.
    return {
      success: true,
      messageId: `solapi_${Date.now()}`,
      shareUrl,
    };
  }
}

// ---------------------------------------------------------
// Aligo Provider 구현체 (필요 시 확장 가능)
// ---------------------------------------------------------
class AligoProvider implements AlimtalkProvider {
  async sendMessage(payload: AlimtalkPayload): Promise<AlimtalkResponse> {
    console.log('[AligoProvider] Not implemented yet');
    return { success: false, error: 'Not implemented' };
  }
}

// ---------------------------------------------------------
// Service Factory
// ---------------------------------------------------------
export class AlimtalkService {
  private provider: AlimtalkProvider;

  constructor(vendor: 'solapi' | 'aligo' = 'solapi') {
    if (vendor === 'solapi') {
      this.provider = new SolapiProvider();
    } else {
      this.provider = new AligoProvider();
    }
  }

  async send(payload: AlimtalkPayload): Promise<AlimtalkResponse> {
    // 공통 밸리데이션 로직 등 추가 가능
    if (!payload.recipientPhone) {
      return { success: false, error: 'Recipient phone is required' };
    }
    
    try {
      return await this.provider.sendMessage(payload);
    } catch (error: any) {
      console.error('[AlimtalkService] Send Error:', error);
      return { success: false, error: error.message };
    }
  }
}

// 싱글톤 인스턴스 노출 (기본값: Solapi)
export const alimtalkService = new AlimtalkService('solapi');
