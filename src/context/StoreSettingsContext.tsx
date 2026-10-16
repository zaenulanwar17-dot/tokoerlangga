import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StoreProfile, OwnerProfile } from '../domain/types';
import { INITIAL_STORE_PROFILE, INITIAL_OWNER_PROFILE } from '../data/demo-data';

interface StoreSettingsContextType {
  storeProfile: StoreProfile;
  updateStoreProfile: (updates: Partial<StoreProfile>) => void;
  resetStoreProfile: () => void;
  submitLogoProposal: (proposedLogoUrl: string, submittedBy: string, note?: string) => void;
  approveLogoProposal: (reviewedBy: string) => void;
  rejectLogoProposal: (reviewedBy: string, reason: string) => void;
  uploadLogoDirect: (logoUrl: string) => void;
  updateOwnerProfile: (updates: Partial<OwnerProfile>) => void;
}

const STORAGE_KEY = 'warung_sembako_profile_v2';

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_STORE_PROFILE,
          ...parsed,
          ownerProfile: {
            ...INITIAL_OWNER_PROFILE,
            ...(parsed.ownerProfile || {}),
          },
        };
      }
    } catch {
      // Fallback
    }
    return INITIAL_STORE_PROFILE;
  });

  const saveProfile = (updated: StoreProfile) => {
    setStoreProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const updateStoreProfile = (updates: Partial<StoreProfile>) => {
    setStoreProfile((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const submitLogoProposal = (proposedLogoUrl: string, submittedBy: string, note?: string) => {
    setStoreProfile((prev) => {
      const updated: StoreProfile = {
        ...prev,
        logoSubmission: {
          proposedLogoUrl,
          submittedBy,
          submittedAt: new Date().toISOString(),
          status: 'PENDING',
          note,
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const approveLogoProposal = (reviewedBy: string) => {
    setStoreProfile((prev) => {
      if (!prev.logoSubmission) return prev;
      const updated: StoreProfile = {
        ...prev,
        logoUrl: prev.logoSubmission.proposedLogoUrl,
        logoSubmission: {
          ...prev.logoSubmission,
          status: 'APPROVED',
          reviewedBy,
          reviewedAt: new Date().toISOString(),
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const rejectLogoProposal = (reviewedBy: string, reason: string) => {
    setStoreProfile((prev) => {
      if (!prev.logoSubmission) return prev;
      const updated: StoreProfile = {
        ...prev,
        logoSubmission: {
          ...prev.logoSubmission,
          status: 'REJECTED',
          reviewedBy,
          reviewedAt: new Date().toISOString(),
          rejectionReason: reason,
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const uploadLogoDirect = (logoUrl: string) => {
    setStoreProfile((prev) => {
      const updated: StoreProfile = {
        ...prev,
        logoUrl,
        logoSubmission: {
          proposedLogoUrl: logoUrl,
          submittedBy: 'Pemilik Warung (Direct)',
          submittedAt: new Date().toISOString(),
          status: 'APPROVED',
          reviewedBy: 'Pemilik Warung (Direct)',
          reviewedAt: new Date().toISOString(),
          note: 'Diterapkan langsung oleh Pemilik Warung',
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const updateOwnerProfile = (updates: Partial<OwnerProfile>) => {
    setStoreProfile((prev) => {
      const currentOwner = prev.ownerProfile || INITIAL_OWNER_PROFILE;
      const updatedOwner: OwnerProfile = { ...currentOwner, ...updates };
      const updated: StoreProfile = {
        ...prev,
        ownerProfile: updatedOwner,
      };
      saveProfile(updated);
      return updated;
    });
  };

  const resetStoreProfile = () => {
    setStoreProfile(INITIAL_STORE_PROFILE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        storeProfile,
        updateStoreProfile,
        resetStoreProfile,
        submitLogoProposal,
        approveLogoProposal,
        rejectLogoProposal,
        uploadLogoDirect,
        updateOwnerProfile,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export function useStoreSettings(): StoreSettingsContextType {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};

