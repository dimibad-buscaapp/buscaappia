export interface ApkCatalogItem {
  id: string;
  name: string;
  sourceApk: string;
  extractedFolder: string;
  packageName?: string;
  category: 'ai_chat' | 'image_tool' | 'assistant';
  materialUse: string;
  keywords: string[];
  preserveModifiedState: boolean;
}

export const APK_CATALOG: ApkCatalogItem[] = [
  {
    id: 'ai-chat-premium-v60',
    name: 'AI Chat Premium V60 [Tekmods]',
    sourceApk: 'AI Chat Premium V60 [Tekmods].apk',
    extractedFolder: 'AI Chat Premium V60 [Tekmods]',
    packageName: 'starnest.aichat.aichatbot.assistant',
    category: 'ai_chat',
    materialUse: 'Base principal para chat IA premium, assistente geral e fluxo de conversa.',
    keywords: ['chat', 'ia', 'assistente', 'bot', 'premium', 'conversa', 'mensagem'],
    preserveModifiedState: true
  },
  {
    id: 'chat-smith-premium-v8-251013-1',
    name: 'Chat Smith Premium v8.251013.1 [Tekmods]',
    sourceApk: 'Chat Smith Premium v8.251013.1 [Tekmods].apk',
    extractedFolder: 'Chat Smith Premium v8.251013.1 [Tekmods]',
    category: 'ai_chat',
    materialUse: 'Referência para interface de chat, geração de textos e prompts de produtividade.',
    keywords: ['chat', 'prompt', 'texto', 'copy', 'escrever', 'produtividade', 'smith'],
    preserveModifiedState: true
  },
  {
    id: 'chaton-1-70-564',
    name: 'ChatOn_1.70.564-638_@leidehmodds_[PREMIUM]_',
    sourceApk: 'ChatOn_1.70.564-638_@leidehmodds_[PREMIUM]_.apk',
    extractedFolder: 'ChatOn_1.70.564-638_@leidehmodds_[PREMIUM]_',
    category: 'ai_chat',
    materialUse: 'Referência para onboarding, chat mobile e recursos premium de conversação.',
    keywords: ['chaton', 'chat', 'mobile', 'premium', 'onboarding', 'conversa'],
    preserveModifiedState: true
  },
  {
    id: 'copilot-pro-v30-0-431015001',
    name: 'Copilot Pro v30.0.431015001 [Tekmods]',
    sourceApk: 'Copilot Pro v30.0.431015001 [Tekmods].apk',
    extractedFolder: 'Copilot Pro v30.0.431015001 [Tekmods]',
    category: 'assistant',
    materialUse: 'Referência para assistente de código, produtividade e automação guiada.',
    keywords: ['copilot', 'codigo', 'código', 'programar', 'dev', 'automacao', 'automação', 'produtividade'],
    preserveModifiedState: true
  },
  {
    id: 'dreamface-v6-13-0-mod',
    name: 'DreamFace V6.13.0 Mod',
    sourceApk: 'DreamFace V6.13.0 Mod.apk',
    extractedFolder: 'DreamFace V6.13.0 Mod',
    category: 'image_tool',
    materialUse: 'Referência para recursos visuais, rosto, avatar, imagem e edição criativa.',
    keywords: ['foto', 'imagem', 'face', 'rosto', 'avatar', 'video', 'vídeo', 'dreamface'],
    preserveModifiedState: true
  },
  {
    id: 'grok-ai-mod-v1-1-04',
    name: 'Grok AI Mod v1.1.04',
    sourceApk: 'Grok AI Mod v1.1.04.apk',
    extractedFolder: 'Grok AI Mod v1.1.04',
    category: 'ai_chat',
    materialUse: 'Referência para chat direto, respostas rápidas e experiência estilo Grok.',
    keywords: ['grok', 'chat', 'rapido', 'rápido', 'resposta', 'ia', 'conversa'],
    preserveModifiedState: true
  },
  {
    id: 'remover-fundo-fotos-pro-v2-292-90',
    name: 'Remover fundo de fotos Pro v2.292.90 [Tekmods]',
    sourceApk: 'Remover fundo de fotos Pro v2.292.90 [Tekmods].apk',
    extractedFolder: 'Remover fundo de fotos Pro v2.292.90 [Tekmods]',
    category: 'image_tool',
    materialUse: 'Referência para remoção de fundo, recorte de imagem e ferramentas de foto.',
    keywords: ['remover fundo', 'fundo', 'foto', 'imagem', 'recorte', 'background', 'editar imagem'],
    preserveModifiedState: true
  }
];
