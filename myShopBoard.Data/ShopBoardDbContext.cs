using Microsoft.EntityFrameworkCore;
using myShopBoard.Data.Entities;


namespace myShopBoard.Data;

public class ShopBoardDbContext(DbContextOptions<ShopBoardDbContext> options) :
DbContext(options)
{
    public DbSet<Yard> Yards => Set<Yard>();
    public DbSet<AssetType> AssetTypes => Set<AssetType>();
    public DbSet<AssetStatus> AssetStatus => Set<AssetStatus>();
    public DbSet<Asset> Assets => Set<Asset>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ShopBoardDbContext).Assembly);

        base.OnModelCreating(modelBuilder);

    }


    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<decimal>().HavePrecision(18,2);
        base.ConfigureConventions(configurationBuilder);
    }


    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        StampAuditFields();
        return base.SaveChanges();
    }


    private void StampAuditFields()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = now;
            }
        }
    }
}