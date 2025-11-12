using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SiorApi.Models
{
    public class OrcamentoItem
    {
        [Key]
        public int OrcamentoItemID { get; set; }

        // --- Chave Estrangeira para Orcamento ---
        [Required]
        public int OrcamentoID { get; set; }

        [ForeignKey("OrcamentoID")]
        [JsonIgnore]
        public Orcamento? Orcamento { get; set; }

        // --- Chave Estrangeira para Produto ---
        [Required]
        public int ProdutoID { get; set; }

        [ForeignKey("ProdutoID")]
        public Produto? Produto { get; set; }

        // --- Dados do Item no momento da venda ---
        [Required]
        public decimal Quantidade { get; set; }

        [Required]
        public decimal PrecoUnitarioVenda { get; set; } // "Congela" o preço do produto
    }
}