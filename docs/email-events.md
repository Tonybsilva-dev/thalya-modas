# E-mails transacionais — mapa de integração futura

Decisão de 27/10/2026: não implementar transporte nem envio de e-mails nesta etapa. Nenhum evento abaixo confirma entrega. Recuperação tem contrato e regras de código, mas a experiência por e-mail depende desta integração futura. Códigos de debug aparecem somente em testes automatizados.

| Evento | Destinatário | Motivo | Momento | Situação |
| --- | --- | --- | --- | --- |
| Cadastro de usuário proprietário | Novo usuário | Confirmar recebimento do cadastro e orientar ativação | Após persistir usuário/onboarding | Envio pendente |
| Verificação de e-mail | Novo usuário | Comprovar posse do endereço, se exigida pela política futura | Após cadastro ou alteração de endereço | Política e envio pendentes; não bloquear com verificação inexistente |
| Recuperação de senha | Dono do endereço existente e ativo | Entregar código temporário de 10 minutos | Após persistir solicitação válida | Ponto de extensão no use case; sem transporte |
| Reenvio de recuperação | Mesmo usuário | Substituir código e permitir retomada após cooldown | Após invalidar código anterior e persistir novo | Ponto de extensão no use case; sem transporte |
| Senha redefinida | Dono da conta | Avisar alteração e orientar suporte em caso de fraude | Após redefinição e revogação das sessões | Envio pendente |
| Encerramento global de sessões | Dono da conta | Confirmar uma ação de segurança solicitada e orientar suporte se não a reconhecer | Após revogação confirmada no servidor, respeitando limites antiabuso | Notificação futura; nenhum envio nesta etapa |
| Bloqueio de tentativas de acesso | Dono da conta, conforme política antiabuso | Alertar atividade suspeita sem permitir spam por atacante | Após avaliação de abuso; não a cada erro | Política e envio pendentes |
| Onboarding concluído | Proprietário da empresa | Confirmar dados da loja e indicar escolha do plano | Após conclusão persistida | Envio pendente |
| Starter confirmado | Proprietário | Confirmar ativação do acesso operacional | Após confirmação persistida | Envio pendente; não é comprovante de cobrança |
| Convite de funcionário | Funcionário convidado | Permitir aceitar vínculo e definir credencial própria | Após convite persistido | Convites e envio pendentes; cadastro administrativo atual não envia senha |
| Conta suspensa/reativada | Titular | Comunicar mudança de acesso e canal de suporte | Após alteração administrativa auditada | Envio pendente |
| Cadastro de cliente comercial | Cliente, somente quando solicitado | Compartilhar confirmação ou acesso futuro | Conforme consentimento e recurso solicitado | Cadastro não exige login nem dispara e-mail automaticamente |

## Operações comerciais e financeiras

| Evento futuro | Destinatário | Por que e quando |
| --- | --- | --- |
| Venda concluída | Cliente identificado, quando solicitado | Compartilhar resumo do pedido, itens e condições após commit; não é documento fiscal |
| Parcelas criadas | Cliente com contato autorizado | Informar pedido de origem, valores e vencimentos após commit da venda |
| Vencimento próximo | Cliente com contato autorizado | Lembrar obrigação acordada conforme política de antecedência, sem repetição por acesso à tela |
| Parcela em atraso | Cliente com contato autorizado | Informar saldo após vencimento e orientar regularização; avaliar saldo novamente antes de enviar |
| Recebimento confirmado | Cliente identificado | Entregar referência do pagamento e saldo restante após commit, inclusive em pagamento parcial |
| Pedido cancelado sem recebimentos | Cliente identificado | Explicar cancelamento e retirada das parcelas da conta após commit |
| Caixa fechado com diferença | Responsável financeiro da filial | Permitir conferência do esperado, contado e motivo, após fechamento persistido |

Essas linhas são um inventário de integração: não existe worker, envio, agendamento ou promessa de entrega nesta implementação. Não enviar dados financeiros a endereço sem identificação/autorização e não usar carregamento de página como gatilho. Futuramente, produzir evento/outbox na mesma transação, com idempotência e destinatário revalidado.

## Contrato futuro

Usar outbox transacional com chave idempotente por evento, fila com retentativas limitadas, worker monitorado e tratamento de falhas. Registrar template, evento, destinatário protegido e situação de entrega; nunca código, senha ou token em logs. Sucesso HTTP da solicitação de recuperação não deve revelar se o endereço existe. Não expor credenciais de funcionários por e-mail.
