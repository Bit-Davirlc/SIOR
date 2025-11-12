using Microsoft.EntityFrameworkCore;
using SiorApi.Models; // <-- Importa a pasta Models

namespace SiorApi.Data
{
    public class AppDbContext : DbContext
    {
        // O construtor que recebe as configurações de conexão
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Mapeia sua classe 'Cliente' para uma tabela 'Clientes' no banco
        public DbSet<Cliente> Clientes { get; set; }

        // ...No futuro, você adicionará outras tabelas aqui
        // public DbSet<Produto> Produtos { get; set; }
        // public DbSet<Orcamento> Orcamentos { get; set; }
    }
}