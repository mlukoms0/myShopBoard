using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using myShopBoard.Data.Repositories;

namespace myShopBoard.Data;

public static class DependencyInjection
{
    /// <summary>
    /// Everything the data layer needs, registered here  so the API project doesn't need to know about the data layer's dependencies.
    /// </summary>
    public static IServiceCollection AddShopBoardData(this IServiceCollection services, string connectionString)
    {
        // AddDbContextPool reuses context instances instead of allocating one per request.
        services.AddDbContextPool<ShopBoardDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
            {
                // A transient Cloud SQL connection drop retry policy.
                npgsql.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null);

                npgsql.CommandTimeout(30);
            }));

        services.AddScoped<IAssetRepository, AssetRepository>();

        // Readiness check that opens a database connection and does a health check.
        services.AddHealthChecks()
                .AddDbContextCheck<ShopBoardDbContext>("database");

        return services;
    }
}