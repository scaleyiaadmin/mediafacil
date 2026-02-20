import { toast } from "sonner";

interface EmailConfig {
    to: string;
    subject: string;
    html: string;
}

/**
 * Serviço de envio de e-mail.
 * Se a API Key do Resend estiver presente, tenta enviar de verdade.
 * Caso contrário, simula o envio no console.
 */
export async function sendEmail(config: EmailConfig): Promise<boolean> {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;

    if (!apiKey || apiKey === "re_123456789") {
        console.log(" [%SIMULAÇÃO EMAIL%] ");
        console.log(`Para: ${config.to}`);
        console.log(`Assunto: ${config.subject}`);
        console.log("Conteúdo:", config.html);
        console.log(" ------------------- ");

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: "Media Facil <contato@mediafacil.com.br>",
                to: [config.to],
                subject: config.subject,
                html: config.html,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erro ao enviar e-mail");
        }

        return true;
    } catch (error) {
        console.error("Erro no serviço de e-mail:", error);
        return false;
    }
}

export function generateBudgetRequestHtml(params: {
    fornecedorNome: string;
    responsavel: string;
    entidade: string;
    itens: any[];
    orcamentoNome?: string;
}) {
    const { fornecedorNome, responsavel, entidade, itens, orcamentoNome } = params;

    const itemsHtml = itens.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.nome}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantidade}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.unidade || 'unid'}</td>
    </tr>
  `).join('');

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
        <h1>Solicitação de Orçamento</h1>
        <p>${entidade}</p>
      </div>
      <div style="padding: 20px;">
        <p>Prezado(a) <strong>${fornecedorNome}</strong>,</p>
        <p>Estamos realizando uma cotação de preços para o orçamento <strong>${orcamentoNome || 'Não especificado'}</strong>.</p>
        <p>Gostaríamos de solicitar os valores para os seguintes itens:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left;">Item</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">Qtd</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">Und</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding: 15px; background-color: #f0f7ff; border-radius: 6px;">
          <p style="margin: 0;"><strong>Responsável:</strong> ${responsavel}</p>
          <p style="margin: 5px 0 0 0;">Por favor, envie sua proposta respondendo a este e-mail ou através da nossa plataforma.</p>
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>Média Fácil - Gestão Inteligente de Orçamentos Públicos</p>
      </div>
    </div>
  `;
}
