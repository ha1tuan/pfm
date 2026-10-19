using FFM.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace FFM.Infrastructure.External.Sms;

/// <summary>Sends nothing; logs the message so a developer can read the OTP. Never registered with a real provider.</summary>
internal sealed partial class MockSmsSender(ILogger<MockSmsSender> logger) : ISmsSender
{
    public const string Mode = "mock";

    public Task SendAsync(SmsMessage message, CancellationToken cancellationToken)
    {
        LogSms(message.Phone, message.Text);
        return Task.CompletedTask;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Mock SMS to {Phone}: {Text}")]
    private partial void LogSms(string phone, string text);
}
