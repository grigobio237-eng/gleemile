import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

export interface ImageOptimizationConfig {
  quality: number;
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  maxWidth: number;
  maxHeight: number;
  progressive: boolean;
  stripMetadata: boolean;
}

export interface ImageSizes {
  thumbnail: { width: 150, height: 150 };
  small: { width: 300, height: 300 };
  medium: { width: 600, height: 600 };
  large: { width: 1200, height: 1200 };
  xlarge: { width: 1920, height: 1920 };
}

export class ImageOptimizer {
  private static readonly DEFAULT_CONFIG: ImageOptimizationConfig = {
    quality: 85,
    format: 'webp',
    maxWidth: 1920,
    maxHeight: 1920,
    progressive: true,
    stripMetadata: true
  };

  private static readonly IMAGE_SIZES: ImageSizes = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
    xlarge: { width: 1920, height: 1920 }
  };

  // 이미지 최적화
  public static async optimizeImage(
    inputPath: string,
    outputPath: string,
    config: Partial<ImageOptimizationConfig> = {}
  ): Promise<{
    success: boolean;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    error?: string;
  }> {
    try {
      const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
      
      // 원본 파일 크기 확인
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // 이미지 최적화
      let sharpInstance = sharp(inputPath);

      // 메타데이터 제거
      if (finalConfig.stripMetadata) {
        sharpInstance = sharpInstance.withMetadata({});
      }

      // 크기 조정
      sharpInstance = sharpInstance
        .resize(finalConfig.maxWidth, finalConfig.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });

      // 포맷별 최적화
      switch (finalConfig.format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality: finalConfig.quality,
            progressive: finalConfig.progressive,
            mozjpeg: true
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality: finalConfig.quality,
            progressive: finalConfig.progressive,
            compressionLevel: 9
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: finalConfig.quality,
            effort: 6
          });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({
            quality: finalConfig.quality,
            effort: 4
          });
          break;
      }

      // 최적화된 이미지 저장
      await sharpInstance.toFile(outputPath);

      // 최적화된 파일 크기 확인
      const optimizedStats = await fs.stat(outputPath);
      const optimizedSize = optimizedStats.size;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio
      };
    } catch (error) {
      return {
        success: false,
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 다중 크기 이미지 생성
  public static async generateMultipleSizes(
    inputPath: string,
    outputDir: string,
    filename: string,
    config: Partial<ImageOptimizationConfig> = {}
  ): Promise<{
    success: boolean;
    generatedSizes: Array<{
      size: keyof ImageSizes;
      path: string;
      width: number;
      height: number;
      fileSize: number;
    }>;
    error?: string;
  }> {
    try {
      const generatedSizes = [];

      for (const [sizeName, dimensions] of Object.entries(this.IMAGE_SIZES)) {
        const outputPath = path.join(outputDir, `${filename}_${sizeName}.webp`);
        
        const result = await this.optimizeImage(inputPath, outputPath, {
          ...config,
          maxWidth: dimensions.width,
          maxHeight: dimensions.height,
          format: 'webp'
        });

        if (result.success) {
          generatedSizes.push({
            size: sizeName as keyof ImageSizes,
            path: outputPath,
            width: dimensions.width,
            height: dimensions.height,
            fileSize: result.optimizedSize
          });
        }
      }

      return {
        success: true,
        generatedSizes
      };
    } catch (error) {
      return {
        success: false,
        generatedSizes: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 이미지 정보 추출
  public static async getImageInfo(inputPath: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
    colorSpace: string;
    density: number;
  } | null> {
    try {
      const metadata = await sharp(inputPath).metadata();
      const stats = await fs.stat(inputPath);

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: stats.size,
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'unknown',
        density: metadata.density || 72
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }

  // 이미지 리사이즈 (비율 유지)
  public static async resizeImage(
    inputPath: string,
    outputPath: string,
    width: number,
    height?: number,
    quality: number = 85
  ): Promise<boolean> {
    try {
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toFile(outputPath);

      return true;
    } catch (error) {
      console.error('Error resizing image:', error);
      return false;
    }
  }

  // 썸네일 생성
  public static async createThumbnail(
    inputPath: string,
    outputPath: string,
    size: number = 150,
    quality: number = 80
  ): Promise<boolean> {
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality })
        .toFile(outputPath);

      return true;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return false;
    }
  }

  // 이미지 포맷 변환
  public static async convertFormat(
    inputPath: string,
    outputPath: string,
    format: 'jpeg' | 'png' | 'webp' | 'avif',
    quality: number = 85
  ): Promise<boolean> {
    try {
      let sharpInstance = sharp(inputPath);

      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality, progressive: true });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality });
          break;
      }

      await sharpInstance.toFile(outputPath);
      return true;
    } catch (error) {
      console.error('Error converting format:', error);
      return false;
    }
  }

  // 배치 이미지 최적화
  public static async batchOptimize(
    inputDir: string,
    outputDir: string,
    config: Partial<ImageOptimizationConfig> = {}
  ): Promise<{
    success: boolean;
    processed: number;
    total: number;
    totalOriginalSize: number;
    totalOptimizedSize: number;
    averageCompressionRatio: number;
    errors: string[];
  }> {
    try {
      const files = await fs.readdir(inputDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(file)
      );

      let processed = 0;
      let totalOriginalSize = 0;
      let totalOptimizedSize = 0;
      const errors: string[] = [];

      for (const file of imageFiles) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);

        const result = await this.optimizeImage(inputPath, outputPath, config);

        if (result.success) {
          processed++;
          totalOriginalSize += result.originalSize;
          totalOptimizedSize += result.optimizedSize;
        } else {
          errors.push(`${file}: ${result.error}`);
        }
      }

      const averageCompressionRatio = totalOriginalSize > 0 
        ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100 
        : 0;

      return {
        success: true,
        processed,
        total: imageFiles.length,
        totalOriginalSize,
        totalOptimizedSize,
        averageCompressionRatio,
        errors
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        total: 0,
        totalOriginalSize: 0,
        totalOptimizedSize: 0,
        averageCompressionRatio: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // 이미지 품질 분석
  public static async analyzeImageQuality(inputPath: string): Promise<{
    sharpness: number;
    brightness: number;
    contrast: number;
    colorfulness: number;
    overallScore: number;
  }> {
    try {
      const { data, info } = await sharp(inputPath)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width, height, channels } = info;
      const pixels = width * height;
      
      let totalBrightness = 0;
      let totalContrast = 0;
      let totalColorfulness = 0;
      let edgeCount = 0;

      // 밝기 및 대비 계산
      for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 밝기 (Y = 0.299*R + 0.587*G + 0.114*B)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;

        // 색상성 (RGB 표준편차)
        const mean = (r + g + b) / 3;
        const variance = Math.pow(r - mean, 2) + Math.pow(g - mean, 2) + Math.pow(b - mean, 2);
        totalColorfulness += Math.sqrt(variance / 3);

        // 에지 감지 (간단한 Sobel 필터)
        if (i < data.length - channels * width) {
          const current = brightness;
          const right = 0.299 * data[i + channels] + 0.587 * data[i + channels + 1] + 0.114 * data[i + channels + 2];
          const down = 0.299 * data[i + channels * width] + 0.587 * data[i + channels * width + 1] + 0.114 * data[i + channels * width + 2];
          
          const edgeStrength = Math.abs(right - current) + Math.abs(down - current);
          if (edgeStrength > 30) { // 임계값
            edgeCount++;
          }
        }
      }

      const avgBrightness = totalBrightness / pixels;
      const avgColorfulness = totalColorfulness / pixels;
      const sharpness = (edgeCount / pixels) * 100;
      
      // 대비 계산 (전체 이미지의 표준편차)
      let contrastSum = 0;
      for (let i = 0; i < data.length; i += channels) {
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        contrastSum += Math.pow(brightness - avgBrightness, 2);
      }
      const contrast = Math.sqrt(contrastSum / pixels);

      // 전체 점수 (0-100)
      const overallScore = Math.min(100, 
        (sharpness * 0.3) + 
        (Math.min(contrast / 50, 1) * 100 * 0.2) + 
        (Math.min(avgColorfulness / 100, 1) * 100 * 0.2) + 
        (Math.min(avgBrightness / 255, 1) * 100 * 0.3)
      );

      return {
        sharpness,
        brightness: avgBrightness,
        contrast,
        colorfulness: avgColorfulness,
        overallScore
      };
    } catch (error) {
      console.error('Error analyzing image quality:', error);
      return {
        sharpness: 0,
        brightness: 0,
        contrast: 0,
        colorfulness: 0,
        overallScore: 0
      };
    }
  }

  // 이미지 최적화 설정 가져오기
  public static getOptimizationConfig(useCase: 'web' | 'mobile' | 'print' | 'thumbnail'): ImageOptimizationConfig {
    switch (useCase) {
      case 'web':
        return {
          quality: 85,
          format: 'webp',
          maxWidth: 1920,
          maxHeight: 1920,
          progressive: true,
          stripMetadata: true
        };
      case 'mobile':
        return {
          quality: 80,
          format: 'webp',
          maxWidth: 800,
          maxHeight: 800,
          progressive: true,
          stripMetadata: true
        };
      case 'print':
        return {
          quality: 95,
          format: 'jpeg',
          maxWidth: 3000,
          maxHeight: 3000,
          progressive: false,
          stripMetadata: false
        };
      case 'thumbnail':
        return {
          quality: 75,
          format: 'webp',
          maxWidth: 300,
          maxHeight: 300,
          progressive: true,
          stripMetadata: true
        };
      default:
        return this.DEFAULT_CONFIG;
    }
  }
}

export default ImageOptimizer;















