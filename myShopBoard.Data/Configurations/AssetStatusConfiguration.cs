using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Configurations;

public class AssetStatusConfiguration : IEntityTypeConfiguration<AssetStatus>
{
    public void Configure(EntityTypeBuilder<AssetStatus> builder)
    {
        builder.ToTable("AssetStatuses");

        builder.Property(s => s.Name).HasMaxLength(60).IsRequired();
        builder.Property(s => s.ColorHex).HasMaxLength(7).IsRequired();
        builder.Property(s => s.CreatedByUserId).HasMaxLength(450);
        builder.Property(s => s.UpdatedByUserId).HasMaxLength(450);

        builder.HasIndex(s => s.Name).IsUnique().HasDatabaseName("IX_AssetStatuses_Name_Unique");
        builder.HasData(
            new AssetStatus { Id = 1, Name = "In Service",                   IsAvailable = true,  IsInShop = false, IsPlannedDowntime = false, ExcludeFromAvailability = false, SortOrder = 10, ColorHex = "#16A34A", CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetStatus { Id = 2, Name = "Down - PM",                    IsAvailable = false, IsInShop = true,  IsPlannedDowntime = true,  ExcludeFromAvailability = false, SortOrder = 20, ColorHex = "#2563EB", CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetStatus { Id = 3, Name = "Down - Shop Repair",           IsAvailable = false, IsInShop = true,  IsPlannedDowntime = false, ExcludeFromAvailability = false, SortOrder = 30, ColorHex = "#DC2626", CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetStatus { Id = 4, Name = "Down - Waiting Parts",         IsAvailable = false, IsInShop = true,  IsPlannedDowntime = false, ExcludeFromAvailability = false, SortOrder = 40, ColorHex = "#EA580C", CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetStatus { Id = 5, Name = "Down - Waiting Authorization", IsAvailable = false, IsInShop = true,  IsPlannedDowntime = false, ExcludeFromAvailability = false, SortOrder = 50, ColorHex = "#CA8A04", CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetStatus { Id = 6, Name = "Down - Road Call",             IsAvailable = false, IsInShop = false, IsPlannedDowntime = false, ExcludeFromAvailability = false, SortOrder = 60, ColorHex = "#B91C1C", CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetStatus { Id = 7, Name = "Down - DOT Inspection",        IsAvailable = false, IsInShop = true,  IsPlannedDowntime = true,  ExcludeFromAvailability = false, SortOrder = 70, ColorHex = "#7C3AED", CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetStatus { Id = 8, Name = "Seasonal / Parked",            IsAvailable = false, IsInShop = false, IsPlannedDowntime = false, ExcludeFromAvailability = true,  SortOrder = 80, ColorHex = "#64748B", CreatedAtUtc = SeedData.SeededAtUtc },
            new AssetStatus { Id = 9, Name = "Out of Fleet",                 IsAvailable = false, IsInShop = false, IsPlannedDowntime = false, ExcludeFromAvailability = true,  SortOrder = 90, ColorHex = "#334155", CreatedAtUtc = SeedData.SeededAtUtc });
    }
}