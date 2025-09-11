import { Trophy, Target } from "lucide-react"

export function GameHeader() {
  return (
    <header className="text-center mb-8">
      <div className="mb-2 flex justify-center">
        <img src="/puzzle-logo.svg" alt="PUZZLE" className="h-16 w-auto" />
      </div>
      
      <p className="text-muted-foreground mb-6 text-pretty">
        Solve the sliding puzzle and unlock achievements as you progress through 100 levels
      </p>

      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="text-sm">Best: 42 moves</span>
        </div>
        <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
          <Target className="w-5 h-5 text-primary" />
          <span className="text-sm">Progress: Level 1</span>
        </div>
      </div>
    </header>
  )
}
