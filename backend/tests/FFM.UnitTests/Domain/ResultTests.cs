using FFM.Domain.Common;

namespace FFM.UnitTests.Domain;

public class ResultTests
{
    private static readonly Error OverLimit = new("overLimit", ErrorKind.BusinessRule);

    [Fact]
    public void Value_converts_to_success()
    {
        Result<int> result = 42;

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(42, result.Value);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Error_converts_to_failure()
    {
        Result<int> result = OverLimit;

        Assert.True(result.IsFailure);
        Assert.Same(OverLimit, result.Error);
    }

    [Fact]
    public void Map_transforms_a_success()
    {
        Result<int> result = 42;

        var mapped = result.Map(v => $"#{v}");

        Assert.Equal("#42", mapped.Value);
    }

    [Fact]
    public void Map_passes_a_failure_through_without_calling_the_mapper()
    {
        Result<int> result = OverLimit;

        var mapped = result.Map<string>(_ => throw new InvalidOperationException("must not run"));

        Assert.Same(OverLimit, mapped.Error);
    }

    [Fact]
    public void Failure_of_one_type_returns_as_failure_of_another()
    {
        // The handler shape in docs/architecture.md §5: `if (otp.IsFailure) return otp.Error;`
        static Result<string> Handle(Result check) => check.IsFailure ? check.Error : "done";

        Assert.Same(OverLimit, Handle(OverLimit).Error);
        Assert.Equal("done", Handle(Result.Success()).Value);
    }

    [Fact]
    public void Null_value_or_error_is_rejected()
    {
        Assert.Throws<ArgumentNullException>(() => Result<string>.Success(null!));
        Assert.Throws<ArgumentNullException>(() => Result<string>.Failure(null!));
        Assert.Throws<ArgumentNullException>(() => Result.Failure(null!));
    }
}
