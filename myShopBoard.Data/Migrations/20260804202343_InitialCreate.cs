using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace myShopBoard.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssetStatuses",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    IsInShop = table.Column<bool>(type: "boolean", nullable: false),
                    IsPlannedDowntime = table.Column<bool>(type: "boolean", nullable: false),
                    ExcludeFromAvailability = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    ColorHex = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AssetTypes",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    RequiresDotAnnual = table.Column<bool>(type: "boolean", nullable: false),
                    DefaultPrimaryMeterUnit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DefaultSecondaryMeterUnit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Yards",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    address2 = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    State = table.Column<string>(type: "text", nullable: true),
                    ZipCode = table.Column<string>(type: "text", nullable: true),
                    Country = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Yards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Assets",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UnitNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    QrToken = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    QrTokenRotatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AssetStatusId = table.Column<long>(type: "bigint", nullable: false),
                    Vin = table.Column<string>(type: "character varying(17)", maxLength: 17, nullable: true),
                    AssetTypeId = table.Column<long>(type: "bigint", nullable: false),
                    YardId = table.Column<long>(type: "bigint", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Make = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Model = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    LicensePlate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    RegistrationNumber = table.Column<string>(type: "text", nullable: true),
                    RegistrationExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DotExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InsuranceExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateAquriedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateSoldUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PrimaryMeterUnit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    SecondaryMeterUnit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    CurrentPrimaryMeter = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    CurrentSecondaryMeter = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    CurrentMeterAsOfUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InServiceDate = table.Column<DateOnly>(type: "date", nullable: true),
                    OutOfServiceDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ArchivedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assets_AssetStatuses_AssetStatusId",
                        column: x => x.AssetStatusId,
                        principalTable: "AssetStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Assets_AssetTypes_AssetTypeId",
                        column: x => x.AssetTypeId,
                        principalTable: "AssetTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Assets_Yards_YardId",
                        column: x => x.YardId,
                        principalTable: "Yards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "AssetStatuses",
                columns: new[] { "Id", "ColorHex", "CreatedAtUtc", "CreatedByUserId", "ExcludeFromAvailability", "IsAvailable", "IsInShop", "IsPlannedDowntime", "Name", "SortOrder", "UpdatedAtUtc", "UpdatedByUserId" },
                values: new object[,]
                {
                    { 1L, "#16A34A", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, false, "In Service", 10, null, null },
                    { 2L, "#2563EB", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, true, true, "Down - PM", 20, null, null },
                    { 3L, "#DC2626", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, true, false, "Down - Shop Repair", 30, null, null },
                    { 4L, "#EA580C", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, true, false, "Down - Waiting Parts", 40, null, null },
                    { 5L, "#CA8A04", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, true, false, "Down - Waiting Authorization", 50, null, null },
                    { 6L, "#B91C1C", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, false, false, "Down - Road Call", 60, null, null },
                    { 7L, "#7C3AED", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, true, true, "Down - DOT Inspection", 70, null, null },
                    { 8L, "#64748B", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, false, false, false, "Seasonal / Parked", 80, null, null },
                    { 9L, "#334155", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, false, false, false, "Out of Fleet", 90, null, null }
                });

            migrationBuilder.InsertData(
                table: "AssetTypes",
                columns: new[] { "Id", "CreatedAtUtc", "CreatedByUserId", "DefaultPrimaryMeterUnit", "DefaultSecondaryMeterUnit", "Name", "RequiresDotAnnual", "UpdatedAtUtc", "UpdatedByUserId" },
                values: new object[,]
                {
                    { 1L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "mi", "hr", "Dump Truck", true, null, null },
                    { 2L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "mi", "hr", "Tractor", true, null, null },
                    { 3L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "mi", null, "Trailer", true, null, null },
                    { 4L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "mi", null, "Pickup", false, null, null },
                    { 5L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "hr", null, "Loader", false, null, null },
                    { 6L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "mi", null, "Box Truck", false, null, null },
                    { 7L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "mi", "hr", "Service Truck", true, null, null }
                });

            migrationBuilder.InsertData(
                table: "Yards",
                columns: new[] { "Id", "Address", "City", "Code", "Country", "CreatedAtUtc", "CreatedByUserId", "Description", "IsActive", "Name", "PhoneNumber", "State", "UpdatedAtUtc", "UpdatedByUserId", "ZipCode", "address2" },
                values: new object[,]
                {
                    { 1L, null, null, "MAIN", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, true, "Main Yard", null, null, null, null, null, null },
                    { 2L, null, null, "NORTH", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, true, "North Terminal", null, null, null, null, null, null }
                });

            migrationBuilder.InsertData(
                table: "Assets",
                columns: new[] { "Id", "ArchivedAtUtc", "AssetStatusId", "AssetTypeId", "Color", "CreatedAtUtc", "CreatedByUserId", "CurrentMeterAsOfUtc", "CurrentPrimaryMeter", "CurrentSecondaryMeter", "DateAquriedUtc", "DateSoldUtc", "DotExpiresAtUtc", "InServiceDate", "InsuranceExpiresAtUtc", "LicensePlate", "Make", "Model", "OutOfServiceDate", "PrimaryMeterUnit", "QrToken", "QrTokenRotatedAtUtc", "RegistrationExpiresAtUtc", "RegistrationNumber", "SecondaryMeterUnit", "UnitNumber", "UpdatedAtUtc", "UpdatedByUserId", "Vin", "YardId", "Year" },
                values: new object[,]
                {
                    { 1L, null, 1L, 1L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 187432m, 9812m, null, null, null, new DateOnly(2019, 4, 12), null, "DT201", "Mack", "Granite GU713", null, "mi", "u7Kq2mXfB9dLpR4wYc1Nzt", null, null, null, "hr", "201", null, null, "1FUJGLDR9CLBP1234", 1L, 2019 },
                    { 2L, null, 3L, 1L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 224115m, 11240m, null, null, null, new DateOnly(2018, 8, 1), null, "DT202", "Peterbilt", "348", null, "mi", "hV3sJ8nQwE5tZ1xA6yUm0P", null, null, null, "hr", "202", null, null, "1FUJGLDR1CLBP2345", 1L, 2018 },
                    { 3L, null, 1L, 1L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 98774m, 5106m, null, null, null, new DateOnly(2021, 2, 18), null, "DT203", "Kenworth", "T880", null, "mi", "Rf9bC2kL6vNhT4gW8jXs3Q", null, null, null, "hr", "203", null, null, "1FUJGLDR3CLBP3456", 1L, 2021 },
                    { 4L, null, 4L, 1L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 291003m, 14775m, null, null, null, new DateOnly(2017, 6, 30), null, "DT204", "Mack", "Granite GU813", null, "mi", "Yz5nD7pM1aS9fK3hJ6qV2L", null, null, null, "hr", "204", null, null, "1FUJGLDR5CLBP4567", 2L, 2017 },
                    { 5L, null, 8L, 1L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 318990m, 16402m, null, null, null, new DateOnly(2016, 3, 22), null, "DT205", "Western Star", "4700SF", null, "mi", "Qw8tG4rB6uH2mZ7cX1vN5J", null, null, null, "hr", "205", null, null, "1FUJGLDR7CLBP5678", 2L, 2016 },
                    { 6L, null, 1L, 2L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 412556m, 12930m, null, null, null, new DateOnly(2020, 1, 15), null, "TR031", "Freightliner", "Cascadia 126", null, "mi", "Ke2LxW9fP5sD8nA3jR7bU1", null, null, null, "hr", "T-31", null, null, "3AKJGLD52ESFR6789", 1L, 2020 },
                    { 7L, null, 2L, 2L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 203881m, 6744m, null, null, null, new DateOnly(2022, 5, 9), null, "TR032", "Volvo", "VNL 760", null, "mi", "Mv6yH1cJ4zQ7gT2pL9wF3S", null, null, null, "hr", "T-32", null, null, "3AKJGLD54ESFR7890", 1L, 2022 },
                    { 8L, null, 6L, 2L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 355209m, 11018m, null, null, null, new DateOnly(2019, 9, 27), null, "TR033", "International", "LT625", null, "mi", "Bn4qZ8dK2xV6mC1sY5tG7H", null, null, null, "hr", "T-33", null, null, "3AKJGLD56ESFR8901", 2L, 2019 },
                    { 9L, null, 1L, 3L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, null, null, null, new DateOnly(2015, 7, 3), null, "TL051", "East", "Genesis End Dump", null, "mi", "Cs1jN7vR3hL9bF4kW6zP2M", null, null, null, null, "TR-51", null, null, null, 1L, 2015 },
                    { 10L, null, 7L, 3L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, null, null, null, null, new DateOnly(2018, 11, 14), null, "TL052", "Ranco", "LW22-40", null, "mi", "Dp3fY6mT8wJ1qX5nH2cB9K", null, null, null, null, "TR-52", null, null, null, 1L, 2018 },
                    { 11L, null, 1L, 4L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 61204m, null, null, null, null, new DateOnly(2022, 3, 1), null, "PU011", "Ford", "F-350", null, "mi", "Gj7wS2bV5nM8xR3tK9dL4Q", null, null, null, null, "P-11", null, null, "1FT8W3BT9NEC01234", 1L, 2022 },
                    { 12L, null, 1L, 5L, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 7318m, null, null, null, null, new DateOnly(2020, 10, 5), null, null, "Caterpillar", "950M", null, "hr", "Ht5kP9zX1cN6vB2mQ8jW3F", null, null, null, null, "L-01", null, null, null, 2L, 2020 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetStatuses_Name_Unique",
                table: "AssetStatuses",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssetTypes_Name_Unique",
                table: "AssetTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_AssetStatusId",
                table: "Assets",
                column: "AssetStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_AssetTypeId",
                table: "Assets",
                column: "AssetTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_QrToken_Unique",
                table: "Assets",
                column: "QrToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_UnitNumber_Unique",
                table: "Assets",
                column: "UnitNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_Vin_Unique",
                table: "Assets",
                column: "Vin",
                unique: true,
                filter: "\"Vin\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_Yard_Status",
                table: "Assets",
                columns: new[] { "YardId", "AssetStatusId" });

            migrationBuilder.CreateIndex(
                name: "IX_Yards_Code_Unique",
                table: "Yards",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Assets");

            migrationBuilder.DropTable(
                name: "AssetStatuses");

            migrationBuilder.DropTable(
                name: "AssetTypes");

            migrationBuilder.DropTable(
                name: "Yards");
        }
    }
}
