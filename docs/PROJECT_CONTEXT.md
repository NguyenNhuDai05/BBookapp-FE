# BeautyBook Project Context

## Product Vision
Transform the existing BeautyBook Expo React Native codebase into a production-quality marketplace MVP. Think like a founding CTO responsible for launching BeautyBook to real customers in the Vietnamese market.

## Marketplace Model
BeautyBook is a two-sided beauty marketplace connecting:
- Customers (seeking beauty/makeup services)
- Makeup Artists / MUAs (providing beauty/makeup services)

**Target Market:**
- Vietnam
- Mobile-first
- Age 18–35

**Comparable products:**
- Airbnb
- Fresha
- Treatwell
- Grab
- Uber

## User Roles
1. **Customer**: Books services, manages bookings, leaves reviews.
2. **MUA (Makeup Artist)**: Onboards, creates a portfolio, lists services, manages bookings.
3. **Admin**: Approves/rejects MUA applications, manages users, handles disputes, and monitors marketplace health.

## Current Architecture
- **Framework**: React Native with Expo Router.
- **State Management**: Zustand (for application state) + `@tanstack/react-query` (for server state).
- **Navigation**: File-based routing with Role-Based Access Control (RBAC) guards (`useProtectedRoute`).
- **Data Layer Pattern**: Clean Architecture (UI -> Hooks -> Services -> Repositories -> Mock Data). No UI component calls raw APIs or mock data directly.

## Current Implementation Status
- Authentication Foundation: **Completed** (Mock JWT generation, user roles, token persistence).
- Route Guards & RBAC: **Completed** (Automatically routes Customers, MUAs, and Admins to their respective portals).
- Data Layer Refactoring: **Completed** (`homeService`, `reviewService`, `muaOnboardingService` successfully migrated to the Repository pattern and React Query).

## Known Technical Debt
- Mock implementations currently reside in repositories (`MockAuthRepository`, `MockHomeRepository`, etc.) and must be swapped out with `ApiRepositories` when the real backend is deployed.
- Some UI components may still need polish regarding exact Figma tokens.

## Current Priorities
- Implementing the MUA Dashboard Portal.
- Implementing the Admin Dashboard Portal.
- Enhancing the booking checkout UI and MUA detail flow.
