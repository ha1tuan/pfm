namespace FFM.Application.Interfaces;

/// <summary>The one place primary keys are generated: UUIDv7, time-ordered for index locality.</summary>
public interface IIdGenerator
{
    Guid NewId();
}
