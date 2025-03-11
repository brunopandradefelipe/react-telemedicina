import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Container, CircularProgress, Alert } from '@mui/material';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { chatWithAssistant } from '../services/openai';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const VirtualConsultation: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Referências para controle de estados
  const lastSignificantTranscriptRef = useRef("");
  const currentTranscriptRef = useRef("");
  const transcriptStableTimeRef = useRef<number>(Date.now());
  const lastTranscriptLengthRef = useRef(0);
  const stableTranscriptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveNoiseCountRef = useRef(0);
  const recentTranscriptHistoryRef = useRef<string[]>([]);
  
  const { 
    transcript, 
    resetTranscript, 
    listening,
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition();

  // Constantes otimizadas para detecção automática - AJUSTADAS
  const SILENCE_THRESHOLD = 2000; // 2.0 segundos de silêncio para finalizar
  const MIN_SPEECH_LENGTH = 3; // REDUZIDO: Mínimo de caracteres para considerar como fala real (era 5)
  const SIGNIFICANT_CHANGE_THRESHOLD = 5; // REDUZIDO: Mudança significativa (era 8)
  const MAX_NOISE_COUNT = 3; // Máximo de ruídos consecutivos antes de resetar
  const INACTIVE_RESET_TIME = 10000; // 10 segundos sem atividade para resetar o estado

  useEffect(() => {
    console.log('[INICIALIZAÇÃO] Componente de Consulta Virtual inicializado');
    
    // Mensagem inicial do assistente
    setMessages([
      {
        role: 'assistant',
        content: 'Olá! Sou seu assistente virtual de triagem médica. Por favor, me diga seu nome para começarmos.'
      }
    ]);
    console.log('[CHAT] Mensagem inicial do assistente adicionada');
    
    // Iniciar reconhecimento de voz automaticamente
    startListening();
    
    // Configurar timer de inatividade
    setInactivityTimer();
    
    return () => {
      console.log('[CLEANUP] Limpando recursos do componente');
      if (stableTranscriptTimerRef.current) clearTimeout(stableTranscriptTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      SpeechRecognition.stopListening();
      console.log('[SPEECH] Reconhecimento de voz interrompido durante cleanup');
    };
  }, []);

  // Configurar timer de inatividade para resetar o estado
  const setInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    
    inactivityTimerRef.current = setTimeout(() => {
      console.log('[INATIVIDADE] Verificando inatividade após', INACTIVE_RESET_TIME/1000, 'segundos');
      if (!isSpeaking && transcript.trim().length === 0) {
        // Reset após período de inatividade
        consecutiveNoiseCountRef.current = 0;
        recentTranscriptHistoryRef.current = [];
        resetTranscript();
        console.log('[INATIVIDADE] Reset realizado por inatividade');
      }
      setInactivityTimer(); // Reiniciar o timer
    }, INACTIVE_RESET_TIME);
  };

  // Monitor de mudanças no transcript 
  useEffect(() => {
    if (!listening) {
      console.log('[SPEECH] Não está escutando ativamente');
      return;
    }
    
    currentTranscriptRef.current = transcript;
    
    // Verificar se houve mudança significativa desde a última verificação
    const currentLength = transcript.trim().length;
    const previousLength = lastTranscriptLengthRef.current;
    const lengthChange = Math.abs(currentLength - previousLength);
    
    console.log(`[SPEECH] Transcript atualizado - Comprimento: ${currentLength}, Mudança: ${lengthChange}`);
    
    // Lógica para determinar se é fala genuína ou ruído
    if (currentLength > 0) {
      // Se for uma mudança significativa (fala genuína)
      if (lengthChange >= SIGNIFICANT_CHANGE_THRESHOLD || currentLength >= MIN_SPEECH_LENGTH * 2) {
        // Armazenar histórico recente para analisar padrões
        recentTranscriptHistoryRef.current.push(transcript);
        if (recentTranscriptHistoryRef.current.length > 5) {
          recentTranscriptHistoryRef.current.shift();
        }
        
        // Se não estava falando antes, agora está
        if (!isSpeaking && currentLength >= MIN_SPEECH_LENGTH) {
          setIsSpeaking(true);
          console.log('[SPEECH] Início de fala detectado');
        }
        
        transcriptStableTimeRef.current = Date.now();
        lastSignificantTranscriptRef.current = transcript;
        consecutiveNoiseCountRef.current = 0;
        
        // Cancelar qualquer timer pendente quando há atividade genuína
        if (stableTranscriptTimerRef.current) {
          clearTimeout(stableTranscriptTimerRef.current);
          stableTranscriptTimerRef.current = null;
          console.log('[SPEECH] Timer de estabilidade cancelado devido a mudança significativa');
        }
      } 
      // Se for uma mudança pequena, mas persistente
      else if (lengthChange > 0 && lengthChange < SIGNIFICANT_CHANGE_THRESHOLD) {
        consecutiveNoiseCountRef.current += 1;
        console.log(`[SPEECH] Mudança pequena detectada - Contador de ruído: ${consecutiveNoiseCountRef.current}`);
        
        // Se detectarmos ruído consistente sem fala significativa, ignoramos
        if (consecutiveNoiseCountRef.current > MAX_NOISE_COUNT && !isSpeaking) {
          resetTranscript();
          consecutiveNoiseCountRef.current = 0;
          console.log('[SPEECH] Ruído excessivo detectado, transcript resetado');
        }
      }
    }
    
    lastTranscriptLengthRef.current = currentLength;
    
    // Verificar se é momento de finalizar a fala
    if (isSpeaking && transcript.trim().length > MIN_SPEECH_LENGTH) {
      if (stableTranscriptTimerRef.current) {
        clearTimeout(stableTranscriptTimerRef.current);
        console.log('[SPEECH] Timer anterior de estabilidade cancelado');
      }
      
      console.log('[SPEECH] Configurando timer de estabilidade para detecção de silêncio');
      stableTranscriptTimerRef.current = setTimeout(() => {
        const timeSinceLastSignificantChange = Date.now() - transcriptStableTimeRef.current;
        console.log(`[SPEECH] Verificando estabilidade - Tempo desde última mudança: ${timeSinceLastSignificantChange}ms`);
        
        // Se o transcript permaneceu estável pelo período do threshold
        if (timeSinceLastSignificantChange >= SILENCE_THRESHOLD) {
          // Análise de qualidade da fala antes de processar
          const cleanedTranscript = transcript.trim();
          console.log(`[SPEECH] Transcript estável detectado: "${cleanedTranscript}"`);
          
          // MODIFICADO: Verificação menos rigorosa para fala significativa
          const isMeaningfulSpeech = 
            cleanedTranscript.length >= MIN_SPEECH_LENGTH * 2 && // Comprimento mínimo
            containsWordLikePattern(cleanedTranscript); // Parece conter palavras reais
          
          // Log adicional para ajudar na depuração da validação
          console.log(`[SPEECH] Análise de fala: Comprimento mínimo: ${cleanedTranscript.length >= MIN_SPEECH_LENGTH * 2}, 
                      Contém padrão de palavra: ${containsWordLikePattern(cleanedTranscript)}`);
          
          if (isMeaningfulSpeech) {
            console.log('[SPEECH] Fala significativa detectada, processando...');
            setIsSpeaking(false);
            processUserSpeech(cleanedTranscript);
          } else {
            // MODIFICADO: Se o texto contiver certas palavras-chave, considerar como significativo mesmo que não passe
            // nos critérios normais
            if (containsNameIndication(cleanedTranscript)) {
              console.log('[SPEECH] Fala contém indicação de nome, processando mesmo sem critérios completos...');
              setIsSpeaking(false);
              processUserSpeech(cleanedTranscript);
            } else {
              console.log('[SPEECH] Fala não significativa detectada, ignorando');
              resetTranscript();
              setIsSpeaking(false);
            }
          }
        }
      }, SILENCE_THRESHOLD);
    }
  }, [transcript, listening, isSpeaking]);

  // NOVA FUNÇÃO: Verifica se o texto contém indicações de nome
  const containsNameIndication = (text: string) => {
    const lowerText = text.toLowerCase();
    const nameIndicators = ['nome', 'chamo', 'sou o', 'sou a', 'me chamo', 'meu nome'];
    const hasNameIndicator = nameIndicators.some(indicator => lowerText.includes(indicator));
    
    console.log(`[SPEECH] Verificação de indicação de nome: ${hasNameIndicator}`);
    return hasNameIndicator;
  };

  // Verifica se o texto parece conter palavras reais (não apenas ruídos)
  const containsWordLikePattern = (text: string) => {
    // Textos muito curtos podem ser ruído
    if (text.length < MIN_SPEECH_LENGTH) return false;
    
    // Verificar se há padrões de palavra (vogais e consoantes intercaladas)
    const containsVowels = /[aeiouáàâãéèêíìîóòôõúùûç]/i.test(text);
    const containsConsonants = /[bcdfghjklmnpqrstvwxyz]/i.test(text);
    const containsSpaces = text.includes(' ');
    
    // MODIFICADO: Critério menos rigoroso para palavras reais
    const result = containsVowels && containsConsonants && (containsSpaces || text.length > 8);
    console.log(`[SPEECH] Análise de padrão de palavra: "${text}" - Resultado: ${result}`);
    return result;
  };

  const startListening = () => {
    try {
      console.log('[SPEECH] Iniciando reconhecimento de voz...');
      SpeechRecognition.startListening({ continuous: true, language: 'pt-BR' });
      console.log('[SPEECH] Reconhecimento de voz iniciado com sucesso');
    } catch (error) {
      console.error("[SPEECH] Erro ao iniciar o reconhecimento de voz:", error);
      
      // Tentar novamente após um curto atraso
      console.log('[SPEECH] Tentando reiniciar reconhecimento em 1 segundo...');
      setTimeout(() => {
        SpeechRecognition.startListening({ continuous: true, language: 'pt-BR' });
        console.log('[SPEECH] Reconhecimento de voz reiniciado após erro');
      }, 1000);
    }
  };

  const processUserSpeech = async (userTranscript: string) => {
    if (!userTranscript.trim()) {
      console.log('[PROCESS] Transcript vazio, ignorando processamento');
      return;
    }
    
    console.log(`[PROCESS] Iniciando processamento da fala: "${userTranscript}"`);
    
    // Adiciona a mensagem do usuário
    const userMessage: Message = {
      role: 'user',
      content: userTranscript
    };
    
    setMessages(prev => [...prev, userMessage]);
    console.log('[CHAT] Mensagem do usuário adicionada ao histórico');

    try {
      setIsLoading(true);
      console.log('[PROCESS] Estado de carregamento ativado');
      
      // Pausa o reconhecimento durante o processamento
      SpeechRecognition.stopListening();
      console.log('[SPEECH] Reconhecimento de voz pausado durante processamento');
      
      console.log('[CHAT] Enviando conversa para o assistente...');
      const response = await chatWithAssistant([...messages, userMessage]);
      console.log('[CHAT] Resposta recebida do assistente:', response);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response || 'Desculpe, não consegui processar sua mensagem.'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      console.log('[CHAT] Resposta do assistente adicionada ao histórico');
    } catch (error) {
      console.error('[CHAT] Erro ao processar mensagem:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
      };
      setMessages(prev => [...prev, errorMessage]);
      console.log('[CHAT] Mensagem de erro adicionada ao histórico');
    } finally {
      setIsLoading(false);
      console.log('[PROCESS] Estado de carregamento desativado');
      resetTranscript();
      lastSignificantTranscriptRef.current = "";
      lastTranscriptLengthRef.current = 0;
      consecutiveNoiseCountRef.current = 0;
      console.log('[PROCESS] Estado de reconhecimento resetado');
      
      // Reiniciar o reconhecimento após o processamento
      console.log('[SPEECH] Reiniciando reconhecimento após processamento');
      startListening();
    }
  };

  // Log quando o estado de escuta muda
  useEffect(() => {
    console.log(`[SPEECH] Estado de escuta alterado: ${listening ? 'ATIVO' : 'INATIVO'}`);
  }, [listening]);

  // Log quando o estado de fala muda
  useEffect(() => {
    console.log(`[SPEECH] Estado de fala alterado: ${isSpeaking ? 'FALANDO' : 'NÃO FALANDO'}`);
  }, [isSpeaking]);

  if (!browserSupportsSpeechRecognition) {
    console.log('[ERROR] Navegador não suporta reconhecimento de voz');
    return <Typography>Seu navegador não suporta reconhecimento de voz.</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Consulta Virtual
        </Typography>
        
        <Paper sx={{ p: 2, mb: 2, maxHeight: '400px', overflow: 'auto' }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                backgroundColor: message.role === 'assistant' ? '#f0f0f0' : '#e3f2fd',
                borderRadius: 2
              }}
            >
              <Typography>
                <strong>{message.role === 'assistant' ? 'Assistente:' : 'Você:'}</strong> {message.content}
              </Typography>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          )}
        </Paper>

        <Box sx={{ mb: 2 }}>
          {isSpeaking ? (
            <Alert severity="info">Ouvindo você falar...</Alert>
          ) : isLoading ? (
            <Alert severity="warning">Processando sua mensagem...</Alert>
          ) : (
            <Alert severity="success">Pode começar a falar. Sua voz será detectada automaticamente.</Alert>
          )}
        </Box>
        
        {transcript && (
          <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e8f5e9' }}>
            <Typography variant="body1">
              <strong>Transcrição em tempo real:</strong> {transcript}
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default VirtualConsultation;