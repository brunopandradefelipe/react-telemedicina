import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Nota: Em produção, as chamadas devem ser feitas através do backend
});

export const chatWithAssistant = async (
  messages: { role: "user" | "assistant"; content: string }[]
) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente médico virtual realizando uma triagem inicial. Seu nome é lucilta. Colete informações importantes do paciente de maneira profissional e empática. Faça perguntas relevantes sobre sintomas e histórico médico. Faça no maximo 3 perguntas, caso não seja necessario encerre o atendimento. Antes de encerrar diga que vai encaminhar para um medico especialista para um atendimento mais detalhado. E informe a especialidade do medico que vai atender o paciente. Caso o atendimento seja complexo tipo coisas extremamente graves, encerre o atendimento e encaminhe para o numero de emergencia 192 ou encaminhe para uma unidade de atendimento medico mais proxima.",
        },
        ...messages,
      ],
      model: "gpt-3.5-turbo",
      max_completion_tokens: 200,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao chamar a API do OpenAI:", error);
    throw error;
  }
};
