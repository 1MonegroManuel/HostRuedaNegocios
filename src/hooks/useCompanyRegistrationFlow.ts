import { useState, useCallback } from 'react';
import type { Evento } from '../apiService/types';

// Tipos para el flujo de registro
export interface CompanyRegistrationData {
    nombre: string;
    rubro: string;
    rubroOtro?: string;
    descripcion: string;
    intereses: string[];
    isVirtual: boolean;
    eventoId: string;
    nit?: string;
    representante?: string;
    telefono?: string;
    email?: string;
    sitio_web?: string;
}

export interface EncargadoData {
    nombre: string;
    apellido: string;
    email: string;
    username: string;
    password: string;
    telefono?: string;
}

export interface PersonalData {
    personal: Array<{
        nombre: string;
        apellido: string;
        email: string;
        telefono?: string;
    }>;
}

export interface CompanyLogoData {
    logo?: File;
}

export interface CompanyReceiptData {
    recibo?: File;
}

export interface CompanyFlowState {
    selectedEvent?: Evento;
    companyData?: CompanyRegistrationData;
    logoData?: CompanyLogoData;
    encargadoData?: EncargadoData;
    personalData?: PersonalData;
    receiptData?: CompanyReceiptData;
    currentStep: number;
    totalSteps: number;
    // IDs generados después de crear usuarios
    encargadoId?: string;
    personalIds?: string[];
}

export interface CompanyFlowActions {
    setSelectedEvent: (event: Evento) => void;
    setCompanyData: (data: CompanyRegistrationData) => void;
    setLogoData: (data: CompanyLogoData) => void;
    setEncargadoData: (data: EncargadoData) => void;
    setPersonalData: (data: PersonalData) => void;
    setReceiptData: (data: CompanyReceiptData) => void;
    setEncargadoId: (id: string) => void;
    setPersonalIds: (ids: string[]) => void;
    nextStep: () => void;
    prevStep: () => void;
    resetFlow: () => void;
    getFlowState: () => CompanyFlowState;
}

export const useCompanyRegistrationFlow = (): CompanyFlowActions => {
    const [flowState, setFlowState] = useState<CompanyFlowState>({
        currentStep: 1,
        totalSteps: 6, // SelectEvents, Company-registration, Company-logo, Encargado, Personal, Registration-Review
    });

    const setSelectedEvent = useCallback((event: Evento) => {
        setFlowState(prev => ({
            ...prev,
            selectedEvent: event,
            currentStep: 2
        }));
    }, []);

    const setCompanyData = useCallback((data: CompanyRegistrationData) => {
        setFlowState(prev => ({
            ...prev,
            companyData: data,
            currentStep: 3
        }));
    }, []);

    const setLogoData = useCallback((data: CompanyLogoData) => {
        setFlowState(prev => ({
            ...prev,
            logoData: data,
            currentStep: 4
        }));
    }, []);

    const setEncargadoData = useCallback((data: EncargadoData) => {
        setFlowState(prev => ({
            ...prev,
            encargadoData: data,
            currentStep: 5
        }));
    }, []);

    const setPersonalData = useCallback((data: PersonalData) => {
        setFlowState(prev => ({
            ...prev,
            personalData: data,
            currentStep: 6
        }));
    }, []);

    const setReceiptData = useCallback((data: CompanyReceiptData) => {
        setFlowState(prev => ({
            ...prev,
            receiptData: data,
            currentStep: 7
        }));
    }, []);

    const setEncargadoId = useCallback((id: string) => {
        setFlowState(prev => ({
            ...prev,
            encargadoId: id
        }));
    }, []);

    const setPersonalIds = useCallback((ids: string[]) => {
        setFlowState(prev => ({
            ...prev,
            personalIds: ids
        }));
    }, []);

    const nextStep = useCallback(() => {
        setFlowState(prev => ({
            ...prev,
            currentStep: Math.min(prev.currentStep + 1, prev.totalSteps)
        }));
    }, []);

    const prevStep = useCallback(() => {
        setFlowState(prev => ({
            ...prev,
            currentStep: Math.max(prev.currentStep - 1, 1)
        }));
    }, []);

    const resetFlow = useCallback(() => {
        setFlowState({
            currentStep: 1,
            totalSteps: 6,
        });
    }, []);

    const getFlowState = useCallback(() => flowState, [flowState]);

    return {
        setSelectedEvent,
        setCompanyData,
        setLogoData,
        setEncargadoData,
        setPersonalData,
        setReceiptData,
        setEncargadoId,
        setPersonalIds,
        nextStep,
        prevStep,
        resetFlow,
        getFlowState,
    };
};
