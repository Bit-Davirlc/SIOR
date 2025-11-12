using System.ComponentModel.DataAnnotations; // <-- Importante para o [Key]

namespace SiorApi.Models
{
    public class Cliente
    {
        [Key] // <-- Informa ao EF Core que esta é a Chave Primária
        public int ClienteID { get; set; }

        [Required] // <-- Não permite que o nome seja nulo
        [StringLength(100)] // <-- Define um tamanho máximo
        public string Nome { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Documento { get; set; } // <-- O '?' permite valor nulo

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Telefone { get; set; }
    }
}