using FFM.BuildingBlocks.Results;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FFM.BuildingBlocks.Http;

internal sealed partial class UnexpectedExceptionHandler(
    IProblemDetailsService problemDetails, ILogger<UnexpectedExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        LogUnexpected(exception, httpContext.TraceIdentifier);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = ErrorProblem.Create("internalError", StatusCodes.Status500InternalServerError, httpContext),
            Exception = exception,
        });
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Unhandled exception for request {TraceIdentifier}")]
    private partial void LogUnexpected(Exception exception, string traceIdentifier);
}
