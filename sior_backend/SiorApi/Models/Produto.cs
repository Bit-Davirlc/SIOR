using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // <-- Para o [ForeignKey]

namespace SiorApi.Models
{
    public class Produto
    {
        [Key]
        public int ProdutoID { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Descricao { get; set; }

        [Required]
        [StringLength(10)]
        public string UnidadeMedida { get; set; } = string.Empty; // Ex: "m", "un", "h"

        [Required]
        public decimal PrecoVenda { get; set; }

        // --- Chave Estrangeira para Categoria ---
        [Required]
        public int CategoriaID { get; set; }

        [ForeignKey("CategoriaID")] // <-- Indica qual propriedade é a FK
        public Categoria? Categoria { get; set; } // <-- Propriedade de Navegação
    }
}