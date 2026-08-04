using myShopBoard.Domain;
using Scalar.AspNetCore;

namespace myShopBoard.API;

public partial class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is not configured. " +
                "Set it in appsettings.json locally, or as the environment variable " +
                "ConnectionStrings__DefaultConnection in Cloud Run.");

        // One call registers the whole stack: domain services, repositories, DbContext, health check.
        builder.Services.AddShopBoardDomain(connectionString);

        builder.Services.AddControllers();
        builder.Services.AddOpenApi();

        // Turns unhandled exceptions into the { error, traceId } contract.
        builder.Services.AddProblemDetails();
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

        // The React dev server runs on a different port, which the browser treats as a different
        // site. Without this, every fetch fails with a CORS error.
        var allowedOrigins = (builder.Configuration["AllowedOrigins"] ?? "http://localhost:8890")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        builder.Services.AddCors(options =>
            options.AddPolicy("AllowUI", policy => policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()));

        var app = builder.Build();

        app.UseExceptionHandler();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.MapScalarApiReference();   // browsable API docs at /scalar/v1
        }

        app.UseCors("AllowUI");

        // TODO(auth): UseAuthentication goes here, before UseAuthorization 
        app.UseAuthorization();

        app.MapControllers();
        app.MapHealthChecks("/health");

        app.Run();
    }
}