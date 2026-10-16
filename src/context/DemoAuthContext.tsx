import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, Customer } from '../domain/types';
import { customerRepository } from '../services';

interface DemoUser {
  id: string;
  name: string;
  role: Role;
  email: string;
}

interface DemoAuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUser: DemoUser;
  updateCurrentUser: (updates: Partial<DemoUser>) => void;
  switchToUser: (user: { id: string; name: string; role: Role; email: string }) => void;
  activeCustomer: Customer | null;
  setActiveCustomer: (customer: Customer | null) => void;
  availableCustomers: Customer[];
  refreshCustomers: () => Promise<void>;
}

const DEMO_USERS: Record<Role, DemoUser> = {
  OWNER: {
    id: 'usr_owner',
    name: 'Haji Ahmad (Pemilik Warung)',
    role: 'OWNER',
    email: 'owner@warungsembako.demo',
  },
  ADMIN: {
    id: 'usr_admin',
    name: 'Budi Santoso (Admin Toko & Gudang)',
    role: 'ADMIN',
    email: 'admin@warungsembako.demo',
  },
  STAFF: {
    id: 'usr_staff',
    name: 'Dewi Lestari (Kasir Utama)',
    role: 'STAFF',
    email: 'kasir@warungsembako.demo',
  },
  CUSTOMER: {
    id: 'usr_customer',
    name: 'Ibu Siti (Warung Kelontong Berkah)',
    role: 'CUSTOMER',
    email: 'siti@kelontongberkah.demo',
  },
};

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export const DemoAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(() => {
    try {
      const saved = localStorage.getItem('warung_demo_role');
      if (saved && ['OWNER', 'ADMIN', 'STAFF', 'CUSTOMER'].includes(saved)) {
        return saved as Role;
      }
    } catch {
      // Fallback
    }
    return 'OWNER';
  });

  const [customUsers, setCustomUsers] = useState<Record<Role, DemoUser>>(() => {
    try {
      const saved = localStorage.getItem('warung_demo_users_v1');
      if (saved) {
        return { ...DEMO_USERS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEMO_USERS;
  });

  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const refreshCustomers = async () => {
    const list = await customerRepository.list();
    setAvailableCustomers(list);
    // If role is CUSTOMER and no activeCustomer is set, pick Ibu Siti (Wholesale 1) or first customer
    if (!activeCustomer && list.length > 0) {
      const wholesaleCust = list.find((c) => c.tier === 'WHOLESALE_1') || list[0];
      setActiveCustomer(wholesaleCust);
    }
  };

  useEffect(() => {
    refreshCustomers();
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    try {
      localStorage.setItem('warung_demo_role', newRole);
    } catch {
      // Ignore
    }
  };

  const updateCurrentUser = (updates: Partial<DemoUser>) => {
    setCustomUsers((prev) => {
      const updatedRoleUser = { ...prev[role], ...updates };
      const updated = { ...prev, [role]: updatedRoleUser };
      try {
        localStorage.setItem('warung_demo_users_v1', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const switchToUser = (user: { id: string; name: string; role: Role; email: string }) => {
    setCustomUsers((prev) => {
      const updated = {
        ...prev,
        [user.role]: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
      };
      try {
        localStorage.setItem('warung_demo_users_v1', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
    setRole(user.role);
  };

  const currentUser = customUsers[role] || DEMO_USERS[role];

  return (
    <DemoAuthContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        updateCurrentUser,
        switchToUser,
        activeCustomer,
        setActiveCustomer,
        availableCustomers,
        refreshCustomers,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
};

export function useDemoAuth(): DemoAuthContextType {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
};
