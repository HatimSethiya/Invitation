// Dawoodi Bohra (Misri / Fatemi) tabular calendar.
// Reference: the 30-year leap cycle described by The Dawoodi Bohras.
// Epoch is Julian Day Number 1948439 (civil daytime mapping).
const FATEMI_EPOCH_JDN = 1948439;
const FATEMI_LEAP_YEARS = new Set([2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29]);
const FATEMI_MONTHS_ARABIC = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

function gregorianParts(value) {
  let year;
  let month;
  let day;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    year = value.getUTCFullYear();
    month = value.getUTCMonth() + 1;
    day = value.getUTCDate();
  } else if (typeof value === "string") {
    const matched = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
    if (!matched) return null;
    year = Number(matched[1]);
    month = Number(matched[2]);
    day = Number(matched[3]);
  } else {
    return null;
  }

  if (year < 622 || year > 9999 || month < 1 || month > 12) return null;
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;
  return { year, month, day };
}

function gregorianToJulianDay({ year, month, day }) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
    - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function fatemiYearStart(year) {
  const completedYears = year - 1;
  const fullCycles = Math.floor(completedYears / 30);
  const remainingYears = completedYears % 30;
  const extraDays = FATEMI_LEAP_YEARS.size * fullCycles
    + [...FATEMI_LEAP_YEARS].filter((leapYear) => leapYear <= remainingYears).length;
  return FATEMI_EPOCH_JDN + completedYears * 354 + extraDays;
}

export function getFatemiDateParts(value) {
  const gregorian = gregorianParts(value);
  if (!gregorian) return null;
  const julianDay = gregorianToJulianDay(gregorian);
  if (julianDay < FATEMI_EPOCH_JDN) return null;

  let year = Math.max(1, Math.floor((julianDay - FATEMI_EPOCH_JDN) / (10631 / 30)) + 1);
  while (fatemiYearStart(year + 1) <= julianDay) year += 1;
  while (fatemiYearStart(year) > julianDay) year -= 1;

  let dayOfYear = julianDay - fatemiYearStart(year);
  for (let month = 1; month <= 12; month += 1) {
    const daysInMonth = month === 12 && FATEMI_LEAP_YEARS.has(year % 30)
      ? 30
      : month % 2 === 1 ? 30 : 29;
    if (dayOfYear < daysInMonth) {
      return { day: dayOfYear + 1, month, year };
    }
    dayOfYear -= daysInMonth;
  }
  return null;
}

export function formatFatemiDate(value) {
  const date = getFatemiDateParts(value);
  if (!date) return "";
  const arabicDigits = (number) => String(number).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
  return arabicDigits(date.day) + " " + FATEMI_MONTHS_ARABIC[date.month - 1]
    + " " + arabicDigits(date.year) + " هـ";
}
