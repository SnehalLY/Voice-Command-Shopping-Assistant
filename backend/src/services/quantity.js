import intentsData from '../data/intents.json' with { type: 'json' };

const UNITS = intentsData.units;

/**
 * Parses quantity + unit from a free-text item phrase.
 *
 * Examples handled:
 *   "2 bottles of water" -> { quantity: 2, unit: "bottle" }
 *   "5 oranges"          -> { quantity: 5, unit: null }
 *   "a loaf of bread"    -> { quantity: 1, unit: "loaf" }
 *   "milk"               -> { quantity: 1, unit: null }
 *
 * This is regex/keyword based (no ML) which is plenty for the bounded
 * command set we support. Returns a normalized quantity and the detected
 * unit string when present.
 */
// Includes Spanish number words so "dos botellas" parses to quantity 2.
export const WORD_TO_NUMBER = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  dozen: 12, half: 0.5,
  uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
};

export const NUMBER_WORDS = new Set(Object.keys(WORD_TO_NUMBER));

function unitList() {
  return Object.entries(UNITS).flatMap(([canonical, aliases]) =>
    aliases.map((a) => ({ canonical, alias: a.toLowerCase() }))
  );
}

export function parseQuantity(text) {
  if (!text || typeof text !== 'string') {
    return { quantity: 1, unit: null };
  }

  const lower = text.toLowerCase();

  // 1) Explicit digit, optionally followed by a unit: "2 bottles", "5 kg", "2 लीटर"
  const digitUnit = lower.match(/(\d+(?:\.\d+)?)\s*([a-z\u0900-\u097f]+)?/);
  // 2) Word number (incl. Spanish), optionally followed by a unit: "two packs", "dos botellas"
  const wordMatch = lower.match(/\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|dozen|half|uno|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/);

  let quantity = 1;
  let unit = null;

  // Detect unit anywhere in the text.
  const allUnits = unitList();
  for (const { canonical, alias } of allUnits) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(lower)) {
      unit = canonical;
      break;
    }
  }

  if (digitUnit && digitUnit[1]) {
    quantity = parseFloat(digitUnit[1]);
    // If the token right after the number is a unit word, prefer it.
    if (digitUnit[2]) {
      const matched = allUnits.find((u) => u.alias === digitUnit[2]);
      if (matched) unit = matched.canonical;
    }
  } else if (wordMatch) {
    quantity = WORD_TO_NUMBER[wordMatch[1]] ?? 1;
  }

  // Sanitize obviously invalid quantities.
  if (!Number.isFinite(quantity) || quantity <= 0) quantity = 1;

  return {
    quantity,
    unit,
  };
}
