using InterProc.Api.Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<ProcedureType> ProcedureTypes => Set<ProcedureType>();
    public DbSet<Procedure> Procedures => Set<Procedure>();
    public DbSet<ProcedureVersion> ProcedureVersions => Set<ProcedureVersion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.DisplayName).HasMaxLength(160);
            entity.HasIndex(user => user.NormalizedEmail).IsUnique();
        });

        modelBuilder.Entity<AuditEvent>(entity =>
        {
            entity.Property(audit => audit.Action).HasMaxLength(32);
            entity.Property(audit => audit.EntityType).HasMaxLength(80);
            entity.Property(audit => audit.EntityId).HasMaxLength(80);
            entity.Property(audit => audit.EntityLabel).HasMaxLength(240);
            entity.Property(audit => audit.UserId).HasMaxLength(450);
            entity.Property(audit => audit.UserDisplayName).HasMaxLength(160);
            entity.HasIndex(audit => audit.OccurredAtUtc);
            entity.HasIndex(audit => new { audit.EntityType, audit.EntityId });
        });

        modelBuilder.Entity<ProcedureType>(entity =>
        {
            entity.Property(type => type.Name).HasMaxLength(120);
            entity.Property(type => type.NormalizedName).HasMaxLength(120);
            entity.Property(type => type.Icon).HasMaxLength(80);
            entity.Property(type => type.ConcurrencyToken).IsConcurrencyToken();
            entity.HasIndex(type => type.NormalizedName).IsUnique().HasFilter("\"IsArchived\" = false");
        });

        modelBuilder.Entity<Procedure>(entity =>
        {
            entity.Property(procedure => procedure.Title).HasMaxLength(180);
            entity.Property(procedure => procedure.NormalizedTitle).HasMaxLength(180);
            entity.Property(procedure => procedure.Icon).HasMaxLength(80);
            entity.Property(procedure => procedure.ShortDescription).HasMaxLength(500);
            entity.Property(procedure => procedure.ConcurrencyToken).IsConcurrencyToken();
            entity.HasIndex(procedure => new { procedure.ProcedureTypeId, procedure.NormalizedTitle })
                .IsUnique().HasFilter("\"IsArchived\" = false");
            entity.HasOne(procedure => procedure.ProcedureType)
                .WithMany(type => type.Procedures)
                .HasForeignKey(procedure => procedure.ProcedureTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProcedureVersion>(entity =>
        {
            entity.Property(version => version.Reason).HasMaxLength(500);
            entity.Property(version => version.CreatedByUserId).HasMaxLength(450);
            entity.Property(version => version.CreatedByDisplayName).HasMaxLength(160);
            entity.HasIndex(version => new { version.ProcedureId, version.Number }).IsUnique();
            entity.HasOne(version => version.Procedure)
                .WithMany(procedure => procedure.Versions)
                .HasForeignKey(version => version.ProcedureId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
