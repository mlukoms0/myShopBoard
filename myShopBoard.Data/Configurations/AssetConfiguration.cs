using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Configurations;

public class AssetConfiguration : IEntityTypeConfiguration<Asset>
{
    public void Configure(EntityTypeBuilder<Asset> builder)
    {
        builder.ToTable("Assets");

        builder.Property(a => a.UnitNumber).HasMaxLength(30).IsRequired();
        builder.Property(a => a.QrToken).HasMaxLength(32).IsRequired();
        builder.Property(a => a.Vin).HasMaxLength(17);
        builder.Property(a => a.Make).HasMaxLength(50);
        builder.Property(a => a.Model).HasMaxLength(50);
        builder.Property(a => a.LicensePlate).HasMaxLength(20);
        builder.Property(a => a.PrimaryMeterUnit).HasMaxLength(10).IsRequired();
        builder.Property(a => a.SecondaryMeterUnit).HasMaxLength(10);
        builder.Property(a => a.CreatedByUserId).HasMaxLength(450);
        builder.Property(a => a.UpdatedByUserId).HasMaxLength(450);


        builder.HasIndex(a => a.UnitNumber).IsUnique().HasDatabaseName("IX_Assets_UnitNumber_Unique");
        builder.HasIndex(a => a.QrToken).IsUnique().HasDatabaseName("IX_Assets_QrToken_Unique");

        //Partial unique index since some assets may have no vin

        builder.HasIndex(a => a.Vin)
            .IsUnique()
            .HasFilter("\"Vin\" IS NOT NULL")
            .HasDatabaseName("IX_Assets_Vin_Unique");

        builder.HasIndex(a => new { a.YardId, a.AssetStatusId })
            .HasDatabaseName("IX_Assets_Yard_Status");

        builder.HasOne(a => a.AssetType)
            .WithMany(t => t.Assets)
            .HasForeignKey(a => a.AssetTypeId).OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.AssetStatus)
            .WithMany(s => s.Assets)
            .HasForeignKey(a => a.AssetStatusId).OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Yard)
            .WithMany(y => y.Assets)
            .HasForeignKey(a => a.YardId).OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(a => a.ArchivedAtUtc == null);

        builder.HasData(SeedAssets());

    }







     private static Asset[] SeedAssets()
    {
        var t = SeedData.SeededAtUtc;

        return
        [
            new Asset { Id = 1,  UnitNumber = "201", QrToken = "u7Kq2mXfB9dLpR4wYc1Nzt", Vin = "1FUJGLDR9CLBP1234", AssetTypeId = 1, AssetStatusId = 1, YardId = 1, Year = 2019, Make = "Mack",       Model = "Granite GU713", LicensePlate = "DT201",  PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = MeterUnits.Hours, CurrentPrimaryMeter = 187_432m, CurrentSecondaryMeter = 9_812m,  CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2019, 4, 12), CreatedAtUtc = t },
            new Asset { Id = 2,  UnitNumber = "202", QrToken = "hV3sJ8nQwE5tZ1xA6yUm0P", Vin = "1FUJGLDR1CLBP2345", AssetTypeId = 1, AssetStatusId = 3, YardId = 1, Year = 2018, Make = "Peterbilt",  Model = "348",           LicensePlate = "DT202",  PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = MeterUnits.Hours, CurrentPrimaryMeter = 224_115m, CurrentSecondaryMeter = 11_240m, CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2018, 8,  1), CreatedAtUtc = t },
            new Asset { Id = 3,  UnitNumber = "203", QrToken = "Rf9bC2kL6vNhT4gW8jXs3Q", Vin = "1FUJGLDR3CLBP3456", AssetTypeId = 1, AssetStatusId = 1, YardId = 1, Year = 2021, Make = "Kenworth",   Model = "T880",          LicensePlate = "DT203",  PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = MeterUnits.Hours, CurrentPrimaryMeter = 98_774m,  CurrentSecondaryMeter = 5_106m,  CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2021, 2, 18), CreatedAtUtc = t },
            new Asset { Id = 4,  UnitNumber = "204", QrToken = "Yz5nD7pM1aS9fK3hJ6qV2L", Vin = "1FUJGLDR5CLBP4567", AssetTypeId = 1, AssetStatusId = 4, YardId = 2, Year = 2017, Make = "Mack",       Model = "Granite GU813", LicensePlate = "DT204",  PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = MeterUnits.Hours, CurrentPrimaryMeter = 291_003m, CurrentSecondaryMeter = 14_775m, CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2017, 6, 30), CreatedAtUtc = t },
            new Asset { Id = 5,  UnitNumber = "205", QrToken = "Qw8tG4rB6uH2mZ7cX1vN5J", Vin = "1FUJGLDR7CLBP5678", AssetTypeId = 1, AssetStatusId = 8, YardId = 2, Year = 2016, Make = "Western Star", Model = "4700SF",       LicensePlate = "DT205",  PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = MeterUnits.Hours, CurrentPrimaryMeter = 318_990m, CurrentSecondaryMeter = 16_402m, CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2016, 3, 22), CreatedAtUtc = t },

            new Asset { Id = 6,  UnitNumber = "T-31", QrToken = "Ke2LxW9fP5sD8nA3jR7bU1", Vin = "3AKJGLD52ESFR6789", AssetTypeId = 2, AssetStatusId = 1, YardId = 1, Year = 2020, Make = "Freightliner", Model = "Cascadia 126", LicensePlate = "TR031", PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = MeterUnits.Hours, CurrentPrimaryMeter = 412_556m, CurrentSecondaryMeter = 12_930m, CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2020, 1, 15), CreatedAtUtc = t },
            new Asset { Id = 7,  UnitNumber = "T-32", QrToken = "Mv6yH1cJ4zQ7gT2pL9wF3S", Vin = "3AKJGLD54ESFR7890", AssetTypeId = 2, AssetStatusId = 2, YardId = 1, Year = 2022, Make = "Volvo",        Model = "VNL 760",      LicensePlate = "TR032", PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = MeterUnits.Hours, CurrentPrimaryMeter = 203_881m, CurrentSecondaryMeter = 6_744m,  CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2022, 5,  9), CreatedAtUtc = t },
            new Asset { Id = 8,  UnitNumber = "T-33", QrToken = "Bn4qZ8dK2xV6mC1sY5tG7H", Vin = "3AKJGLD56ESFR8901", AssetTypeId = 2, AssetStatusId = 6, YardId = 2, Year = 2019, Make = "International", Model = "LT625",       LicensePlate = "TR033", PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = MeterUnits.Hours, CurrentPrimaryMeter = 355_209m, CurrentSecondaryMeter = 11_018m, CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2019, 9, 27), CreatedAtUtc = t },

            new Asset { Id = 9,  UnitNumber = "TR-51", QrToken = "Cs1jN7vR3hL9bF4kW6zP2M", Vin = null, AssetTypeId = 3, AssetStatusId = 1, YardId = 1, Year = 2015, Make = "East",   Model = "Genesis End Dump", LicensePlate = "TL051", PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = null, CurrentPrimaryMeter = null, CurrentSecondaryMeter = null, CurrentMeterAsOfUtc = null, InServiceDate = new DateOnly(2015, 7,  3), CreatedAtUtc = t },
            new Asset { Id = 10, UnitNumber = "TR-52", QrToken = "Dp3fY6mT8wJ1qX5nH2cB9K", Vin = null, AssetTypeId = 3, AssetStatusId = 7, YardId = 1, Year = 2018, Make = "Ranco",  Model = "LW22-40",         LicensePlate = "TL052", PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = null, CurrentPrimaryMeter = null, CurrentSecondaryMeter = null, CurrentMeterAsOfUtc = null, InServiceDate = new DateOnly(2018, 11, 14), CreatedAtUtc = t },

            new Asset { Id = 11, UnitNumber = "P-11", QrToken = "Gj7wS2bV5nM8xR3tK9dL4Q", Vin = "1FT8W3BT9NEC01234", AssetTypeId = 4, AssetStatusId = 1, YardId = 1, Year = 2022, Make = "Ford",       Model = "F-350",  LicensePlate = "PU011", PrimaryMeterUnit = MeterUnits.Miles, SecondaryMeterUnit = null,             CurrentPrimaryMeter = 61_204m, CurrentSecondaryMeter = null,   CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2022, 3,  1), CreatedAtUtc = t },
            new Asset { Id = 12, UnitNumber = "L-01", QrToken = "Ht5kP9zX1cN6vB2mQ8jW3F", Vin = null,                AssetTypeId = 5, AssetStatusId = 1, YardId = 2, Year = 2020, Make = "Caterpillar", Model = "950M",  LicensePlate = null,    PrimaryMeterUnit = MeterUnits.Hours, SecondaryMeterUnit = null,             CurrentPrimaryMeter = 7_318m,  CurrentSecondaryMeter = null,   CurrentMeterAsOfUtc = t, InServiceDate = new DateOnly(2020, 10, 5), CreatedAtUtc = t },
        ];
    }
}