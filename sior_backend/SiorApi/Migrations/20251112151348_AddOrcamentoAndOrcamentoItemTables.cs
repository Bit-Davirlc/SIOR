using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiorApi.Migrations
{
    /// <inheritdoc />
    public partial class AddOrcamentoAndOrcamentoItemTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Orcamentos",
                columns: table => new
                {
                    OrcamentoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteID = table.Column<int>(type: "int", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ValorTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orcamentos", x => x.OrcamentoID);
                    table.ForeignKey(
                        name: "FK_Orcamentos_Clientes_ClienteID",
                        column: x => x.ClienteID,
                        principalTable: "Clientes",
                        principalColumn: "ClienteID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrcamentoItens",
                columns: table => new
                {
                    OrcamentoItemID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrcamentoID = table.Column<int>(type: "int", nullable: false),
                    ProdutoID = table.Column<int>(type: "int", nullable: false),
                    Quantidade = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PrecoUnitarioVenda = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrcamentoItens", x => x.OrcamentoItemID);
                    table.ForeignKey(
                        name: "FK_OrcamentoItens_Orcamentos_OrcamentoID",
                        column: x => x.OrcamentoID,
                        principalTable: "Orcamentos",
                        principalColumn: "OrcamentoID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrcamentoItens_Produtos_ProdutoID",
                        column: x => x.ProdutoID,
                        principalTable: "Produtos",
                        principalColumn: "ProdutoID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrcamentoItens_OrcamentoID",
                table: "OrcamentoItens",
                column: "OrcamentoID");

            migrationBuilder.CreateIndex(
                name: "IX_OrcamentoItens_ProdutoID",
                table: "OrcamentoItens",
                column: "ProdutoID");

            migrationBuilder.CreateIndex(
                name: "IX_Orcamentos_ClienteID",
                table: "Orcamentos",
                column: "ClienteID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrcamentoItens");

            migrationBuilder.DropTable(
                name: "Orcamentos");
        }
    }
}
