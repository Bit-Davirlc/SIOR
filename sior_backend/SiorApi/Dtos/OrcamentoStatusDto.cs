// sior_backend/SiorApi/Dtos/OrcamentoStatusDto.cs
using System.ComponentModel.DataAnnotations;

namespace SiorApi.Dtos
{
    public class OrcamentoStatusDto
    {
        [Required]
        public string Status { get; set; } =  string.Empty;
    }
}