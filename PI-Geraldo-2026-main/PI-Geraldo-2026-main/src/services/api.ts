/**
 * Camada de acesso a dados.
 *
 * Enquanto o back-end não está pronto, todas as funções usam os dados de
 * `src/mocks`. Quando a API existir, basta trocar a implementação de cada
 * função por uma chamada `http(...)` mantendo as mesmas assinaturas — as
 * páginas não precisam mudar.
 */
import { db, salvarDb } from '../mocks/data'
import type {
  DadosCadastro,
  FiltrosBusca,
  Match,
  Mensagem,
  Perfil,
  PerfilInvestidor,
  PerfilStartup,
  ResumoAtividade,
} from '../types'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

// Helper para quando a API real estiver disponível.
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  
  if (!res.ok) {
    // Tenta extrair a mensagem de erro exata que nosso authController.ts enviou
    const erroJson = await res.json().catch(() => ({}));
    throw new Error(erroJson.error || `Erro ${res.status} em ${path}`);
  }
  
  return res.json() as Promise<T>
}

const esperar = (ms = 250) => new Promise((r) => setTimeout(r, ms))
const novoId = () => crypto.randomUUID()
const perfilPorId = (id: string) => db.perfis.find((p) => p.id === id)

// ---------- Autenticação ----------

// Nova função de login apontando para o seu Back-end real
export async function login(email: string, senha: string): Promise<Perfil> {
  const resposta = await http<{ token: string } & Perfil>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });

  // Salva o token JWT localmente para as próximas requisições
  if (resposta.token) {
    localStorage.setItem('token', resposta.token);
  }

  // Devolve o perfil para o AuthContext entrar no Dashboard
  return resposta;
}

export async function cadastrar(dados: DadosCadastro): Promise<Perfil> {
  // A validação de e-mail duplicado e a criação de ID agora acontecem no back-end.
  const resposta = await http<{ token: string } & Perfil>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

  // Salva o token JWT retornado pelo back-end no navegador para manter o usuário logado
  if (resposta.token) {
    localStorage.setItem('token', resposta.token);
  }

  return resposta;
}

export async function atualizarPerfil(perfil: Perfil): Promise<Perfil> {
  const resposta = await http<{ message: string, perfil: Perfil }>('/perfil', {
    method: 'PUT',
    body: JSON.stringify(perfil),
  });
  
  return resposta.perfil;
} 

// ---------- Busca ----------

/** Investidores buscam startups e vice-versa. */
export async function buscar(usuario: Perfil, filtros: FiltrosBusca): Promise<Perfil[]> {
  return await http<Perfil[]>('/buscar', {
    method: 'POST',
    body: JSON.stringify(filtros),
  });
}

/** Localizações existentes, para o filtro "Todos os locais". */
export async function listarLocalizacoes(papel: Perfil['papel']): Promise<string[]> {
  await esperar(50)
  const alvo = papel === 'investidor' ? 'startup' : 'investidor'
  return [...new Set(db.perfis.filter((p) => p.papel === alvo).map((p) => p.localizacao))].sort()
}

/** Recomendações calculadas pelo algoritmo de compatibilidade no backend. */
export async function recomendacoes(usuario: Perfil, limite = 4): Promise<Perfil[]> {
  try {
    const resultados = await http<Perfil[]>('/recomendacoes', {
      method: 'GET'
    });
    
    return resultados.slice(0, limite);
  } catch (error) {
    console.error("Erro ao buscar recomendações:", error);
    return [];
  }
}

// ---------- Interesses e matches ----------

/** Registra interesse. Se o outro lado já tinha registrado, cria e retorna o match. */
export async function registrarInteresse(deId: string, paraId: string): Promise<Match | null> {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) return null;
  
  const usuario = JSON.parse(usuarioStr);
  
  const id_startup = usuario.papel === 'startup' ? deId : paraId;
  const id_investidor = usuario.papel === 'investidor' ? deId : paraId;
  
  try {
    await http('/match/interesse', {
      method: 'POST',
      body: JSON.stringify({
        id_startup: id_startup,
        id_investidor: id_investidor,
        iniciado_por: usuario.papel,
        mensagem: 'Olá! Vi seu perfil na plataforma e gostaria de conectar.'
      })
    });
    
    return null;
    
  } catch (error) {
    // Se o backend devolver erro (como "já registrado"), tentamos forçar o Match definitivo!
    console.log("Possível interesse mútuo detectado. Tentando gerar match...");
    const matchRealizado = await aceitarPendente(paraId);
    return matchRealizado;
  }
}

/** Nova função: Aceita um interesse pendente e gera o Match no Back-end */
export async function aceitarPendente(alvoId: string): Promise<Match | null> {
  try {
     const resposta = await http<{ match: Match }>('/match/aceitar', {
        method: 'POST',
        body: JSON.stringify({ alvoId })
     });
     return resposta.match;
  } catch(e) {
     console.error("Erro ao aceitar match", e);
     return null;
  }
}

/** IDs em quem o usuário já registrou interesse. */
export async function interessesEnviados(usuarioId: string): Promise<string[]> {
  // O Front-end usava isso para não mostrar o botão em quem já demos like.
  // Temporariamente retornamos vazio. Numa futura melhoria, podemos criar a rota GET /match/enviados.
  return [];
}

/** Perfis que registraram interesse no usuário e ainda não viraram match. */
export async function interessesPendentes(usuarioId: string): Promise<Perfil[]> {
  // Chama a nova rota protegida do back-end
  return await http<Perfil[]>('/match/pendentes', { method: 'GET' });
}
export async function resumoAtividade(usuarioId: string): Promise<ResumoAtividade> {
  // Chama a nossa rota real do back-end para trazer as contagens do Dashboard
  return await http<ResumoAtividade>('/dashboard', {
    method: 'GET'
  });
}

export async function listarMatches(usuarioId: string): Promise<Array<{ match: Match; outro: Perfil }>> {
  try {
    return await http<Array<{ match: Match; outro: Perfil }>>('/match/listar', {
      method: 'GET'
    });
  } catch (error) {
    console.error("Erro ao listar matches:", error);
    return [];
  }
}

// ---------- Conversas ----------

// ---------- Conversas ----------

export async function listarMensagens(matchId: string): Promise<Mensagem[]> {
  try {
    return await http<Mensagem[]>(`/mensagens/${matchId}`, { method: 'GET' });
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
    return [];
  }
}

export async function enviarMensagem(matchId: string, autorId: string, texto: string): Promise<Mensagem> {
  return await http<Mensagem>('/mensagens', {
    method: 'POST',
    body: JSON.stringify({ matchId, texto })
  });
}

export async function buscarPerfilPorId(id: string): Promise<Perfil> {
  return await http<Perfil>(`/perfil/${id}`, {
    method: 'GET'
  });
}