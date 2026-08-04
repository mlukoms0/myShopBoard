using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;

namespace myShopBoard.API;

/// <summary>
/// Global exception handler for the API. Catches unhandled exceptions and returns a JSON response with the error message and trace id.
/// </summary>
public partial class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, message) = exception switch
        {
            KeyNotFoundException      => (StatusCodes.Status404NotFound,   exception.Message),
            ArgumentException         => (StatusCodes.Status400BadRequest, exception.Message),
            InvalidOperationException => (StatusCodes.Status409Conflict,   exception.Message),
            _                         => (StatusCodes.Status500InternalServerError,
                                          "An unexpected error occurred."),
        };

        // Correlation id lets you find the full detail in the logs from a user's screenshot.
        var traceId = httpContext.TraceIdentifier;

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            LogUnhandledException(logger, traceId, exception);
        }
        else
        {
            LogHandledException(logger, exception.GetType().Name, exception.Message, traceId);
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";

        // NOTE: never serialize exception.ToString() here - stack traces should not reach the browser.
        await httpContext.Response.WriteAsync(
            JsonSerializer.Serialize(new { error = message, traceId }),
            cancellationToken);

        return true;
    }

    // Source-generated logging (CA1848).
    
    [LoggerMessage(
        EventId = 1000,
        Level = LogLevel.Error,
        Message = "Unhandled exception. TraceId {TraceId}")]
    private static partial void LogUnhandledException(ILogger logger, string traceId, Exception exception);

    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Warning,
        Message = "Handled {ExceptionType}: {ExceptionMessage}. TraceId {TraceId}")]
    private static partial void LogHandledException(
        ILogger logger,
        string exceptionType,
        string exceptionMessage,
        string traceId);
}