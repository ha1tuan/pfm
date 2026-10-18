using FFM.BuildingBlocks;
using FFM.BuildingBlocks.Logging;
using FFM.Modules.Admin;
using FFM.Modules.Audit;
using FFM.Modules.BankLink;
using FFM.Modules.Identity;
using FFM.Modules.Pfm;
using FFM.Modules.Pricing;
using FFM.Modules.Transfer;
using FFM.Modules.Wallet;

var builder = Host.CreateApplicationBuilder(args);

builder.AddStructuredLogging();
builder.Services.AddBuildingBlocks();

builder.Services.AddIdentityModule(builder.Configuration);
builder.Services.AddWalletModule(builder.Configuration);
builder.Services.AddTransferModule(builder.Configuration);
builder.Services.AddBankLinkModule(builder.Configuration);
builder.Services.AddPricingModule(builder.Configuration);
builder.Services.AddPfmModule(builder.Configuration);
builder.Services.AddAuditModule(builder.Configuration);
builder.Services.AddAdminModule(builder.Configuration);

var host = builder.Build();
host.Run();
