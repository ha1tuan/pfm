using System.Diagnostics.CodeAnalysis;

namespace FFM.Domain.Common;

/// <summary>Outcome of a use case that returns no value (lock, approve, verify).</summary>
public sealed class Result
{
    private static readonly Result SuccessInstance = new(null);

    private Result(Error? error)
    {
        Error = error;
    }

    [MemberNotNullWhen(false, nameof(Error))]
    public bool IsSuccess => Error is null;

    [MemberNotNullWhen(true, nameof(Error))]
    public bool IsFailure => Error is not null;

    public Error? Error { get; }

    public static Result Success() => SuccessInstance;

    public static Result Failure(Error error)
    {
        ArgumentNullException.ThrowIfNull(error);
        return new Result(error);
    }

    public static implicit operator Result(Error error) => Failure(error);
}

/// <summary>Outcome of a use case: a value, or the business <see cref="Results.Error"/> that prevented it.</summary>
/// <remarks>A class, not a struct: <c>default(Result&lt;T&gt;)</c> would be neither success nor failure.</remarks>
public sealed class Result<T>
{
    private Result(T? value, Error? error)
    {
        Value = value;
        Error = error;
    }

    [MemberNotNullWhen(true, nameof(Value))]
    [MemberNotNullWhen(false, nameof(Error))]
    public bool IsSuccess => Error is null;

    [MemberNotNullWhen(true, nameof(Error))]
    [MemberNotNullWhen(false, nameof(Value))]
    public bool IsFailure => Error is not null;

    public T? Value { get; }

    public Error? Error { get; }

    public static Result<T> Success(T value)
    {
        ArgumentNullException.ThrowIfNull(value);
        return new Result<T>(value, null);
    }

    public static Result<T> Failure(Error error)
    {
        ArgumentNullException.ThrowIfNull(error);
        return new Result<T>(default, error);
    }

    /// <summary>Transforms the value; a failure passes through unchanged.</summary>
    public Result<TNew> Map<TNew>(Func<T, TNew> map) =>
        IsSuccess ? Result<TNew>.Success(map(Value)) : Result<TNew>.Failure(Error);

    public static implicit operator Result<T>(T value) => Success(value);

    public static implicit operator Result<T>(Error error) => Failure(error);
}
