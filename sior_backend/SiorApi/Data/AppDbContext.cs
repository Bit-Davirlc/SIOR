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
        public DbSet<Orcamento> Orcamentos { get; set; }
        public DbSet<OrcamentoItem> OrcamentoItens { get; set; }

        // ...No futuro, você adicionará outras tabelas aqui
        // public DbSet<Produto> Produtos { get; set; }
        // public DbSet<Orcamento> Orcamentos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // Produto
    modelBuilder.Entity<Produto>()
        .Property(p => p.PrecoVenda)
        .HasColumnType("decimal(18, 2)");

    // Orcamento
    modelBuilder.Entity<Orcamento>()
        .Property(o => o.ValorTotal)
        .HasColumnType("decimal(18, 2)");

    // OrcamentoItem
    modelBuilder.Entity<OrcamentoItem>(entity =>
    {
        entity.Property(oi => oi.Quantidade)
              .HasColumnType("decimal(18, 2)");

        entity.Property(oi => oi.PrecoUnitarioVenda)
              .HasColumnType("decimal(18, 2)");
    });
}
    }
}