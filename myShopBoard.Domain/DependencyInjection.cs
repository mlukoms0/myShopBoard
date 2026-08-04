using Microsoft.Extensions.DependencyInjection;
using myShopBoard.Data;
using myShopBoard.Domain.Services;

namespace myShopBoard.Domain;

public static class DependencyInjection
{
    public static IServiceCollection AddShopBoardDomain(this IServiceCollection services, string connectionString)
    {
        services.AddShopBoardData(connectionString);

        services.AddScoped<IAssetService, AssetService>();

        return services;
    }
}