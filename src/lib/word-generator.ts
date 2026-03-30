import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore — no types for this package
import ImageModule from 'docxtemplater-image-module-free';

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'fisa-cazare.docx');

function base64ToBuffer(base64: string): Buffer {
  const data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(data, 'base64');
}

export interface RegistrationData {
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  city: string;
  street: string;
  streetNumber: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  purposeOfTravel: string;
  idType: string;
  idSeries: string;
  idNumber: string;
  touristSignature: string;       // base64 PNG
  receptionistSignature: string;  // base64 PNG
}

export async function generateRegistrationDoc(data: RegistrationData): Promise<Buffer> {
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(templateContent);

  // Normalize image tags from single-brace {%TAG} to double-brace {{%TAG}} to match delimiters
  const docXml = zip.file('word/document.xml')!.asText();
  const patchedXml = docXml.replace(/\{%(\w+)\}/g, '{{%$1}}');
  zip.file('word/document.xml', patchedXml);

  const imageModule = new ImageModule({
    centered: false,
    getImage(tagValue: string) {
      if (!tagValue) {
        // 1×1 transparent PNG — used when no signature is provided
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      }
      return base64ToBuffer(tagValue);
    },
    getSize() {
      return [150, 60]; // width x height in px
    },
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });

  doc.render({
    FULL_NAME: data.fullName,
    DATE_OF_BIRTH: data.dateOfBirth,
    PLACE_OF_BIRTH: data.placeOfBirth,
    NATIONALITY: data.nationality,
    CITY: data.city,
    STREET: data.street,
    STREET_NUMBER: data.streetNumber,
    COUNTRY: data.country,
    ARRIVAL_DATE: data.arrivalDate,
    DEPARTURE_DATE: data.departureDate,
    PURPOSE_OF_TRAVEL: data.purposeOfTravel,
    ID_TYPE: data.idType,
    ID_SERIES: data.idSeries,
    ID_NUMBER: data.idNumber,
    TOURIST_SIGNATURE: data.touristSignature,
    RECEPTIONIST_SIGNATURE: data.receptionistSignature,
  });

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
}

export function generateFileName(
  propertyTitle: string,
  firstName: string,
  lastName: string,
  checkInDate: Date,
  submissionId: string
): string {
  const diacritics: Record<string, string> = {
    ă: 'a', â: 'a', î: 'i', ș: 's', ț: 't',
    Ă: 'A', Â: 'A', Î: 'I', Ș: 'S', Ț: 'T',
  };
  const slug = (s: string) =>
    s
      .split('')
      .map(c => diacritics[c] ?? c)
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

  const shortId = submissionId.slice(-4);
  const year  = checkInDate.getFullYear();
  const month = String(checkInDate.getMonth() + 1).padStart(2, '0');
  const day   = String(checkInDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return `${slug(propertyTitle)}_${slug(lastName)}${slug(firstName)}_${dateStr}_${shortId}.docx`;
}
