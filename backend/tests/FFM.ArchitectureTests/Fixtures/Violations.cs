using FFM.Application.Interfaces;
using FFM.Domain.Common;

// Deliberate violations: each rule in ArchRules has a test proving it catches one of these.

namespace FFM.ArchitectureTests.Fixtures
{
    internal static class UsesApi
    {
        // A type from FFM.Api, so this assembly carries a reference to it.
        public static readonly Type EntryPoint = typeof(FFM.Api.Auth.JwtOptions);
    }
}

namespace FFM.ArchitectureTests.Fixtures.Misplaced
{
    // Deliberate violation: a handler outside UseCases.
    internal sealed class TopUpHandler : ICommandHandler<int, int>
    {
        public Task<Result<int>> HandleAsync(int command, CancellationToken cancellationToken) =>
            Task.FromResult<Result<int>>(command);
    }

    // Deliberate violation: a service outside Services.
    internal sealed class CategoryService;
}

namespace FFM.ArchitectureTests.Fixtures.UseCases.Wallet
{
    // Deliberate violation: inside UseCases but not named *Handler.
    internal sealed class TopUp : IQueryHandler<int, int>
    {
        public Task<Result<int>> HandleAsync(int query, CancellationToken cancellationToken) =>
            Task.FromResult<Result<int>>(query);
    }
}
