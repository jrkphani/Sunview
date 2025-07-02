import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  BookOpen, 
  Calculator, 
  Database, 
  Lightbulb, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

// TypeScript interfaces
export interface ExplainerSection {
  title: string
  content: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}

export interface ExplainerExample {
  title: string
  description: string
  calculation?: string
  result?: string
  interpretation?: string
}

export interface ExplainerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  methodology?: ExplainerSection
  calculation?: ExplainerSection
  dataSources?: ExplainerSection
  examples?: ExplainerExample[]
  visualAids?: React.ReactNode
  formula?: string
  grade?: 'excellent' | 'good' | 'fair' | 'poor'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  className?: string
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200'
}

const gradeColors = {
  excellent: 'text-green-600',
  good: 'text-blue-600',
  fair: 'text-yellow-600',
  poor: 'text-red-600'
}

const gradeIcons = {
  excellent: CheckCircle,
  good: TrendingUp,
  fair: AlertTriangle,
  poor: AlertTriangle
}

export function InsightExplainer({
  isOpen,
  onClose,
  title,
  description,
  methodology,
  calculation,
  dataSources,
  examples = [],
  visualAids,
  formula,
  grade,
  difficulty = 'intermediate',
  className
}: ExplainerProps) {
  const GradeIcon = grade ? gradeIcons[grade] : Info

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {grade && (
                <Badge variant="outline" className={cn("gap-1", gradeColors[grade])}>
                  <GradeIcon className="h-3 w-3" />
                  {grade.charAt(0).toUpperCase() + grade.slice(1)}
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={difficultyColors[difficulty]}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Formula Display */}
          {formula && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="h-5 w-5" />
                  Formula
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm border">
                  {formula}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Methodology Section */}
          {methodology && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {methodology.icon ? (
                    <methodology.icon className="h-5 w-5" />
                  ) : (
                    <Lightbulb className="h-5 w-5" />
                  )}
                  {methodology.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {methodology.content}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calculation Details */}
          {calculation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {calculation.icon ? (
                    <calculation.icon className="h-5 w-5" />
                  ) : (
                    <Calculator className="h-5 w-5" />
                  )}
                  {calculation.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {calculation.content}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Sources */}
          {dataSources && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {dataSources.icon ? (
                    <dataSources.icon className="h-5 w-5" />
                  ) : (
                    <Database className="h-5 w-5" />
                  )}
                  {dataSources.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {dataSources.content}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visual Aids */}
          {visualAids && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Visual Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visualAids}
              </CardContent>
            </Card>
          )}

          {/* Examples */}
          {examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5" />
                  Examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {examples.map((example, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm">{example.title}</h4>
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                    
                    {example.calculation && (
                      <div className="bg-slate-50 p-3 rounded border">
                        <p className="text-xs font-medium text-slate-600 mb-1">Calculation:</p>
                        <code className="text-sm">{example.calculation}</code>
                      </div>
                    )}
                    
                    {example.result && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">Result:</span>
                        <Badge variant="secondary">{example.result}</Badge>
                      </div>
                    )}
                    
                    {example.interpretation && (
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                        <p className="text-xs font-medium text-blue-800 mb-1">Interpretation:</p>
                        <p className="text-sm text-blue-700">{example.interpretation}</p>
                      </div>
                    )}
                    
                    {index < examples.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-6 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Trigger button component for consistent styling
export interface ExplainerTriggerProps {
  onClick: () => void
  variant?: 'button' | 'icon'
  size?: 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function ExplainerTrigger({ 
  onClick, 
  variant = 'icon', 
  size = 'sm',
  className,
  children 
}: ExplainerTriggerProps) {
  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={onClick}
        className={cn("gap-2", className)}
      >
        <Info className="h-4 w-4" />
        {children || "Learn More"}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-6 w-6 p-0 hover:bg-slate-100 rounded-full",
        "text-slate-500 hover:text-slate-700",
        className
      )}
    >
      <Info className="h-4 w-4" />
      <span className="sr-only">Show explanation</span>
    </Button>
  )
}