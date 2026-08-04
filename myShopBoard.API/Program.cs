namespace myShopBoard.API;

/// <summary>
/// Application entry point and composition root.
/// </summary>
/// <remarks>
/// Declared as an explicit class rather than using C# top-level statements, for two reasons:
/// <list type="bullet">
///   <item>it matches the myStorage house convention, and</item>
///   <item><c>public partial class Program</c> is what makes <c>WebApplicationFactory&lt;Program&gt;</c>
///   usable from the test project. myStorage cannot add API integration tests today without
///   first making this exact change.</item>
/// </list>
/// </remarks>
public partial class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddControllers();
        builder.Services.AddOpenApi();

        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        // TODO(pipeline): the full middleware chain is added in later steps, and its ORDER is
        // load-bearing - see ZDocumentation/ARCHITECTURE.md section 11, invariant 1:
        //   UseForwardedHeaders -> UseExceptionHandler -> [dev] OpenAPI -> UseCors
        //   -> UseAuthentication -> UseAuthorization -> UseRateLimiter -> MapControllers
        //
        // UseHttpsRedirection is deliberately absent for now. In a container behind Cloud Run,
        // TLS terminates at Google's edge and the app itself serves plain HTTP on port 8080;
        // enabling redirection before ForwardedHeaders is configured causes redirect loops.
        // It is added together with UseHsts and correct proxy configuration in the deploy step.

        app.UseAuthorization();
        app.MapControllers();

        // Liveness probe. Docker and Cloud Run health checks hit this.
        // A readiness check that actually verifies database connectivity arrives in Step 3.
        app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

        app.Run();
    }
}
