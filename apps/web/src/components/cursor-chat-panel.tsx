import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface CursorChatPanelProps {
  isOpen: boolean
  onClose: () => void
  onInsertText?: (text: string) => void
}

// Hardcoded demo responses for different types of writing assistance
const DEMO_RESPONSES = {
  character: [
    "Let me help you develop this character. What's their main motivation in this scene?",
    "I notice this character could use more depth. Consider adding a specific mannerism or speech pattern that makes them unique.",
    "This character's dialogue feels authentic. You might want to show their internal conflict through their actions rather than just their words."
  ],
  plot: [
    "This plot point has great potential. Have you considered how it connects to your character's arc?",
    "To heighten the tension here, try introducing an unexpected obstacle that forces your protagonist to make a difficult choice.",
    "This scene could benefit from raising the stakes. What does your character stand to lose if they fail here?"
  ],
  style: [
    "Your prose has a nice rhythm. Consider varying your sentence length to create more dynamic pacing.",
    "This description is vivid. You might want to engage more senses beyond just visual details.",
    "Strong dialogue! The subtext comes through clearly. Consider adding a beat of action to break up the conversation."
  ],
  general: [
    "This is a compelling scene. What aspect would you like me to help you develop further?",
    "I can help you brainstorm ideas, develop characters, plot points, or refine your writing style. What would be most helpful?",
    "Your writing shows promise. Would you like suggestions on pacing, character development, or world-building?"
  ]
}

const PROMPT_SUGGESTIONS = [
  "Help me develop this character",
  "Suggest plot twists for this scene",
  "Improve the pacing here",
  "Make this dialogue more realistic",
  "Add more sensory details",
  "What's missing from this scene?"
]

export function CursorChatPanel({ isOpen, onClose, onInsertText }: CursorChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const getRandomResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes("character") || lowerInput.includes("dialogue")) {
      return DEMO_RESPONSES.character[Math.floor(Math.random() * DEMO_RESPONSES.character.length)]
    }
    if (lowerInput.includes("plot") || lowerInput.includes("story") || lowerInput.includes("scene")) {
      return DEMO_RESPONSES.plot[Math.floor(Math.random() * DEMO_RESPONSES.plot.length)]
    }
    if (lowerInput.includes("style") || lowerInput.includes("writing") || lowerInput.includes("prose")) {
      return DEMO_RESPONSES.style[Math.floor(Math.random() * DEMO_RESPONSES.style.length)]
    }
    
    return DEMO_RESPONSES.general[Math.floor(Math.random() * DEMO_RESPONSES.general.length)]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getRandomResponse(input),
        role: "assistant",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 1500) // Random delay between 1-2.5 seconds
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleInsertToEditor = (text: string) => {
    onInsertText?.(text)
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border z-50 flex flex-col shadow-lg">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Writing Assistant</h3>
              <p className="text-xs text-muted-foreground">AI-powered writing help</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Hi! I'm here to help with your writing. Ask me anything about characters, plot, style, or storytelling.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 text-xs py-1"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "max-w-[280px] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs p-1"
                      onClick={() => handleInsertToEditor(message.content)}
                    >
                      Insert into editor
                    </Button>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your writing..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isTyping}
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </div>
  )
}