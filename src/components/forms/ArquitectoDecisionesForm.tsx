// src/components/forms/ArquitectoDecisionesForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ArrowRight, ArrowLeft, Brain, Clock, Target, Search, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

import { arquitectoDecisionesSchema, ArquitectoDecisionesFormData } from '@/lib/validations/forms'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { id: 1, title: 'Contexto', icon: Brain, description: 'Describe tu decisión' },
  { id: 2, title: 'Timeline', icon: Clock, description: '¿Cuándo necesitas decidir?' },
  { id: 3, title: 'Alternativas', icon: Target, description: 'Opciones que estás considerando' },
  { id: 4, title: 'Criterios', icon: Target, description: 'Qué es importante para ti' },
  { id: 5, title: 'Información', icon: Search, description: 'Qué te falta saber' },
  { id: 6, title: 'Personal', icon: User, description: 'Contexto adicional (opcional)' },
]

const TIMELINE_OPTIONS = [
  { value: 'urgente', label: 'Urgente (esta semana)', description: 'Necesito decidir ya' },
  { value: '2-4-semanas', label: '2-4 semanas', description: 'Tengo algo de tiempo' },
  { value: '1-2-meses', label: '1-2 meses', description: 'Puedo tomarme mi tiempo' },
  { value: 'flexible', label: 'Flexible', description: 'No hay apuro específico' },
]

export function ArquitectoDecisionesForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, profile } = useAuth()
  const supabase = createClient()

  const form = useForm<ArquitectoDecisionesFormData>({
    resolver: zodResolver(arquitectoDecisionesSchema),
    defaultValues: {
      contextoDecision: '',
      timeline: undefined,
      alternativas: ['', ''],
      criterios: ['', '', ''],
      informacionFaltante: '',
      contextoPersonal: '',
    },
  })

  const {
    fields: alternativasFields,
    append: appendAlternativa,
    remove: removeAlternativa,
  } = useFieldArray({
    control: form.control,
    name: 'alternativas',
  })

  const {
    fields: criteriosFields,
    append: appendCriterio,
    remove: removeCriterio,
  } = useFieldArray({
    control: form.control,
    name: 'criterios',
  })

  const progress = (currentStep / STEPS.length) * 100

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await form.trigger(fieldsToValidate)
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getFieldsForStep = (step: number): (keyof ArquitectoDecisionesFormData)[] => {
    switch (step) {
      case 1: return ['contextoDecision']
      case 2: return ['timeline']
      case 3: return ['alternativas']
      case 4: return ['criterios']
      case 5: return ['informacionFaltante']
      case 6: return ['contextoPersonal']
      default: return []
    }
  }

  const onSubmit = async (data: ArquitectoDecisionesFormData) => {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Crear sesión en la base de datos
      const { data: session, error: sessionError } = await supabase
        .from('agent_sessions')
        .insert({
          user_id: user.id,
          agent_type: 'arquitecto-decisiones',
          form_data: data,
          status: 'active',
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Registrar evento de analytics
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        session_id: session.id,
        event_type: 'form_completed',
        event_data: { agent_type: 'arquitecto-decisiones' },
      })

      // Redirigir al chat
      router.push(`/arquitecto-decisiones/chat/${session.id}`)
    } catch (error: any) {
      console.error('Error creating session:', error)
      setError('Error al crear la sesión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    const currentStepData = STEPS[currentStep - 1]
    const Icon = currentStepData.icon

    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contextoDecision">
                Describe la decisión que necesitas tomar *
              </Label>
              <Textarea
                id="contextoDecision"
                placeholder="Ej: Estoy evaluando si expandir mi negocio online a mercados internacionales. Actualmente tengo una tienda de productos artesanales que vende solo en Argentina, pero he recibido consultas desde otros países..."
                className="min-h-32"
                {...form.register('contextoDecision')}
              />
              {form.formState.errors.contextoDecision && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contextoDecision.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {form.watch('contextoDecision')?.length || 0}/1000 caracteres (mínimo 50)
              </p>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>¿En qué plazo necesitas tomar esta decisión? *</Label>
              <Select
                value={form.watch('timeline')}
                onValueChange={(value) => form.setValue('timeline', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.timeline && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.timeline.message}
                </p>
              )}
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Lista las opciones que estás considerando (mínimo 2, máximo 6)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {alternativasFields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="flex-1">
                    <Input
                      placeholder={`Alternativa ${index + 1}`}
                      {...form.register(`alternativas.${index}`)}
                    />
                    {form.formState.errors.alternativas?.[index] && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.alternativas[index]?.message}
                      </p>
                    )}
                  </div>
                  {alternativasFields.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeAlternativa(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
              
              {alternativasFields.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendAlternativa('')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar alternativa
                </Button>
              )}
              
              {form.formState.errors.alternativas?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.alternativas.root.message}
                </p>
              )}
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  ¿Qué factores son importantes para esta decisión? (mínimo 3, máximo 8)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {criteriosFields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="flex-1">
                    <Input
                      placeholder={`Criterio ${index + 1} (ej: Costo, Tiempo, Impacto)`}
                      {...form.register(`criterios.${index}`)}
                    />
                    {form.formState.errors.criterios?.[index] && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.criterios[index]?.message}
                      </p>
                    )}
                  </div>
                  {criteriosFields.length > 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeCriterio(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
              
              {criteriosFields.length < 8 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendCriterio('')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar criterio
                </Button>
              )}
              
              {form.formState.errors.criterios?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.criterios.root.message}
                </p>
              )}
            </div>
          </motion.div>
        )

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="informacionFaltante">
                ¿Qué información te falta para tomar esta decisión? *
              </Label>
              <Textarea
                id="informacionFaltante"
                placeholder="Ej: Necesito entender mejor los costos de logística internacional, las regulaciones de importación en otros países, y si tengo la capacidad operativa para manejar pedidos internacionales..."
                className="min-h-24"
                {...form.register('informacionFaltante')}
              />
              {form.formState.errors.informacionFaltante && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.informacionFaltante.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {form.watch('informacionFaltante')?.length || 0}/500 caracteres (mínimo 20)
              </p>
            </div>
          </motion.div>
        )

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Contexto personal que pueda influir en la decisión
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextoPersonal">
                Información adicional (opcional)
              </Label>
              <Textarea
                id="contextoPersonal"
                placeholder="Ej: Soy madre soltera con dos hijos, tengo experiencia limitada en comercio internacional, mi presupuesto es ajustado pero tengo buenas relaciones con proveedores locales..."
                className="min-h-24"
                {...form.register('contextoPersonal')}
              />
              {form.formState.errors.contextoPersonal && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contextoPersonal.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {form.watch('contextoPersonal')?.length || 0}/300 caracteres (opcional)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">¡Casi listo!</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Con esta información, el Arquitecto de Decisiones creará un análisis estructurado 
                    y te guiará paso a paso hacia la mejor decisión para tu situación.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Acceso requerido</CardTitle>
          <CardDescription>
            Necesitas estar registrado para usar el Arquitecto de Decisiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/login')} className="w-full">
            Iniciar sesión
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Arquitecto de Decisiones Estratégicas</h1>
        <p className="text-muted-foreground">
          Te ayudo a tomar decisiones complejas usando frameworks estructurados y metodologías probadas
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Paso {currentStep} de {STEPS.length}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando sesión...' : 'Comenzar análisis'}
                  <Brain className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Usage info */}
      {profile && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Plan actual: <span className="font-medium capitalize">{profile.subscription_plan}</span>
              </span>
              <span className="text-muted-foreground">
                Uso este mes: <span className="font-medium">{profile.usage_count}</span>
                {profile.subscription_plan === 'free' && ' / 100 mensajes'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}