using InterProc.Api.Domain;
using InterProc.Api.Services;
using Xunit;

namespace InterProc.Api.Tests;

public sealed class ClientRulesTests
{
    [Theory]
    [InlineData(WorkStates.Completed, false)]
    [InlineData(WorkStates.Cancelled, false)]
    [InlineData(WorkStates.Draft, true)]
    [InlineData(WorkStates.Running, true)]
    public void Open_work_rule_uses_only_completed_and_cancelled_as_closed(string state, bool expected)
    {
        var client = ClientWithWork(state, archived: false);
        Assert.Equal(expected, ClientRules.HasOpenWorks(client));
    }

    [Fact]
    public void Archived_work_does_not_block_client_archive()
    {
        Assert.False(ClientRules.HasOpenWorks(ClientWithWork(WorkStates.Running, archived: true)));
    }

    [Fact]
    public void Optional_foreign_tax_id_is_trimmed_without_format_validation()
    {
        Assert.Equal("AR 30-123", ClientRules.CleanOptional("  AR 30-123  "));
        Assert.Null(ClientRules.CleanOptional("  "));
    }

    private static Client ClientWithWork(string state, bool archived) => new()
    {
        Name = "Client", NormalizedName = "CLIENT",
        Works = [new WorkItem { Name = "Work", Code = "TRB-TEST", Client = null!, State = state, IsArchived = archived }]
    };
}
