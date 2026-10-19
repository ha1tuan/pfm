namespace FFM.Application.Interfaces;

/// <summary>SMS provider. Only a mock adapter exists (Infrastructure/External/Sms), selected by <c>Sms:Mode</c>.</summary>
public interface ISmsSender
{
    Task SendAsync(SmsMessage message, CancellationToken cancellationToken);
}

/// <param name="Phone">E.164 recipient.</param>
public sealed record SmsMessage(string Phone, string Text);
