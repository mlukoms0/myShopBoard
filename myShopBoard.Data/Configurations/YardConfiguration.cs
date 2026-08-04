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
        builder.Property(y => y.CreatedByUserId).HasMaxLength(450);
        builder.Property(y => y.UpdatedByUserId).HasMaxLength(450);

        builder.HasIndex(y => y.Code).IsUnique().HasDatabaseName("IX_Yards_Code_Unique");

        builder.HasData(
            new Yard { Id = 1, Name = "Main Yard", Code = "MAIN", IsActive = true, CreatedAtUtc = SeedData.SeededAtUtc },
            new Yard { Id = 2, Name = "North Terminal", Code = "NORTH", IsActive = true, CreatedAtUtc = SeedData.SeededAtUtc }
        );

        
    }
}