using FFM.Domain.Entities.Identity;

namespace FFM.Application.DTOs.Identity;

public sealed record UserSummary(Guid Id, string FullName, string Phone, int KycLevel, UserStatus Status);
