import { Bot, Send, User } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface AIChatContentProps {
  onInsertText?: (text: string) => void
}

// Hardcoded demo responses for different types of writing assistance
const DEMO_RESPONSES = {
  character: [
    "Let me help you develop this character. What's their main motivation in this scene?",
    "I notice this character could use more depth. Consider adding a specific mannerism or speech pattern that makes them unique.",
    "This character's dialogue feels authentic. You might want to show their internal conflict through their actions rather than just their words.",
  ],
  plot: [
    "This plot point has great potential. Have you considered how it connects to your character's arc?",
    "To heighten the tension here, try introducing an unexpected obstacle that forces your protagonist to make a difficult choice.",
    "This scene could benefit from raising the stakes. What does your character stand to lose if they fail here?",
  ],
  style: [
    "Your prose has a nice rhythm. Consider varying your sentence length to create more dynamic pacing.",
    "This description is vivid. You might want to engage more senses beyond just visual details.",
    "Strong dialogue! The subtext comes through clearly. Consider adding a beat of action to break up the conversation.",
  ],
  general: [
    "This is a compelling scene. What aspect would you like me to help you develop further?",
    "I can help you brainstorm ideas, develop characters, plot points, or refine your writing style. What would be most helpful?",
    "Your writing shows promise. Would you like suggestions on pacing, character development, or world-building?",
  ],
}

const PROMPT_SUGGESTIONS = [
  "Help me develop this character",
  "Suggest plot twists for this scene",
  "Improve the pacing here",
  "Make this dialogue more realistic",
  "Add more sensory details",
  "What's missing from this scene?",
]

export function AIChatContent({ onInsertText }: AIChatContentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  const getRandomResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes("character") || lowerInput.includes("dialogue")) {
      return DEMO_RESPONSES.character[Math.floor(Math.random() * DEMO_RESPONSES.character.length)]
    }
    if (
      lowerInput.includes("plot") ||
      lowerInput.includes("story") ||
      lowerInput.includes("scene")
    ) {
      return DEMO_RESPONSES.plot[Math.floor(Math.random() * DEMO_RESPONSES.plot.length)]
    }
    if (
      lowerInput.includes("style") ||
      lowerInput.includes("writing") ||
      lowerInput.includes("prose")
    ) {
      return DEMO_RESPONSES.style[Math.floor(Math.random() * DEMO_RESPONSES.style.length)]
    }

    return DEMO_RESPONSES.general[Math.floor(Math.random() * DEMO_RESPONSES.general.length)]
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) {
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(
      () => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: getRandomResponse(input),
          role: "assistant",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsTyping(false)
      },
      1000 + Math.random() * 1500
    ) // Random delay between 1-2.5 seconds
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleInsertToEditor = (text: string) => {
    onInsertText?.(text)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 w-fit rounded-full bg-muted p-3">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mb-4 text-muted-foreground text-sm">
                Hi! I'm here to help with your writing. Ask me anything about characters, plot,
                style, or storytelling.
              </p>
              <div className="space-y-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS.map((suggestion) => (
                    <Badge
                      className="cursor-pointer py-1 text-xs hover:bg-secondary/80"
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      variant="secondary"
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
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              key={message.id}
            >
              {message.role === "assistant" && (
                <Avatar className="mt-1 h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[240px] rounded-lg px-3 py-2 text-sm",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" && (
                  <div className="mt-2 border-border/50 border-t pt-2">
                    <Button
                      className="h-6 p-1 text-xs"
                      onClick={() => handleInsertToEditor(message.content)}
                      size="sm"
                      variant="ghost"
                    >
                      Insert into editor
                    </Button>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <Avatar className="mt-1 h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start gap-3">
              <Avatar className="mt-1 h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <Separator />

      {/* Input Area */}
      <div className="p-4">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            className="flex-1"
            disabled={isTyping}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your writing..."
            ref={inputRef}
            value={input}
          />
          <Button className="px-3" disabled={!input.trim() || isTyping} size="sm" type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
