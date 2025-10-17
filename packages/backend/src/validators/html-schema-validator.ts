import type { Frame } from 'puppeteer';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
}

export class HTMLSchemaValidator {
  async validate(frame: Frame): Promise<SchemaValidationResult> {
    const errors: string[] = [];

    try {
      // Verificar se o elemento principal existe
      const mainList = await frame.$('#listaHorarios');
      if (!mainList) {
        errors.push('Elemento #listaHorarios não encontrado');
        return { isValid: false, errors };
      }

      // Executar validações estruturais no contexto do frame
      const validationResult = await frame.evaluate(() => {
        const validationErrors: string[] = [];
        const eventElements = document.querySelectorAll('#listaHorarios > li');

        if (eventElements.length === 0) {
          validationErrors.push('Nenhum evento encontrado em #listaHorarios > li');
          return validationErrors;
        }

        eventElements.forEach((eventElement, index) => {
          // Validar título do evento
          const titleElement = eventElement.querySelector('.tituloDoTipo');
          if (!titleElement) {
            validationErrors.push(`Evento ${index + 1}: elemento .tituloDoTipo não encontrado`);
          }

          // Validar estrutura da tabela
          const table = eventElement.querySelector('table');
          if (!table) {
            validationErrors.push(`Evento ${index + 1}: elemento table não encontrado`);
            return;
          }

          const tbody = table.querySelector('tbody');
          if (!tbody) {
            validationErrors.push(`Evento ${index + 1}: elemento tbody não encontrado`);
            return;
          }

          const rows = tbody.querySelectorAll('tr');
          if (rows.length === 0) {
            validationErrors.push(`Evento ${index + 1}: nenhuma linha encontrada na tabela`);
            return;
          }

          // Validar cabeçalho (primeira linha)
          const headerRow = rows[0];
          const headerCells = headerRow.querySelectorAll('th');
          if (headerCells.length < 4) {
            validationErrors.push(
              `Evento ${index + 1}: cabeçalho deve ter pelo menos 4 colunas (encontrado: ${headerCells.length})`
            );
          }

          // Validar pelo menos uma linha de dados
          const dataRows = Array.from(rows).slice(1);
          if (dataRows.length === 0) {
            validationErrors.push(`Evento ${index + 1}: nenhuma linha de dados encontrada`);
            return;
          }

          // Validar estrutura das linhas de dados
          dataRows.forEach((row, rowIndex) => {
            const thCells = row.querySelectorAll('th');
            const regex = /^\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*(.+?)\s*$/;
            if (thCells.length && regex.test(thCells[0].textContent)) {
              return;
            }

            const cells = row.querySelectorAll('td');
            if (cells.length < 4) {
              validationErrors.push(
                `Evento ${index + 1}, linha ${rowIndex + 1}: deve ter pelo menos 4 colunas (encontrado: ${cells.length})`
              );
              return;
            }

            // Validar que a primeira célula tem um link
            const linkElement = cells[0].querySelector('a');
            if (!linkElement) {
              validationErrors.push(
                `Evento ${index + 1}, linha ${rowIndex + 1}: link do curso não encontrado na primeira coluna`
              );
            }
          });
        });

        return validationErrors;
      });

      errors.push(...validationResult);
    } catch (error) {
      errors.push(`Erro durante validação: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
