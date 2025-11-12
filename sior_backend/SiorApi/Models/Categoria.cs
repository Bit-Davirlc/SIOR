using System.ComponentModel.DataAnnotations;

namespace SiorApi.Models
{
    public class Categoria
    {
        [Key]
        public int CategoriaID { get; set; }

        [Required]
        [StringLength(50)]
        public string Nome { get; set; } = string.Empty;
    }
}