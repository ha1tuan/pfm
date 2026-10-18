using FFM.BuildingBlocks.Results;

namespace FFM.BuildingBlocks.Application;

/// <summary>One implementation per use case, injected straight into its endpoint (no mediator, D3).</summary>
public interface ICommandHandler<in TCommand, TResult>
{
    Task<Result<TResult>> HandleAsync(TCommand command, CancellationToken cancellationToken);
}
