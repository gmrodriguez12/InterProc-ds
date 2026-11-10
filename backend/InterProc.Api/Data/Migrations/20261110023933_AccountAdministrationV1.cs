using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InterProc.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AccountAdministrationV1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM "AspNetUsers"
                        WHERE "NormalizedEmail" IS NOT NULL
                        GROUP BY "NormalizedEmail"
                        HAVING COUNT(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'AccountAdministrationV1 cannot create a unique email index because duplicate normalized emails exist. Resolve the duplicates and retry the migration.';
                    END IF;

                    IF EXISTS (SELECT 1 FROM "AspNetRoles" WHERE "NormalizedName" = 'USER')
                       AND EXISTS (SELECT 1 FROM "AspNetRoles" WHERE "NormalizedName" = 'USUARIO') THEN
                        RAISE EXCEPTION 'AccountAdministrationV1 found both USER and USUARIO roles. Consolidate their memberships and retry the migration.';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropIndex(
                name: "EmailIndex",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail",
                unique: true);

            migrationBuilder.Sql(
                """
                UPDATE "AspNetRoles"
                SET "Name" = 'admin'
                WHERE "NormalizedName" = 'ADMIN';

                UPDATE "AspNetRoles"
                SET "Name" = 'usuario', "NormalizedName" = 'USUARIO'
                WHERE "NormalizedName" = 'USER';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "AspNetRoles"
                SET "Name" = 'Admin'
                WHERE "NormalizedName" = 'ADMIN';

                UPDATE "AspNetRoles"
                SET "Name" = 'User', "NormalizedName" = 'USER'
                WHERE "NormalizedName" = 'USUARIO';
                """);

            migrationBuilder.DropIndex(
                name: "EmailIndex",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "AspNetUsers");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");
        }
    }
}
