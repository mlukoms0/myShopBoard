using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace myShopBoard.Data.Migrations
{
    /// <inheritdoc />
    public partial class LongLatTableAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "address2",
                table: "Yards",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ZipCode",
                table: "Yards",
                type: "character varying(12)",
                maxLength: 12,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "State",
                table: "Yards",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "Yards",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Yards",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Country",
                table: "Yards",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "City",
                table: "Yards",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "Yards",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "Yards",
                type: "numeric(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "Yards",
                type: "numeric(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AssetLocations",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AssetId = table.Column<long>(type: "bigint", nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    Longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    RecordedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ExternalRef = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssetLocations_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AssetLocations",
                columns: new[] { "Id", "AssetId", "CreatedAtUtc", "CreatedByUserId", "ExternalRef", "Latitude", "Longitude", "RecordedAtUtc", "Source", "UpdatedAtUtc", "UpdatedByUserId" },
                values: new object[,]
                {
                    { 1L, 1L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 29.765400m, -95.372100m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 2L, 2L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 29.758200m, -95.366400m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 3L, 3L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 29.771300m, -95.381200m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 4L, 4L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 32.780100m, -96.801400m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 5L, 5L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 32.772300m, -96.793600m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 6L, 6L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 29.752600m, -95.359300m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 7L, 7L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 29.766700m, -95.375500m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 8L, 8L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 32.769400m, -96.810200m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 9L, 9L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 29.763800m, -95.370700m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 10L, 10L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 29.761900m, -95.368300m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 11L, 11L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 29.759100m, -95.364600m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null },
                    { 12L, 12L, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 32.774800m, -96.796900m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manual", null, null }
                });

            migrationBuilder.UpdateData(
                table: "Yards",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "City", "Country", "Latitude", "Longitude", "State" },
                values: new object[] { "Houston", "US", 29.760400m, -95.369800m, "TX" });

            migrationBuilder.UpdateData(
                table: "Yards",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "City", "Country", "Latitude", "Longitude", "State" },
                values: new object[] { "Dallas", "US", 32.776700m, -96.797000m, "TX" });

            migrationBuilder.CreateIndex(
                name: "IX_Yards_State",
                table: "Yards",
                column: "State");

            migrationBuilder.CreateIndex(
                name: "IX_AssetLocations_AssetId_Unique",
                table: "AssetLocations",
                column: "AssetId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssetLocations_Source_ExternalRef",
                table: "AssetLocations",
                columns: new[] { "Source", "ExternalRef" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetLocations");

            migrationBuilder.DropIndex(
                name: "IX_Yards_State",
                table: "Yards");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Yards");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Yards");

            migrationBuilder.AlterColumn<string>(
                name: "address2",
                table: "Yards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ZipCode",
                table: "Yards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(12)",
                oldMaxLength: 12,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "State",
                table: "Yards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2)",
                oldMaxLength: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "Yards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Yards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Country",
                table: "Yards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2)",
                oldMaxLength: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "City",
                table: "Yards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "Yards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Yards",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "City", "Country", "State" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "Yards",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "City", "Country", "State" },
                values: new object[] { null, null, null });
        }
    }
}
