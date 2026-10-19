using FFM.Application;
using FFM.Infrastructure.DependencyInjection;
using FFM.Infrastructure.Logging;

var builder = Host.CreateApplicationBuilder(args);

builder.AddStructuredLogging();
builder.Services.AddApplication();
builder.Services.AddInfrastructure();
builder.Services.AddWorkerServices();

var host = builder.Build();
host.Run();
