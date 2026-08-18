import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  EMPLOYMENT_GROUP_LABELS,
  type EmploymentGroup,
  type RosterPerson,
  type Unit,
} from "@/lib/types"

type PersonProps = {
  mode: "person"
  people: RosterPerson[]
  eligibleGroups: EmploymentGroup[] | null
  value: string | null
  onChange: (id: string) => void
}

type UnitProps = {
  mode: "unit"
  units: Unit[]
  value: string | null
  onChange: (id: string) => void
}

export type NomineeComboboxProps = PersonProps | UnitProps

export function NomineeCombobox(props: NomineeComboboxProps) {
  const [open, setOpen] = useState(false)

  const options = useMemo(() => {
    if (props.mode === "unit") {
      return props.units.map((u) => ({
        id: u.id,
        label: u.name,
        sub: null as string | null,
      }))
    }
    const groups =
      props.eligibleGroups && props.eligibleGroups.length > 0
        ? new Set(props.eligibleGroups)
        : null
    return props.people
      .filter((p) => !groups || groups.has(p.classification))
      .map((p) => ({
        id: p.id,
        label: p.full_name,
        sub: [p.position, EMPLOYMENT_GROUP_LABELS[p.classification]]
          .filter(Boolean)
          .join(" · "),
      }))
  }, [props])

  const selected = options.find((o) => o.id === props.value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected
              ? selected.label
              : props.mode === "unit"
                ? "Select a unit or office..."
                : "Select a nominee..."}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={
              props.mode === "unit" ? "Search units..." : "Search people..."
            }
          />
          <CommandList>
            <CommandEmpty>No match found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.label} ${o.sub ?? ""}`}
                  onSelect={() => {
                    props.onChange(o.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{o.label}</span>
                    {o.sub && (
                      <span className="truncate text-xs text-muted-foreground">
                        {o.sub}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      props.value === o.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
