// Type declarations for ElevenLabs Conversational AI Widget
declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': {
      'agent-id': string
      onError?: (e: any) => void
      children?: React.ReactNode
    }
  }
}


