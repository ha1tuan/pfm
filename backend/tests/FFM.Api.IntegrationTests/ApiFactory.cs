using System.Security.Cryptography;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace FFM.Api.IntegrationTests;

public sealed class ApiFactory(Infrastructure infrastructure, params string[] omittedSettings)
    : WebApplicationFactory<Program>
{
    private static readonly string SigningKey = RSA.Create(2048).ExportRSAPrivateKeyPem();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var settings = new Dictionary<string, string>
        {
            ["ConnectionStrings:Postgres"] = infrastructure.Postgres.GetConnectionString(),
            ["ConnectionStrings:RabbitMq"] = infrastructure.RabbitMq.GetConnectionString(),
            ["ConnectionStrings:Redis"] = infrastructure.Redis.GetConnectionString(),
            ["Jwt:SigningKey"] = SigningKey,
        };

        foreach (var (key, value) in settings)
        {
            // Blank rather than absent, so appsettings.Development.json cannot fill the gap.
            builder.UseSetting(key, omittedSettings.Contains(key) ? string.Empty : value);
        }
    }
}
