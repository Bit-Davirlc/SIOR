using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiorApi.Models
{
    public class Orcamento
    {
        [Key]
        public int OrcamentoID { get; set; }

        [Required]
        public int ClienteID { get; set; }

        [ForeignKey("ClienteID")]
        public Cliente? Cliente { get; set; } // Propriedade de Navegação

        [Required]
        public DateTime DataCriacao { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty; // Ex: "Em Aberto", "Finalizado", "Cancelado"

        public decimal ValorTotal { get; set; }

        // Um Orçamento tem VÁRIOS Itens
        // Esta é a propriedade de navegação para a lista de itens
        public ICollection<OrcamentoItem> Itens { get; set; } = new List<OrcamentoItem>();
    }
}