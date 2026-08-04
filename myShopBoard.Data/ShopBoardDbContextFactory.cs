using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace myShopBoard.Data;

/// <summary>
/// Used by dotnet ef comman line tools.
/// </summary>

public class ShopBoardDbContextFactory : IDesignTimeDbContextFactory<ShopBoardDbContext>
{
    public ShopBoardDbContext CreateDbContext(string[] args)
    {
        // Environment variable wins so this also works against staging/production when needed.
        // The fallback points at local Docker Postgres 
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=localhost;Port=5435;Database=myshopboard;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<ShopBoardDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new ShopBoardDbContext(options);
    }
}