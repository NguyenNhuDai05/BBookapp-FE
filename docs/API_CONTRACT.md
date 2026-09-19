# BBook Frontend API Contract

This document is the frontend's single reference for the ASP.NET Core API currently available in `BeautyBookBackend/Controllers`. All paths are relative to `EXPO_PUBLIC_API_URL`, which must end in `/api`.

## Authentication

| Method | Path | Authentication | Frontend owner |
| --- | --- | --- | --- |
| POST | `/Auth/register` | Public | `ApiAuthRepository.register` |
| POST | `/Auth/login` | Public | `ApiAuthRepository.login` |
| POST | `/Auth/google` | Public | `ApiAuthRepository.loginWithGoogle` |
| POST | `/Auth/become-mua` | Bearer JWT | `AuthService.becomeMua` |
| GET | `/User/profile` | Bearer JWT | `ApiAuthRepository.getMe`, `userService` |
| PUT | `/User/profile` | Bearer JWT | `userService` |

## MUA, services, and portfolio

| Method | Path | Authentication |
| --- | --- | --- |
| GET | `/Mua?page={page}` | Public |
| GET | `/Mua/{id}` | Public |
| GET | `/Mua/{id}/availability?date={date}&duration={minutes}` | Public |
| PUT | `/Mua/profile` | Bearer JWT; MUA profile required |
| GET | `/Mua/{id}/service` | Public |
| POST | `/Mua/{muaId}/service` | Bearer JWT; MUA profile required |
| PUT | `/Mua/service/{id}` | Bearer JWT; owner required |
| DELETE | `/Mua/service/{id}` | Bearer JWT; owner required |
| GET | `/Mua/{id}/portfolio` | Public |
| POST | `/Mua/portfolio` | Bearer JWT; MUA/Admin |
| PUT | `/Mua/portfolio/{id}` | Bearer JWT; MUA/Admin owner |
| DELETE | `/Mua/portfolio/{id}` | Bearer JWT; MUA/Admin owner |
| POST | `/Mua/portfolio/{id}/like` | Bearer JWT |
| POST | `/Mua/portfolio/{id}/save` | Bearer JWT |
| GET | `/Mua/portfolio/{id}/comments` | Public |
| POST | `/Mua/portfolio/{id}/comments` | Bearer JWT |
| POST | `/Mua/portfolio/{id}/comments/{commentId}/replies` | Bearer JWT |
| GET | `/Mua/portfolio/favorites?type=liked|saved` | Bearer JWT |
| GET | `/Mua/styles` | Public |
| PUT | `/Mua/styles` | Bearer JWT; MUA/Admin |
| GET | `/Feed?page={page}&limit={limit}` | Public |

Portfolio reorder, cover, visibility, and pin endpoints do not exist. The frontend must not expose those operations until the backend contract adds them.

## Booking and reviews

| Method | Path | Authentication |
| --- | --- | --- |
| POST | `/Booking/create` | Bearer JWT |
| POST | `/Booking/{id}/deposit-payment` | Bearer JWT; creates/reuses a payOS payment link for the booking deposit |
| POST | `/Booking/payos/webhook` | Anonymous; verified payOS webhook updates payment and booking status |
| GET | `/Booking?viewAs=customer|mua` | Bearer JWT |
| GET | `/Booking/{id}` | Bearer JWT; participant |
| PUT | `/Booking/{id}/status` | Bearer JWT; transition permissions apply |
| POST | `/Booking/{id}/resolve-dispute` | Admin |
| POST | `/Booking/auto-complete-overdue` | Admin |
| GET | `/Review/mua/{muaId}` | Public |
| POST | `/Review/booking/{bookingId}` | Bearer JWT; customer |
| POST | `/Review/{reviewId}/reply` | Bearer JWT; MUA/Admin |

There is no `/Booking/upcoming` endpoint. The frontend uses the normal booking list and filters locally when an upcoming item is needed.

## Wallet and payments

| Method | Path | Authentication |
| --- | --- | --- |
| GET | `/Wallet` | Bearer JWT |
| POST | `/Wallet/topups` | Bearer JWT |
| GET | `/Wallet/topups` | Bearer JWT |
| GET | `/Wallet/topups/{id}` | Bearer JWT; owner |
| POST | `/Wallet/topups/payos/webhook` | Public; PayOS signature required |
| POST | `/Wallet/withdraw` | Bearer JWT |

## Chat, upload, and notifications

| Method | Path | Authentication |
| --- | --- | --- |
| GET | `/Chat/rooms` | Bearer JWT |
| POST | `/Chat/mua/{muaId}` | Bearer JWT |
| GET | `/Chat/rooms/{roomId}/messages` | Bearer JWT; participant |
| POST | `/Chat/rooms/{roomId}/messages` | Bearer JWT; participant |
| POST | `/Chat/rooms/{roomId}/messages/{messageId}/reaction` | Bearer JWT; participant |
| POST | `/Chat/rooms/{roomId}/join?connectionId={id}` | Bearer JWT; participant |
| POST | `/Chat/rooms/{roomId}/leave?connectionId={id}` | Bearer JWT |
| POST | `/Upload/image` | Bearer JWT; multipart field `file` |
| POST | `/Notification/device-token` | Bearer JWT |
| DELETE | `/Notification/device-token` | Bearer JWT; JSON body |

SignalR hub: `/chathub`.

## Known backend gaps represented safely in the frontend

- Monthly MUA availability editing is not supported. Legacy hooks return no data or a clear unsupported error and never call an invented endpoint.
- MUA onboarding drafts are stored locally. Submission uses `/Auth/become-mua` followed by `/Mua/profile`.
- Admin approval, portfolio ordering/pinning/visibility, and recent-review aggregation are not exposed by the current API.
