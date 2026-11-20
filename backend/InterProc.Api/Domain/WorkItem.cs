namespace InterProc.Api.Domain;

public sealed class WorkItem
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Code { get; set; }
    public Guid ClientId { get; set; }
    public required Client Client { get; set; }
    public required string State { get; set; }
    public int ProgressPercent { get; set; }
    public bool IsArchived { get; set; }
    public ICollection<ClientNote> ClientNotes { get; set; } = [];
}

public static class WorkStates
{
    public const string Draft = "Borrador";
    public const string Quotation = "Presupuesto";
    public const string Planned = "Planificado";
    public const string Running = "En Ejecución";
    public const string Completed = "Terminado";
    public const string Cancelled = "Cancelado";
    public const string Paused = "Pausado";
    public const string Maintenance = "En Mantenimiento";

    public static bool IsClosed(string state) => state is Completed or Cancelled;
}
