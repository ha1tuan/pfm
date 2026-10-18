using FFM.BuildingBlocks.Results;

namespace FFM.BuildingBlocks.Application;

/// <summary>One implementation per use case, injected straight into its endpoint (no mediator, D3).</summary>
public interface IQueryHandler<in TQuery, TResult>
{
    Task<Result<TResult>> HandleAsync(TQuery query, CancellationToken cancellationToken);
}
