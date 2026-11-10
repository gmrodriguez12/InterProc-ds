using InterProc.Api.Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

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
    }
}
