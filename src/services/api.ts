import { Message } from "../types";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

interface MedicalRecordData {
  patientName: string;
  symptoms: string;
  medicalHistory: string;
  recommendation: string;
  specialtyReferral?: string;
  emergencyReferral: boolean;
  summary: string;
  conversationHistory: Message[];
}

/**
 * Salva um prontuário médico no banco de dados
 */
export const saveMedicalRecord = async (
  data: MedicalRecordData
): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/medical-records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro ao salvar prontuário: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao salvar prontuário:", error);
    throw error;
  }
};

/**
 * Busca todos os prontuários médicos
 */
export const getAllMedicalRecords = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/medical-records`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar prontuários: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar prontuários:", error);
    throw error;
  }
};

/**
 * Busca um prontuário médico por ID
 */
export const getMedicalRecordById = async (id: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/medical-records/${id}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar prontuário: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar prontuário:", error);
    throw error;
  }
};

/**
 * Busca prontuários médicos por nome do paciente
 */
export const getMedicalRecordsByPatientName = async (
  name: string
): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/medical-records/patient/${name}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar prontuários: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar prontuários:", error);
    throw error;
  }
};
