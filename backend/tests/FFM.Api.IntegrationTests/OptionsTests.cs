using Microsoft.Extensions.Options;

namespace FFM.Api.IntegrationTests;

public sealed class OptionsTests(Infrastructure infrastructure)
{
    public static TheoryData<string> RequiredSettings =>
        ["ConnectionStrings:Postgres", "ConnectionStrings:RabbitMq", "ConnectionStrings:Redis", "Jwt:SigningKey"];

    [Theory]
    [MemberData(nameof(RequiredSettings))]
    public async Task Api_fails_at_startup_when_a_required_setting_is_missing(string setting)
    {
        await using var factory = new ApiFactory(infrastructure, setting);

        var error = Assert.Throws<OptionsValidationException>(() => factory.CreateClient());

        Assert.Contains(setting.Split(':')[1], error.Message);
    }
}
