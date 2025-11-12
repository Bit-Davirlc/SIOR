using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SiorApi.Data; // <-- Nosso DbContext
using SiorApi.Models; // <-- Nosso Model

namespace SiorApi.Controllers
{
    [Route("api/[controller]")] // Define a rota: "api/clientes"
    [ApiController]
    public class ClientesController : ControllerBase
    {
        // Variável privada para guardar a "ponte" com o banco
        private readonly AppDbContext _context;

        // Construtor: Pede o DbContext por Injeção de Dependência
        public ClientesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/clientes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
        {
            // Retorna todos os clientes do banco
            return await _context.Clientes.ToListAsync();
        }

        // GET: api/clientes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);

            if (cliente == null)
            {
                return NotFound(); // Retorna 404 se não encontrar
            }

            return cliente; // Retorna o cliente encontrado
        }

        // POST: api/clientes
        [HttpPost]
        public async Task<ActionResult<Cliente>> PostCliente(Cliente cliente)
        {
            _context.Clientes.Add(cliente); // Adiciona o novo cliente
            await _context.SaveChangesAsync(); // Salva no banco

            // Retorna 201 (Created) e o novo cliente (com o ID gerado)
            return CreatedAtAction(nameof(GetCliente), new { id = cliente.ClienteID }, cliente);
        }

        // PUT: api/clientes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCliente(int id, Cliente cliente)
        {
            if (id != cliente.ClienteID)
            {
                return BadRequest(); // Se o ID da URL for diferente do ID do objeto
            }

            _context.Entry(cliente).State = EntityState.Modified; // Marca o objeto como "modificado"

            try
            {
                await _context.SaveChangesAsync(); // Tenta salvar
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Clientes.Any(e => e.ClienteID == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent(); // Retorna 204 (Sucesso, sem conteúdo)
        }

        // DELETE: api/clientes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
            {
                return NotFound();
            }

            _context.Clientes.Remove(cliente); // Remove o cliente
            await _context.SaveChangesAsync(); // Salva a remoção no banco

            return NoContent(); // Retorna 204
        }
    }
}