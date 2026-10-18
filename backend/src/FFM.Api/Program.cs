using FFM.Api.Auth;
using FFM.BuildingBlocks;
using FFM.BuildingBlocks.Health;
using FFM.BuildingBlocks.Http;
using FFM.BuildingBlocks.Logging;
using FFM.Modules.Admin;
using FFM.Modules.Audit;
using FFM.Modules.BankLink;
using FFM.Modules.Identity;
using FFM.Modules.Pfm;
using FFM.Modules.Pricing;
using FFM.Modules.Transfer;
using FFM.Modules.Wallet;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.AddStructuredLogging();
builder.Services.AddBuildingBlocks();
builder.Services.AddErrorHandling();
builder.Services.AddDependencyHealthChecks();
builder.Services.AddJwtAuthentication();

builder.Services.AddIdentityModule(builder.Configuration);
builder.Services.AddWalletModule(builder.Configuration);
builder.Services.AddTransferModule(builder.Configuration);
builder.Services.AddBankLinkModule(builder.Configuration);
builder.Services.AddPricingModule(builder.Configuration);
builder.Services.AddPfmModule(builder.Configuration);
builder.Services.AddAuditModule(builder.Configuration);
builder.Services.AddAdminModule(builder.Configuration);

var app = builder.Build();

app.UseErrorHandling();
app.UseSerilogRequestLogging();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthEndpoints();

app.MapIdentityEndpoints();
app.MapWalletEndpoints();
app.MapTransferEndpoints();
app.MapBankLinkEndpoints();
app.MapPricingEndpoints();
app.MapPfmEndpoints();
app.MapAuditEndpoints();
app.MapAdminEndpoints();

app.Run();

public partial class Program;
