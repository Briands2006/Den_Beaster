// Alle opmaak van geld en datums op één plek, zodat de hele app er hetzelfde uitziet.
// Wil je later iets veranderen (bv. "di 12 nov." i.p.v. "dinsdag 12 november"), dan doe je dat hier.

// We maken de formatters één keer aan en hergebruiken ze: een Intl-formatter aanmaken is
// relatief duur, hem gebruiken is goedkoop.
const euroFormatter = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" });

// Geld bewaren we altijd in centen (integer), om afrondingsfouten te vermijden: 0.1 + 0.2 !== 0.3.
// Pas bij het tonen delen we door 100. euro(4550) → "€ 45,50"
export const euro = (cents: number) => euroFormatter.format(cents / 100);

// Een kolom van het type `date` komt uit Supabase als tekst: "2026-11-21".
// Valkuil: new Date("2026-11-21") is middernacht in UTC. Formatteer je dat in een tijdzone
// die achter UTC ligt, dan krijg je de dag ervoor. Daarom zeggen we tegen Intl expliciet:
// lees én toon deze datum in UTC. Zo blijft 21 november altijd 21 november.
const dateFormatter = new Intl.DateTimeFormat("nl-BE", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// gigDate("2026-11-21") → "za 21 november 2026"
export const gigDate = (isoDate: string) => dateFormatter.format(new Date(isoDate));

// "Vandaag" als "YYYY-MM-DD", in Belgische tijd.
// Waarom niet gewoon new Date()? De server van Vercel draait in UTC. Om 00:30 's nachts
// in België is het daar nog gisteren, en dan zou een gig van vandaag al in het archief staan.
// De locale "en-CA" geeft toevallig precies het formaat YYYY-MM-DD terug.
const todayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" });
export const todayISO = () => todayFormatter.format(new Date());
