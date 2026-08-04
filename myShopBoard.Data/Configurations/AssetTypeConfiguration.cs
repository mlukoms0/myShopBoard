using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Configurations;

public class AssetTypeConfiguration : IEntityTypeConfiguration<AssetType>
{
    public void Configure(EntityTypeBuilder<AssetType> builder)
    {
        builder.ToTable("AssetTypes");

        builder.Property(t => t.Name).HasMaxLength(60).IsRequired();
        builder.Property(t => t.DefaultPrimaryMeterUnit).HasMaxLength(10).IsRequired();
        builder.Property(t => t.DefaultSecondaryMeterUnit).HasMaxLength(10);
        builder.Property(t => t.CreatedByUserId).HasMaxLength(450);
        builder.Property(t => t.UpdatedByUserId).HasMaxLength(450);

        builder.HasIndex(t => t.Name).IsUnique().HasDatabaseName("IX_AssetTypes_Name_Unique");

        builder.HasData(
            new AssetType { Id = 1, Name = "Dump Truck", RequiresDotAnnual = true, DefaultPrimaryMeterUnit = MeterUnits.Miles, DefaultSecondaryMeterUnit = MeterUnits.Hours, CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetType { Id = 2, Name = "Tractor", RequiresDotAnnual = true, DefaultPrimaryMeterUnit = MeterUnits.Miles, DefaultSecondaryMeterUnit = MeterUnits.Hours, CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetType { Id = 3, Name = "Trailer", RequiresDotAnnual = true, DefaultPrimaryMeterUnit = MeterUnits.Miles, DefaultSecondaryMeterUnit = null, CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetType { Id = 4, Name = "Pickup", RequiresDotAnnual = false, DefaultPrimaryMeterUnit = MeterUnits.Miles, DefaultSecondaryMeterUnit = null, CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetType { Id = 5, Name = "Loader", RequiresDotAnnual = false, DefaultPrimaryMeterUnit = MeterUnits.Hours, DefaultSecondaryMeterUnit = null, CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetType { Id = 6, Name = "Box Truck", RequiresDotAnnual = false, DefaultPrimaryMeterUnit = MeterUnits.Miles, DefaultSecondaryMeterUnit = null, CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetType { Id = 7, Name = "Service Truck", RequiresDotAnnual = true, DefaultPrimaryMeterUnit = MeterUnits.Miles, DefaultSecondaryMeterUnit = MeterUnits.Hours, CreatedAtUtc = SeedData.SeededAtUtc });
    }
}