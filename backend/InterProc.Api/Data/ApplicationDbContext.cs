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
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientNote> ClientNotes => Set<ClientNote>();
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();

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

        modelBuilder.Entity<Client>(entity =>
        {
            entity.Property(client => client.Name).HasMaxLength(200);
            entity.Property(client => client.NormalizedName).HasMaxLength(200);
            entity.Property(client => client.TaxId).HasMaxLength(100);
            entity.Property(client => client.ContactPerson).HasMaxLength(160);
            entity.Property(client => client.Email).HasMaxLength(256);
            entity.Property(client => client.Phone).HasMaxLength(80);
            entity.Property(client => client.Address).HasMaxLength(500);
            entity.Property(client => client.ConcurrencyToken).IsConcurrencyToken();
            entity.HasIndex(client => client.NormalizedName).IsUnique().HasFilter("\"IsArchived\" = false");
        });

        modelBuilder.Entity<WorkItem>(entity =>
        {
            entity.ToTable(table =>
            {
                table.HasCheckConstraint("CK_WorkItems_ProgressPercent", "\"ProgressPercent\" >= 0 AND \"ProgressPercent\" <= 100");
                table.HasCheckConstraint("CK_WorkItems_State", "\"State\" IN ('Borrador', 'Presupuesto', 'Planificado', 'En Ejecución', 'Terminado', 'Cancelado', 'Pausado', 'En Mantenimiento')");
            });
            entity.Property(work => work.Name).HasMaxLength(200);
            entity.Property(work => work.Code).HasMaxLength(40);
            entity.Property(work => work.State).HasMaxLength(40);
            entity.HasIndex(work => work.Code).IsUnique();
            entity.HasOne(work => work.Client).WithMany(client => client.Works)
                .HasForeignKey(work => work.ClientId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ClientNote>(entity =>
        {
            entity.Property(note => note.CreatedByUserId).HasMaxLength(450);
            entity.Property(note => note.CreatedByDisplayName).HasMaxLength(160);
            entity.Property(note => note.UpdatedByUserId).HasMaxLength(450);
            entity.Property(note => note.UpdatedByDisplayName).HasMaxLength(160);
            entity.Property(note => note.ConcurrencyToken).IsConcurrencyToken();
            entity.HasOne(note => note.Client).WithMany(client => client.Notes)
                .HasForeignKey(note => note.ClientId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(note => note.WorkItem).WithMany(work => work.ClientNotes)
                .HasForeignKey(note => note.WorkItemId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
