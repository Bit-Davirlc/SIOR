using Microsoft.EntityFrameworkCore;
using SiorApi.Data;

// Define uma política de CORS com um nome
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

// Adiciona a política de CORS ao builder <--
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            // Permite que seu frontend (do live-server) acesse a API
            // ATENÇÃO: Troque "http://127.0.0.1:5500" pela URL que o Live Server abrir.
            policy.WithOrigins("http://127.0.0.1:5500", "http://localhost:5500") 
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// 1. Pega a Connection String do appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. Registra o AppDbContext (a ponte) e diz para ele usar o SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// 3. Registra os outros serviços
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

// Diz ao app para USAR a política de CORS <--
app.UseCors(MyAllowSpecificOrigins); 

app.UseAuthorization();
app.MapControllers();
app.Run();