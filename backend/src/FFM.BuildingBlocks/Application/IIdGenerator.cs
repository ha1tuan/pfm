namespace FFM.BuildingBlocks.Application;

/// <summary>The one place primary keys are generated: UUIDv7, time-ordered for index locality.</summary>
public interface IIdGenerator
{
    Guid NewId();
}

internal sealed class UuidV7Generator(TimeProvider timeProvider) : IIdGenerator
{
    public Guid NewId() => Guid.CreateVersion7(timeProvider.GetUtcNow());
}
