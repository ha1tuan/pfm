# ADR-0004: Clean Architecture bốn tầng thay cho modular monolith

- Trạng thái: Đã chấp nhận (2026-10-19)
- Thay thế: ADR-0002 (modular monolith, mỗi module hai project)

## Bối cảnh

Walking skeleton dựng backend theo ADR-0002: 8 module, mỗi module gồm `FFM.Modules.<X>` (internal) và `FFM.Modules.<X>.Contracts` (public), cộng `FFM.BuildingBlocks`. Tổng cộng 19 project cho một codebase chưa có use case nào. Mỗi module có DbContext riêng, nên muốn commit Transfer, Wallet, Audit và outbox cùng nhau thì phải có `IUnitOfWork` enlist nhiều DbContext vào một connection.

Nhóm muốn cấu trúc quen thuộc hơn, theo template Clean Architecture phổ biến của .NET: một project cho mỗi tầng.

## Quyết định

1. Backend gồm bốn project theo tầng, phụ thuộc chỉ hướng vào trong:
   - `FFM.Domain`: entity, value object, quy tắc, interface repository, `Result`/`Error`. Không tham chiếu gì ngoài BCL.
   - `FFM.Application`: use case, DTO, validator, interface ra ngoài. Chỉ tham chiếu Domain và FluentValidation.
   - `FFM.Infrastructure`: EF Core, Dapper, Redis, RabbitMQ, provider mock, job, consumer.
   - `FFM.Api`: endpoint Minimal API, middleware, filter, auth.

   `FFM.Worker` vẫn là một host riêng, tham chiếu Application và Infrastructure.
2. Vùng nghiệp vụ (Identity, Wallet, Transfer, BankLink, Pricing, PFM, Audit, Admin) là **thư mục con** trong từng tầng, không còn là project.
3. Use case nghiệp vụ dùng một handler cho mỗi use case (giữ D3). CRUD thuần trên một entity của User dùng `XxxService`. Tiêu chí ở `backend/docs/architecture.md` §5.
4. Một `FfmDbContext` cho mọi schema. Schema theo feature vẫn giữ để tổ chức dữ liệu. Outbox và inbox gom về schema `messaging`.
5. Consumer và job chỉ đăng ký qua `AddWorkerServices()`, do `FFM.Worker` gọi.
6. `FFM.ArchitectureTests` kiểm hướng phụ thuộc giữa tầng, và vị trí của handler và service.

## Hệ quả

Tốt:

- Còn 5 project nguồn thay vì 19. Cấu trúc quen thuộc với người đã biết Clean Architecture.
- Một DbContext nên một DB transaction xuyên schema là `BeginTransactionAsync` bình thường, không cần enlist.
- Câu hỏi "consumer chạy ở host nào" có câu trả lời rõ: `AddWorkerServices()`.

Mất đi:

- **Ranh giới giữa các feature không còn được compiler hay arch test chặn.** Trước đây Transfer không thể gọi phần internal của Wallet. Giờ mọi class nằm chung project, nên quy tắc sở hữu (Transfer sở hữu Transaction, chỉ `ILedgerPosting` ghi Sổ cái, Admin chỉ giữ Dashboard) chỉ còn là quy ước và dựa vào code review.
- Truy vấn đọc được JOIN xuyên schema. Việc này tiện, nhưng nếu sau này cần tách một feature ra service riêng thì sẽ khó hơn so với ADR-0002.
- `Contracts` biến mất: interface dùng chung giữa các feature (`ISmartOtpVerifier`, `ILedgerPosting`, `IPricingQuery` …) chuyển vào `Application/Interfaces`.

Nếu sau này cần lại ranh giới cứng giữa các feature, có thể thêm rule NetArchTest theo namespace (`UseCases.Transfer` không dùng type của `Data.Repositories.Wallet` …) mà không phải tách lại project.
