using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SiorApi.Data;
using SiorApi.Models;
using SiorApi.Dtos; // <-- Importante: O nosso DTO

namespace SiorApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrcamentosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrcamentosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/orcamentos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Orcamento>>> GetOrcamentos()
        {
            // Traz os orçamentos e inclui o Cliente de cada um
            return await _context.Orcamentos
                                 .Include(o => o.Cliente)
                                 .OrderByDescending(o => o.DataCriacao) // Mais recentes primeiro
                                 .ToListAsync();
        }

        // GET: api/orcamentos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Orcamento>> GetOrcamento(int id)
        {
            // Este é um GET complexo:
            // 1. Encontra o Orçamento pelo ID
            // 2. Inclui o Cliente
            // 3. Inclui a lista de Itens
            // 4. DENTRO de cada Item, inclui o Produto (para sabermos o nome)
            var orcamento = await _context.Orcamentos
                .Include(o => o.Cliente)
                .Include(o => o.Itens)
                    .ThenInclude(oi => oi.Produto) // "Então inclua" o Produto de cada Item
                .FirstOrDefaultAsync(o => o.OrcamentoID == id);

            if (orcamento == null)
            {
                return NotFound();
            }

            return orcamento;
        }

        // POST: api/orcamentos
        // Este é o método mais importante!
        [HttpPost]
        public async Task<ActionResult<Orcamento>> PostOrcamento(OrcamentoCreateDto orcamentoDto)
        {
            if (!orcamentoDto.Itens.Any())
            {
                return BadRequest("Um orçamento não pode ser criado sem itens.");
            }

            // 1. Criar o objeto "Orcamento" (a capa)
            var novoOrcamento = new Orcamento
            {
                ClienteID = orcamentoDto.ClienteID,
                Status = orcamentoDto.Status,
                DataCriacao = DateTime.UtcNow, // Usar UTC é uma boa prática
                ValorTotal = 0 // Vamos calcular isso
            };

            decimal valorTotalCalculado = 0;

            // 2. Iterar sobre os itens do DTO para criar os "OrcamentoItem"
            foreach (var itemDto in orcamentoDto.Itens)
            {
                // 3. Buscar o produto no banco para "congelar" o preço
                var produtoDb = await _context.Produtos.FindAsync(itemDto.ProdutoID);
                if (produtoDb == null)
                {
                    return BadRequest($"Produto com ID {itemDto.ProdutoID} não encontrado.");
                }

                // 4. Criar a linha de item
                var novoItem = new OrcamentoItem
                {
                    Orcamento = novoOrcamento, // Vincula ao orçamento que estamos a criar
                    ProdutoID = itemDto.ProdutoID,
                    Quantidade = itemDto.Quantidade,
                    PrecoUnitarioVenda = produtoDb.PrecoVenda // <-- O PREÇO É "CONGELADO" AQUI!
                };

                // 5. Adicionar o item à lista do orçamento
                novoOrcamento.Itens.Add(novoItem);

                // 6. Somar ao valor total
                valorTotalCalculado += (novoItem.Quantidade * novoItem.PrecoUnitarioVenda);
            }

            // 7. Atualizar o valor total do orçamento
            novoOrcamento.ValorTotal = valorTotalCalculado;

            // 8. Adicionar o orçamento (e todos os seus itens) ao contexto
            _context.Orcamentos.Add(novoOrcamento);

            // 9. Salvar tudo no banco de uma só vez (transação)
            await _context.SaveChangesAsync();

            // Retorna o orçamento completo
            return CreatedAtAction(nameof(GetOrcamento), new { id = novoOrcamento.OrcamentoID }, novoOrcamento);
        }

        // DELETE: api/orcamentos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrcamento(int id)
        {
            // (O EF Core é inteligente, se eliminarmos o Orçamento,
            // ele geralmente elimina os OrcamentoItens se a FK estiver configurada
            // Mas vamos ser explícitos para garantir)

            var orcamento = await _context.Orcamentos
                                  .Include(o => o.Itens) // Inclui os itens para que sejam rastreados
                                  .FirstOrDefaultAsync(o => o.OrcamentoID == id);

            if (orcamento == null)
            {
                return NotFound();
            }

            // Remove os itens primeiro (embora o cascade delete deva funcionar)
            _context.OrcamentoItens.RemoveRange(orcamento.Itens);

            // Remove a capa
            _context.Orcamentos.Remove(orcamento);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Nota: Um "PUT" (Editar) num orçamento é muito complexo (adicionar/remover/mudar itens).
        // Para um TCC, focar no POST (Criar) e GET (Ver) é o mais importante.
        // Um PUT simples poderia ser só para mudar o Status (Ex: "Em Aberto" -> "Finalizado")
    }
}