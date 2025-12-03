// Centralized bot logic for FlowPilot
window.FlowBot = (function(){
  function normalize(t){ return (t||'').toString().trim().toLowerCase(); }

  function isBotEmail(email){ if (!email) return false; const e=(email||'').toLowerCase(); return e.indexOf('help-bot')!==-1 || e.indexOf('assistente')!==-1 || e.indexOf('bot')!==-1; }

  function replyText(text, opts){
    const t = normalize(text);
    if (!t) return 'Olá — em que posso ajudar?';

    // simple keyword/rule based responses
    if (t.match(/^(oi|olá|ola|bom dia|boa tarde|boa noite)\b/)) return 'Olá! Eu sou o Assistente FlowPilot — em que posso ajudar hoje?';
    if (t.indexOf('cadastro')!==-1 || t.indexOf('cadastrar')!==-1 || t.indexOf('criar conta')!==-1) return 'Para criar uma conta, vá em Cadastro. Se preferir, posso abrir a tela de cadastro para você.';
    if (t.indexOf('login')!==-1 || t.indexOf('entrar')!==-1) return 'Se tiver problemas ao entrar, verifique seu email e senha. Posso ajudá-lo a redefinir a senha se necessário.';
    if (t.indexOf('avatar')!==-1 || t.indexOf('foto')!==-1) return 'Para alterar sua foto, acesse Meu Perfil e clique no lápis para editar — você pode fazer upload do avatar e do banner.';
    if (t.indexOf('plano')!==-1 || t.indexOf('preço')!==-1 || t.indexOf('premium')!==-1) return 'Nossos planos estão em Meus Planos — há opções Gratuita e Premium com recursos extras.';
    if (t.indexOf('suporte')!==-1 || t.indexOf('contato')!==-1) return 'Você pode nos contatar por email em Flowpilot.emp0@gmail.com ou abrir um ticket em nossa central de ajuda.';
    if (t.indexOf('obrig')!==-1 || t.indexOf('graç')!==-1) return 'Disponha! Fico feliz em ajudar.';

    // if the user asked a direct question (contains '?'), try to be helpful
    if (t.indexOf('?') !== -1) {
      return 'Boa pergunta — aqui está uma resposta rápida: ' + summarizeQuestion(t);
    }

    // fallback: try to echo contextually
    return 'Entendi: "' + text + '". Pode fornecer mais detalhes ou dizer como prefere que eu ajude?';
  }

  function summarizeQuestion(q){
    // very small heuristic: if contains keywords, return short guidance
    if (q.indexOf('como')!==-1 && q.indexOf('fazer')!==-1) return 'tente seguir o passo-a-passo na seção correspondente do app.';
    if (q.indexOf('onde')!==-1) return 'você encontra isso no menu principal ou na página indicada.';
    if (q.indexOf('por que')!==-1) return 'pode haver várias causas — verifique as configurações e, se persistir, envie um print para o suporte.';
    return 'aqui está uma orientação geral: descreva o objetivo e eu lhe direi os próximos passos.';
  }

  return { replyText, isBotEmail };
})();
