import { Outlet } from "react-router-dom"
import { Dumbbell } from 'lucide-react'

function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-primary/90 via-primary to-primary/80 w-1/2">
        <div className="max-w-md space-y-6 text-center px-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Dumbbell className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-primary-foreground">
            Welcome to Fitmart
          </h1>
          <p className="text-xl text-primary-foreground/90">
            Your journey to fitness excellence starts here
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex flex-col items-center justify-center gap-4 mb-8">
            <Dumbbell className="h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold text-center">Welcome to Fitmart</h1>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
