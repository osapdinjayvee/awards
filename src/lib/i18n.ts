/**
 * Tiny i18n for the public voting flow — three locales, no dependency.
 *
 * Interface strings live in the dictionaries below. Admin-authored content
 * (award descriptions, criteria, welcome text) carries its own translations in
 * an i18n jsonb column — see localized() at the bottom of this file.
 */

export const LANGS = ["en", "tl", "taglish"] as const
export type Lang = (typeof LANGS)[number]

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  tl: "Tagalog",
  taglish: "Taglish",
}

/** Short labels for the switcher chip. */
export const LANG_SHORT: Record<Lang, string> = {
  en: "EN",
  tl: "TL",
  taglish: "TG",
}

type Params = Record<string, string | number>
type Entry = string | ((p: Params) => string)

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

const en = {
  // --- shared
  "common.backToAwards": "Back to the awards",
  "common.backTo": ({ title }: Params) => `Back to ${title}`,
  "common.startVoting": "Start voting",
  "common.exit": "Exit",
  "common.loading": "Loading...",

  // --- events index
  "index.title": "Award Nominations",
  "index.empty": "There are no open nomination events right now.",

  // --- event layout errors
  "layout.errorTitle": "Something went wrong",
  "layout.errorBody": "We couldn't load this event. Please try again in a moment.",
  "layout.notFound": "This award event doesn't exist or isn't published.",

  // --- landing
  "landing.votingOpen": "Voting open",
  "landing.votingClosed": "Voting closed",
  "landing.closesToday": "Closes today",
  "landing.daysLeft": ({ n }: Params) => `${n} days left`,
  "landing.seeAwards": "See the awards",
  "landing.aboutEyebrow": "About this recognition",
  "landing.awardsTitle": "The Awards",
  "landing.awardsSubtitle": ({ n }: Params) =>
    `${n} categories · individual awards are voted per employment group, the team award per division · the bar shows how its criteria are weighed`,
  "landing.teamBadge": "Team / Unit",
  "landing.individualBadge": "Individual",
  "landing.perDivision": "One winner per division",

  // --- voter gate
  "gate.title": "Verify to vote",
  "gate.description": ({ title }: Params) =>
    `Voting for ${title} is open to listed personnel only. Enter your employee ID number and full name as they appear on record.`,
  "gate.idLabel": "ID number",
  "gate.nameLabel": "Full name",
  "gate.nameHint":
    'Any order works — "Jayvee Osapdin" and "Osapdin, Jayvee M." are both fine.',
  "gate.errNoId": "Please enter your ID number.",
  "gate.errNoName": "Please enter your full name (first and last name).",

  // --- ballot
  "ballot.closed": "Voting for this event is closed.",
  "ballot.welcome": ({ name }: Params) => `Welcome, ${name}`,
  "ballot.progress": ({ voted, total }: Params) => `${voted}/${total} submitted`,
  "ballot.readyToSend": ({ n }: Params) => `${n} ready to send`,
  "ballot.left": ({ n }: Params) => `${n} left`,
  "ballot.title": "Your ballot",
  "ballot.titleDone": "Your ballot is complete",
  "ballot.intro":
    "Pick one nominee per section, then send them all at once. A submitted section is final.",
  "ballot.introDone":
    "Every section is in. The live results below keep updating as others vote.",
  "ballot.howJudged": "How this is judged",
  "ballot.noDivisions":
    "This award isn't open for voting yet — no divisions have been set up for it.",
  "ballot.thanksTitle": "Thank you for voting",
  "ballot.thanksBody": ({ title }: Params) =>
    `Your ballot for ${title} is complete.`,
  "ballot.dockEmpty": ({ n }: Params) =>
    `Choose a nominee in any of the ${n} open ${plural(Number(n), "section", "sections")}.`,
  "ballot.dockNothing": "Nothing left to submit.",
  "ballot.dockReady": ({ n }: Params) =>
    `${n} ${plural(Number(n), "section", "sections")} ready to send`,
  "ballot.submit": ({ n }: Params) => (Number(n) > 0 ? `Submit ${n}` : "Submit"),
  "ballot.submitted": ({ n }: Params) =>
    `${n} ${plural(Number(n), "vote", "votes")} submitted. Thank you!`,
  "ballot.moreFailed": ({ n }: Params) => `${n} more failed.`,
  "ballot.switchTitle": "Switch voter?",
  "ballot.switchBody": ({ name }: Params) =>
    `You are signed in as ${name}. Votes you already submitted stay recorded`,
  "ballot.switchPending": ({ n }: Params) =>
    `, but ${n} unsent ${plural(Number(n), "selection", "selections")} will be discarded`,
  "ballot.switchStay": "Stay signed in",
  "ballot.switchConfirm": "Switch voter",
  "ballot.unitsAndOffices": "Units & Offices",

  // --- section picker / results
  "section.submitted": "Submitted",
  "section.votes": ({ n }: Params) => `${n} ${plural(Number(n), "vote", "votes")}`,
  "section.loadingResults": "Loading results...",
  "section.showMore": ({ n }: Params) => `Show ${n} more`,
  "section.candidates": ({ n }: Params) =>
    `${n} ${plural(Number(n), "candidate", "candidates")}`,
  "section.choose": "Search and choose a nominee",
  "section.empty": "No candidates in this section yet",
  "section.searchPlaceholder": "Search by name or position...",
  "section.noMatch": "No match.",
  "section.clear": "Clear selection",
  "section.yourVote": "You",

  // --- RPC errors
  "err.notAuthorized":
    "We couldn't find you on the voter list. Check your ID number and full name.",
  "err.tooManyAttempts":
    "Too many failed attempts. Please wait 10 minutes and try again.",
  "err.alreadyVoted": "You have already voted in this section.",
  "err.eventClosed": "Voting for this event is closed.",
  "err.invalidId": "Please enter your ID number.",
  "err.invalidVote":
    "That vote isn't valid for this section. Refresh the page and try again.",
  "err.generic": "Something went wrong. Please try again.",
} satisfies Record<string, Entry>

export type TranslationKey = keyof typeof en

const tl: Record<TranslationKey, Entry> = {
  "common.backToAwards": "Bumalik sa mga parangal",
  "common.backTo": ({ title }) => `Bumalik sa ${title}`,
  "common.startVoting": "Simulan ang pagboto",
  "common.exit": "Lumabas",
  "common.loading": "Naglo-load...",

  "index.title": "Mga Nominasyon sa Parangal",
  "index.empty": "Walang bukas na nominasyon sa ngayon.",

  "layout.errorTitle": "May naganap na problema",
  "layout.errorBody":
    "Hindi namin ma-load ang kaganapang ito. Pakisubukan muli sa ilang sandali.",
  "layout.notFound": "Wala ang kaganapang ito o hindi pa ito nailathala.",

  "landing.votingOpen": "Bukas ang pagboto",
  "landing.votingClosed": "Sarado ang pagboto",
  "landing.closesToday": "Magsasara ngayong araw",
  "landing.daysLeft": ({ n }) => `${n} araw na lang`,
  "landing.seeAwards": "Tingnan ang mga parangal",
  "landing.aboutEyebrow": "Tungkol sa pagkilalang ito",
  "landing.awardsTitle": "Ang Mga Parangal",
  "landing.awardsSubtitle": ({ n }) =>
    `${n} kategorya · ang mga indibidwal na parangal ay binoboto kada uri ng empleyado, ang parangal pangkat naman ay kada dibisyon · ipinapakita ng bar kung paano tinitimbang ang mga pamantayan`,
  "landing.teamBadge": "Pangkat / Yunit",
  "landing.individualBadge": "Indibidwal",
  "landing.perDivision": "Isang panalo kada dibisyon",

  "gate.title": "Magpatunay para makaboto",
  "gate.description": ({ title }) =>
    `Ang pagboto sa ${title} ay para lamang sa mga nakalistang tauhan. Ilagay ang inyong ID number at buong pangalan ayon sa talaan.`,
  "gate.idLabel": "ID number",
  "gate.nameLabel": "Buong pangalan",
  "gate.nameHint":
    'Kahit anong ayos ay tanggap — "Jayvee Osapdin" at "Osapdin, Jayvee M." ay parehong tama.',
  "gate.errNoId": "Pakilagay ang inyong ID number.",
  "gate.errNoName": "Pakilagay ang inyong buong pangalan (pangalan at apelyido).",

  "ballot.closed": "Sarado na ang pagboto para sa kaganapang ito.",
  "ballot.welcome": ({ name }) => `Maligayang pagdating, ${name}`,
  "ballot.progress": ({ voted, total }) => `${voted}/${total} naipasa`,
  "ballot.readyToSend": ({ n }) => `${n} handa nang ipadala`,
  "ballot.left": ({ n }) => `${n} ang natitira`,
  "ballot.title": "Ang inyong balota",
  "ballot.titleDone": "Kumpleto na ang inyong balota",
  "ballot.intro":
    "Pumili ng isang nominado kada seksyon, pagkatapos ay ipadala lahat nang sabay-sabay. Hindi na mababago ang naipasang seksyon.",
  "ballot.introDone":
    "Kumpleto na ang lahat ng seksyon. Patuloy na nag-a-update ang resulta sa ibaba habang bumoboto ang iba.",
  "ballot.howJudged": "Paano ito hinuhusgahan",
  "ballot.noDivisions":
    "Hindi pa bukas sa pagboto ang parangal na ito — wala pang nakatakdang dibisyon.",
  "ballot.thanksTitle": "Salamat sa pagboto",
  "ballot.thanksBody": ({ title }) =>
    `Kumpleto na ang inyong balota para sa ${title}.`,
  "ballot.dockEmpty": ({ n }) =>
    `Pumili ng nominado sa alinman sa ${n} bukas na seksyon.`,
  "ballot.dockNothing": "Wala nang dapat ipasa.",
  "ballot.dockReady": ({ n }) => `${n} seksyon ang handa nang ipadala`,
  "ballot.submit": ({ n }) => (Number(n) > 0 ? `Ipasa ang ${n}` : "Ipasa"),
  "ballot.submitted": ({ n }) => `${n} boto ang naipasa. Maraming salamat!`,
  "ballot.moreFailed": ({ n }) => `${n} pa ang hindi naipasa.`,
  "ballot.switchTitle": "Palitan ang botante?",
  "ballot.switchBody": ({ name }) =>
    `Naka-sign in kayo bilang ${name}. Mananatiling nakatala ang mga naipasa nang boto`,
  "ballot.switchPending": ({ n }) =>
    `, ngunit mabubura ang ${n} piniling hindi pa naipapadala`,
  "ballot.switchStay": "Manatiling naka-sign in",
  "ballot.switchConfirm": "Palitan ang botante",
  "ballot.unitsAndOffices": "Mga Yunit at Tanggapan",

  "section.submitted": "Naipasa",
  "section.votes": ({ n }) => `${n} boto`,
  "section.loadingResults": "Kinukuha ang resulta...",
  "section.showMore": ({ n }) => `Ipakita pa ang ${n}`,
  "section.candidates": ({ n }) => `${n} kandidato`,
  "section.choose": "Maghanap at pumili ng nominado",
  "section.empty": "Wala pang kandidato sa seksyong ito",
  "section.searchPlaceholder": "Maghanap ayon sa pangalan o posisyon...",
  "section.noMatch": "Walang katugma.",
  "section.clear": "Alisin ang napili",
  "section.yourVote": "Kayo",

  "err.notAuthorized":
    "Hindi namin kayo makita sa listahan ng mga botante. Pakisuri ang ID number at buong pangalan.",
  "err.tooManyAttempts":
    "Masyadong maraming maling pagsubok. Maghintay ng 10 minuto at subukang muli.",
  "err.alreadyVoted": "Nakaboto na kayo sa seksyong ito.",
  "err.eventClosed": "Sarado na ang pagboto para sa kaganapang ito.",
  "err.invalidId": "Pakilagay ang inyong ID number.",
  "err.invalidVote":
    "Hindi wasto ang botong ito para sa seksyong ito. I-refresh ang pahina at subukang muli.",
  "err.generic": "May naganap na problema. Pakisubukan muli.",
}

const taglish: Record<TranslationKey, Entry> = {
  "common.backToAwards": "Balik sa awards",
  "common.backTo": ({ title }) => `Balik sa ${title}`,
  "common.startVoting": "Start voting",
  "common.exit": "Exit",
  "common.loading": "Loading...",

  "index.title": "Award Nominations",
  "index.empty": "Wala pang bukas na nomination event ngayon.",

  "layout.errorTitle": "May something wrong",
  "layout.errorBody":
    "Hindi ma-load ang event na ito. Please try again in a moment.",
  "layout.notFound": "Wala ang event na ito o hindi pa published.",

  "landing.votingOpen": "Open ang voting",
  "landing.votingClosed": "Closed na ang voting",
  "landing.closesToday": "Closing today",
  "landing.daysLeft": ({ n }) => `${n} days na lang`,
  "landing.seeAwards": "Tingnan ang awards",
  "landing.aboutEyebrow": "Tungkol sa recognition na ito",
  "landing.awardsTitle": "Ang Mga Award",
  "landing.awardsSubtitle": ({ n }) =>
    `${n} categories · ang individual awards ay per employment group ang boto, ang team award naman ay per division · ipinapakita ng bar kung paano weighted ang criteria`,
  "landing.teamBadge": "Team / Unit",
  "landing.individualBadge": "Individual",
  "landing.perDivision": "Isang panalo kada division",

  "gate.title": "Mag-verify para makaboto",
  "gate.description": ({ title }) =>
    `Ang voting sa ${title} ay para lang sa mga listed na personnel. I-enter ang inyong employee ID number at full name gaya ng nasa record.`,
  "gate.idLabel": "ID number",
  "gate.nameLabel": "Full name",
  "gate.nameHint":
    'Kahit anong order okay lang — "Jayvee Osapdin" at "Osapdin, Jayvee M." pareho pwede.',
  "gate.errNoId": "Please enter ang inyong ID number.",
  "gate.errNoName": "Please enter ang full name ninyo (first at last name).",

  "ballot.closed": "Closed na ang voting para sa event na ito.",
  "ballot.welcome": ({ name }) => `Welcome, ${name}`,
  "ballot.progress": ({ voted, total }) => `${voted}/${total} na-submit`,
  "ballot.readyToSend": ({ n }) => `${n} ready to send`,
  "ballot.left": ({ n }) => `${n} pa ang natitira`,
  "ballot.title": "Ang inyong ballot",
  "ballot.titleDone": "Complete na ang ballot ninyo",
  "ballot.intro":
    "Pumili ng isang nominee kada section, tapos i-submit lahat nang sabay. Final na ang na-submit na section.",
  "ballot.introDone":
    "Complete na lahat ng section. Live pa rin ang results sa baba habang bumoboto ang iba.",
  "ballot.howJudged": "Paano ito ji-judge",
  "ballot.noDivisions":
    "Hindi pa open sa voting ang award na ito — wala pang naka-set na division.",
  "ballot.thanksTitle": "Salamat sa pagboto",
  "ballot.thanksBody": ({ title }) =>
    `Complete na ang ballot ninyo para sa ${title}.`,
  "ballot.dockEmpty": ({ n }) =>
    `Pumili ng nominee sa kahit alin sa ${n} open na section.`,
  "ballot.dockNothing": "Wala nang pwedeng i-submit.",
  "ballot.dockReady": ({ n }) => `${n} section ang ready to send`,
  "ballot.submit": ({ n }) => (Number(n) > 0 ? `I-submit ang ${n}` : "I-submit"),
  "ballot.submitted": ({ n }) => `${n} votes ang na-submit. Salamat!`,
  "ballot.moreFailed": ({ n }) => `${n} pa ang hindi na-submit.`,
  "ballot.switchTitle": "Palitan ang voter?",
  "ballot.switchBody": ({ name }) =>
    `Naka-sign in kayo bilang ${name}. Ang na-submit nang votes ay mananatiling recorded`,
  "ballot.switchPending": ({ n }) =>
    `, pero mawawala ang ${n} na hindi pa na-submit na pinili`,
  "ballot.switchStay": "Stay signed in",
  "ballot.switchConfirm": "Palitan ang voter",
  "ballot.unitsAndOffices": "Units & Offices",

  "section.submitted": "Na-submit",
  "section.votes": ({ n }) => `${n} votes`,
  "section.loadingResults": "Kinukuha ang results...",
  "section.showMore": ({ n }) => `Show pa ang ${n}`,
  "section.candidates": ({ n }) => `${n} candidates`,
  "section.choose": "Mag-search at pumili ng nominee",
  "section.empty": "Wala pang candidate sa section na ito",
  "section.searchPlaceholder": "Search by name o position...",
  "section.noMatch": "Walang match.",
  "section.clear": "I-clear ang pinili",
  "section.yourVote": "Kayo",

  "err.notAuthorized":
    "Hindi kayo makita sa voter list. Pakicheck ang ID number at full name ninyo.",
  "err.tooManyAttempts":
    "Sobrang dami nang failed attempts. Maghintay ng 10 minutes tapos try again.",
  "err.alreadyVoted": "Nakaboto na kayo sa section na ito.",
  "err.eventClosed": "Closed na ang voting para sa event na ito.",
  "err.invalidId": "Please enter ang inyong ID number.",
  "err.invalidVote":
    "Hindi valid ang vote na ito para sa section na ito. I-refresh ang page at try again.",
  "err.generic": "May nagkaproblema. Please try again.",
}

const DICTIONARIES: Record<Lang, Record<TranslationKey, Entry>> = {
  en,
  tl,
  taglish,
}

const STORAGE_KEY = "awards.lang"

export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang
  } catch {
    // storage blocked — fall through to the default
  }
  return "en"
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // ignore
  }
}

/** Look up a key, falling back to English for anything untranslated. */
export function translate(
  lang: Lang,
  key: TranslationKey,
  params: Params = {},
): string {
  const entry = DICTIONARIES[lang][key] ?? en[key]
  return typeof entry === "function" ? entry(params) : entry
}

// ---------------------------------------------------------------- content

/** A row that may carry translations: { tl: { field: "..." }, taglish: {...} } */
export interface Translatable {
  i18n?: Record<string, Record<string, string>> | null
}

/**
 * Admin-authored content in the active language, falling back to the original
 * field when that language has no translation for it.
 */
export function localized<T extends Translatable, K extends keyof T & string>(
  row: T,
  field: K,
  lang: Lang,
): T[K] {
  if (lang === "en") return row[field]
  const value = row.i18n?.[lang]?.[field]
  return (value && value.trim() !== "" ? value : row[field]) as T[K]
}
