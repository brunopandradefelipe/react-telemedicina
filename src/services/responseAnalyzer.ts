interface AnalysisResult {
  isConsultationEnding: boolean;
  specialtyReferral: string;
  isEmergency: boolean;
  summary: string;
}

/**
 * Analisa a resposta do assistente para identificar se a consulta está sendo encerrada
 * e se há encaminhamento para especialidade ou emergência
 */
export const analyzeAssistantResponse = (response: string): AnalysisResult => {
  const result: AnalysisResult = {
    isConsultationEnding: false,
    specialtyReferral: "",
    isEmergency: false,
    summary: "",
  };

  // Converte para minúsculas para facilitar a análise
  const lowerResponse = response.toLowerCase();

  // Verifica se há indicação de encaminhamento para especialidade
  const specialtyPatterns = [
    /encaminh[a-z]+ (para|ao|à) ([a-zçáàâãéèêíìîóòôõúùû\s]+)(ist[a])/i,
    /consult[a-z]+ com ([a-zçáàâãéèêíìîóòôõúùû\s]+)(ist[a])/i,
    /especialista em ([a-zçáàâãéèêíìîóòôõúùû\s]+)/i,
  ];

  for (const pattern of specialtyPatterns) {
    const match = response.match(pattern);
    if (match) {
      // Extrai a especialidade do match
      const specialty = match[0];
      result.specialtyReferral = specialty;
      result.isConsultationEnding = true;
      break;
    }
  }

  // Verifica se há indicação de emergência
  const emergencyPatterns = [
    /192/,
    /emergência/i,
    /urgência/i,
    /samu/i,
    /imediatamente/i,
    /hospital/i,
    /pronto[\s-]socorro/i,
    /pronto[\s-]atendimento/i,
    /upa/i,
  ];

  for (const pattern of emergencyPatterns) {
    if (pattern.test(lowerResponse)) {
      result.isEmergency = true;
      result.isConsultationEnding = true;
      break;
    }
  }

  // Se a consulta está sendo encerrada, gera um resumo
  if (result.isConsultationEnding) {
    result.summary = generateSummary(response);
  }

  return result;
};

/**
 * Gera um resumo da consulta com base na resposta final do assistente
 */
const generateSummary = (response: string): string => {
  // Extrai informações relevantes da resposta
  let summary = "Resumo da Consulta:\n\n";

  // Tenta identificar sintomas mencionados
  const symptomsMatch = response.match(/sintomas?[:\s]+([^.]+)/i);
  if (symptomsMatch) {
    summary += `Sintomas: ${symptomsMatch[1].trim()}\n\n`;
  }

  // Tenta identificar recomendações
  const recommendationMatch = response.match(/recomend[o|amos][:\s]+([^.]+)/i);
  if (recommendationMatch) {
    summary += `Recomendação: ${recommendationMatch[1].trim()}\n\n`;
  }

  // Adiciona o encaminhamento
  if (response.includes("encaminh")) {
    const referralMatch = response.match(/encaminh[a-z]+ [^.]+/i);
    if (referralMatch) {
      summary += `Encaminhamento: ${referralMatch[0].trim()}\n\n`;
    }
  }

  // Se não conseguiu extrair informações específicas, usa a resposta completa
  if (summary === "Resumo da Consulta:\n\n") {
    summary += `Observações: ${response}\n\n`;
  }

  return summary;
};
