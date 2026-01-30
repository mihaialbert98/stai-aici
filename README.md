# StaiAici – Platformă de cazare în România

## Cerințe

- Node.js 18+
- PostgreSQL 14+
- npm sau yarn

## Setup local

1. **Instalează dependențele:**
   ```bash
   npm install
   ```

2. **Configurează variabilele de mediu:**
   ```bash
   cp .env.example .env
   ```
   Editează `.env` cu datele tale PostgreSQL și un secret JWT.

3. **Inițializează baza de date:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Populează cu date demo:**
   ```bash
   npm run db:seed
   ```

5. **Pornește serverul de dezvoltare:**
   ```bash
   npm run dev
   ```
   Aplicația rulează pe [http://localhost:3000](http://localhost:3000).

## Conturi demo

Toate conturile au parola: `password123`

| Rol    | Email                |
|--------|----------------------|
| Admin  | admin@staiaici.ro    |
| Gazdă  | maria@example.com    |
| Gazdă  | ion@example.com      |
| Oaspete| andrei@example.com   |
| Oaspete| elena@example.com    |

## Variabile de mediu

| Variabilă          | Descriere                          |
|--------------------|------------------------------------|
| DATABASE_URL       | Connection string PostgreSQL       |
| JWT_SECRET         | Secret pentru semnarea JWT         |
| NEXT_PUBLIC_APP_URL| URL-ul aplicației                  |

## Structura proiectului

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Register, login, logout, me
│   │   ├── properties/   # CRUD proprietăți + blocked dates
│   │   ├── bookings/     # CRUD rezervări
│   │   ├── messages/     # Chat per booking
│   │   ├── amenities/    # Lista facilități
│   │   ├── host/         # Stats gazdă
│   │   └── admin/        # Users, properties, bookings (admin)
│   ├── auth/             # Login & register pages
│   ├── search/           # Search results
│   ├── property/[id]/    # Property details
│   └── dashboard/
│       ├── guest/        # Bookings, messages
│       ├── host/         # Properties, bookings, calendar, messages
│       └── admin/        # Users, properties, bookings
├── components/           # Shared UI components
├── lib/                  # Utils, auth, prisma, validations
└── middleware.ts          # Route protection
```

## Comenzi utile

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:studio    # Prisma Studio (GUI DB)
npm run db:seed      # Re-seed demo data
npm run db:reset     # Reset + seed
```
