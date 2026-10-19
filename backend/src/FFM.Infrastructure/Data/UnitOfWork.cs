using FFM.Application.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace FFM.Infrastructure.Data;

internal sealed class UnitOfWork(FfmDbContext db) : IUnitOfWork
{
    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);

    public async Task<IUnitOfWorkTransaction> BeginTransactionAsync(CancellationToken cancellationToken) =>
        new Transaction(await db.Database.BeginTransactionAsync(cancellationToken));

    private sealed class Transaction(IDbContextTransaction transaction) : IUnitOfWorkTransaction
    {
        public Task CommitAsync(CancellationToken cancellationToken) => transaction.CommitAsync(cancellationToken);

        public ValueTask DisposeAsync() => transaction.DisposeAsync();
    }
}
