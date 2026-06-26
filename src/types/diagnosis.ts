export type Question = {
  id: number;
  category: string;
  text: string;
  options: { label: string; score: number }[];
};
