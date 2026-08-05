using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Configurations;

public class AssetLocationConfiguration : IEntityTypeConfiguration<AssetLocation>
{
    public void Configure(EntityTypeBuilder<AssetLocation> builder)
    {
        builder.ToTable("AssetLocations");

        // CRITICAL: overrides the global decimal convention of (18,2) set in
        // ShopBoardDbContext.ConfigureConventions. At (18,2) a longitude of -95.3698 would be
        // stored as -95.37 - about 1 km of error, which puts a truck in the wrong part of town.
        // (9,6) gives roughly 0.1 m and is the standard choice for WGS84 degrees.
        builder.Property(l => l.Latitude).HasPrecision(9, 6).IsRequired();
        builder.Property(l => l.Longitude).HasPrecision(9, 6).IsRequired();

        builder.Property(l => l.Source).HasMaxLength(20).IsRequired();
        builder.Property(l => l.ExternalRef).HasMaxLength(120);
        builder.Property(l => l.CreatedByUserId).HasMaxLength(450);
        builder.Property(l => l.UpdatedByUserId).HasMaxLength(450);

        // One current position per asset. A telematics poller upserts against this.
        builder.HasIndex(l => l.AssetId).IsUnique().HasDatabaseName("IX_AssetLocations_AssetId_Unique");

        // Lets a poller reconcile "their vehicle 7742" to "our unit 204" without guessing.
        builder.HasIndex(l => new { l.Source, l.ExternalRef }).HasDatabaseName("IX_AssetLocations_Source_ExternalRef");

        // Cascade is correct here and only here: a location is meaningless without its asset,
        // and unlike service history it carries no compliance value worth retaining.
        builder.HasOne(l => l.Asset)
               .WithOne(a => a.Location)
               .HasForeignKey<AssetLocation>(l => l.AssetId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasData(SeedLocations());
    }

    /// <summary>
    /// Hand-placed coordinates scattered around each unit's yard, so the map has something to
    /// draw before any telematics integration exists. All tagged Source = "manual" and removable
    /// with a single DELETE - see the remarks on AssetLocation.
    /// </summary>
    private static AssetLocation[] SeedLocations()
    {
        var t = SeedData.SeededAtUtc;

        // MAIN  = Houston  (29.7604, -95.3698)
        // NORTH = Dallas   (32.7767, -96.7970)
        (long Id, long AssetId, decimal Lat, decimal Lng)[] rows =
        [
            (1,  1,  29.765400m, -95.372100m),   // 201   MAIN
            (2,  2,  29.758200m, -95.366400m),   // 202   MAIN
            (3,  3,  29.771300m, -95.381200m),   // 203   MAIN
            (4,  4,  32.780100m, -96.801400m),   // 204   NORTH
            (5,  5,  32.772300m, -96.793600m),   // 205   NORTH
            (6,  6,  29.752600m, -95.359300m),   // T-31  MAIN
            (7,  7,  29.766700m, -95.375500m),   // T-32  MAIN
            (8,  8,  32.769400m, -96.810200m),   // T-33  NORTH
            (9,  9,  29.763800m, -95.370700m),   // TR-51 MAIN
            (10, 10, 29.761900m, -95.368300m),   // TR-52 MAIN
            (11, 11, 29.759100m, -95.364600m),   // P-11  MAIN
            (12, 12, 32.774800m, -96.796900m),   // L-01  NORTH
        ];

        return [.. rows.Select(r => new AssetLocation
        {
            Id = r.Id,
            AssetId = r.AssetId,
            Latitude = r.Lat,
            Longitude = r.Lng,
            RecordedAtUtc = t,
            Source = LocationSources.Manual,
            CreatedAtUtc = t,
        })];
    }
}
