// src/components/chat/MessageComponent.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ChatMessage } from '@/types/agents'

interface MessageComponentProps {
  message: ChatMessage
  onRegenerate?: () => void
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void
}

export function MessageComponent({ message, onRegenerate, onFeedback }: MessageComponentProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type)
    onFeedback?.(message.id, type)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {message.role === 'assistant' && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Arquitecto de Decisiones</span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(message.created_at)}
              </span>
            </div>
            
            {/* Action buttons for assistant messages */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('positive')}
                className={`h-6 w-6 p-0 ${feedback === 'positive' ? 'text-green-500' : ''}`}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('negative')}
                className={`h-6 w-6 p-0 ${feedback === 'negative' ? 'text-red-500' : ''}`}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onRegenerate}>
                    Regenerar respuesta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyToClipboard}>
                    Copiar mensaje
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {message.role === 'user' && (
          <div className="text-xs opacity-70 mt-2 text-right">
            {formatTimestamp(message.created_at)}
          </div>
        )}

        {/* Token usage info for debugging */}
        {message.tokens_used && process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground mt-2">
            Tokens: {message.tokens_used}
          </div>
        )}
      </div>
    </motion.div>
  )
}
