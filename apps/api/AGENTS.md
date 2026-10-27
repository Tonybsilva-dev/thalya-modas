# Isolamento empresarial obrigatório

Para toda implementação ou revisão de operações empresariais:

- Resolver empresa, filial e usuário no servidor, após autenticação e validação dos vínculos. Nunca aceitar tenantId, storeId ou userId do payload como autorização.
- Propagar contexto explícito de empresa/filial às camadas de aplicação e persistência. No catálogo, CatalogScope exige tenantId, storeId e userId; o repositório PostgreSQL verifica a relação filial/empresa.
- Manter o escopo no filtro final de UPDATE/DELETE, além das leituras. Não substituir uma gravação com escopo por uma gravação somente por id após validação anterior.
- Validar todos os vínculos recebidos: contato/fornecedor, produto/fornecedor, item/produto/pedido e recebimento/pedido/fornecedor. Pertencer à mesma empresa não autoriza misturar filiais.
- Não permitir mudar tenant/filial de um registro como edição comum. Transferências exigem fluxo específico, autorização e histórico.
- Preservar as garantias dos triggers SQL do catálogo. Novas tabelas e relações empresariais precisam de proteção equivalente e testes no PostgreSQL, além dos testes HTTP.
- Testar acesso entre tenants, entre filiais do mesmo tenant, payload com escopo forjado e vínculos estrangeiros, incluindo comprovação de que o registro original permanece intacto.
- Escopar caches, arquivos e futuros jobs ao contexto autorizado. O destino de storage não pode vir livremente do cliente.
- Acesso global de SUPER_ADMIN é uma exceção explícita de autorização. Não criar bypass genérico para perfis operacionais.

Autenticação pública, recuperação de senha e health checks têm escopos próprios; não exigir uma filial antes do cadastro/onboarding. RLS não está implementado: não confundir os triggers de integridade com isolamento de leitura no PostgreSQL. Consulte `../../docs/tenant-isolation.md` para cobertura e limites atuais.
