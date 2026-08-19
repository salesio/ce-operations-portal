# Checklist de QA Manual: Supabase Runtime & Visibilidade de Membros

## Objectivo
Validar que os 1896 membros existentes no Supabase staging/live são carregados e exibidos correctamente no portal, com paginação funcional, filtros por igreja/célula, visualização de perfis, e diagnósticos de runtime sem fugas de credenciais.

---

## 1. Verificação de Diagnósticos no DevTools Console (F12)

Abra o DevTools (`F12`) na consola do navegador e execute:

### 1.1 `window.CERuntime.getInfo()`
**Saída esperada**:
```json
{
  "environment": "production",
  "dataSource": "supabase",
  "supabaseEnabled": true,
  "realAuthEnabled": false,
  "supabaseConfigured": true,
  "urlHost": "kmurqbgpybrolrrumiue.supabase.co",
  "buildVersion": "2026.08.19-members-runtime-fix",
  "buildTimestamp": "2026-08-19T08:30:00.000Z",
  "authStatus": "demo_mode"
}
```
* **Critério de Aceitação**: Nenhuma chave secreta (`sb_publishable_...` ou `service_role`) deve ser visível no retorno.

### 1.2 `window.CESupabase.getInfo()`
**Saída esperada**:
```json
{
  "status": "ready",
  "configured": true,
  "connected": true,
  "urlConfigured": true,
  "authSessionPresent": false,
  "dataSource": "supabase",
  "version": "2026.08.19-members-runtime-fix",
  "enabled": true,
  "hasUrl": true,
  "hasAnonKey": true,
  "urlHost": "kmurqbgpybrolrrumiue.supabase.co",
  "usingServiceRole": false
}
```

### 1.3 `window.CEMembers.getInfo()`
**Saída esperada**:
```json
{
  "dataSource": "supabase",
  "repository": "membersSupabaseAdapter",
  "fallbackUsed": false,
  "lastQuery": { "page": 1, "pageSize": 50 },
  "lastError": null,
  "lastRowsReturned": 50,
  "version": "2026.08.19-members-runtime-fix",
  "via": "CESupabase",
  "ready": true,
  "fallback": false
}
```
* **Critério de Aceitação**: `fallbackUsed` deve ser `false`. `dataSource` deve ser `"supabase"`.

---

## 2. Verificação de Rede (Network Tab)

1. No DevTools, abra o separador **Network** (Rede).
2. Filtre por `rest/v1/members`.
3. Recarregue a página ou navegue até ao módulo **Membros**.
4. **Verificações**:
   - URL do pedido: `https://kmurqbgpybrolrrumiue.supabase.co/rest/v1/members?select=...&order=full_name.asc&offset=0&limit=50`
   - Headers: `Prefer: count=exact` e `apikey: <anon-key>`
   - Status Code: `200 OK` ou `206 Partial Content`
   - Content-Range header: `0-49/1896`

---

## 3. Testes Funcionais da Interface de Membros

### 3.1 Carregamento da Página 1
- Navegar para `/#members`.
- Verificar se a tabela exibe 50 linhas com nomes completos, telefones, igreja e células.
- Verificar rodapé de paginação: `"1896 membros · Página 1 / 38"`.

### 3.2 Navegação entre Páginas (Paginação)
- Clicar no botão **Próximo** (`Next`).
- Verificar se a Página 2 carrega os membros de 51 a 100 sem recarregar a página inteira.
- O rodapé deve atualizar para `"1896 membros · Página 2 / 38"`.
- Clicar no botão **Anterior** (`Previous`) e confirmar o regresso à Página 1.

### 3.3 Alteração do Tamanho da Página (Page Size: 25 / 50 / 100)
- No seletor de tamanho de página, alterar para `25`:
  - A tabela deve renderizar 25 membros.
  - O rodapé deve indicar `"1896 membros · Página 1 / 76"`.
- Alterar para `100`:
  - A tabela deve renderizar 100 membros.
  - O rodapé deve indicar `"1896 membros · Página 1 / 19"`.

### 3.4 Filtro por Igreja (Scoping Sede)
- No filtro de igrejas, selecionar `E.C. Maputo Central - Sede`.
- O pedido de rede deve enviar `church_id=eq.a1111111-1111-4111-8111-111111111101` ou busca normalizada.
- A contagem de membros correspondentes deve ser exibida.

### 3.5 Pesquisa por Nome / Telefone
- No campo de pesquisa, digitar pelo menos 2 caracteres (ex: `"Kene"` ou `"84"`).
- O pedido de rede deve conter o parâmetro `or=(full_name.ilike.%...%,...)`.
- Os resultados correspondentes devem ser filtrados com precisão.

### 3.6 Abertura de Perfil do Membro (Drawer)
- Clicar numa linha de membro ou no botão de detalhes.
- O Drawer lateral deve abrir exibindo:
  - Nome completo e título/tratamento
  - Contactos (telefone primário, secundário, WhatsApp, e-mail)
  - Filiação eclesiástica (Igreja, Grupo de Célula, Célula, Departamento)
  - Histórico e notas de reconciliação

---

## 4. Teste de Resiliência e Strict Mode (Tratamento de Erros)

1. Simular falha de rede (ex: modo Offline no DevTools).
2. Tentar mudar de página de membros.
3. **Comportamento Esperado**:
   - A interface exibe aviso claro: `"Não foi possível carregar membros do Supabase."`
   - O botão **Tentar novamente** fica disponível.
   - O sistema **NÃO** faz fallback silencioso para os 2 membros mock locais.
   - `window.CEMembers.getInfo().fallbackUsed` permanece `false` e `lastError` indica a causa.
