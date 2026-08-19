import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  loadLang,
  saveLang,
  translate,
  type Lang,
  type TranslationKey,
} from "@/lib/i18n"

type Ctx = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LangContext = createContext<Ctx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => loadLang())

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    saveLang(next)
    document.documentElement.lang = next === "en" ? "en" : "fil"
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
    }),
    [lang, setLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

/** Interface language + translator. English outside a provider. */
export function useLang(): Ctx {
  const ctx = useContext(LangContext)
  if (ctx) return ctx
  return {
    lang: "en",
    setLang: () => undefined,
    t: (key, params) => translate("en", key, params),
  }
}
