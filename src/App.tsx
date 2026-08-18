import { SupabaseStatus } from "@/components/supabase-status"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function App() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Awards</CardTitle>
          <CardDescription>
            Vite + React + Tailwind v4 + shadcn/ui are wired up.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Ada Lovelace" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" placeholder="Best Newcomer" />
          </div>
          <SupabaseStatus />
        </CardContent>
        <CardFooter className="gap-2">
          <Button className="flex-1">Nominate</Button>
          <Button variant="outline" className="flex-1">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default App
