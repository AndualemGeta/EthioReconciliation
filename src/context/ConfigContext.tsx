import React, { createContext, useContext, useState } from 'react';
import { OrgTerminology, LegalEntity, Tenant, GroupOrg, UserScope } from '../types';

interface ConfigContextType {
  activeLanguage: 'en' | 'am';
  setActiveLanguage: (lang: 'en' | 'am') => void;
  activeTenant: Tenant;
  activeGroup: GroupOrg;
  activeLegalEntity: LegalEntity;
  setActiveLegalEntityId: (id: string) => void;
  allLegalEntities: LegalEntity[];
  userScope: UserScope;
  setUserScope: React.Dispatch<React.SetStateAction<UserScope>>;
  getLabel: (key: keyof OrgTerminology, fallback?: string) => string;
}

const DEFAULT_ETHIOPIA_TERMINOLOGY: OrgTerminology = {
  branchLabel: 'Shop',
  agentLabel: 'DSA',
  floatSourceLabel: 'UM / DD Float',
  mobileMoneyLabel: 'M-PESA / Telebirr',
  currencyLabel: 'ETB',
};

const DEFAULT_GLOBAL_LEGAL_ENTITY: LegalEntity = {
  id: 'LE-ETH-01',
  groupId: 'GRP-AFRICA-01',
  tenantId: 'TNT-GLOBAL-01',
  name: 'EthioConnect Telecom Distributor PLC',
  code: 'ETH-DIST-01',
  countryCode: 'ET',
  baseCurrency: 'ETB',
  fiscalYearStartMonth: 7, // Hamle (July)
  timeZone: 'Africa/Addis_Ababa',
  taxId: 'TIN-1029384756',
  contactEmail: 'finance@ethioconnect.et',
  status: 'ACTIVE',
  terminology: DEFAULT_ETHIOPIA_TERMINOLOGY,
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'am'>('en');

  const [activeTenant] = useState<Tenant>({
    id: 'TNT-GLOBAL-01',
    name: 'ReconFlow Enterprise Global',
    code: 'RECON-GLOBAL',
    createdAtUtc: '2026-01-01T00:00:00Z',
  });

  const [activeGroup] = useState<GroupOrg>({
    id: 'GRP-AFRICA-01',
    tenantId: 'TNT-GLOBAL-01',
    name: 'East Africa Distribution Group',
    code: 'EADG',
  });

  const [allLegalEntities] = useState<LegalEntity[]>([
    DEFAULT_GLOBAL_LEGAL_ENTITY,
    {
      id: 'LE-KEN-01',
      groupId: 'GRP-AFRICA-01',
      tenantId: 'TNT-GLOBAL-01',
      name: 'Kenya Telecom Outlets Ltd',
      code: 'KEN-DIST-01',
      countryCode: 'KE',
      baseCurrency: 'KES',
      fiscalYearStartMonth: 1,
      timeZone: 'Africa/Nairobi',
      taxId: 'KRA-9920192',
      contactEmail: 'finance@kenyatelecom.co.ke',
      status: 'ACTIVE',
      terminology: {
        branchLabel: 'Branch',
        agentLabel: 'Sales Representative',
        floatSourceLabel: 'Wallet Source',
        mobileMoneyLabel: 'M-PESA',
        currencyLabel: 'KES',
      },
    },
  ]);

  const [activeLegalEntityId, setActiveLegalEntityId] = useState<string>('LE-ETH-01');

  const activeLegalEntity =
    allLegalEntities.find((le) => le.id === activeLegalEntityId) || DEFAULT_GLOBAL_LEGAL_ENTITY;

  const [userScope, setUserScope] = useState<UserScope>({
    userId: 'USR-001',
    userName: 'Kassahun Tadesse',
    role: 'FINANCE_MANAGER',
    tenantId: 'TNT-GLOBAL-01',
    groupId: 'GRP-AFRICA-01',
    companyId: activeLegalEntity.id,
    legalEntityId: activeLegalEntity.id,
    countryCode: activeLegalEntity.countryCode,
    authorizedLegalEntityIds: ['LE-ETH-01', 'LE-KEN-01'],
  });

  const getLabel = (key: keyof OrgTerminology, fallback?: string): string => {
    if (activeLanguage === 'am') {
      const amharicMap: Record<keyof OrgTerminology, string> = {
        branchLabel: 'ሱቅ / ቅርንጫፍ',
        agentLabel: 'የሜዳ ወኪል (DSA)',
        floatSourceLabel: 'ፍሎት ምንጭ (UM / DD)',
        mobileMoneyLabel: 'ሞባይል ገንዘብ',
        currencyLabel: 'ብር (ETB)',
      };
      return amharicMap[key] || fallback || activeLegalEntity.terminology[key];
    }
    return activeLegalEntity.terminology[key] || fallback || '';
  };

  return (
    <ConfigContext.Provider
      value={{
        activeLanguage,
        setActiveLanguage,
        activeTenant,
        activeGroup,
        activeLegalEntity,
        setActiveLegalEntityId,
        allLegalEntities,
        userScope,
        setUserScope,
        getLabel,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return ctx;
};
