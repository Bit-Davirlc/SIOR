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
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Produto> Produtos { get; set; }

        // ...No futuro, você adicionará outras tabelas aqui
        // public DbSet<Produto> Produtos { get; set; }
        // public DbSet<Orcamento> Orcamentos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // Define a precisão do decimal para PrecoVenda na tabela Produtos
    modelBuilder.Entity<Produto>()
        .Property(p => p.PrecoVenda)
        .HasColumnType("decimal(18, 2)");
}
    }
}