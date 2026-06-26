export type BlockCategory = 'core' | 'business' | 'hobby' | 'study' | 'sports';

export interface IBlockConfig {
  blockId: string;
  blockName: string;
  category: BlockCategory;
  isActive: boolean;
  order: number;
}
