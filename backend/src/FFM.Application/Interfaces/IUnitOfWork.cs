namespace FFM.Application.Interfaces;

/// <summary>
/// The one DB transaction a use case commits in, across every feature schema (ADR-0004).
/// Repositories, audit and outbox writes made in the same scope are saved together.
/// </summary>
public interface IUnitOfWork
{
    /// <summary>Saves pending changes; outside <see cref="BeginTransactionAsync"/> this is its own transaction.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken);

    /// <summary>Opens a transaction that spans several saves; dispose without commit rolls back.</summary>
    Task<IUnitOfWorkTransaction> BeginTransactionAsync(CancellationToken cancellationToken);
}

public interface IUnitOfWorkTransaction : IAsyncDisposable
{
    Task CommitAsync(CancellationToken cancellationToken);
}
