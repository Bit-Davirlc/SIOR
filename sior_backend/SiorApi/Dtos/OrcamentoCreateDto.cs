namespace SiorApi.Dtos
{
    // Este DTO é para cada "linha" de item
    public class OrcamentoItemCreateDto
    {
        public int ProdutoID { get; set; }
        public decimal Quantidade { get; set; }
    }

    // Este DTO é o objeto principal que o frontend vai enviar
    public class OrcamentoCreateDto
    {
        public int ClienteID { get; set; }
        public string Status { get; set; } = "Em Aberto";

        // Uma lista dos itens
        public List<OrcamentoItemCreateDto> Itens { get; set; } = new List<OrcamentoItemCreateDto>();
    }
}