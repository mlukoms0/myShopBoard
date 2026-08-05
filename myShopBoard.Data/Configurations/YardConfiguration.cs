using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Configurations;

public class YardConfiguration : IEntityTypeConfiguration<Yard>
{
    public void Configure(EntityTypeBuilder<Yard> builder)
    {
        builder.ToTable("Yards");

        builder.Property(y => y.Name).HasMaxLength(100).IsRequired();
        builder.Property(y => y.Code).HasMaxLength(20).IsRequired();
        builder.Property(y => y.Description).HasMaxLength(500);
        builder.Property(y => y.Address).HasMaxLength(200);
        builder.Property(y => y.address2).HasMaxLength(200);
        builder.Property(y => y.City).HasMaxLength(100);
        builder.Property(y => y.State).HasMaxLength(2);
        builder.Property(y => y.ZipCode).HasMaxLength(12);
        builder.Property(y => y.Country).HasMaxLength(2);
        builder.Property(y => y.PhoneNumber).HasMaxLength(30);
        builder.Property(y => y.CreatedByUserId).HasMaxLength(450);
        builder.Property(y => y.UpdatedByUserId).HasMaxLength(450);

        // Overrides the global (18,2) decimal convention - see AssetLocationConfiguration for why.
        builder.Property(y => y.Latitude).HasPrecision(9, 6);
        builder.Property(y => y.Longitude).HasPrecision(9, 6);

        builder.HasIndex(y => y.Code).IsUnique().HasDatabaseName("IX_Yards_Code_Unique");

        // Drives the map's state-level grouping - states with no yards get no pin.
        builder.HasIndex(y => y.State).HasDatabaseName("IX_Yards_State");

        builder.HasData(
            new Yard
            {
                Id = 1, Name = "Main Yard", Code = "MAIN", IsActive = true,
                City = "Houston", State = "TX", Country = "US",
                Latitude = 29.760400m, Longitude = -95.369800m,
                CreatedAtUtc = SeedData.SeededAtUtc,
            },
            new Yard
            {
                Id = 2, Name = "North Terminal", Code = "NORTH", IsActive = true,
                City = "Dallas", State = "TX", Country = "US",
                Latitude = 32.776700m, Longitude = -96.797000m,
                CreatedAtUtc = SeedData.SeededAtUtc,
            }
        );
    }
}
