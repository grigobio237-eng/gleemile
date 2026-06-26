'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type JourneyType = 'WELLNESS' | 'CLINICAL_PRE' | 'CLINICAL_POST' | null;
export type MedicalCategory = 'PLASTIC' | 'ORTHOPEDIC' | 'INTERNAL' | 'GENERAL' | 'DENTAL' | 'ORIENTAL' | null;
export type TreatmentType = 'PROCEDURE' | 'SURGERY' | null;

interface RecoveryContextType {
  journey: JourneyType;
  setJourney: (journey: JourneyType) => void;
  medicalCategory: MedicalCategory;
  setMedicalCategory: (category: MedicalCategory) => void;
  treatmentType: TreatmentType;
  setTreatmentType: (type: TreatmentType) => void;
  resetJourney: () => void;
}

const RecoveryContext = createContext<RecoveryContextType | undefined>(undefined);

export function RecoveryProvider({ children }: { children: ReactNode }) {
  const [journey, setJourneyState] = useState<JourneyType>(null);
  const [medicalCategory, setMedicalCategoryState] = useState<MedicalCategory>(null);
  const [treatmentType, setTreatmentTypeState] = useState<TreatmentType>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from sessionStorage
  useEffect(() => {
    const savedJourney = sessionStorage.getItem('youniqle_journey') as JourneyType;
    if (savedJourney && ['WELLNESS', 'CLINICAL_PRE', 'CLINICAL_POST'].includes(savedJourney)) {
      setJourneyState(savedJourney);
    }

    const savedCategory = sessionStorage.getItem('youniqle_medical_category') as MedicalCategory;
    if (savedCategory) {
      setMedicalCategoryState(savedCategory);
    }

    const savedTreatment = sessionStorage.getItem('youniqle_treatment_type') as TreatmentType;
    if (savedTreatment) {
      setTreatmentTypeState(savedTreatment);
    }

    setIsInitialized(true);
  }, []);

  const setJourney = (newJourney: JourneyType) => {
    setJourneyState(newJourney);
    if (newJourney) {
      sessionStorage.setItem('youniqle_journey', newJourney);
    } else {
      sessionStorage.removeItem('youniqle_journey');
    }
  };

  const setMedicalCategory = (category: MedicalCategory) => {
    setMedicalCategoryState(category);
    if (category) {
      sessionStorage.setItem('youniqle_medical_category', category);
    } else {
      sessionStorage.removeItem('youniqle_medical_category');
    }
  };

  const setTreatmentType = (type: TreatmentType) => {
    setTreatmentTypeState(type);
    if (type) {
      sessionStorage.setItem('youniqle_treatment_type', type);
    } else {
      sessionStorage.removeItem('youniqle_treatment_type');
    }
  };

  const resetJourney = () => {
    setJourney(null);
    setMedicalCategory(null);
    setTreatmentType(null);
  };

  return (
    <RecoveryContext.Provider value={{ 
      journey, setJourney, 
      medicalCategory, setMedicalCategory, 
      treatmentType, setTreatmentType,
      resetJourney 
    }}>
      {isInitialized ? children : <div className="hidden">{children}</div>}
    </RecoveryContext.Provider>
  );
}

export function useRecovery() {
  const context = useContext(RecoveryContext);
  if (context === undefined) {
    throw new Error('useRecovery must be used within a RecoveryProvider');
  }
  return context;
}
