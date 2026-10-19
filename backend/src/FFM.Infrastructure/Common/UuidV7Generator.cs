using FFM.Application.Interfaces;

namespace FFM.Infrastructure.Common;

internal sealed class UuidV7Generator(TimeProvider timeProvider) : IIdGenerator
{
    public Guid NewId() => Guid.CreateVersion7(timeProvider.GetUtcNow());
}
