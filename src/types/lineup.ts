import type { Timestamp } from 'firebase/firestore';

export type SportType = 'soccer' | 'futsal' | 'basketball' | 'volleyball' | 'tennis' | 'badminton' | 'jokgu' | 'baseball' | 'empty';

export interface LineupPlayer {
  id: string; // memberId
  name: string;
  coordX: number; // 0 to 100 percentage
  coordY: number; // 0 to 100 percentage
  teamColor?: 'red' | 'blue'; // for displaying red/blue teams if needed
  positionLabel?: string; // FW, MF, DF, GK etc.
}

export interface LineupData {
  sportType: SportType;
  players: LineupPlayer[];
  updatedAt: Timestamp | null;
  updatedBy: string; // userId who last updated
}
