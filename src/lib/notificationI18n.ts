import { connectDB } from '@/lib/db';

export interface NotificationTranslation {
  language: string;
  subject?: string;
  title: string;
  content: string;
  htmlContent?: string;
  variables: {
    [key: string]: string;
  };
}

export interface NotificationTemplateI18n {
  templateId: string;
  translations: NotificationTranslation[];
  defaultLanguage: string;
  supportedLanguages: string[];
}

export class NotificationI18n {
  // 지원 언어 목록
  static readonly SUPPORTED_LANGUAGES = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ];

  // 언어 감지
  static detectLanguage(acceptLanguage?: string, userLanguage?: string): string {
    // 1. 사용자 설정 언어 우선
    if (userLanguage && this.isLanguageSupported(userLanguage)) {
      return userLanguage;
    }

    // 2. Accept-Language 헤더에서 감지
    if (acceptLanguage) {
      const languages = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase())
        .map(lang => lang.split('-')[0]); // 'en-US' -> 'en'

      for (const lang of languages) {
        if (this.isLanguageSupported(lang)) {
          return lang;
        }
      }
    }

    // 3. 기본 언어 (한국어)
    return 'ko';
  }

  // 언어 지원 여부 확인
  static isLanguageSupported(language: string): boolean {
    return this.SUPPORTED_LANGUAGES.some(lang => lang.code === language);
  }

  // 언어 정보 조회
  static getLanguageInfo(language: string) {
    return this.SUPPORTED_LANGUAGES.find(lang => lang.code === language) || {
      code: language,
      name: language.toUpperCase(),
      flag: '🌐'
    };
  }

  // 템플릿 번역 생성
  static async createTemplateTranslation(
    templateId: string,
    language: string,
    translation: Omit<NotificationTranslation, 'language'>
  ): Promise<void> {
    try {
      await connectDB();
      
      // MongoDB에 번역 저장 (실제 구현에서는 별도 컬렉션 사용)
      const mongoose = await import('mongoose');
      if (!mongoose.default.connection.db) {
        throw new Error('Database connection not available');
      }
      const collection = mongoose.default.connection.db.collection('notification_translations');
      
      await collection.updateOne(
        { templateId, language },
        {
          $set: {
            templateId,
            language,
            ...translation,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Create template translation error:', error);
      throw error;
    }
  }

  // 템플릿 번역 조회
  static async getTemplateTranslation(
    templateId: string,
    language: string
  ): Promise<NotificationTranslation | null> {
    try {
      await connectDB();
      
      const mongoose = await import('mongoose');
      if (!mongoose.default.connection.db) {
        return null;
      }
      const collection = mongoose.default.connection.db.collection('notification_translations');
      const translation = await collection.findOne({ templateId, language });
      
      return translation ? {
        language: translation.language,
        subject: translation.subject,
        title: translation.title,
        content: translation.content,
        htmlContent: translation.htmlContent,
        variables: translation.variables || {}
      } : null;
    } catch (error) {
      console.error('Get template translation error:', error);
      return null;
    }
  }

  // 템플릿의 모든 번역 조회
  static async getTemplateTranslations(templateId: string): Promise<NotificationTranslation[]> {
    try {
      await connectDB();
      
      const mongoose = await import('mongoose');
      if (!mongoose.default.connection.db) {
        return [];
      }
      const collection = mongoose.default.connection.db.collection('notification_translations');
      const translations = await collection.find({ templateId }).toArray();
      
      return translations.map(translation => ({
        language: translation.language,
        subject: translation.subject,
        title: translation.title,
        content: translation.content,
        htmlContent: translation.htmlContent,
        variables: translation.variables || {}
      }));
    } catch (error) {
      console.error('Get template translations error:', error);
      return [];
    }
  }

  // 번역된 템플릿 처리
  static async processTranslatedTemplate(
    templateId: string,
    language: string,
    variables: { [key: string]: any } = {}
  ): Promise<NotificationTranslation | null> {
    try {
      // 번역 조회
      const translation = await this.getTemplateTranslation(templateId, language);
      
      if (!translation) {
        // 번역이 없으면 기본 언어로 폴백
        const fallbackTranslation = await this.getTemplateTranslation(templateId, 'ko');
        if (!fallbackTranslation) {
          return null;
        }
        return this.processVariables(fallbackTranslation, variables);
      }
      
      return this.processVariables(translation, variables);
    } catch (error) {
      console.error('Process translated template error:', error);
      return null;
    }
  }

  // 변수 처리
  private static processVariables(
    translation: NotificationTranslation,
    variables: { [key: string]: any }
  ): NotificationTranslation {
    const processText = (text: string): string => {
      if (!text) return text;
      
      return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
        const value = variables[variableName];
        if (value === undefined) {
          // 번역된 변수명 확인
          const translatedVarName = translation.variables[variableName];
          if (translatedVarName) {
            return translatedVarName;
          }
          return match;
        }
        return String(value);
      });
    };

    return {
      language: translation.language,
      subject: translation.subject ? processText(translation.subject) : undefined,
      title: processText(translation.title),
      content: processText(translation.content),
      htmlContent: translation.htmlContent ? processText(translation.htmlContent) : undefined,
      variables: translation.variables
    };
  }

  // 번역 품질 검증
  static validateTranslation(translation: NotificationTranslation): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 필수 필드 검증
    if (!translation.title || translation.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!translation.content || translation.content.trim().length === 0) {
      errors.push('Content is required');
    }

    // 길이 검증
    if (translation.title && translation.title.length > 200) {
      warnings.push('Title is too long (max 200 characters)');
    }

    if (translation.content && translation.content.length > 2000) {
      warnings.push('Content is too long (max 2000 characters)');
    }

    // 변수 일관성 검증
    const titleVariables = translation.title.match(/\{\{(\w+)\}\}/g) || [];
    const contentVariables = translation.content.match(/\{\{(\w+)\}\}/g) || [];
    
    const allVariables = [...new Set([...titleVariables, ...contentVariables])];
    
    for (const variable of allVariables) {
      const varName = variable.replace(/\{\{|\}\}/g, '');
      if (!translation.variables[varName]) {
        warnings.push(`Variable '${varName}' is not defined in variables`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // 번역 통계
  static async getTranslationStats(templateId: string): Promise<{
    totalLanguages: number;
    completedLanguages: number;
    completionRate: number;
    languages: Array<{
      code: string;
      name: string;
      flag: string;
      hasTranslation: boolean;
      lastUpdated?: Date;
    }>;
  }> {
    try {
      await connectDB();
      
      const mongoose = await import('mongoose');
      if (!mongoose.default.connection.db) {
        return {
          totalLanguages: this.SUPPORTED_LANGUAGES.length,
          completedLanguages: 0,
          completionRate: 0,
          languages: this.SUPPORTED_LANGUAGES.map(lang => ({
            code: lang.code,
            name: lang.name,
            flag: lang.flag,
            hasTranslation: false
          }))
        };
      }
      const collection = mongoose.default.connection.db.collection('notification_translations');
      const translations = await collection.find({ templateId }).toArray();
      
      const completedLanguages = new Set(translations.map(t => t.language));
      const totalLanguages = this.SUPPORTED_LANGUAGES.length;
      
      const languages = this.SUPPORTED_LANGUAGES.map(lang => {
        const translation = translations.find(t => t.language === lang.code);
        return {
          code: lang.code,
          name: lang.name,
          flag: lang.flag,
          hasTranslation: completedLanguages.has(lang.code),
          lastUpdated: translation?.updatedAt
        };
      });

      return {
        totalLanguages,
        completedLanguages: completedLanguages.size,
        completionRate: Math.round((completedLanguages.size / totalLanguages) * 100),
        languages
      };
    } catch (error) {
      console.error('Get translation stats error:', error);
      return {
        totalLanguages: this.SUPPORTED_LANGUAGES.length,
        completedLanguages: 0,
        completionRate: 0,
        languages: this.SUPPORTED_LANGUAGES.map(lang => ({
          code: lang.code,
          name: lang.name,
          flag: lang.flag,
          hasTranslation: false
        }))
      };
    }
  }

  // 자동 번역 (실제 구현에서는 번역 API 연동)
  static async autoTranslate(
    text: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<string> {
    try {
      // 실제 구현에서는 Google Translate, DeepL, Azure Translator 등 사용
      // 여기서는 간단한 예시만 제공
      
      if (fromLanguage === toLanguage) {
        return text;
      }

      // 간단한 번역 예시 (실제로는 번역 API 호출)
      const translations: { [key: string]: { [key: string]: string } } = {
        'ko': {
          'en': 'Hello! This is a notification.',
          'zh': '你好！这是一个通知。',
          'ja': 'こんにちは！これは通知です。'
        },
        'en': {
          'ko': '안녕하세요! 이것은 알림입니다.',
          'zh': '你好！这是一个通知。',
          'ja': 'こんにちは！これは通知です。'
        }
      };

      return translations[fromLanguage]?.[toLanguage] || text;
    } catch (error) {
      console.error('Auto translate error:', error);
      return text;
    }
  }

  // 번역 일괄 생성
  static async createBulkTranslations(
    templateId: string,
    sourceLanguage: string,
    sourceTranslation: NotificationTranslation,
    targetLanguages: string[]
  ): Promise<void> {
    try {
      for (const targetLanguage of targetLanguages) {
        if (targetLanguage === sourceLanguage) continue;

        const translatedTitle = await this.autoTranslate(
          sourceTranslation.title,
          sourceLanguage,
          targetLanguage
        );

        const translatedContent = await this.autoTranslate(
          sourceTranslation.content,
          sourceLanguage,
          targetLanguage
        );

        const translatedSubject = sourceTranslation.subject
          ? await this.autoTranslate(sourceTranslation.subject, sourceLanguage, targetLanguage)
          : undefined;

        const translatedHtmlContent = sourceTranslation.htmlContent
          ? await this.autoTranslate(sourceTranslation.htmlContent, sourceLanguage, targetLanguage)
          : undefined;

        await this.createTemplateTranslation(templateId, targetLanguage, {
          subject: translatedSubject,
          title: translatedTitle,
          content: translatedContent,
          htmlContent: translatedHtmlContent,
          variables: sourceTranslation.variables
        });
      }
    } catch (error) {
      console.error('Create bulk translations error:', error);
      throw error;
    }
  }
}
