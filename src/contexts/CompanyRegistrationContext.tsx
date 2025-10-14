import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useCompanyRegistrationFlow } from '../hooks/useCompanyRegistrationFlow';
import type { CompanyFlowState, CompanyFlowActions } from '../hooks/useCompanyRegistrationFlow';

interface CompanyRegistrationContextType extends CompanyFlowActions {
    flowState: CompanyFlowState;
}

const CompanyRegistrationContext = createContext<CompanyRegistrationContextType | undefined>(undefined);

interface CompanyRegistrationProviderProps {
    children: ReactNode;
}

export const CompanyRegistrationProvider: React.FC<CompanyRegistrationProviderProps> = ({ children }) => {
    const flowActions = useCompanyRegistrationFlow();
    const flowState = flowActions.getFlowState();

    const contextValue: CompanyRegistrationContextType = {
        ...flowActions,
        flowState,
    };

    return (
        <CompanyRegistrationContext.Provider value={contextValue}>
            {children}
        </CompanyRegistrationContext.Provider>
    );
};

export const useCompanyRegistration = (): CompanyRegistrationContextType => {
    const context = useContext(CompanyRegistrationContext);
    if (!context) {
        throw new Error('useCompanyRegistration must be used within a CompanyRegistrationProvider');
    }
    return context;
};
