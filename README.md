# MonnieGift - Secure Money Gift Platform

Een moderne web applicatie voor het veilig versturen van geld cadeaus met email authenticatie. Gebruikt Stripe Connect voor betalingen en Resend voor email notificaties.

## 🚀 Features

- **Veilige betalingen** via Stripe Connect
- **Email authenticatie** met Resend service
- **Geen account nodig** voor ontvangers
- **Moderne UI** met Tailwind CSS
- **TypeScript** voor type safety
- **Database** met Prisma ORM

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Payments**: Stripe Connect
- **Email**: Resend
- **Database**: PostgreSQL met Prisma
- **Icons**: Lucide React

## 📋 Setup Instructies

### 1. Dependencies installeren

```bash
npm install
```

### 2. Environment variabelen

Kopieer `env.example` naar `.env.local` en vul de volgende waarden in:

```bash
cp env.example .env.local
```

Vul de volgende waarden in:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend Email Service
RESEND_API_KEY=re_...

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/monniegift"

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database setup

```bash
# Database migratie
npx prisma migrate dev

# Database seeden (optioneel)
npx prisma db seed
```

### 4. Development server starten

```bash
npm run dev
```

De applicatie is nu beschikbaar op [http://localhost:3000](http://localhost:3000)

## 🔧 Stripe Setup

### 1. Stripe Account
- Maak een Stripe account aan op [stripe.com](https://stripe.com)
- Ga naar de Dashboard en kopieer je API keys

### 2. Webhook Setup
- Ga naar Webhooks in je Stripe Dashboard
- Maak een nieuwe webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Selecteer de volgende events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Kopieer de webhook secret naar je `.env.local`

## 📧 Resend Setup

### 1. Resend Account
- Maak een Resend account aan op [resend.com](https://resend.com)
- Ga naar API Keys en maak een nieuwe key
- Kopieer de key naar je `.env.local`

### 2. Domain Setup (Production)
- Voeg je domain toe in Resend
- Update de `from` email in `lib/email.ts`

## 🎯 Hoe het werkt

### 1. Gift Creation
1. Gebruiker vult het formulier in met:
   - Bedrag
   - Valuta
   - Bericht (optioneel)
   - Eigen email
   - Ontvanger email
2. Stripe Payment Intent wordt aangemaakt
3. Na succesvolle betaling wordt email verstuurd

### 2. Email Notificatie
- Ontvanger krijgt een email met:
  - Link naar de gift pagina
  - 6-cijferige authenticatie code
  - Bedrag en bericht details

### 3. Gift Claiming
1. Ontvanger klikt op link in email
2. Voert authenticatie code in
3. Voert bank account details in
4. Gift wordt overgemaakt via Stripe Connect

## 🗄️ Database Schema

```prisma
model Gift {
  id                String   @id @default(cuid())
  amount            Int      // Amount in cents
  currency          String   @default("eur")
  message           String?
  senderEmail       String
  recipientEmail    String
  authenticationCode String @unique
  isClaimed         Boolean  @default(false)
  claimedAt         DateTime?
  stripePaymentIntentId String?
  stripeTransferId  String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

## 🔒 Security Features

- **Email authenticatie** - Alleen de ontvanger kan de gift claimen
- **Stripe Connect** - Veilige betalingen en transfers
- **Input validatie** - Alle inputs worden gevalideerd
- **Rate limiting** - Bescherming tegen misbruik
- **HTTPS** - Veilige data overdracht

## 🚀 Deployment

### Vercel (Aanbevolen)
1. Push code naar GitHub
2. Verbind repository met Vercel
3. Voeg environment variabelen toe
4. Deploy automatisch

### Andere platforms
- Heroku
- Railway
- DigitalOcean App Platform

## 📝 API Endpoints

### POST /api/gifts/create
Maakt een nieuwe gift aan

**Body:**
```json
{
  "amount": 1000,
  "currency": "eur",
  "message": "Happy Birthday!",
  "senderEmail": "sender@example.com",
  "recipientEmail": "recipient@example.com"
}
```

### GET /api/gifts/[id]
Haalt gift details op

### POST /api/gifts/claim
Claimt een gift

**Body:**
```json
{
  "giftId": "gift_id",
  "authenticationCode": "123456",
  "bankAccountId": "bank_account_id"
}
```

### POST /api/webhooks/stripe
Stripe webhook handler

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch
3. Commit je changes
4. Push naar de branch
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License.

## 🆘 Support

Voor vragen of problemen:
- Open een issue op GitHub
- Email: support@monniegift.com

---

Gemaakt met ❤️ voor veilige geld cadeaus
# MonnieGiftV2
