import { PrismaClient, Role, BookingStatus, MessageRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.create({
    data: { email: 'admin@staiaici.ro', passwordHash: hash, name: 'Admin StaiAici', role: Role.ADMIN },
  });
  const host1 = await prisma.user.create({
    data: { email: 'maria@example.com', passwordHash: hash, name: 'Maria Popescu', role: Role.HOST, phone: '0722000001' },
  });
  const host2 = await prisma.user.create({
    data: { email: 'ion@example.com', passwordHash: hash, name: 'Ion Ionescu', role: Role.HOST, phone: '0722000002' },
  });
  const guest1 = await prisma.user.create({
    data: { email: 'andrei@example.com', passwordHash: hash, name: 'Andrei Georgescu', role: Role.GUEST, phone: '0733000001' },
  });
  const guest2 = await prisma.user.create({
    data: { email: 'elena@example.com', passwordHash: hash, name: 'Elena Dumitrescu', role: Role.GUEST, phone: '0733000002' },
  });

  // Amenities
  const amenityNames = ['Wi-Fi', 'Parcare', 'Bucătărie', 'Aer condiționat', 'Încălzire', 'TV', 'Mașină de spălat', 'Balcon', 'Grădină', 'Piscină', 'Jacuzzi', 'Șemineu', 'Animale permise', 'Loc de joacă'];
  const amenities = await Promise.all(
    amenityNames.map((name) => prisma.amenity.create({ data: { name } }))
  );

  // Properties
  const props = [
    {
      hostId: host1.id, title: 'Apartament modern în centrul Bucureștiului', description: 'Apartament spațios cu 2 camere, complet mobilat, la 5 minute de Piața Universității. Ideal pentru cupluri sau familii mici.', city: 'București', address: 'Str. Academiei 15, Sector 1',
      pricePerNight: 350, maxGuests: 4,
      checkInInfo: 'Check-in de la ora 15:00. Cheia se ridică de la recepție.', houseRules: 'Nu se fumează. Liniște după ora 22:00.', localTips: 'Vizitați Muzeul Național de Artă (5 min). Restaurant recomandat: Caru\' cu Bere.',
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
      amenityIdxs: [0, 2, 3, 4, 5, 6],
    },
    {
      hostId: host1.id, title: 'Cabană rustică în Brașov', description: 'Cabană tradițională românească la poalele munților. Perfectă pentru o escapadă la munte cu familia.', city: 'Brașov', address: 'Str. Republicii 42',
      pricePerNight: 500, maxGuests: 6,
      checkInInfo: 'Check-in de la 14:00. Vă așteptăm la intrare.', houseRules: 'Animalele sunt binevenite. Grătarul disponibil pe terasă.', localTips: 'Cetatea Brașov la 10 min. Poiana Brașov la 20 min cu mașina.',
      images: ['https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800', 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800'],
      amenityIdxs: [0, 1, 2, 4, 5, 8, 11, 12],
    },
    {
      hostId: host2.id, title: 'Studio cozy lângă plajă – Mamaia', description: 'Studio modern cu vedere la mare. La doar 2 minute de plajă. Perfect pentru vacanța de vară.', city: 'Constanța', address: 'Bd. Mamaia 120',
      pricePerNight: 280, maxGuests: 2,
      checkInInfo: 'Self check-in cu cod la intrare. Codul se trimite pe WhatsApp.', houseRules: 'Fără petreceri. Fără fumat.', localTips: 'Aqua Magic Park la 5 min. Restaurante pe faleză la 10 min.',
      images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'],
      amenityIdxs: [0, 3, 5, 7],
    },
    {
      hostId: host2.id, title: 'Vilă cu piscină în Cluj-Napoca', description: 'Vilă spațioasă cu piscină exterioară și grădină. Ideală pentru grupuri sau evenimente.', city: 'Cluj-Napoca', address: 'Str. Avram Iancu 88',
      pricePerNight: 800, maxGuests: 10,
      checkInInfo: 'Check-in flexibil. Contactați gazda.', houseRules: 'Petreceri doar cu acordul gazdei.', localTips: 'Centrul vechi la 15 min. Grădina Botanică la 10 min.',
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
      amenityIdxs: [0, 1, 2, 3, 4, 5, 6, 8, 9, 13],
    },
    {
      hostId: host1.id, title: 'Apartament panoramic în Sibiu', description: 'Apartament la ultimul etaj cu priveliște spre Piața Mare. Zona pietonală, acces facil la toate atracțiile.', city: 'Sibiu', address: 'Piața Mare 5',
      pricePerNight: 420, maxGuests: 3,
      checkInInfo: 'Check-in ora 16:00. Cheia la cafeneaua de la parter.', houseRules: 'Fără fumat. Fără animale.', localTips: 'Turnul Sfatului la 1 minut. Piața Mică la 3 minute.',
      images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
      amenityIdxs: [0, 2, 3, 4, 5],
    },
    {
      hostId: host2.id, title: 'Pensiune tradițională în Maramureș', description: 'Pensiune autentică din lemn cu mâncare tradițională. Experiență rurală unică în inima Maramureșului.', city: 'Baia Mare', address: 'Sat Bârsana, nr. 120',
      pricePerNight: 250, maxGuests: 8,
      checkInInfo: 'Vă așteptăm la poarta mare. Sunați la 0722000002.', houseRules: 'Copiii sunt bineveniți. Liniște după 22:00.', localTips: 'Mănăstirea Bârsana la 5 min. Cimitirul Vesel Săpânța la 30 min.',
      images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'],
      amenityIdxs: [0, 1, 2, 4, 8, 12, 13],
    },
  ];

  const createdProps = [];
  for (const p of props) {
    const { images, amenityIdxs, ...data } = p;
    const property = await prisma.property.create({ data });
    await Promise.all(images.map((url, i) => prisma.propertyImage.create({ data: { propertyId: property.id, url, order: i } })));
    await Promise.all(amenityIdxs.map((idx) => prisma.propertyAmenity.create({ data: { propertyId: property.id, amenityId: amenities[idx].id } })));
    createdProps.push(property);
  }

  // Bookings
  const now = new Date();
  const bookings = [
    { propertyId: createdProps[0].id, guestId: guest1.id, hostId: host1.id, startDate: addDays(now, 5), endDate: addDays(now, 8), status: BookingStatus.ACCEPTED, totalPrice: 1050, guests: 2 },
    { propertyId: createdProps[1].id, guestId: guest2.id, hostId: host1.id, startDate: addDays(now, 10), endDate: addDays(now, 14), status: BookingStatus.PENDING, totalPrice: 2000, guests: 4 },
    { propertyId: createdProps[2].id, guestId: guest1.id, hostId: host2.id, startDate: addDays(now, 2), endDate: addDays(now, 5), status: BookingStatus.PENDING, totalPrice: 840, guests: 2 },
    { propertyId: createdProps[3].id, guestId: guest2.id, hostId: host2.id, startDate: addDays(now, -5), endDate: addDays(now, -2), status: BookingStatus.ACCEPTED, totalPrice: 2400, guests: 6 },
  ];

  const createdBookings = [];
  for (const b of bookings) {
    createdBookings.push(await prisma.booking.create({ data: b }));
  }

  // Messages
  await prisma.message.createMany({
    data: [
      { bookingId: createdBookings[0].id, senderId: guest1.id, role: MessageRole.GUEST, content: 'Bună ziua! Am o întrebare despre parcare.' },
      { bookingId: createdBookings[0].id, senderId: host1.id, role: MessageRole.HOST, content: 'Bună! Parcarea este inclusă, locul 12 în parcarea subterană.' },
      { bookingId: createdBookings[1].id, senderId: guest2.id, role: MessageRole.GUEST, content: 'Se poate face check-in mai devreme, la ora 12?' },
    ],
  });

  // Blocked dates on property 0
  for (let i = 20; i < 25; i++) {
    await prisma.blockedDate.create({ data: { propertyId: createdProps[0].id, date: addDays(now, i) } });
  }

  console.log('Seed complete!');
  console.log('Demo accounts (all passwords: password123):');
  console.log('  Admin: admin@staiaici.ro');
  console.log('  Host:  maria@example.com / ion@example.com');
  console.log('  Guest: andrei@example.com / elena@example.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
