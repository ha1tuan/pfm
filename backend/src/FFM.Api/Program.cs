using FFM.Api.Auth;
using FFM.Api.Endpoints;
using FFM.Api.Middleware;
using FFM.Api.OpenApi;
using FFM.Application;
using FFM.Infrastructure.Data;
using FFM.Infrastructure.DependencyInjection;
using FFM.Infrastructure.Health;
using FFM.Infrastructure.Logging;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddBuildTimeDocumentPlaceholders();

builder.AddStructuredLogging();
builder.Services.AddApplication();
builder.Services.AddInfrastructure();
builder.Services.AddDependencyHealthChecks();
builder.Services.AddErrorHandling();
builder.Services.AddJwtAuthentication();
builder.Services.AddDevCors(builder.Configuration);
builder.Services.AddFfmOpenApi();

var app = builder.Build();

if (app.Configuration.GetValue<bool>(DatabaseMigrationExtensions.MigrateOnStartupKey))
{
    await app.MigrateDatabaseAsync();
}

app.UseErrorHandling();
app.UseSerilogRequestLogging();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapHealthEndpoints();
app.MapApiEndpoints();

app.Run();

public partial class Program;
