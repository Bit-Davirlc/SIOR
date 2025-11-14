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

        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrcamento(int id, OrcamentoCreateDto orcamentoDto)
        {
            // 1. Encontra o orçamento principal
            var orcamento = await _context.Orcamentos.FindAsync(id);
            if (orcamento == null)
            {
                return NotFound("Orçamento não encontrado.");
            }

            // 2. Atualiza os dados simples (Cliente e Status)
            orcamento.ClienteID = orcamentoDto.ClienteID;
            orcamento.Status = orcamentoDto.Status;

            // 3. Remove TODOS os itens antigos deste orçamento
            // (Esta é a forma mais segura de atualizar itens complexos)
            var itensAntigos = _context.OrcamentoItens
                .Where(i => i.OrcamentoID == id);
            _context.OrcamentoItens.RemoveRange(itensAntigos);

            // 4. Adiciona os "novos" itens (do DTO)
            decimal novoValorTotal = 0;
            
            // É importante criar uma nova lista, pois a antiga foi removida
            orcamento.Itens = new List<OrcamentoItem>(); 

            foreach (var itemDto in orcamentoDto.Itens)
            {
                var produto = await _context.Produtos.FindAsync(itemDto.ProdutoID);
                if (produto == null)
                {
                    return BadRequest($"Produto com ID {itemDto.ProdutoID} não encontrado.");
                }

                var novoItem = new OrcamentoItem
                {
                    OrcamentoID = id, // Linka com o orçamento existente
                    ProdutoID = itemDto.ProdutoID,
                    Quantidade = itemDto.Quantidade,
                    PrecoUnitarioVenda = produto.PrecoVenda // Pega o preço atual
                };
                
                orcamento.Itens.Add(novoItem); // Adiciona na nova lista
                novoValorTotal += novoItem.Quantidade * novoItem.PrecoUnitarioVenda;
            }

            // 5. Atualiza o valor total e a data
            orcamento.ValorTotal = novoValorTotal;
            orcamento.DataCriacao = DateTime.UtcNow; // Atualiza a data para a da edição

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Orcamentos.Any(e => e.OrcamentoID == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent(); // Sucesso
        }

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

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrcamentoStatus(int id, [FromBody] OrcamentoStatusDto statusDto)
        {
            if (statusDto == null || string.IsNullOrEmpty(statusDto.Status))
            {
                return BadRequest("O novo status não pode ser nulo ou vazio.");
            }

            var orcamento = await _context.Orcamentos.FindAsync(id);

            if (orcamento == null)
            {
                return NotFound("Orçamento não encontrado.");
            }

            // Ação simples: Apenas atualiza o status
            orcamento.Status = statusDto.Status;
            
            try
            {
                // Salva a mudança
                await _context.SaveChangesAsync();
            }
            catch (Exception)
            {
                return StatusCode(500, "Ocorreu um erro ao atualizar o status.");
            }

            return NoContent(); // Sucesso
        }
    }
}